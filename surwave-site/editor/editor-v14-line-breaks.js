(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;

  function isBlankBlock(node){
    const text=(node.textContent||'').replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g,'').trim();
    if(text)return false;
    return !node.querySelector('img,video,svg,canvas,iframe,object,embed');
  }
  function normalizeContainer(container){
    [...container.children].forEach(child=>{
      if(child.tagName!=='PRE'&&child.tagName!=='CODE')normalizeContainer(child);
    });
    const nodes=[...container.childNodes];
    if(!nodes.some(node=>node.nodeType===Node.ELEMENT_NODE&&(node.tagName==='DIV'||node.tagName==='P')))return;
    const fragment=document.createDocumentFragment();
    let emitted=false;
    for(const node of nodes){
      if(node.nodeType===Node.ELEMENT_NODE&&(node.tagName==='DIV'||node.tagName==='P')){
        if(emitted)fragment.appendChild(document.createElement('br'));
        const blank=isBlankBlock(node);
        if(!blank){
          while(node.firstChild)fragment.appendChild(node.firstChild);
        }
        emitted=true;
        continue;
      }
      fragment.appendChild(node);
      if(node.nodeType===Node.ELEMENT_NODE||String(node.nodeValue||'').length)emitted=true;
    }
    container.replaceChildren(fragment);
  }
  function normalizeHtml(value){
    const box=document.createElement('div');box.innerHTML=String(value??'');
    normalizeContainer(box);
    const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);
    const textNodes=[];while(walker.nextNode())textNodes.push(walker.currentNode);
    textNodes.forEach(node=>{node.nodeValue=(node.nodeValue||'').replace(/[\u200B\uFEFF]/g,'')});
    return box.innerHTML;
  }
  function walk(blocks,fn){
    (blocks||[]).forEach(block=>{
      fn(block);
      if(block.type==='hint'||block.type==='details')walk(block.children,fn);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>walk(step.children,fn));
    });
  }
  function normalizeBlocks(blocks){
    walk(blocks,b=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(b[key]!=null)b[key]=normalizeHtml(b[key]);
      if(b.type==='list')b.items=(b.items||[]).map(normalizeHtml);
      if(b.type==='image')b.caption=normalizeHtml(b.caption||'');
      if(b.type==='mention')b.label=normalizeHtml(b.label||'Раздел');
      if(b.type==='linkgroup')b.items=(b.items||[]).map(item=>({...item,title:normalizeHtml(item.title||''),description:normalizeHtml(item.description||'')}));
      if(b.type==='embed'){b.title=normalizeHtml(b.title||'');b.description=normalizeHtml(b.description||'')}
      if(b.type==='table')b.rows=(b.rows||[]).map(row=>row.map(normalizeHtml));
      if(b.type==='servercards')b.items=(b.items||[]).map(item=>({...item,title:normalizeHtml(item.title||item.ip||'')}));
    });
    return blocks;
  }

  const previousParse=Core.parseDocument;
  Core.parseDocument=source=>{
    const doc=previousParse(source);
    normalizeBlocks(doc.blocks);
    return doc;
  };
  const previousSerialize=Core.serializeDocument;
  Core.serializeDocument=(frontmatter,blocks)=>{
    const copy=Core.clone(blocks||[]);
    normalizeBlocks(copy);
    return previousSerialize(frontmatter,copy);
  };

  function selectionInside(editor){
    const sel=window.getSelection();if(!sel?.rangeCount)return null;
    const range=sel.getRangeAt(0),node=range.commonAncestorContainer;
    const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
    return node===editor||editor.contains(el)?range:null;
  }
  function insertBreak(editor){
    const range=selectionInside(editor);if(!range)return false;
    range.deleteContents();
    const br=document.createElement('br');
    range.insertNode(br);
    range.setStartAfter(br);range.collapse(true);
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
    editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertLineBreak'}));
    return true;
  }

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.ctrlKey||event.altKey||event.metaKey)return;
    const editor=event.target?.closest?.('.rich-editor');if(!editor)return;
    event.preventDefault();event.stopPropagation();
    insertBreak(editor);
  },true);

  document.addEventListener('focusout',event=>{
    const editor=event.target?.closest?.('.rich-editor');if(!editor)return;
    const before=editor.innerHTML,after=normalizeHtml(before);
    if(after!==before){editor.innerHTML=after;editor.dispatchEvent(new Event('input',{bubbles:true}))}
  },true);

  window.SurwaveRichLineBreaks={normalizeHtml};
})();
