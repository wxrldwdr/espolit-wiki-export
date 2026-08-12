(() => {
  const savedRanges=new WeakMap();
  let scanFrame=0;

  function editorFromToolbar(toolbar){
    if(!toolbar)return null;
    const wrap=toolbar.parentElement;
    return wrap?.querySelector(':scope > .rich-editor')||wrap?.querySelector('.rich-editor')||null;
  }
  function rangeInside(editor,range){
    if(!editor||!range)return false;
    const node=range.commonAncestorContainer;
    const el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    return node===editor||!!(el&&editor.contains(el));
  }
  function remember(editor){
    if(!editor)return false;
    const sel=window.getSelection();
    if(!sel?.rangeCount)return false;
    const range=sel.getRangeAt(0);
    if(!rangeInside(editor,range))return false;
    try{savedRanges.set(editor,range.cloneRange());return true}catch(_){return false}
  }
  function restore(editor){
    const stored=savedRanges.get(editor);
    if(!stored||!stored.startContainer?.isConnected||!stored.endContainer?.isConnected||!rangeInside(editor,stored))return null;
    try{
      const range=stored.cloneRange(),sel=window.getSelection();
      sel.removeAllRanges();sel.addRange(range);return range;
    }catch(_){return null}
  }
  function hasBackground(el){
    if(!el||el.nodeType!==Node.ELEMENT_NODE)return false;
    if(el.tagName==='MARK')return true;
    const raw=el.getAttribute('style')||'';
    return !!el.style.backgroundColor||!!el.style.background||/(?:^|;)\s*background(?:-color)?\s*:/i.test(raw);
  }
  function stripBackground(el){
    if(!el?.parentNode)return;
    if(el.tagName==='MARK'){
      const span=document.createElement('span');
      [...el.attributes].forEach(attr=>span.setAttribute(attr.name,attr.value));
      span.style.removeProperty('background');
      span.style.removeProperty('background-color');
      if(span.hasAttribute('style')&&!span.getAttribute('style').trim())span.removeAttribute('style');
      while(el.firstChild)span.appendChild(el.firstChild);
      el.replaceWith(span);
      if(!span.attributes.length)span.replaceWith(...span.childNodes);
      return;
    }
    el.style.removeProperty('background');
    el.style.removeProperty('background-color');
    if(el.hasAttribute('style')&&!el.getAttribute('style').trim())el.removeAttribute('style');
    if(el.tagName==='SPAN'&&!el.attributes.length)el.replaceWith(...el.childNodes);
  }
  function cleanFragment(fragment){
    const all=[...fragment.querySelectorAll('mark,[style]')];
    for(let i=all.length-1;i>=0;i--){
      const el=all[i];
      if(el.isConnected||fragment.contains(el)){
        if(hasBackground(el))stripBackground(el);
      }
    }
  }
  function cleanEmptyHighlights(editor){
    const all=[...editor.querySelectorAll('mark,[style]')];
    for(let i=all.length-1;i>=0;i--){
      const el=all[i];if(!hasBackground(el))continue;
      const visible=(el.textContent||'').replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g,'').trim();
      if(!visible)stripBackground(el);
    }
  }
  function clearHighlight(editor){
    const range=restore(editor);
    if(!range||range.collapsed)return false;
    try{
      const fragment=range.extractContents();
      cleanFragment(fragment);
      const holder=document.createElement('span');
      holder.appendChild(fragment);
      range.insertNode(holder);
      const selected=document.createRange();selected.selectNodeContents(holder);
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(selected);
      savedRanges.set(editor,selected.cloneRange());
      cleanEmptyHighlights(editor);
      editor.dispatchEvent(new Event('input',{bubbles:true}));
      return true;
    }catch(error){
      console.warn('Surwave highlight reset failed',error);
      return false;
    }
  }
  function decorateToolbar(toolbar){
    if(!toolbar||toolbar.querySelector('.sw-highlight-reset-button'))return;
    const highlight=[...toolbar.querySelectorAll('input[type="color"]')].find(input=>String(input.title||'').toLowerCase().includes('выдел'));
    if(!highlight)return;
    const button=document.createElement('button');button.type='button';button.className='sw-highlight-reset-button';button.textContent='Сброс';button.title='Убрать цвет выделения у выбранного текста';
    button.addEventListener('mousedown',event=>{
      event.preventDefault();event.stopPropagation();
      const editor=editorFromToolbar(toolbar);if(!editor)return;
      if(!restore(editor))remember(editor);
      clearHighlight(editor);
    });
    highlight.insertAdjacentElement('afterend',button);
  }
  function scan(){document.querySelectorAll('.rich-toolbar').forEach(decorateToolbar)}
  function scheduleScan(){if(scanFrame)return;scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()})}

  document.addEventListener('selectionchange',()=>{
    const sel=window.getSelection();if(!sel?.rangeCount)return;
    const node=sel.anchorNode,el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    const editor=el?.closest?.('.rich-editor');if(editor)remember(editor);
  });
  document.addEventListener('pointerdown',event=>{
    const toolbar=event.target?.closest?.('.rich-toolbar');if(toolbar)remember(editorFromToolbar(toolbar));
  },true);

  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))scheduleScan()});
  observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [0,100,300,700,1400].forEach(ms=>setTimeout(scheduleScan,ms));
})();
