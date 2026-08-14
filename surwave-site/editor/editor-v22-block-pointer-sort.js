(() => {
  const refs=window.SurwaveEditorBlockRefs;
  if(!(refs instanceof Map))return;

  let session=null;
  let scanFrame=0;

  function directCards(container){
    return container?[...container.children].filter(el=>el.classList?.contains('block-card')):[];
  }

  function blockFor(card){
    return refs.get(card?.dataset?.editorPath||'')||null;
  }

  function splitPath(path){
    const value=String(path||'');
    const match=value.match(/^(.*?)(?:\.)?(\d+)$/);
    if(!match)return{base:'',index:0};
    return{base:match[1].replace(/\.$/,''),index:+match[2]||0};
  }

  function pathAt(base,index){return base?`${base}.${index}`:`${index}`}

  function clearTargets(container){
    directCards(container).forEach(card=>card.classList.remove('sw-block-pointer-source','sw-block-drop-before','sw-block-drop-after'));
  }

  function targetIndex(container,source,y){
    const cards=directCards(container).filter(card=>card!==source);
    for(let i=0;i<cards.length;i++){
      const rect=cards[i].getBoundingClientRect();
      if(y<rect.top+rect.height/2)return i;
    }
    return cards.length;
  }

  function showTarget(container,source,index){
    clearTargets(container);
    source.classList.add('sw-block-pointer-source');
    const cards=directCards(container).filter(card=>card!==source);
    if(!cards.length)return;
    if(index<=0)cards[0].classList.add('sw-block-drop-before');
    else if(index>=cards.length)cards[cards.length-1].classList.add('sw-block-drop-after');
    else cards[index].classList.add('sw-block-drop-before');
  }

  function autoScroll(y){
    const topbar=document.querySelector('.editor-topbar');
    const top=topbar?.getBoundingClientRect().bottom||0;
    const edge=Math.max(70,Math.min(130,innerHeight*.14));
    const bottom=innerHeight;
    let delta=0;
    if(y<top+edge){const ratio=Math.min(1,(top+edge-y)/edge);delta=-Math.max(3,Math.round(24*ratio*ratio));}
    else if(y>bottom-edge){const ratio=Math.min(1,(y-(bottom-edge))/edge);delta=Math.max(3,Math.round(24*ratio*ratio));}
    if(delta)window.scrollBy(0,delta);
  }

  function makeGhost(card){
    const ghost=document.createElement('div');
    ghost.className='sw-block-pointer-ghost';
    const kind=card.querySelector(':scope > .block-head > .block-kind')?.textContent||'Блок';
    ghost.textContent=kind;
    document.body.appendChild(ghost);
    return ghost;
  }

  async function moveActualBlock(base,from,target){
    let index=from;
    for(let guard=0;guard<200&&index!==target;guard++){
      const card=document.querySelector(`.block-card[data-editor-path="${CSS.escape(pathAt(base,index))}"]`);
      if(!card)return false;
      const title=index<target?'Ниже':'Выше';
      const button=[...card.querySelectorAll(':scope > .block-head > button')].find(btn=>btn.title===title);
      if(!button)return false;
      button.click();
      index+=index<target?1:-1;
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    return index===target;
  }

  function stop(cancel=false){
    const active=session;if(!active)return;
    session=null;
    document.documentElement.classList.remove('sw-block-pointer-sorting');
    clearTargets(active.container);
    active.ghost?.remove();
    try{active.handle.releasePointerCapture(active.pointerId)}catch(_){}
    if(cancel||!active.moved)return;
    void moveActualBlock(active.base,active.from,active.target);
  }

  function begin(event,card,handle){
    if(event.button!=null&&event.button!==0)return;
    if(!blockFor(card))return;
    const container=card.parentElement,cards=directCards(container);
    if(cards.length<2)return;
    event.preventDefault();event.stopPropagation();
    if(session)stop(true);
    const rect=card.getBoundingClientRect(),ghost=makeGhost(card);
    const path=splitPath(card.dataset.editorPath||'');
    const from=cards.indexOf(card);
    ghost.style.left=`${Math.max(8,rect.left+12)}px`;
    ghost.style.top=`${Math.max(8,rect.top+6)}px`;
    ghost.style.width=`${Math.max(120,Math.min(360,rect.width-24))}px`;
    ghost.style.visibility='hidden';
    card.classList.add('sw-block-pointer-source');
    document.documentElement.classList.add('sw-block-pointer-sorting');
    session={pointerId:event.pointerId,card,container,handle,ghost,base:path.base,from,startX:event.clientX,startY:event.clientY,target:from,moved:false};
    try{handle.setPointerCapture(event.pointerId)}catch(_){}
  }

  function move(event){
    const active=session;if(!active||event.pointerId!==active.pointerId)return;
    event.preventDefault();event.stopPropagation();
    if(!active.moved){
      if(Math.hypot(event.clientX-active.startX,event.clientY-active.startY)<4)return;
      active.moved=true;active.ghost.style.visibility='visible';
    }
    active.ghost.style.top=`${Math.max(8,Math.min(innerHeight-42,event.clientY-18))}px`;
    active.ghost.style.left=`${Math.max(8,Math.min(innerWidth-active.ghost.offsetWidth-8,event.clientX+14))}px`;
    active.target=targetIndex(active.container,active.card,event.clientY);
    showTarget(active.container,active.card,active.target);
    autoScroll(event.clientY);
  }

  function decorate(card){
    card.draggable=false;
    card.removeAttribute('draggable');
    const handle=card.querySelector(':scope > .block-head > .drag-handle');
    if(!handle||handle.dataset.swBlockPointerV22==='1')return;
    handle.dataset.swBlockPointerV22='1';
    handle.draggable=false;
    handle.style.touchAction='none';
    handle.title='Перетащить блок';
    handle.addEventListener('pointerdown',event=>begin(event,card,handle));
    handle.addEventListener('pointermove',move);
    handle.addEventListener('pointerup',event=>{if(session&&event.pointerId===session.pointerId){event.preventDefault();event.stopPropagation();stop(false)}});
    handle.addEventListener('pointercancel',event=>{if(session&&event.pointerId===session.pointerId)stop(true)});
    handle.addEventListener('lostpointercapture',()=>{if(session&&session.handle===handle)stop(false)});
    card.addEventListener('dragstart',event=>{event.preventDefault();event.stopImmediatePropagation()},true);
  }

  function injectStyles(){
    if(document.getElementById('sw-block-pointer-sort-style'))return;
    const style=document.createElement('style');style.id='sw-block-pointer-sort-style';
    style.textContent=`
      .block-card.sw-block-pointer-source{opacity:.34}
      .block-card.sw-block-drop-before{box-shadow:inset 0 3px 0 #00ffc0!important}
      .block-card.sw-block-drop-after{box-shadow:inset 0 -3px 0 #00ffc0!important}
      .sw-block-pointer-ghost{position:fixed;z-index:2147483000;pointer-events:none;padding:9px 12px;border:1px solid rgba(0,255,192,.65);border-radius:9px;background:#071012;color:#e9f6f1;font-weight:800;box-shadow:0 14px 34px rgba(0,0,0,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      html.sw-block-pointer-sorting,html.sw-block-pointer-sorting *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}
      .block-head>.drag-handle{touch-action:none;cursor:grab}
    `;
    document.head.appendChild(style);
  }

  function scan(){document.querySelectorAll('.block-card[data-editor-path]').forEach(decorate)}
  function schedule(){if(scanFrame)return;scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()})}

  injectStyles();
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule()});
  observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [0,80,180,400,900,1500].forEach(delay=>setTimeout(schedule,delay));
  window.addEventListener('blur',()=>stop(true));
  window.SurwaveBlockPointerSortV22=true;
})();
