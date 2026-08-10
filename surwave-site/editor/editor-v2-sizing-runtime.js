(() => {
  const Core = window.SurwaveEditorCoreV2;
  const refs = window.SurwaveEditorBlockRefs;
  if (!Core || !refs) return;

  Core.previewCss += '.sw-preview-image-frame{display:flex!important;flex-direction:column!important;overflow:hidden!important}.sw-preview-image-frame>img{flex:1 1 auto;min-height:0}.sw-preview-image-frame>figcaption{flex:0 0 auto}';
  const previous = Core.renderBlocksHtml;

  Core.renderBlocksHtml = (blocks, base='') => {
    const html = previous(blocks, base);
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('[data-editor-path]').forEach(node => {
      const block = refs.get(node.dataset.editorPath);
      if (!block || block.type !== 'image') return;
      node.classList.add('sw-preview-image-frame');
      const img = node.querySelector('img');
      if (!img) return;
      const fixedHeight = Number(block.layout?.height) > 0;
      if (fixedHeight) {
        img.style.flex = '1 1 auto';
        img.style.minHeight = '0';
        img.style.height = '0';
        img.style.width = '100%';
      } else {
        img.style.removeProperty('flex');
        img.style.removeProperty('min-height');
        img.style.height = 'auto';
      }
    });
    return template.innerHTML;
  };
})();
