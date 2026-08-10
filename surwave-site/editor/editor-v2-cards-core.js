(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  if (!Core.TYPES.some(([type]) => type === 'servercards')) {
    const before = Core.TYPES.findIndex(([type]) => type === 'quote');
    Core.TYPES.splice(before >= 0 ? before : Core.TYPES.length, 0, ['servercards', 'IP-карточки / копирование']);
  }

  const baseDefault = Core.defaultBlock;
  const baseParse = Core.parseDocument;
  const baseSerializeBlocks = Core.serializeBlocks;
  const baseRender = Core.renderBlocksHtml;

  const DEFAULT_EDGE = '#00ff78';
  const DEFAULT_CENTER = '#00ffc0';
  const LINK_OPEN = /^<div class="sw-link-gradient" data-sw-link-gradient="([^"]+)">$/;
  const LINK_CLOSE = '</div><!--sw-link-gradient-->';
  const COPY_CONFIG = /data-sw-copy-config="([^"]+)"/;
  const TOKEN = '__SURWAVE_SERVERCARDS__';

  function defaults(type) {
    if (type !== 'servercards') return baseDefault(type);
    return {
      type: 'servercards',
      borderGradient: true,
      textGradient: true,
      borderEdge: DEFAULT_EDGE,
      borderCenter: DEFAULT_CENTER,
      textEdge: DEFAULT_EDGE,
      textCenter: DEFAULT_CENTER,
      items: [
        {ip:'mc.surwave.ru', title:'mc.surwave.ru', image:''},
        {ip:'mc.surwave.pro', title:'mc.surwave.pro', image:''}
      ]
    };
  }
  Core.defaultBlock = defaults;

  function encode(value) {
    return encodeURIComponent(JSON.stringify(value));
  }
  function decode(value) {
    try { return JSON.parse(decodeURIComponent(value)); }
    catch (_) { return null; }
  }
  function gradientMeta(block) {
    return {
      borderGradient: !!block.borderGradient,
      textGradient: !!block.textGradient,
      borderEdge: block.borderEdge || DEFAULT_EDGE,
      borderCenter: block.borderCenter || DEFAULT_CENTER,
      textEdge: block.textEdge || DEFAULT_EDGE,
      textCenter: block.textCenter || DEFAULT_CENTER
    };
  }
  function applyGradientMeta(block, meta) {
    if (!block || !meta) return block;
    block.borderGradient = meta.borderGradient !== false;
    block.textGradient = !!meta.textGradient;
    block.borderEdge = meta.borderEdge || DEFAULT_EDGE;
    block.borderCenter = meta.borderCenter || DEFAULT_CENTER;
    block.textEdge = meta.textEdge || DEFAULT_EDGE;
    block.textCenter = meta.textCenter || DEFAULT_CENTER;
    return block;
  }
  function ensureLinkGradient(block) {
    if (!block || block.type !== 'linkgroup') return block;
    if (block.borderGradient == null) block.borderGradient = false;
    if (block.textGradient == null) block.textGradient = false;
    if (!block.borderEdge) block.borderEdge = DEFAULT_EDGE;
    if (!block.borderCenter) block.borderCenter = DEFAULT_CENTER;
    if (!block.textEdge) block.textEdge = DEFAULT_EDGE;
    if (!block.textCenter) block.textCenter = DEFAULT_CENTER;
    return block;
  }

  function processParsed(blocks) {
    const out = [];
    for (let i = 0; i < (blocks || []).length; i++) {
      let block = blocks[i];
      if (block.type === 'raw') {
        const copyMatch = String(block.markdown || '').match(COPY_CONFIG);
        if (copyMatch) {
          const config = decode(copyMatch[1]);
          if (config && config.type === 'servercards') {
            config.layout = block.layout || config.layout;
            out.push(config);
            continue;
          }
        }
        const open = String(block.markdown || '').trim().match(LINK_OPEN);
        if (open && blocks[i + 1]?.type === 'linkgroup' && String(blocks[i + 2]?.markdown || '').trim() === LINK_CLOSE) {
          const target = ensureLinkGradient(blocks[i + 1]);
          applyGradientMeta(target, decode(open[1]));
          out.push(target);
          i += 2;
          continue;
        }
      }
      if (block.type === 'hint' || block.type === 'details') block.children = processParsed(block.children);
      if (block.type === 'stepper') block.steps = (block.steps || []).map(step => ({...step, children:processParsed(step.children)}));
      ensureLinkGradient(block);
      out.push(block);
    }
    return out;
  }

  Core.parseDocument = source => {
    const doc = baseParse(source);
    doc.blocks = processParsed(doc.blocks);
    return doc;
  };

  function copyConfig(block) {
    const copy = Core.clone(block);
    delete copy.layout;
    return copy;
  }

  function fallbackCopyHandler() {
    return "event.preventDefault();event.stopPropagation();if(window.frameElement&&window.frameElement.id==='preview')return false;const b=this,s=b.querySelector('[data-copy-state]'),done=()=>{s.textContent='Скопировано';b.classList.add('is-copied');clearTimeout(b._swTimer);b._swTimer=setTimeout(()=>{s.textContent='Нажмите чтобы скопировать';b.classList.remove('is-copied')},5000)},fallback=()=>{const t=document.createElement('textarea');t.value=b.dataset.copy;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove();done()},p=navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(b.dataset.copy):null;p?p.then(done).catch(fallback):fallback();return false;";
  }

  function copyCardsHtml(block, path='', live=false) {
    const meta = gradientMeta(block);
    const classes = ['sw-copy-pair', meta.borderGradient ? 'sw-border-gradient' : '', meta.textGradient ? 'sw-text-gradient' : ''].filter(Boolean).join(' ');
    const style = `--sw-border-edge:${Core.esc(meta.borderEdge)};--sw-border-center:${Core.esc(meta.borderCenter)};--sw-text-edge:${Core.esc(meta.textEdge)};--sw-text-center:${Core.esc(meta.textCenter)}`;
    const config = encode(copyConfig(block));
    const handler = live ? ` onclick="${fallbackCopyHandler()}"` : '';
    const cards = (block.items || []).slice(0, 2).map(item => {
      const ip = String(item.ip || '').trim();
      const title = String(item.title || ip || 'Адрес сервера');
      return `<button type="button" class="sw-copy-card" data-copy="${Core.esc(ip)}"${handler}>${item.image ? `<span class="sw-copy-image"><img src="${Core.mediaUrl(item.image)}" alt=""></span>` : ''}<span class="sw-copy-content"><strong class="sw-copy-title">${Core.esc(title)}</strong><span class="sw-copy-ip">${Core.esc(ip)}</span><span class="sw-copy-state" data-copy-state>Нажмите чтобы скопировать</span></span></button>`;
    }).join('');
    return `<div class="${classes}"${path ? ` data-editor-path="${Core.esc(path)}"` : ''} data-sw-copy-config="${config}" style="${style}">${cards}</div>`;
  }

  Core.serializeBlocks = blocks => (blocks || []).map(block => {
    if (block.type === 'servercards') return copyCardsHtml(block, '', true);
    if (block.type === 'linkgroup') {
      ensureLinkGradient(block);
      const meta = encode(gradientMeta(block));
      return `<div class="sw-link-gradient" data-sw-link-gradient="${meta}">\n${baseSerializeBlocks([block])}\n${LINK_CLOSE}`;
    }
    return baseSerializeBlocks([block]);
  }).filter(Boolean).join('\n\n');

  function mapBlocks(blocks, base='', map=new Map()) {
    (blocks || []).forEach((block, i) => {
      const path = base ? `${base}.${i}` : `${i}`;
      map.set(path, block);
      if (block.type === 'hint' || block.type === 'details') mapBlocks(block.children, `${path}.children`, map);
      if (block.type === 'stepper') (block.steps || []).forEach((step, si) => mapBlocks(step.children, `${path}.steps.${si}.children`, map));
    });
    return map;
  }
  function prepareRender(blocks, base='') {
    return (blocks || []).map((block, i) => {
      const path = base ? `${base}.${i}` : `${i}`;
      if (block.type === 'servercards') return {type:'raw', markdown:`${TOKEN}${path}`};
      const copy = Core.clone(block);
      if (copy.type === 'hint' || copy.type === 'details') copy.children = prepareRender(copy.children, `${path}.children`);
      if (copy.type === 'stepper') copy.steps = (copy.steps || []).map((step, si) => ({...step, children:prepareRender(step.children, `${path}.steps.${si}.children`)}));
      return copy;
    });
  }

  Core.renderBlocksHtml = (blocks, base='') => {
    const refs = mapBlocks(blocks, base);
    const html = baseRender(prepareRender(blocks, base), base);
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('[data-editor-path]').forEach(node => {
      const path = node.dataset.editorPath;
      const block = refs.get(path);
      if (!block) return;
      if (block.type === 'servercards') {
        const holder = document.createElement('template');
        holder.innerHTML = copyCardsHtml(block, path, false);
        node.replaceWith(holder.content.firstElementChild);
        return;
      }
      if (block.type === 'linkgroup') {
        ensureLinkGradient(block);
        node.classList.toggle('sw-link-border-gradient', !!block.borderGradient);
        node.classList.toggle('sw-link-text-gradient', !!block.textGradient);
        node.style.setProperty('--sw-border-edge', block.borderEdge || DEFAULT_EDGE);
        node.style.setProperty('--sw-border-center', block.borderCenter || DEFAULT_CENTER);
        node.style.setProperty('--sw-text-edge', block.textEdge || DEFAULT_EDGE);
        node.style.setProperty('--sw-text-center', block.textCenter || DEFAULT_CENTER);
      }
    });
    return template.innerHTML;
  };

  Core.previewCss += `
    .sw-copy-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0;--sw-border-edge:#00ff78;--sw-border-center:#00ffc0;--sw-text-edge:#00ff78;--sw-text-center:#00ffc0}
    .sw-copy-card{appearance:none;position:relative;display:flex;align-items:center;justify-content:center;gap:13px;min-height:112px;padding:18px;border:1px solid #233137;border-radius:14px;background:#050809;color:#eaf6f1;text-align:left;cursor:pointer;overflow:hidden;transition:transform .16s ease,background .2s ease,box-shadow .2s ease}
    .sw-copy-pair.sw-border-gradient .sw-copy-card{border:1px solid transparent;background:linear-gradient(#050809,#050809) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 25%,transparent),var(--sw-border-center) 50%,color-mix(in srgb,var(--sw-border-edge) 25%,transparent)) border-box}
    .sw-copy-pair.sw-border-gradient .sw-copy-card:hover{background:linear-gradient(#07100d,#07100d) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 62%,transparent),color-mix(in srgb,var(--sw-border-center) 88%,var(--sw-border-edge)) 50%,color-mix(in srgb,var(--sw-border-edge) 62%,transparent)) border-box;box-shadow:0 0 28px rgba(0,255,120,.08)}
    .sw-copy-pair.sw-border-gradient .sw-copy-card:active,.sw-copy-card.is-copied{transform:translateY(1px);background:linear-gradient(#08130f,#08130f) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 78%,transparent),color-mix(in srgb,var(--sw-border-center) 92%,var(--sw-border-edge)) 50%,color-mix(in srgb,var(--sw-border-edge) 78%,transparent)) border-box}
    .sw-copy-image{width:58px;height:58px;display:grid;place-items:center;flex:none;border-radius:11px;overflow:hidden;background:#08110e}.sw-copy-image img{width:100%;height:100%;object-fit:contain}
    .sw-copy-content{display:flex;min-width:0;flex-direction:column;align-items:flex-start}.sw-copy-title{font-size:18px;line-height:1.2}.sw-copy-ip{margin-top:4px;font-size:14px;color:#c1d0ca}.sw-copy-state{margin-top:7px;font-size:11.5px;color:#71867e;transition:color .2s}.sw-copy-card.is-copied .sw-copy-state{color:#00ffc0}
    .sw-copy-pair.sw-text-gradient .sw-copy-title,.sw-copy-pair.sw-text-gradient .sw-copy-ip,.sw-copy-pair.sw-text-gradient .sw-copy-state,.sw-link-text-gradient .link-copy strong,.sw-link-text-gradient .link-copy small{background:linear-gradient(90deg,var(--sw-text-edge),var(--sw-text-center) 50%,var(--sw-text-edge));-webkit-background-clip:text;background-clip:text;color:transparent!important}
    .sw-link-border-gradient{border:1px solid transparent!important;background:linear-gradient(#091013,#091013) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 25%,transparent),var(--sw-border-center) 50%,color-mix(in srgb,var(--sw-border-edge) 25%,transparent)) border-box!important}.sw-link-border-gradient:hover{background:linear-gradient(#0a1415,#0a1415) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 58%,transparent),var(--sw-border-center) 50%,color-mix(in srgb,var(--sw-border-edge) 58%,transparent)) border-box!important}
    @media(max-width:650px){.sw-copy-pair{grid-template-columns:1fr}.sw-copy-card{min-height:96px}}
  `;
})();
