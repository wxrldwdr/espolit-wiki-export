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
  function surfaceColor(percent){return`color-mix(in srgb,#050809 ${percent}%,var(--bg,#060a0c))`}

  function syncPath(path){
    const block=refs.get(path);
    if(!block||block.type!=='servercards')return;
    const root=findPreviewRoot(path);
    if(!root)return;
    const percent=clamp(block.backgroundOpacity),opacity=percent/100;
    root.style.setProperty('--sw-bg-opacity',String(opacity));
    root.querySelectorAll(':scope > .sw-copy-card').forEach(card=>{
      const inner=[...card.children].find(node=>node.classList?.contains('sw-runtime-inner-layer'));
      const buffer=[...card.children].find(node=>node.classList?.contains('sw-runtime-buffer-layer'));
      if(buffer){buffer.style.setProperty('background','var(--bg,#060a0c)','important');buffer.style.setProperty('opacity','1','important')}
      if(inner){inner.style.setProperty('background',surfaceColor(percent),'important');inner.style.setProperty('opacity','1','important')}
    });
  }

  function syncAll(){
    document.querySelectorAll('.block-card[data-editor-path]').forEach(card=>syncPath(card.dataset.editorPath));
  }

  function relabelShade(){
    document.querySelectorAll('.sw-advanced-gradient-editor .sw-adv-field>span').forEach(label=>{
      if(label.textContent.trim()==='Затемнение блока')label.textContent='Затемнение градиента';
    });
    document.querySelectorAll('.sw-advanced-gradient-editor .sw-adv-note').forEach(note=>{
      if(note.textContent.includes('«Затемнение блока»'))note.textContent=note.textContent.replace('«Затемнение блока»','«Затемнение градиента»').replace('направленным слоем','направленным слоем только рамки');
    });
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

  function bindPreviewGuards(){
    const doc=frame.contentDocument;
    if(!doc||doc.documentElement.dataset.swIpOpacityGuard==='1')return;
    doc.documentElement.dataset.swIpOpacityGuard='1';
    const restore=event=>{
      const target=event.target;
      if(!(target instanceof frame.contentWindow.Element))return;
      const root=target.closest('.sw-copy-pair[data-editor-path]');
      if(!root)return;
      queueMicrotask(()=>syncPath(root.dataset.editorPath));
    };
    ['pointerover','pointerout','pointerdown','pointerup','click'].forEach(type=>doc.addEventListener(type,restore,true));
  }

  document.addEventListener('input',fromControl,true);
  document.addEventListener('change',fromControl,true);
  frame.addEventListener('load',()=>requestAnimationFrame(()=>{bindPreviewGuards();syncAll()}));
  frame.addEventListener('surwave-preview-updated',()=>requestAnimationFrame(()=>{bindPreviewGuards();syncAll()}));
  [150,400,900,1500].forEach(ms=>setTimeout(()=>{bindPreviewGuards();syncAll();relabelShade()},ms));
})();
