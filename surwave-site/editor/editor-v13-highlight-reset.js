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
    const sel=window.getSelection();if(!sel?.rangeCount)return false;
    const range=sel.getRangeAt(0);if(!rangeInside(editor,range))return false;
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
  function cleanShell(el){
    const shell=el.tagName==='MARK'?document.createElement('span'):el.cloneNode(false);
    if(el.tagName==='MARK')[...el.attributes].forEach(attr=>shell.setAttribute(attr.name,attr.value));
    shell.style.removeProperty('background');
    shell.style.removeProperty('background-color');
    if(shell.hasAttribute('style')&&!shell.getAttribute('style').trim())shell.removeAttribute('style');
    return shell;
  }
  function normalShell(el){return el.cloneNode(false)}
  function appendWrapped(target,shell,contents){
    if(!contents?.hasChildNodes())return;
    shell.appendChild(contents);target.appendChild(shell);
  }
  function stripBackground(el){
    if(!el?.parentNode)return;
    const shell=cleanShell(el);
    while(el.firstChild)shell.appendChild(el.firstChild);
    el.replaceWith(shell);
    if(shell.tagName==='SPAN'&&!shell.attributes.length)shell.replaceWith(...shell.childNodes);
  }
  function backgroundAncestor(node,editor){
    let el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    while(el&&el!==editor){if(hasBackground(el))return el;el=el.parentElement}
    return null;
  }
  function depth(el){let n=0,p=el;while((p=p.parentElement))n++;return n}
  function rangeBetween(startMarker,endMarker){
    const range=document.createRange();range.setStartAfter(startMarker);range.setEndBefore(endMarker);return range;
  }
  function splitCandidate(el,startMarker,endMarker){
    if(!el?.isConnected)return;
    const hasStart=el.contains(startMarker),hasEnd=el.contains(endMarker);
    if(!hasStart&&!hasEnd){stripBackground(el);return}

    try{
      const replacement=document.createDocumentFragment();
      if(hasStart&&hasEnd){
        const before=document.createRange();before.selectNodeContents(el);before.setEndBefore(startMarker);
        const middle=document.createRange();middle.setStartAfter(startMarker);middle.setEndBefore(endMarker);
        const after=document.createRange();after.selectNodeContents(el);after.setStartAfter(endMarker);
        const beforeFrag=before.cloneContents(),middleFrag=middle.cloneContents(),afterFrag=after.cloneContents();
        appendWrapped(replacement,normalShell(el),beforeFrag);
        replacement.appendChild(startMarker);
        appendWrapped(replacement,cleanShell(el),middleFrag);
        replacement.appendChild(endMarker);
        appendWrapped(replacement,normalShell(el),afterFrag);
        el.replaceWith(replacement);
        return;
      }
      if(hasStart){
        const before=document.createRange();before.selectNodeContents(el);before.setEndBefore(startMarker);
        const tail=document.createRange();tail.setStartAfter(startMarker);tail.setEnd(el,el.childNodes.length);
        const beforeFrag=before.cloneContents(),tailFrag=tail.cloneContents();
        appendWrapped(replacement,normalShell(el),beforeFrag);
        replacement.appendChild(startMarker);
        appendWrapped(replacement,cleanShell(el),tailFrag);
        el.replaceWith(replacement);
        return;
      }
      const head=document.createRange();head.setStart(el,0);head.setEndBefore(endMarker);
      const after=document.createRange();after.setStartAfter(endMarker);after.setEnd(el,el.childNodes.length);
      const headFrag=head.cloneContents(),afterFrag=after.cloneContents();
      appendWrapped(replacement,cleanShell(el),headFrag);
      replacement.appendChild(endMarker);
      appendWrapped(replacement,normalShell(el),afterFrag);
      el.replaceWith(replacement);
    }catch(error){console.warn('Surwave highlight split failed',error)}
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
    const range=restore(editor);if(!range)return false;
    if(range.collapsed){
      const hit=backgroundAncestor(range.startContainer,editor);if(!hit)return false;
      stripBackground(hit);cleanEmptyHighlights(editor);editor.dispatchEvent(new Event('input',{bubbles:true}));return true;
    }
    try{
      const startMarker=document.createElement('span'),endMarker=document.createElement('span');
      startMarker.dataset.swHighlightBoundary='start';endMarker.dataset.swHighlightBoundary='end';
      const endRange=range.cloneRange();endRange.collapse(false);endRange.insertNode(endMarker);
      const startRange=range.cloneRange();startRange.collapse(true);startRange.insertNode(startMarker);

      const selected=rangeBetween(startMarker,endMarker);
      const candidates=[...editor.querySelectorAll('mark,[style]')]
        .filter(hasBackground)
        .filter(el=>{try{return selected.intersectsNode(el)}catch(_){return false}})
        .sort((a,b)=>depth(b)-depth(a));
      candidates.forEach(el=>splitCandidate(el,startMarker,endMarker));

      const finalRange=rangeBetween(startMarker,endMarker);
      startMarker.remove();endMarker.remove();
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(finalRange);
      savedRanges.set(editor,finalRange.cloneRange());
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
