(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  const previousParse = Core.parseDocument;
  const previousSerializeBlocks = Core.serializeBlocks;
  const previousRender = Core.renderBlocksHtml;

  function linkWrapperClasses(block) {
    return [
      'sw-link-gradient',
      block?.borderGradient ? 'sw-border-gradient' : '',
      block?.textGradient ? 'sw-text-gradient' : ''
    ].filter(Boolean).join(' ');
  }

  function normalizeSavedLinkWrappers(source) {
    return String(source || '').replace(
      /<div class="sw-link-gradient(?:\s+[^"]*)?"\s+data-sw-link-gradient=/g,
      '<div class="sw-link-gradient" data-sw-link-gradient='
    );
  }

  Core.parseDocument = source => previousParse(normalizeSavedLinkWrappers(source));

  function copyIcon() {
    return '<span class="sw-copy-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><rect x="8" y="8" width="10" height="10" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg></span>';
  }

  function polishServerCards(markup, block) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const root = template.content.querySelector('.sw-copy-pair');
    if (!root) return markup;

    const items = Array.isArray(block?.items) ? block.items.slice(0, 2) : [];
    root.querySelectorAll('.sw-copy-card').forEach((card, index) => {
      const item = items[index] || {};
      const ip = String(item.ip || '').trim();
      const title = String(item.title || ip || 'Адрес сервера').trim();
      card.setAttribute('aria-label', `Скопировать IP ${ip || title}`);

      const titleNode = card.querySelector('.sw-copy-title');
      if (titleNode) titleNode.textContent = title || ip;

      const ipNode = card.querySelector('.sw-copy-ip');
      if (ipNode) {
        if (!ip || title.toLowerCase() === ip.toLowerCase()) ipNode.remove();
        else ipNode.textContent = ip;
      }

      if (!card.querySelector('.sw-copy-icon')) {
        card.insertAdjacentHTML('beforeend', copyIcon());
      }
    });

    return template.innerHTML;
  }

  Core.serializeBlocks = blocks => {
    let output = previousSerializeBlocks(blocks);
    if ((blocks || []).length !== 1) return output;
    const block = blocks[0];

    if (block?.type === 'servercards') {
      return polishServerCards(output, block);
    }

    if (block?.type === 'linkgroup') {
      const classes = linkWrapperClasses(block);
      output = output.replace('<div class="sw-link-gradient" data-sw-link-gradient=', `<div class="${classes}" data-sw-link-gradient=`);
    }
    return output;
  };

  Core.renderBlocksHtml = (blocks, base='') => {
    const html = previousRender(blocks, base);
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll('.sw-copy-pair[data-editor-path]').forEach(root => {
      const path = root.dataset.editorPath;
      const refs = window.SurwaveEditorBlockRefs;
      const block = refs?.get(path);
      if (!block) return;
      const polished = document.createElement('template');
      polished.innerHTML = polishServerCards(root.outerHTML, block);
      root.replaceWith(polished.content.firstElementChild);
    });

    return template.innerHTML;
  };

  Core.previewCss += `
    .sw-copy-pair{gap:14px;margin:18px 0}
    .sw-copy-card{justify-content:flex-start;gap:16px;min-height:90px;padding:12px 16px;border-radius:16px;border:3px solid #1d292d;background:#050809;box-shadow:0 8px 22px rgba(0,0,0,.25);transition:transform .06s ease,box-shadow .18s ease,background .18s ease}
    .sw-copy-pair.sw-border-gradient .sw-copy-card{border:3px solid transparent;background:linear-gradient(#050809,#050809) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 12%,transparent) 0%,color-mix(in srgb,var(--sw-border-edge) 32%,transparent) 24%,color-mix(in srgb,var(--sw-border-center) 84%,transparent) 50%,color-mix(in srgb,var(--sw-border-edge) 32%,transparent) 76%,color-mix(in srgb,var(--sw-border-edge) 12%,transparent) 100%) border-box}
    .sw-copy-pair.sw-border-gradient .sw-copy-card:hover{background:linear-gradient(#08100d,#08100d) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 28%,transparent) 0%,color-mix(in srgb,var(--sw-border-edge) 64%,transparent) 24%,color-mix(in srgb,var(--sw-border-center) 94%,transparent) 50%,color-mix(in srgb,var(--sw-border-edge) 64%,transparent) 76%,color-mix(in srgb,var(--sw-border-edge) 28%,transparent) 100%) border-box;box-shadow:0 10px 26px rgba(0,0,0,.30),0 0 24px rgba(0,255,120,.07)}
    .sw-copy-pair.sw-border-gradient .sw-copy-card:active,.sw-copy-pair.sw-border-gradient .sw-copy-card.is-copied{transform:translateY(1px);background:linear-gradient(#09130f,#09130f) padding-box,linear-gradient(90deg,color-mix(in srgb,var(--sw-border-edge) 38%,transparent) 0%,color-mix(in srgb,var(--sw-border-edge) 74%,transparent) 24%,color-mix(in srgb,var(--sw-border-center) 97%,transparent) 50%,color-mix(in srgb,var(--sw-border-edge) 74%,transparent) 76%,color-mix(in srgb,var(--sw-border-edge) 38%,transparent) 100%) border-box}
    .sw-copy-image{width:50px;height:50px;border-radius:10px;background:#07100d;border:0}
    .sw-copy-content{flex:1;align-items:flex-start}.sw-copy-title{font-size:20px;font-weight:800;letter-spacing:.2px}.sw-copy-ip{margin-top:2px;font-size:13px}.sw-copy-state{margin-top:3px;white-space:nowrap;font-size:12px}
    .sw-copy-icon{margin-left:auto;display:grid;place-items:center;width:27px;height:27px;flex:none;color:#a9bbb4;opacity:.82;transition:color .18s ease,opacity .18s ease,transform .06s ease}.sw-copy-icon svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.sw-copy-card:hover .sw-copy-icon,.sw-copy-card.is-copied .sw-copy-icon{color:#00ffc0;opacity:1}.sw-copy-card:active .sw-copy-icon{transform:translateY(1px)}
    .sw-copy-pair.sw-text-gradient .sw-copy-title,.sw-copy-pair.sw-text-gradient .sw-copy-ip,.sw-copy-pair.sw-text-gradient .sw-copy-state{background:linear-gradient(90deg,var(--sw-text-edge) 0%,var(--sw-text-center) 50%,var(--sw-text-edge) 100%);-webkit-background-clip:text;background-clip:text;color:transparent!important}
    @media(max-width:650px){.sw-copy-card{min-height:84px}.sw-copy-state{white-space:normal}}
  `;
})();
