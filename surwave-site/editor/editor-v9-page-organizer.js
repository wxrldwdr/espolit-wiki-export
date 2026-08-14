(() => {
  const pageList=document.getElementById('pageList');
  const pageSearch=document.getElementById('pageSearch');
  const groupSelect=document.getElementById('pageGroup');
  const pathField=document.getElementById('pagePath');
  const toast=document.getElementById('toast');
  if(!pageList||!groupSelect)return;

  let inventory={pages:[],groups:[],groupMeta:[]};
  let draggingPath='';
  let refreshQueued=false;
  let toastTimer=0;
  let capabilitiesPromise=null;
  let groupBusy=false;

  function notify(text,ms=2200){
    if(!toast)return;
    toast.textContent=text;toast.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),ms);
  }
  async function api(url,options={}){
    const r=await fetch(url,{cache:'no-store',...options});
    let d={};try{d=await r.json()}catch(_){d={error:`HTTP ${r.status}`}}
    if(!r.ok){
      if((r.status===404||d.error==='Неизвестный API-метод')&&/\/(create-group|move-page|move-group)$/.test(url)){
        throw new Error('Запущен старый локальный сервер Wiki. Полностью закрой его и снова запусти START_EDITOR.bat.');
      }
      throw new Error(d.error||`HTTP ${r.status}`);
    }
    return d;
  }
  async function ensureOrganizerApi(){
    if(!capabilitiesPromise){
      capabilitiesPromise=fetch('/api/editor/capabilities',{cache:'no-store'}).then(async r=>{
        let d={};try{d=await r.json()}catch(_){}
        if(!r.ok||!d.createGroup||!d.movePage||!d.moveGroup||Number(d.editorApi||0)<5){
          throw new Error('Запущена старая версия локального сервера Wiki. Замени serve_editor.py и полностью перезапусти START_EDITOR.bat.');
        }
        return d;
      }).catch(error=>{capabilitiesPromise=null;throw error});
    }
    return capabilitiesPromise;
  }
  const pageInfo=path=>(inventory.pages||[]).find(p=>p.path===path);
  function buttonPath(button){return button?.querySelector('small')?.textContent?.trim()||''}
  function rowFor(button){return button?.parentElement?.classList.contains('page-item-archive-row')?button.parentElement:button}
  function groupName(title){
    if(title?.dataset?.groupName)return title.dataset.groupName;
    if(!title)return'';
    return [...title.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
  }
  function clearDropMarks(){pageList.querySelectorAll('.page-drop-before,.page-drop-after,.group-drop-target').forEach(x=>x.classList.remove('page-drop-before','page-drop-after','group-drop-target'))}

  function ensureGroupOption(name){
    if(!name||[...groupSelect.options].some(o=>o.value===name))return;
    const option=document.createElement('option');option.value=name;option.textContent=name;
    const special=[...groupSelect.options].find(o=>o.value==='__new__');
    groupSelect.insertBefore(option,special||null);
  }

  function ensureToolbar(){
    if(document.querySelector('.page-organizer-toolbar'))return;
    const toolbar=document.createElement('div');toolbar.className='page-organizer-toolbar';
    const add=document.createElement('button');add.type='button';add.className='btn';add.textContent='+ Новый раздел';
    add.onclick=async()=>{
      const title=prompt('Название нового раздела:','Новый раздел')?.trim();
      if(!title)return;
      try{
        await ensureOrganizerApi();
        await api('/api/editor/create-group',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title})});
        ensureGroupOption(title);await refresh(true);notify(`Раздел «${title}» создан`);
      }catch(e){notify('Ошибка создания раздела: '+e.message,6000)}
    };
    toolbar.appendChild(add);pageList.parentNode.insertBefore(toolbar,pageList);
  }

  function ensureGroupTitles(){
    if(pageSearch?.value.trim())return;
    const existing=new Map();
    pageList.querySelectorAll('.page-group-title').forEach(title=>{const name=groupName(title);if(name)existing.set(name,title)});
    for(const name of inventory.groups||[]){
      if(existing.has(name))continue;
      const title=document.createElement('div');title.className='page-group-title';title.dataset.groupName=name;title.appendChild(document.createTextNode(name));pageList.appendChild(title);existing.set(name,title);
    }
  }

  function reorderDom(){
    ensureGroupTitles();
    const titleMap=new Map();
    pageList.querySelectorAll('.page-group-title').forEach(title=>{const name=groupName(title);if(name)titleMap.set(name,title)});
    const nodeMap=new Map();
    pageList.querySelectorAll('.page-item').forEach(button=>{const path=buttonPath(button);if(path)nodeMap.set(path,rowFor(button))});
    const fragment=document.createDocumentFragment();
    const used=new Set();
    for(const group of inventory.groups||[]){
      const title=titleMap.get(group);if(title){fragment.appendChild(title);used.add(title)}
      for(const page of (inventory.pages||[]).filter(p=>(p.group||'Без раздела')===group)){
        const node=nodeMap.get(page.path);if(node){fragment.appendChild(node);used.add(node)}
      }
    }
    for(const node of [...pageList.children])if(!used.has(node))fragment.appendChild(node);
    pageList.appendChild(fragment);
  }

  async function movePage(path,group,index){
    try{
      await ensureOrganizerApi();
      const previousGroup=pageInfo(path)?.group||'';
      await api('/api/editor/move-page',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,group,index})});
      if(pathField?.value.trim()===path&&previousGroup!==group){
        ensureGroupOption(group);groupSelect.value=group;groupSelect.dispatchEvent(new Event('change',{bubbles:true}));
      }
      await refresh(true);notify(previousGroup===group?'Порядок страниц сохранён':`Страница перемещена в «${group}»`);
    }catch(e){notify('Ошибка перемещения: '+e.message,6000)}
  }

  async function moveGroup(name,direction){
    if(groupBusy)return;
    const before=[...(inventory.groups||[])];
    const oldIndex=before.indexOf(name);
    const target=oldIndex+direction;
    if(oldIndex<0||target<0||target>=before.length)return;
    groupBusy=true;updateGroupButtons();
    try{
      await ensureOrganizerApi();
      const result=await api('/api/editor/move-group',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({group:name,direction})
      });
      const expected=[...before];[expected[oldIndex],expected[target]]=[expected[target],expected[oldIndex]];
      const saved=Array.isArray(result.groups)?result.groups:[];
      if(saved.length&&saved.join('\u0000')!==expected.join('\u0000')){
        throw new Error('Сервер вернул другой порядок разделов после сохранения');
      }
      await refresh(true);
      if((inventory.groups||[]).join('\u0000')!==expected.join('\u0000')){
        throw new Error('Проверка после записи не прошла: порядок разделов не сохранился на диске');
      }
      notify(`Раздел «${name}» перемещён ${direction<0?'выше':'ниже'} вместе со всеми страницами`);
    }catch(e){
      await refresh(true).catch(()=>{});
      notify('Ошибка перемещения раздела: '+e.message,6500);
    }finally{groupBusy=false;updateGroupButtons()}
  }

  function bindPage(button){
    if(button.dataset.pageDragReady==='1')return;button.dataset.pageDragReady='1';button.draggable=true;
    button.addEventListener('dragstart',e=>{
      const path=buttonPath(button);if(!path)return;e.stopPropagation();draggingPath=path;button.classList.add('page-dragging');
      e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',path)}catch(_){}
    });
    button.addEventListener('dragend',()=>{draggingPath='';button.classList.remove('page-dragging');clearDropMarks()});
    button.addEventListener('dragover',e=>{
      if(!draggingPath||draggingPath===buttonPath(button))return;e.preventDefault();e.stopPropagation();clearDropMarks();
      const row=rowFor(button),r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;row.classList.add(after?'page-drop-after':'page-drop-before');e.dataTransfer.dropEffect='move';
    });
    button.addEventListener('drop',e=>{
      if(!draggingPath)return;e.preventDefault();e.stopPropagation();
      const source=draggingPath,targetPath=buttonPath(button),target=pageInfo(targetPath);if(!target||source===targetPath)return;
      const row=rowFor(button),r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;
      const peers=(inventory.pages||[]).filter(p=>(p.group||'Без раздела')===(target.group||'Без раздела')&&p.path!==source);
      let index=peers.findIndex(p=>p.path===targetPath);if(index<0)index=peers.length;else if(after)index++;
      draggingPath='';clearDropMarks();movePage(source,target.group||'Без раздела',index);
    });
  }

  function groupOrderButton(symbol,title,direction,name){
    const button=document.createElement('button');button.type='button';button.className='group-order-button';button.textContent=symbol;button.title=title;button.dataset.direction=String(direction);
    button.addEventListener('pointerdown',e=>e.stopPropagation());
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();void moveGroup(name,direction)});
    return button;
  }

  function updateGroupButtons(){
    const groups=inventory.groups||[];
    pageList.querySelectorAll('.page-group-title').forEach(title=>{
      const name=groupName(title),index=groups.indexOf(name),controls=title.querySelector(':scope > .group-order-controls');if(!controls)return;
      const up=controls.querySelector('[data-direction="-1"]'),down=controls.querySelector('[data-direction="1"]');
      if(up)up.disabled=groupBusy||index<=0;
      if(down)down.disabled=groupBusy||index<0||index>=groups.length-1;
    });
  }

  function bindGroup(title){
    const name=groupName(title);if(!name)return;title.dataset.groupName=name;
    if(title.dataset.groupDropReady!=='1'){
      title.dataset.groupDropReady='1';
      title.addEventListener('dragover',e=>{if(!draggingPath)return;e.preventDefault();e.stopPropagation();clearDropMarks();title.classList.add('group-drop-target');e.dataTransfer.dropEffect='move'});
      title.addEventListener('dragleave',()=>title.classList.remove('group-drop-target'));
      title.addEventListener('drop',e=>{
        if(!draggingPath)return;e.preventDefault();e.stopPropagation();const source=draggingPath,current=groupName(title);if(!current)return;
        const index=(inventory.pages||[]).filter(p=>(p.group||'Без раздела')===current&&p.path!==source).length;
        draggingPath='';clearDropMarks();movePage(source,current,index);
      });
    }
    let controls=title.querySelector(':scope > .group-order-controls');
    if(!controls){
      controls=document.createElement('span');controls.className='group-order-controls';
      controls.append(groupOrderButton('↑','Переместить раздел выше',-1,name),groupOrderButton('↓','Переместить раздел ниже',1,name));
      const rename=title.querySelector(':scope > .rename-group');
      if(rename)title.insertBefore(controls,rename);else title.appendChild(controls);
    }
  }

  function decorate(){
    ensureToolbar();ensureGroupTitles();
    pageList.querySelectorAll('.page-item').forEach(bindPage);
    pageList.querySelectorAll('.page-group-title').forEach(bindGroup);
    updateGroupButtons();
  }

  async function refresh(reorder=false){
    try{
      inventory=await api('/api/editor/pages');
      (inventory.groups||[]).forEach(ensureGroupOption);
      if(reorder)reorderDom();
      decorate();
    }catch(e){notify('Ошибка списка страниц: '+e.message,4500)}
  }
  function queueRefresh(){
    if(refreshQueued)return;refreshQueued=true;
    requestAnimationFrame(()=>{refreshQueued=false;decorate()});
  }

  const style=document.createElement('style');style.textContent=`
    .page-organizer-toolbar{display:flex;margin:8px 0 10px}.page-organizer-toolbar .btn{width:100%}
    .page-item[draggable="true"]{cursor:grab}.page-item.page-dragging{opacity:.42;cursor:grabbing}
    .page-item-archive-row.page-drop-before,.page-item.page-drop-before{box-shadow:inset 0 2px 0 #00ffc0}
    .page-item-archive-row.page-drop-after,.page-item.page-drop-after{box-shadow:inset 0 -2px 0 #00ffc0}
    .page-group-title.group-drop-target{outline:1px solid rgba(0,255,192,.7);background:rgba(0,255,120,.08);border-radius:8px}
    .page-group-title{display:flex;align-items:center;gap:3px;min-width:0}
    .page-group-title>.group-order-controls{display:inline-flex;align-items:center;gap:1px;margin-left:auto}
    .group-order-button{width:22px;height:22px;padding:0;border:1px solid transparent;border-radius:5px;background:transparent;color:#71867e;cursor:pointer;font:700 12px/1 system-ui}
    .group-order-button:hover:not(:disabled){color:#00ffc0;border-color:rgba(0,255,192,.22);background:rgba(0,255,120,.06)}
    .group-order-button:disabled{opacity:.22;cursor:default}
    .page-group-title>.rename-group,.page-group-title>.group-archive-toggle{flex:0 0 auto}
  `;document.head.appendChild(style);

  const observer=new MutationObserver(queueRefresh);observer.observe(pageList,{childList:true,subtree:true});
  pageSearch?.addEventListener('input',()=>setTimeout(decorate,0));
  [0,150,400,900].forEach(ms=>setTimeout(()=>refresh(true),ms));
  window.SurwavePageOrganizerV9=true;
})();
