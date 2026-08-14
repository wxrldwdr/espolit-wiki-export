(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;

  const ARROW_SRC='/surwave-site/assets/icons/inline-arrow.svg';
  const savedRanges=new WeakMap();
  let scanFrame=0;

  function editorForToolbar(toolbar){
    const wrap=toolbar?.parentElement;
    return wrap?.querySelector(':scope > .rich-editor')||wrap?.querySelector('.rich-editor')||null;
  }
  function rangeInside(editor,range){
    if(!editor||!range)return false;
    const node=range.commonAncestorContainer;
    const el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    return node===editor||!!(el&&editor.contains(el));
  }
  function remember(editor){
    if(!editor)return null;
    const sel=window.getSelection();
    if(!sel?.rangeCount)return null;
    const range=sel.getRangeAt(0);
    if(!rangeInside(editor,range))return null;
    try{
      const copy=range.cloneRange();
      savedRanges.set(editor,copy);
      return copy;
    }catch(_){return null}
  }
  function usableRange(editor){
    const sel=window.getSelection();
    if(sel?.rangeCount){
      const current=sel.getRangeAt(0);
      if(rangeInside(editor,current)){
        try{return current.cloneRange()}catch(_){}
      }
    }
    const saved=savedRanges.get(editor);
    if(saved?.startContainer?.isConnected&&saved?.endContainer?.isConnected&&rangeInside(editor,saved)){
      try{return saved.cloneRange()}catch(_){}
    }
    const end=document.createRange();
    end.selectNodeContents(editor);end.collapse(false);
    return end;
  }
  function selectRange(editor,range){
    try{
      editor.focus({preventScroll:true});
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
      savedRanges.set(editor,range.cloneRange());
    }catch(_){}
  }
  function makeArrow(){
    const img=document.createElement('img');
    img.className='sw-inline-arrow-image';
    img.dataset.swInlineArrow='1';
    img.dataset.swSource=ARROW_SRC;
    img.src=ARROW_SRC;
    img.alt='';
    img.draggable=false;
    img.contentEditable='false';
    img.setAttribute('aria-hidden','true');
    return img;
  }
  function insertArrow(editor){
    const range=usableRange(editor);
    if(!range)return;
    range.collapse(false);
    const arrow=makeArrow();
    range.insertNode(arrow);
    const spacer=document.createTextNode('\u200B');
    arrow.after(spacer);
    range.setStartAfter(spacer);range.collapse(true);
    selectRange(editor,range);
    editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:null}));
  }
  function makeButton(editor){
    const button=document.createElement('button');
    button.type='button';
    button.className='sw-inline-arrow-button';
    button.title='Вставить визуальную стрелку';
    button.innerHTML=`<img class="sw-arrow-tool-icon" src="${ARROW_SRC}" width="24" height="16" alt="" draggable="false">`;
    button.addEventListener('pointerdown',event=>{remember(editor);event.preventDefault();event.stopPropagation()});
    button.addEventListener('mousedown',event=>{remember(editor);event.preventDefault();event.stopPropagation()});
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();insertArrow(editor)});
    return button;
  }
  function decorateToolbar(toolbar){
    const editor=editorForToolbar(toolbar);if(!editor)return;
    const current=toolbar.querySelector('.sw-inline-arrow-button');
    if(current?.dataset.swInlineArrowV20==='1')return;
    const button=makeButton(editor);button.dataset.swInlineArrowV20='1';
    if(current)current.replaceWith(button);else toolbar.appendChild(button);
  }
  function normalizeArrowElements(root=document){
    root.querySelectorAll?.('span.sw-inline-arrow[data-sw-inline-arrow="1"]').forEach(span=>{
      const img=makeArrow();span.replaceWith(img);
    });
  }
  function injectStyles(){
    if(document.getElementById('sw-inline-media-v20-style'))return;
    const style=document.createElement('style');style.id='sw-inline-media-v20-style';
    style.textContent=`
      .sw-inline-arrow-image{display:inline-block!important;width:1.82em!important;height:1.02em!important;max-width:none!important;max-height:none!important;object-fit:contain!important;vertical-align:-.18em!important;margin:0 .08em!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
      .sw-arrow-tool-icon{display:block!important;width:24px!important;height:16px!important;object-fit:contain!important;pointer-events:none!important;border:0!important;background:transparent!important}
      .sw-inline-pasted-image{display:block!important;width:auto!important;max-width:100%!important;height:auto!important;max-height:480px!important;object-fit:contain!important;margin:.45em 0!important;border-radius:8px!important;border:1px solid rgba(116,145,134,.22)!important;background:#05090a!important}
    `;
    document.head.appendChild(style);
  }
  function scan(){
    document.querySelectorAll('.rich-toolbar').forEach(decorateToolbar);
    normalizeArrowElements(document);
  }
  function schedule(){if(scanFrame)return;scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()})}

  document.addEventListener('selectionchange',()=>{
    const sel=window.getSelection();if(!sel?.rangeCount)return;
    const node=sel.anchorNode,el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    const editor=el?.closest?.('.rich-editor');if(editor)remember(editor);
  });
  document.addEventListener('pointerdown',event=>{
    const toolbar=event.target?.closest?.('.rich-toolbar');if(toolbar)remember(editorForToolbar(toolbar));
  },true);

  injectStyles();
  Core.previewCss+=`.sw-inline-arrow-image{display:inline-block!important;width:1.82em!important;height:1.02em!important;max-width:none!important;max-height:none!important;object-fit:contain!important;vertical-align:-.18em!important;margin:0 .08em!important;border:0!important;border-radius:0!important;background:transparent!important}.sw-inline-pasted-image{display:block!important;width:auto!important;max-width:100%!important;height:auto!important;max-height:480px!important;object-fit:contain!important;margin:.45em 0!important;border-radius:8px!important;border:1px solid rgba(116,145,134,.22)!important;background:#05090a!important}`;
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule()});
  observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [0,80,180,400,900].forEach(delay=>setTimeout(schedule,delay));

  window.SurwaveInlineMediaV20={remember,usableRange,insertArrow};
})();
