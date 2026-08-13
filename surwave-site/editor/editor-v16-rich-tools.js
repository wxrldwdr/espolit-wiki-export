(() => {
  const Core=window.SurwaveEditorCoreV2;
  const refs=window.SurwaveEditorBlockRefs;
  if(!Core||!(refs instanceof Map))return;

  const RICH_META_RE=/<!--SURWAVE_RICH_FIELDS_V1:([^\n]*?)-->/;
  const ARROW_DATA='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%2060%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g1%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2300ff78%22%20stop-opacity%3D%22.72%22%2F%3E%3Cstop%20offset%3D%22.58%22%20stop-color%3D%22%23bfffe0%22%20stop-opacity%3D%22.22%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22g2%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2300ff78%22%20stop-opacity%3D%22.38%22%2F%3E%3Cstop%20offset%3D%22.62%22%20stop-color%3D%22%23dffff0%22%20stop-opacity%3D%22.18%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M2%203%2046%2030%202%2057%2027%2030Z%22%20fill%3D%22url%28%23g1%29%22%2F%3E%3Cpath%20d%3D%22M38%203%2082%2030%2038%2057%2063%2030Z%22%20fill%3D%22url%28%23g2%29%22%2F%3E%3C%2Fsvg%3E';
  let scanFrame=0,tokenSeq=0,listDrag=null;

  function markDirty(){
    const field=document.getElementById('pagePath');
    if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function visibleText(root){
    return String(root?.textContent||'').replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00A0]/g,'').trim();
  }
  function actualBackground(el){
    const value=String(el?.style?.backgroundColor||el?.style?.background||'').trim().toLowerCase();
    if(!value||value==='transparent'||value==='rgba(0, 0, 0, 0)'||value==='rgba(0,0,0,0)')return'';
    return value;
  }
  function normalizeLegacyMarks(value){
    const box=document.createElement('div');box.innerHTML=String(value??'');
    [...box.querySelectorAll('mark')].forEach(mark=>{
      if(actualBackground(mark))return;
      const rawColor=mark.dataset.gitbookColor||mark.style.color||'';
      if(rawColor){
        const span=document.createElement('span');
        [...mark.attributes].forEach(attr=>{if(attr.name!=='style')span.setAttribute(attr.name,attr.value)});
        const color=rawColor==='$primary'?'#00ff78':rawColor;
        if(mark.dataset.gitbookColor)span.dataset.gitbookColor=mark.dataset.gitbookColor;
        span.style.color=color;
        while(mark.firstChild)span.appendChild(mark.firstChild);
        mark.replaceWith(span);
      }else{
        mark.replaceWith(...mark.childNodes);
      }
    });
    return box.innerHTML;
  }
  function walkBlocks(blocks,fn){
    (blocks||[]).forEach(block=>{
      fn(block);
      if(block.type==='hint'||block.type==='details')walkBlocks(block.children,fn);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>walkBlocks(step.children,fn));
    });
  }
  function mapRichFields(blocks,mapper){
    walkBlocks(blocks,b=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(b[key]!=null)b[key]=mapper(b[key]);
      if(b.type==='list')b.items=(b.items||[]).map(mapper);
      if(b.type==='image'||b.type==='gif'||b.type==='video')b.caption=mapper(b.caption||'');
      if(b.type==='mention')b.label=mapper(b.label||'Раздел');
      if(b.type==='linkgroup')b.items=(b.items||[]).map(item=>({...item,title:mapper(item.title||''),description:mapper(item.description||'')}));
      if(b.type==='embed'){b.title=mapper(b.title||'');b.description=mapper(b.description||'')}
      if(b.type==='table')b.rows=(b.rows||[]).map(row=>row.map(mapper));
      if(b.type==='servercards')b.items=(b.items||[]).map(item=>({...item,title:mapper(item.title||item.ip||'')}));
    });
    return blocks;
  }
  function canonicalCustom(el){
    if(el.matches('span[data-sw-inline-list="1"]')){
      const clone=el.cloneNode(true);
      clone.removeAttribute('contenteditable');
      clone.querySelectorAll('[contenteditable]').forEach(node=>node.removeAttribute('contenteditable'));
      clone.className='sw-inline-list';clone.dataset.swInlineList='1';
      return clone.outerHTML;
    }
    return '<span class="sw-inline-arrow" data-sw-inline-arrow="1" aria-hidden="true"></span>';
  }
  function protectCustom(value,tokens){
    const box=document.createElement('div');box.innerHTML=normalizeLegacyMarks(value);
    const protect=el=>{
      const token=`SWXRICH${++tokenSeq}TOKEN`;
      tokens.set(token,canonicalCustom(el));
      el.replaceWith(document.createTextNode(token));
    };
    [...box.querySelectorAll('span[data-sw-inline-list="1"]')].forEach(protect);
    [...box.querySelectorAll('span[data-sw-inline-arrow="1"]')].forEach(protect);
    return box.innerHTML;
  }
  function protectDirectRichFields(blocks,tokens){
    walkBlocks(blocks,b=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(b[key]!=null)b[key]=protectCustom(b[key],tokens);
      if(b.type==='list')b.items=(b.items||[]).map(value=>protectCustom(value,tokens));
      if(b.type==='gif'||b.type==='video')b.caption=protectCustom(b.caption||'',tokens);
      if(b.type==='linkgroup')b.items=(b.items||[]).map(item=>({...item,description:protectCustom(item.description||'',tokens)}));
      if(b.type==='embed'){
        b.title=protectCustom(b.title||'',tokens);
        b.description=protectCustom(b.description||'',tokens);
      }
    });
    return blocks;
  }

  const previousParse=Core.parseDocument;
  Core.parseDocument=source=>{
    const doc=previousParse(source);
    mapRichFields(doc.blocks,normalizeLegacyMarks);
    return doc;
  };
  const previousSerialize=Core.serializeDocument;
  Core.serializeDocument=(frontmatter,blocks)=>{
    const copy=Core.clone(blocks||[]),tokens=new Map();
    mapRichFields(copy,normalizeLegacyMarks);
    protectDirectRichFields(copy,tokens);
    let output=previousSerialize(frontmatter,copy);
    if(tokens.size){
      output=output.replace(RICH_META_RE,(full,payload)=>{
        let next=payload;
        for(const [token,html] of tokens)next=next.split(token).join(encodeURIComponent(html));
        return `<!--SURWAVE_RICH_FIELDS_V1:${next}-->`;
      });
      for(const [token,html] of tokens)output=output.split(token).join(html);
    }
    return output;
  };

  function editorForToolbar(toolbar){
    const wrap=toolbar?.parentElement;
    return wrap?.querySelector(':scope > .rich-editor')||wrap?.querySelector('.rich-editor')||null;
  }
  function selectionRange(editor){
    const selection=window.getSelection();if(!selection?.rangeCount)return null;
    const range=selection.getRangeAt(0),node=range.commonAncestorContainer;
    const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
    return node===editor||editor.contains(el)?range:null;
  }
  function commitEditor(editor){editor.dispatchEvent(new Event('input',{bubbles:true}))}
  function toolButton(html,title,handler,cls=''){
    const button=document.createElement('button');button.type='button';button.className=cls;button.innerHTML=html;button.title=title;
    button.addEventListener('mousedown',event=>{event.preventDefault();event.stopPropagation();handler()});
    return button;
  }
  function insertArrow(editor){
    editor.focus();const range=selectionRange(editor);if(!range)return;
    range.collapse(false);
    const arrow=document.createElement('span');arrow.className='sw-inline-arrow';arrow.dataset.swInlineArrow='1';arrow.contentEditable='false';arrow.setAttribute('aria-label','Стрелка');
    range.insertNode(arrow);
    const spacer=document.createTextNode('\u200B');arrow.after(spacer);
    range.setStartAfter(spacer);range.collapse(true);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    commitEditor(editor);
  }
  function splitSelectedHtml(fragment){
    const box=document.createElement('div');box.appendChild(fragment);
    let html=box.innerHTML;
    if(window.SurwaveRichLineBreaks?.normalizeHtml)html=window.SurwaveRichLineBreaks.normalizeHtml(html);
    return html.split(/<br\s*\/?\s*>/i).map(part=>part.trim()).filter(part=>{
      const tmp=document.createElement('div');tmp.innerHTML=part;return visibleText(tmp)||tmp.querySelector('img,svg,video,[data-sw-inline-arrow]');
    });
  }
  function selectedToList(editor){
    editor.focus();const range=selectionRange(editor);if(!range||range.collapsed)return;
    const parts=splitSelectedHtml(range.extractContents());if(!parts.length)return;
    const list=document.createElement('span');list.className='sw-inline-list';list.dataset.swInlineList='1';
    parts.forEach(part=>{const item=document.createElement('span');item.className='sw-inline-list-item';item.dataset.swInlineListItem='1';item.innerHTML=part;list.appendChild(item)});
    range.insertNode(list);
    const spacer=document.createTextNode('\u200B');list.after(spacer);
    range.setStartAfter(spacer);range.collapse(true);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    commitEditor(editor);
  }
  function copySelection(editor){
    editor.focus();const range=selectionRange(editor);if(!range||range.collapsed)return;
    document.execCommand('createLink',false,'#copy');commitEditor(editor);
  }
  function decorateToolbar(toolbar){
    if(!toolbar)return;
    const editor=editorForToolbar(toolbar);if(!editor)return;
    const noCopy=toolbar.dataset.swNoCopy==='1';
    let copies=[...toolbar.querySelectorAll('button')].filter(button=>/копирован/i.test(button.title||''));
    if(noCopy){copies.forEach(button=>button.remove());copies=[]}
    else{
      let copy=copies.shift();
      if(!copy){copy=toolButton('⧉','Пометить выделенный текст для копирования',()=>copySelection(editor),'sw-copy-mark-button');toolbar.appendChild(copy)}
      copy.classList.add('sw-copy-mark-button');
      copies.forEach(button=>button.remove());
    }
    if(!toolbar.querySelector('.sw-inline-list-button')){
      const listButton=toolButton('☷','Преобразовать выделенные строки в список',()=>selectedToList(editor),'sw-inline-list-button');
      toolbar.appendChild(listButton);
    }
    if(!toolbar.querySelector('.sw-inline-arrow-button')){
      const arrowButton=toolButton('<span class="sw-arrow-tool-icon" aria-hidden="true"></span>','Вставить визуальную стрелку',()=>insertArrow(editor),'sw-inline-arrow-button');
      toolbar.appendChild(arrowButton);
    }
  }

  function clearListDropMarks(card){card?.querySelectorAll('.sw-list-drop-before,.sw-list-drop-after,.sw-list-dragging').forEach(row=>row.classList.remove('sw-list-drop-before','sw-list-drop-after','sw-list-dragging'))}
  function syncListRows(card,block){
    const rows=[...card.querySelectorAll(':scope > .block-body > .list-row')];
    rows.forEach((row,index)=>{
      row.dataset.swListIndex=String(index);
      const value=block.items?.[index]||'';
      const editor=row.querySelector('.rich-editor');
      if(editor){const next=window.SurwaveUniversalRich?.normalize?window.SurwaveUniversalRich.normalize(value):value;if(editor.innerHTML!==next)editor.innerHTML=next}
      else{const input=row.querySelector('input.field');if(input&&input.value!==value)input.value=value}
    });
  }
  function decorateListCard(card){
    const block=refs.get(card.dataset.editorPath||'');if(!block||block.type!=='list')return;
    const rows=[...card.querySelectorAll(':scope > .block-body > .list-row')];
    rows.forEach((row,index)=>{
      row.dataset.swListIndex=String(index);
      if(row.dataset.swListDragReady==='1')return;row.dataset.swListDragReady='1';row.draggable=false;
      const handle=document.createElement('span');handle.className='sw-list-drag-handle';handle.textContent='⠿';handle.title='Перетащить пункт';handle.setAttribute('role','button');handle.tabIndex=0;
      row.insertBefore(handle,row.firstChild);
      const arm=event=>{event.stopPropagation();row.draggable=true};
      handle.addEventListener('pointerdown',arm);handle.addEventListener('mousedown',arm);
      const disarm=()=>{if(!row.classList.contains('sw-list-dragging'))row.draggable=false};
      handle.addEventListener('pointerup',disarm);handle.addEventListener('pointercancel',disarm);
      row.addEventListener('dragstart',event=>{
        if(!row.draggable){event.preventDefault();return}
        event.stopPropagation();const from=Number(row.dataset.swListIndex||index);
        listDrag={card,block,from,row};row.classList.add('sw-list-dragging');
        event.dataTransfer.effectAllowed='move';try{event.dataTransfer.setData('text/plain',String(from))}catch(_){}
      });
      row.addEventListener('dragover',event=>{
        if(!listDrag||listDrag.card!==card)return;event.preventDefault();event.stopPropagation();
        clearListDropMarks(card);listDrag.row.classList.add('sw-list-dragging');
        const rect=row.getBoundingClientRect(),after=event.clientY>rect.top+rect.height/2;
        row.classList.add(after?'sw-list-drop-after':'sw-list-drop-before');event.dataTransfer.dropEffect='move';
      });
      row.addEventListener('drop',event=>{
        if(!listDrag||listDrag.card!==card)return;event.preventDefault();event.stopPropagation();
        const from=listDrag.from,target=Number(row.dataset.swListIndex||index),rect=row.getBoundingClientRect(),after=event.clientY>rect.top+rect.height/2;
        let to=target+(after?1:0);if(from<to)to--;to=Math.max(0,Math.min((block.items||[]).length-1,to));
        if(to!==from){const item=block.items.splice(from,1)[0];block.items.splice(to,0,item);syncListRows(card,block);markDirty()}
        clearListDropMarks(card);listDrag=null;row.draggable=false;
      });
      row.addEventListener('dragend',()=>{clearListDropMarks(card);listDrag=null;row.draggable=false});
    });
  }

  function reinforceNestedType(zone){
    const title=zone.querySelector(':scope > .nested-title'),select=title?.querySelector('.sw-nested-type');
    const add=[...title?.querySelectorAll('button')||[]].find(button=>/^\+\s*Блок/.test(button.textContent||''));
    if(!select||!add||add.dataset.swNestedTypeGuard==='1')return;add.dataset.swNestedTypeGuard='1';
    add.addEventListener('click',()=>{
      const type=select.value||'text';if(type==='text')return;
      const previous=Core.defaultBlock,replacement=previous(type);
      const wrapper=requested=>requested==='text'?Core.clone(replacement):previous(requested);
      Core.defaultBlock=wrapper;
      queueMicrotask(()=>{if(Core.defaultBlock===wrapper)Core.defaultBlock=previous});
    },true);
  }

  function scan(){
    document.querySelectorAll('.rich-toolbar').forEach(decorateToolbar);
    document.querySelectorAll('.block-card[data-editor-path]').forEach(decorateListCard);
    document.querySelectorAll('.nested-zone').forEach(reinforceNestedType);
  }
  function schedule(){if(scanFrame)return;scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()})}
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule()});
  observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [0,100,250,600,1200].forEach(delay=>setTimeout(schedule,delay));

  const inlineCss=`.sw-inline-list{display:block;margin:.35em 0 .45em;padding-left:1.35em}.sw-inline-list-item{display:list-item;list-style-type:disc;padding-left:.1em}.sw-inline-arrow{display:inline-block;width:1.82em;height:1.02em;vertical-align:-.18em;margin:0 .08em;background:url("${ARROW_DATA}") center/contain no-repeat}`;
  Core.previewCss+=inlineCss;
  window.SurwaveRichToolsV16={normalizeLegacyMarks,arrowData:ARROW_DATA};
})();
