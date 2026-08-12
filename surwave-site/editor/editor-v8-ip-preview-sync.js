(() => {
  const frame=document.getElementById('preview');
  const refs=window.SurwaveEditorBlockRefs;
  if(!frame||!refs)return;

  const clamp=value=>{
    const n=Number(value);
    return Number.isFinite(n)?Math.max(0,Math.min(100,n)):100;
  };

  function findPreviewRoot(path){
    const doc=frame.contentDocument;
    if(!doc)return null;
    try{return doc.querySelector(`[data-editor-path="${CSS.escape(path)}"]`)}catch(_){return null}
  }

  function syncPath(path){
    const block=refs.get(path);
    if(!block||block.type!=='servercards')return;
    const root=findPreviewRoot(path);
    if(!root)return;
    const opacity=clamp(block.backgroundOpacity)/100;
    root.style.setProperty('--sw-bg-opacity',String(opacity));
    root.querySelectorAll(':scope > .sw-copy-card').forEach(card=>{
      const inner=[...card.children].find(node=>node.classList?.contains('sw-runtime-inner-layer'));
      if(inner)inner.style.setProperty('opacity',String(opacity),'important');
    });
  }

  function syncAll(){
    document.querySelectorAll('.block-card[data-editor-path]').forEach(card=>syncPath(card.dataset.editorPath));
  }

  let queuedPath='';
  let raf=0;
  function queuePath(path){
    queuedPath=path||queuedPath;
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      if(queuedPath){syncPath(queuedPath);queuedPath=''}
    });
  }

  function fromControl(event){
    const target=event.target;
    if(!(target instanceof Element))return;
    const editor=target.closest('.sw-advanced-gradient-editor');
    if(!editor)return;
    const card=target.closest('.block-card[data-editor-path]');
    if(!card)return;
    const block=refs.get(card.dataset.editorPath);
    if(block?.type==='servercards')queuePath(card.dataset.editorPath);
  }

  document.addEventListener('input',fromControl,true);
  document.addEventListener('change',fromControl,true);
  frame.addEventListener('load',()=>requestAnimationFrame(syncAll));
  frame.addEventListener('surwave-preview-updated',()=>requestAnimationFrame(syncAll));
  [150,400,900].forEach(ms=>setTimeout(syncAll,ms));
})();
