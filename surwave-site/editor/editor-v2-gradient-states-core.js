(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  const previousDefault = Core.defaultBlock;
  const previousParse = Core.parseDocument;
  const previousSerialize = Core.serializeBlocks;
  const previousRender = Core.renderBlocksHtml;

  const MODES = new Set(['center','left','right','top','bottom']);
  const ANIMS = new Set(['none','pulse','flow','orbit','shimmer','wave','glow']);
  const STATES = ['normal','hover','active','copied'];
  const LAYERS = ['border','text'];

  function clamp(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function stateDefaults(layer, name) {
    const alpha = layer === 'text' ? 100 : ({normal:[12,84],hover:[28,94],active:[38,97],copied:[42,98]}[name] || [20,90]);
    return {
      mode:'center',
      color1:'#00ff78',
      alpha1:Array.isArray(alpha) ? alpha[0] : alpha,
      useSecond:true,
      color2:'#00ffc0',
      alpha2:Array.isArray(alpha) ? alpha[1] : alpha,
      animation:'none',
      speed:2.4
    };
  }

  function ensureState(value, layer, name) {
    const d = stateDefaults(layer, name);
    const s = value && typeof value === 'object' ? value : {};
    return {
      mode:MODES.has(s.mode) ? s.mode : d.mode,
      color1:String(s.color1 || d.color1),
      alpha1:clamp(s.alpha1,0,100,d.alpha1),
      useSecond:s.useSecond !== false,
      color2:String(s.color2 || d.color2),
      alpha2:clamp(s.alpha2,0,100,d.alpha2),
      animation:ANIMS.has(s.animation) ? s.animation : d.animation,
      speed:clamp(s.speed,0.2,60,d.speed)
    };
  }

  function migrateLegacy(block) {
    if (!block || !['servercards','linkgroup'].includes(block.type)) return block;
    const legacyBorder1 = block.borderEdge || '#00ff78';
    const legacyBorder2 = block.borderCenter || '#00ffc0';
    const legacyText1 = block.textEdge || '#00ff78';
    const legacyText2 = block.textCenter || '#00ffc0';
    if (!block.gradientStates || typeof block.gradientStates !== 'object') block.gradientStates = {};
    for (const layer of LAYERS) {
      if (!block.gradientStates[layer] || typeof block.gradientStates[layer] !== 'object') block.gradientStates[layer] = {};
      for (const name of STATES) {
        const s = ensureState(block.gradientStates[layer][name], layer, name);
        if (!block.gradientStates[layer][name]) {
          s.color1 = layer === 'border' ? legacyBorder1 : legacyText1;
          s.color2 = layer === 'border' ? legacyBorder2 : legacyText2;
        }
        block.gradientStates[layer][name] = s;
      }
    }
    if (block.borderGradient == null) block.borderGradient = block.type === 'servercards';
    if (block.textGradient == null) block.textGradient = block.type === 'servercards';
    return block;
  }

  Core.defaultBlock = type => migrateLegacy(previousDefault(type));

  function walk(blocks, fn) {
    (blocks || []).forEach(block => {
      migrateLegacy(block);
      fn(block);
      if (block.type === 'hint' || block.type === 'details') walk(block.children, fn);
      if (block.type === 'stepper') (block.steps || []).forEach(step => walk(step.children, fn));
    });
  }

  function decode(value) {
    try { return JSON.parse(decodeURIComponent(value)); }
    catch (_) { return null; }
  }
  function encode(value) { return encodeURIComponent(JSON.stringify(value)); }

  function collectLinkMeta(source) {
    const list = [];
    String(source || '').replace(/data-sw-link-gradient="([^"]+)"/g, (_, raw) => {
      list.push(decode(raw));
      return _;
    });
    return list;
  }

  Core.parseDocument = source => {
    const metas = collectLinkMeta(source);
    const doc = previousParse(source);
    let linkIndex = 0;
    walk(doc.blocks, block => {
      if (block.type !== 'linkgroup') return;
      const meta = metas[linkIndex++] || null;
      if (meta?.gradientStates) block.gradientStates = Core.clone(meta.gradientStates);
      migrateLegacy(block);
    });
    return doc;
  };

  function hexRgb(value, fallback='#00ff78') {
    let v = String(value || '').trim();
    if (!/^#[0-9a-f]{3,6}$/i.test(v)) v = fallback;
    if (v.length === 4) v = '#' + [...v.slice(1)].map(ch => ch + ch).join('');
    const n = parseInt(v.slice(1),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function rgba(color, alpha) {
    const [r,g,b] = hexRgb(color);
    return `rgba(${r},${g},${b},${clamp(alpha,0,100,100)/100})`;
  }

  function gradient(state) {
    const s = ensureState(state,'border','normal');
    const c1 = rgba(s.color1,s.alpha1);
    const c2 = rgba(s.useSecond ? s.color2 : s.color1,s.alpha2);
    if (s.mode === 'center') return `linear-gradient(90deg,${c1} 0%,${c2} 50%,${c1} 100%)`;
    if (s.mode === 'right') return `linear-gradient(270deg,${c1} 0%,${c2} 100%)`;
    if (s.mode === 'top') return `linear-gradient(180deg,${c1} 0%,${c2} 100%)`;
    if (s.mode === 'bottom') return `linear-gradient(0deg,${c1} 0%,${c2} 100%)`;
    return `linear-gradient(90deg,${c1} 0%,${c2} 100%)`;
  }

  function animName(state, layer) {
    const a = ensureState(state,layer,'normal').animation;
    if (a === 'orbit' && layer === 'text') return 'swGradFlow';
    return {
      none:'none',pulse:'swGradPulse',flow:'swGradFlow',orbit:'swGradOrbit',
      shimmer:'swGradShimmer',wave:'swGradWave',glow:'swGradGlow'
    }[a] || 'none';
  }

  function stateVars(block) {
    migrateLegacy(block);
    const vars = [];
    for (const layer of LAYERS) {
      const short = layer === 'border' ? 'b' : 't';
      for (const name of STATES) {
        const key = name === 'normal' ? 'n' : name === 'hover' ? 'h' : name === 'active' ? 'a' : 'c';
        const state = block.gradientStates[layer][name];
        vars.push(`--sw-${short}-${key}-grad:${gradient(state)}`);
        vars.push(`--sw-${short}-${key}-anim:${animName(state,layer)}`);
        vars.push(`--sw-${short}-${key}-speed:${clamp(state.speed,0.2,60,2.4)}s`);
      }
    }
    return vars.join(';');
  }

  function enhanceElement(root, block) {
    if (!root || !block) return;
    migrateLegacy(block);
    root.classList.toggle('sw-adv-border', !!block.borderGradient);
    root.classList.toggle('sw-adv-text', !!block.textGradient);
    root.dataset.swGradientV = '2';
    const style = stateVars(block).split(';');
    style.forEach(pair => {
      const at = pair.indexOf(':');
      if (at > 0) root.style.setProperty(pair.slice(0,at),pair.slice(at+1));
    });
  }

  function enrichSerialized(output, block) {
    if (!block || !['servercards','linkgroup'].includes(block.type)) return output;
    migrateLegacy(block);
    const template = document.createElement('template');
    template.innerHTML = output;
    const root = block.type === 'servercards'
      ? template.content.querySelector('.sw-copy-pair')
      : template.content.querySelector('.sw-link-gradient');
    if (!root) return output;
    enhanceElement(root,block);
    if (block.type === 'linkgroup') {
      const raw = root.getAttribute('data-sw-link-gradient');
      const meta = decode(raw) || {};
      meta.gradientStates = Core.clone(block.gradientStates);
      root.setAttribute('data-sw-link-gradient',encode(meta));
    }
    return template.innerHTML;
  }

  Core.serializeBlocks = blocks => {
    if ((blocks || []).length !== 1) return previousSerialize(blocks);
    const block = blocks[0];
    return enrichSerialized(previousSerialize(blocks),block);
  };

  function blockMap(blocks, base='', map=new Map()) {
    (blocks || []).forEach((block,i) => {
      const path = base ? `${base}.${i}` : `${i}`;
      map.set(path,block);
      if (block.type === 'hint' || block.type === 'details') blockMap(block.children,`${path}.children`,map);
      if (block.type === 'stepper') (block.steps || []).forEach((step,si) => blockMap(step.children,`${path}.steps.${si}.children`,map));
    });
    return map;
  }

  Core.renderBlocksHtml = (blocks, base='') => {
    const map = blockMap(blocks,base);
    const html = previousRender(blocks,base);
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('[data-editor-path]').forEach(node => {
      const block = map.get(node.dataset.editorPath);
      if (!block || !['servercards','linkgroup'].includes(block.type)) return;
      enhanceElement(node,block);
    });
    return template.innerHTML;
  };

  const CSS = `
  .sw-copy-pair.sw-adv-border .sw-copy-card,.sw-link-gradient.sw-adv-border .link-group{position:relative!important;border:3px solid #172529!important;background:#050809!important;isolation:isolate;overflow:hidden}
  .sw-copy-pair.sw-adv-border .sw-copy-card:before,.sw-link-gradient.sw-adv-border .link-group:before{content:"";position:absolute;z-index:0;inset:0;border-radius:inherit;padding:3px;pointer-events:none;background-image:var(--sw-b-grad);background-size:220% 220%;background-position:50% 50%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:var(--sw-b-anim,none) var(--sw-b-speed,2.4s) linear infinite}
  .sw-copy-pair.sw-adv-border .sw-copy-card>*{position:relative;z-index:1}.sw-link-gradient.sw-adv-border .link-group>*{position:relative;z-index:1}
  .sw-copy-pair .sw-copy-card,.sw-link-gradient .link-group{--sw-b-grad:var(--sw-b-n-grad);--sw-b-anim:var(--sw-b-n-anim);--sw-b-speed:var(--sw-b-n-speed);--sw-t-grad:var(--sw-t-n-grad);--sw-t-anim:var(--sw-t-n-anim);--sw-t-speed:var(--sw-t-n-speed)}
  .sw-copy-pair .sw-copy-card:hover,.sw-link-gradient .link-group:hover{--sw-b-grad:var(--sw-b-h-grad);--sw-b-anim:var(--sw-b-h-anim);--sw-b-speed:var(--sw-b-h-speed);--sw-t-grad:var(--sw-t-h-grad);--sw-t-anim:var(--sw-t-h-anim);--sw-t-speed:var(--sw-t-h-speed)}
  .sw-copy-pair .sw-copy-card:active,.sw-link-gradient .link-group:active{--sw-b-grad:var(--sw-b-a-grad);--sw-b-anim:var(--sw-b-a-anim);--sw-b-speed:var(--sw-b-a-speed);--sw-t-grad:var(--sw-t-a-grad);--sw-t-anim:var(--sw-t-a-anim);--sw-t-speed:var(--sw-t-a-speed)}
  .sw-copy-pair .sw-copy-card.is-copied{--sw-b-grad:var(--sw-b-c-grad);--sw-b-anim:var(--sw-b-c-anim);--sw-b-speed:var(--sw-b-c-speed);--sw-t-grad:var(--sw-t-c-grad);--sw-t-anim:var(--sw-t-c-anim);--sw-t-speed:var(--sw-t-c-speed)}
  .sw-copy-pair.sw-adv-text .sw-copy-title,.sw-copy-pair.sw-adv-text .sw-copy-ip,.sw-copy-pair.sw-adv-text .sw-copy-state,.sw-link-gradient.sw-adv-text .link-copy strong,.sw-link-gradient.sw-adv-text .link-copy small{background-image:var(--sw-t-grad)!important;background-size:220% 220%!important;background-position:50% 50%;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important;animation:var(--sw-t-anim,none) var(--sw-t-speed,2.4s) linear infinite}
  @keyframes swGradPulse{0%,100%{opacity:.58;filter:brightness(.86)}50%{opacity:1;filter:brightness(1.18)}}
  @keyframes swGradFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes swGradOrbit{0%{transform:rotate(0deg) scale(1.45)}100%{transform:rotate(360deg) scale(1.45)}}
  @keyframes swGradShimmer{0%{background-position:180% 50%;filter:brightness(.8)}45%,55%{filter:brightness(1.35)}100%{background-position:-80% 50%;filter:brightness(.8)}}
  @keyframes swGradWave{0%,100%{background-position:0% 20%;opacity:.72}25%{background-position:70% 0%;opacity:1}50%{background-position:100% 80%;opacity:.8}75%{background-position:30% 100%;opacity:1}}
  @keyframes swGradGlow{0%,100%{opacity:.62;filter:drop-shadow(0 0 1px rgba(0,255,120,.05))}50%{opacity:1;filter:drop-shadow(0 0 7px rgba(0,255,192,.45))}}
  @media (prefers-reduced-motion:reduce){.sw-copy-pair *,.sw-link-gradient *,.sw-copy-pair *:before,.sw-link-gradient *:before{animation-duration:.001ms!important;animation-iteration-count:1!important}}
  `;
  Core.previewCss += CSS;
  window.SurwaveAdvancedGradientCSS = CSS;
  window.SurwaveEnsureGradientStates = migrateLegacy;
})();