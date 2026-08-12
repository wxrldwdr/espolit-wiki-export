(() => {
  const Core=window.SurwaveEditorCoreV2;if(!Core)return;
  const previousDefault=Core.defaultBlock,previousParse=Core.parseDocument,previousSerialize=Core.serializeBlocks,previousRender=Core.renderBlocksHtml;
  const MODES=new Set(['center','left','right','top','bottom']),ANIMS=new Set(['none','pulse','flow','orbit','shimmer','wave','glow']),STATES=['normal','hover','active','copied'],LAYERS=['border','text'];
  const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};

  function stateDefaults(layer,name){
    const alpha=layer==='text'?100:({normal:[12,84],hover:[28,94],active:[38,97],copied:[42,98]}[name]||[20,90]);
    return{mode:'center',color1:'#00ff78',alpha1:Array.isArray(alpha)?alpha[0]:alpha,useSecond:true,color2:'#00ffc0',alpha2:Array.isArray(alpha)?alpha[1]:alpha,animation:'none',speed:2.4,shade:{normal:34,hover:20,active:10,copied:14}[name]??24};
  }

  function normalizeStateInPlace(value,layer,name){
    const d=stateDefaults(layer,name),s=value&&typeof value==='object'?value:{};
    s.mode=MODES.has(s.mode)?s.mode:d.mode;
    s.color1=String(s.color1||d.color1);
    s.alpha1=clamp(s.alpha1,0,100,d.alpha1);
    s.useSecond=s.useSecond!==false;
    s.color2=String(s.color2||d.color2);
    s.alpha2=clamp(s.alpha2,0,100,d.alpha2);
    s.animation=ANIMS.has(s.animation)?s.animation:d.animation;
    s.speed=clamp(s.speed,0.2,60,d.speed);
    s.shade=clamp(s.shade,0,100,d.shade);
    delete s.backgroundOpacity;
    return s;
  }

  function migrateLegacy(block){
    if(!block||!['servercards','linkgroup'].includes(block.type))return block;
    const legacyBorder1=block.borderEdge||'#00ff78',legacyBorder2=block.borderCenter||'#00ffc0',legacyText1=block.textEdge||'#00ff78',legacyText2=block.textCenter||'#00ffc0';
    if(!block.gradientStates||typeof block.gradientStates!=='object')block.gradientStates={};

    if(block.type==='servercards'){
      const oldOpacity=block.gradientStates?.border?.normal?.backgroundOpacity;
      if(block.backgroundOpacity==null)block.backgroundOpacity=clamp(oldOpacity,0,100,100);
      else block.backgroundOpacity=clamp(block.backgroundOpacity,0,100,100);
    }

    for(const layer of LAYERS){
      if(!block.gradientStates[layer]||typeof block.gradientStates[layer]!=='object')block.gradientStates[layer]={};
      for(const name of STATES){
        const had=block.gradientStates[layer][name];
        const target=had&&typeof had==='object'?had:{};
        if(!had){
          target.color1=layer==='border'?legacyBorder1:legacyText1;
          target.color2=layer==='border'?legacyBorder2:legacyText2;
          block.gradientStates[layer][name]=target;
        }
        normalizeStateInPlace(target,layer,name);
      }
    }
    if(block.borderGradient==null)block.borderGradient=block.type==='servercards';
    if(block.textGradient==null)block.textGradient=block.type==='servercards';
    return block;
  }

  Core.defaultBlock=type=>migrateLegacy(previousDefault(type));
  function walk(blocks,fn){(blocks||[]).forEach(block=>{migrateLegacy(block);fn(block);if(block.type==='hint'||block.type==='details')walk(block.children,fn);if(block.type==='stepper')(block.steps||[]).forEach(step=>walk(step.children,fn))})}
  function decode(value){try{return JSON.parse(decodeURIComponent(value))}catch(_){return null}}
  function encode(value){return encodeURIComponent(JSON.stringify(value))}
  function collectLinkMeta(source){const list=[];String(source||'').replace(/data-sw-link-gradient="([^"]+)"/g,(_,raw)=>{list.push(decode(raw));return _});return list}

  Core.parseDocument=source=>{
    const metas=collectLinkMeta(source),doc=previousParse(source);let linkIndex=0;
    walk(doc.blocks,block=>{if(block.type!=='linkgroup')return;const meta=metas[linkIndex++]||null;if(meta?.gradientStates)block.gradientStates=Core.clone(meta.gradientStates);migrateLegacy(block)});
    return doc;
  };

  function hexRgb(value,fallback='#00ff78'){let v=String(value||'').trim();if(!/^#[0-9a-f]{3,6}$/i.test(v))v=fallback;if(v.length===4)v='#'+[...v.slice(1)].map(ch=>ch+ch).join('');const n=parseInt(v.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]}
  function rgba(color,alpha){const[r,g,b]=hexRgb(color);return`rgba(${r},${g},${b},${clamp(alpha,0,100,100)/100})`}
  function gradient(state){const s=normalizeStateInPlace(state,'border','normal'),c1=rgba(s.color1,s.alpha1),c2=rgba(s.useSecond?s.color2:s.color1,s.alpha2);if(s.mode==='center')return`linear-gradient(90deg,${c1} 0%,${c2} 50%,${c1} 100%)`;if(s.mode==='right')return`linear-gradient(270deg,${c1} 0%,${c2} 100%)`;if(s.mode==='top')return`linear-gradient(180deg,${c1} 0%,${c2} 100%)`;if(s.mode==='bottom')return`linear-gradient(0deg,${c1} 0%,${c2} 100%)`;return`linear-gradient(90deg,${c1} 0%,${c2} 100%)`}
  function animName(state,layer){const a=normalizeStateInPlace(state,layer,'normal').animation;if(a==='orbit'&&layer==='text')return'swGradFlow';return{none:'none',pulse:'swGradPulse',flow:'swGradFlow',orbit:'swGradOrbit',shimmer:'swGradShimmer',wave:'swGradWave',glow:'swGradGlow'}[a]||'none'}

  function stateVars(block){
    migrateLegacy(block);
    const vars=[];
    for(const layer of LAYERS){
      const short=layer==='border'?'b':'t';
      for(const name of STATES){
        const key=name==='normal'?'n':name==='hover'?'h':name==='active'?'a':'c',state=block.gradientStates[layer][name];
        vars.push(`--sw-${short}-${key}-grad:${gradient(state)}`,`--sw-${short}-${key}-anim:${animName(state,layer)}`,`--sw-${short}-${key}-speed:${clamp(state.speed,0.2,60,2.4)}s`);
      }
    }
    if(block.type==='servercards')vars.push(`--sw-bg-opacity:${clamp(block.backgroundOpacity,0,100,100)/100}`);
    return vars.join(';');
  }

  function enhanceElement(root,block){
    if(!root||!block)return;
    migrateLegacy(block);
    root.classList.toggle('sw-adv-border',!!block.borderGradient);
    root.classList.toggle('sw-adv-text',!!block.textGradient);
    root.dataset.swGradientV='7';
    stateVars(block).split(';').forEach(pair=>{const at=pair.indexOf(':');if(at>0)root.style.setProperty(pair.slice(0,at),pair.slice(at+1))});
  }

  function enrichSerialized(output,block){
    if(!block||!['servercards','linkgroup'].includes(block.type))return output;
    migrateLegacy(block);
    const template=document.createElement('template');template.innerHTML=output;
    const root=block.type==='servercards'?template.content.querySelector('.sw-copy-pair'):template.content.querySelector('.sw-link-gradient');
    if(!root)return output;
    enhanceElement(root,block);
    if(block.type==='linkgroup'){
      const meta=decode(root.getAttribute('data-sw-link-gradient'))||{};
      meta.gradientStates=Core.clone(block.gradientStates);
      root.setAttribute('data-sw-link-gradient',encode(meta));
    }
    return template.innerHTML;
  }

  Core.serializeBlocks=blocks=>{if((blocks||[]).length!==1)return previousSerialize(blocks);const block=blocks[0];return enrichSerialized(previousSerialize(blocks),block)};
  function blockMap(blocks,base='',map=new Map()){(blocks||[]).forEach((block,i)=>{const path=base?`${base}.${i}`:`${i}`;map.set(path,block);if(block.type==='hint'||block.type==='details')blockMap(block.children,`${path}.children`,map);if(block.type==='stepper')(block.steps||[]).forEach((step,si)=>blockMap(step.children,`${path}.steps.${si}.children`,map))});return map}
  Core.renderBlocksHtml=(blocks,base='')=>{const map=blockMap(blocks,base),html=previousRender(blocks,base),template=document.createElement('template');template.innerHTML=html;template.content.querySelectorAll('[data-editor-path]').forEach(node=>{const block=map.get(node.dataset.editorPath);if(block&&['servercards','linkgroup'].includes(block.type))enhanceElement(node,block)});return template.innerHTML};

  const CSS=`
  .sw-copy-pair .sw-copy-card,.sw-link-gradient .link-group{--sw-b-grad:var(--sw-b-n-grad);--sw-b-anim:var(--sw-b-n-anim);--sw-b-speed:var(--sw-b-n-speed);--sw-t-grad:var(--sw-t-n-grad);--sw-t-anim:var(--sw-t-n-anim);--sw-t-speed:var(--sw-t-n-speed)}
  .sw-copy-pair .sw-copy-card:hover,.sw-link-gradient .link-group:hover{--sw-b-grad:var(--sw-b-h-grad);--sw-b-anim:var(--sw-b-h-anim);--sw-b-speed:var(--sw-b-h-speed);--sw-t-grad:var(--sw-t-h-grad);--sw-t-anim:var(--sw-t-h-anim);--sw-t-speed:var(--sw-t-h-speed)}
  .sw-copy-pair .sw-copy-card:active,.sw-link-gradient .link-group:active{--sw-b-grad:var(--sw-b-a-grad);--sw-b-anim:var(--sw-b-a-anim);--sw-b-speed:var(--sw-b-a-speed);--sw-t-grad:var(--sw-t-a-grad);--sw-t-anim:var(--sw-t-a-anim);--sw-t-speed:var(--sw-t-a-speed)}
  .sw-copy-pair .sw-copy-card.is-copied{--sw-b-grad:var(--sw-b-c-grad);--sw-b-anim:var(--sw-b-c-anim);--sw-b-speed:var(--sw-b-c-speed);--sw-t-grad:var(--sw-t-c-grad);--sw-t-anim:var(--sw-t-c-anim);--sw-t-speed:var(--sw-t-c-speed)}
  `;
  Core.previewCss+=CSS;
  window.SurwaveAdvancedGradientCSS=CSS;
  window.SurwaveEnsureGradientStates=migrateLegacy;
})();