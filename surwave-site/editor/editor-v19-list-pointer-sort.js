(() => {
  const refs=window.SurwaveEditorBlockRefs;
  if(!(refs instanceof Map))return;

  let scanFrame=0;
  let session=null;

  function markDirty(){
    const field=document.getElementById('pagePath');
    if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function injectStyles(){
    if(document.getElementById('sw-list-pointer-sort-style'))return;
    const style=document.createElement('style');
    style.id='sw-list-pointer-sort-style';
    style.textContent=`
      .list-row{position:relative}
      .sw-list-drag-handle{display:inline-flex;flex:0 0 24px;align-self:stretch;align-items:center;justify-content:center;color:#698078;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;font:700 16px/1 monospace;border-radius:6px}
      .sw-list-drag-handle:hover{color:#00ffc0;background:rgba(0,255,192,.055)}
      .sw-list-drag-handle:active{cursor:grabbing}
      .list-row.sw-list-pointer-source{opacity:.34}
      .list-row.sw-list-drop-before{box-shadow:inset 0 2px 0 #00ffc0}
      .list-row.sw-list-drop-after{box-shadow:inset 0 -2px 0 #00ffc0}
      .sw-list-pointer-ghost{position:fixed;z-index:2147483000;pointer-events:none;box-sizing:border-box;margin:0;opacity:.96;transform:translateZ(0);border:1px solid rgba(0,255,192,.55);border-radius:9px;background:#071012;box-shadow:0 14px 34px rgba(0,0,0,.48);overflow:hidden}
      .sw-list-pointer-ghost .sw-list-drag-handle{color:#00ffc0}
      body.sw-list-pointer-sorting,body.sw-list-pointer-sorting *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}
    `;
    document.head.appendChild(style);
  }

  function rowsFor(card){
    return [...card.querySelectorAll(':scope > .block-body > .list-row')];
  }

  function clearMarks(card){
    if(!card)return;
    rowsFor(card).forEach(row=>row.classList.remove('sw-list-pointer-source','sw-list-drop-before','sw-list-drop-after'));
  }

  function normalizeRich(value){
    return window.SurwaveUniversalRich?.normalize
      ? window.SurwaveUniversalRich.normalize(value)
      : String(value??'');
  }

  function syncRows(card,block){
    const rows=rowsFor(card);
    rows.forEach((row,index)=>{
      row.dataset.swListIndex=String(index);
      const value=String(block.items?.[index]??'');
      const editor=row.querySelector('.rich-editor');
      if(editor){
        const next=normalizeRich(value);
        if(editor.innerHTML!==next)editor.innerHTML=next;
      }else{
        const input=row.querySelector('input.field');
        if(input&&input.value!==value)input.value=value;
      }
    });
  }

  function insertionSlot(rows,y){
    for(let i=0;i<rows.length;i++){
      const rect=rows[i].getBoundingClientRect();
      if(y<rect.top+rect.height/2)return i;
    }
    return rows.length;
  }

  function destinationIndex(from,slot,length){
    let to=slot;
    if(slot>from)to--;
    return Math.max(0,Math.min(Math.max(0,length-1),to));
  }

  function showBoundary(card,slot){
    const rows=rowsFor(card);
    rows.forEach(row=>row.classList.remove('sw-list-drop-before','sw-list-drop-after'));
    if(!rows.length)return;
    if(slot<=0)rows[0].classList.add('sw-list-drop-before');
    else if(slot>=rows.length)rows[rows.length-1].classList.add('sw-list-drop-after');
    else rows[slot].classList.add('sw-list-drop-before');
  }

  function scrollNearEdge(clientY){
    const workspace=document.querySelector('.workspace');
    const container=workspace&&workspace.scrollHeight>workspace.clientHeight+4?workspace:document.scrollingElement;
    if(!container)return;
    const rect=container===document.scrollingElement
      ? {top:0,bottom:window.innerHeight}
      : container.getBoundingClientRect();
    const edge=72;
    let delta=0;
    if(clientY<rect.top+edge)delta=-Math.max(4,Math.round((rect.top+edge-clientY)/4));
    else if(clientY>rect.bottom-edge)delta=Math.max(4,Math.round((clientY-(rect.bottom-edge))/4));
    if(!delta)return;
    if(container===document.scrollingElement)window.scrollBy(0,delta);
    else container.scrollTop+=delta;
  }

  function makeGhost(row,rect){
    const ghost=row.cloneNode(true);
    ghost.classList.remove('sw-list-pointer-source','sw-list-drop-before','sw-list-drop-after');
    ghost.classList.add('sw-list-pointer-ghost');
    ghost.removeAttribute('draggable');
    ghost.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
    ghost.querySelectorAll('input,textarea,select,button').forEach(el=>{el.disabled=true;el.tabIndex=-1});
    ghost.style.left=`${rect.left}px`;
    ghost.style.top=`${rect.top}px`;
    ghost.style.width=`${rect.width}px`;
    ghost.style.height=`${rect.height}px`;
    document.body.appendChild(ghost);
    return ghost;
  }

  function finish(cancel=false){
    const current=session;
    if(!current)return;
    session=null;
    document.body.classList.remove('sw-list-pointer-sorting');
    clearMarks(current.card);
    current.ghost?.remove();
    try{current.handle.releasePointerCapture(current.pointerId)}catch(_){}

    if(cancel||!current.moved)return;
    const length=current.block.items?.length||0;
    const to=destinationIndex(current.from,current.slot,length);
    if(to===current.from)return;
    const item=current.block.items.splice(current.from,1)[0];
    current.block.items.splice(to,0,item);
    syncRows(current.card,current.block);
    markDirty();
  }

  function begin(event,card,row,block,handle){
    if(event.button!=null&&event.button!==0)return;
    event.preventDefault();
    event.stopPropagation();
    if(session)finish(true);

    const rows=rowsFor(card);
    const from=rows.indexOf(row);
    if(from<0||rows.length<2)return;

    const rect=row.getBoundingClientRect();
    const ghost=makeGhost(row,rect);
    ghost.style.visibility='hidden';
    row.classList.add('sw-list-pointer-source');
    document.body.classList.add('sw-list-pointer-sorting');

    session={
      pointerId:event.pointerId,
      card,row,block,handle,ghost,from,
      slot:from,
      startX:event.clientX,startY:event.clientY,
      offsetY:event.clientY-rect.top,
      moved:false
    };
    try{handle.setPointerCapture(event.pointerId)}catch(_){}
  }

  function movePointer(event){
    const current=session;
    if(!current||event.pointerId!==current.pointerId)return;
    event.preventDefault();
    event.stopPropagation();

    if(!current.moved){
      const distance=Math.hypot(event.clientX-current.startX,event.clientY-current.startY);
      if(distance<4)return;
      current.moved=true;
      current.ghost.style.visibility='visible';
    }

    const rect=current.card.getBoundingClientRect();
    current.ghost.style.left=`${rect.left}px`;
    current.ghost.style.width=`${rect.width}px`;
    current.ghost.style.top=`${event.clientY-current.offsetY}px`;

    const rows=rowsFor(current.card);
    current.slot=insertionSlot(rows,event.clientY);
    showBoundary(current.card,current.slot);
    current.row.classList.add('sw-list-pointer-source');
    scrollNearEdge(event.clientY);
  }

  function decorateRow(card,row,block,index){
    row.dataset.swListIndex=String(index);
    row.dataset.swListDragReady='1';
    row.draggable=false;

    let old=row.querySelector(':scope > .sw-list-drag-handle');
    let handle;
    if(old){
      handle=old.cloneNode(true);
      old.replaceWith(handle);
    }else{
      handle=document.createElement('span');
      handle.className='sw-list-drag-handle';
      handle.textContent='⠿';
      row.insertBefore(handle,row.firstChild);
    }
    handle.title='Перетащить пункт';
    handle.setAttribute('role','button');
    handle.tabIndex=0;
    handle.dataset.swPointerSortHandle='1';

    if(row.dataset.swPointerNativeGuard!=='1'){
      row.dataset.swPointerNativeGuard='1';
      row.addEventListener('dragstart',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
      },true);
    }

    handle.addEventListener('pointerdown',event=>begin(event,card,row,block,handle));
    handle.addEventListener('pointermove',movePointer);
    handle.addEventListener('pointerup',event=>{
      if(!session||event.pointerId!==session.pointerId)return;
      event.preventDefault();event.stopPropagation();finish(false);
    });
    handle.addEventListener('pointercancel',event=>{
      if(session&&event.pointerId===session.pointerId)finish(true);
    });
    handle.addEventListener('lostpointercapture',()=>{
      if(session&&session.handle===handle)finish(false);
    });
  }

  function decorateCard(card){
    const block=refs.get(card.dataset.editorPath||'');
    if(!block||block.type!=='list')return;
    const rows=rowsFor(card);
    rows.forEach((row,index)=>{
      const existing=row.querySelector(':scope > .sw-list-drag-handle[data-sw-pointer-sort-handle="1"]');
      row.dataset.swListIndex=String(index);
      if(existing)return;
      decorateRow(card,row,block,index);
    });
  }

  function scan(){
    document.querySelectorAll('.block-card[data-editor-path]').forEach(decorateCard);
  }

  function schedule(){
    if(scanFrame)return;
    scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()});
  }

  injectStyles();
  const root=document.getElementById('blocks')||document.body;
  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule();
  });
  observer.observe(root,{childList:true,subtree:true});
  [0,80,180,400,850,1500].forEach(delay=>setTimeout(schedule,delay));

  window.addEventListener('blur',()=>finish(true));
  window.SurwaveListPointerSortV19=true;
})();
