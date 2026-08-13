(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;

  function editorForReset(button){
    const toolbar=button?.closest?.('.rich-toolbar'),wrap=toolbar?.parentElement;
    return wrap?.querySelector(':scope > .rich-editor')||wrap?.querySelector('.rich-editor')||null;
  }
  function rangeInside(editor){
    const sel=window.getSelection();if(!editor||!sel?.rangeCount)return null;
    const range=sel.getRangeAt(0),node=range.commonAncestorContainer;
    const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
    return node===editor||editor.contains(el)?range:null;
  }
  function removeBackgroundElement(el){
    if(!el?.parentNode)return;
    if(el.tagName==='MARK'){
      const span=document.createElement('span');
      [...el.attributes].forEach(attr=>span.setAttribute(attr.name,attr.value));
      span.style.removeProperty('background');span.style.removeProperty('background-color');
      if(span.hasAttribute('style')&&!span.getAttribute('style').trim())span.removeAttribute('style');
      while(el.firstChild)span.appendChild(el.firstChild);
      el.replaceWith(span);
      if(!span.attributes.length)span.replaceWith(...span.childNodes);
      return;
    }
    el.style?.removeProperty('background');el.style?.removeProperty('background-color');
    if(el.hasAttribute?.('style')&&!el.getAttribute('style').trim())el.removeAttribute('style');
  }
  function stripBackgroundDeep(root){
    if(!root?.querySelectorAll)return;
    [...root.querySelectorAll('mark,[style]')].reverse().forEach(removeBackgroundElement);
  }
  function sealCurrentSelection(editor){
    const range=rangeInside(editor);if(!range||range.collapsed)return;
    try{
      const fragment=range.extractContents();stripBackgroundDeep(fragment);
      const seal=document.createElement('span');seal.dataset.swHighlightCleared='1';seal.appendChild(fragment);range.insertNode(seal);
      const selected=document.createRange();selected.selectNodeContents(seal);
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(selected);
      editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'formatBackColor'}));
    }catch(error){console.warn('Surwave highlight persistence seal failed',error)}
  }

  document.addEventListener('mousedown',event=>{
    const button=event.target?.closest?.('.sw-highlight-reset-button');if(!button)return;
    const editor=editorForReset(button);if(!editor)return;
    queueMicrotask(()=>sealCurrentSelection(editor));
  },true);

  function cleanValue(value){
    const box=document.createElement('div');box.innerHTML=String(value??'');
    box.querySelectorAll('[data-sw-highlight-cleared]').forEach(seal=>{
      stripBackgroundDeep(seal);
      seal.replaceWith(...seal.childNodes);
    });
    return box.innerHTML;
  }
  function walk(blocks){
    (blocks||[]).forEach(block=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(typeof block[key]==='string')block[key]=cleanValue(block[key]);
      if(block.type==='list')block.items=(block.items||[]).map(cleanValue);
      if(['image','gif','video'].includes(block.type)&&typeof block.caption==='string')block.caption=cleanValue(block.caption);
      if(block.type==='mention'&&typeof block.label==='string')block.label=cleanValue(block.label);
      if(block.type==='linkgroup')block.items=(block.items||[]).map(item=>({...item,title:cleanValue(item.title||''),description:cleanValue(item.description||'')}));
      if(block.type==='embed'){block.title=cleanValue(block.title||'');block.description=cleanValue(block.description||'')}
      if(block.type==='table')block.rows=(block.rows||[]).map(row=>row.map(cell=>cleanValue(cell||'')));
      if(block.type==='servercards')block.items=(block.items||[]).map(item=>({...item,title:cleanValue(item.title||item.ip||'')}));
      if(block.type==='hint'||block.type==='details')walk(block.children);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>walk(step.children));
    });
    return blocks;
  }

  const previousSerialize=Core.serializeDocument;
  Core.serializeDocument=(frontmatter,blocks)=>{
    const copy=Core.clone(blocks||[]);walk(copy);
    return previousSerialize(frontmatter,copy);
  };
  window.SurwaveHighlightPersistence=true;
})();
