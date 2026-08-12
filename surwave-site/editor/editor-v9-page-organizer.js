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

  function notify(text,ms=2200){
    if(!toast)return;
    toast.textContent=text;toast.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),ms);
  }
  async function api(url,options={}){
    const r=await fetch(url,{cache:'no-store',...options});
    let d={};try{d=await r.json()}catch(_){d={error:`HTTP ${r.status}`}}
    if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d;
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
        await api('/api/editor/create-group',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title})});
        ensureGroupOption(title);await refresh(true);notify(`Раздел «${title}» создан`);
      }catch(e){notify('Ошибка создания раздела: '+e.message,4500)}
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
      await api('/api/editor/move-page',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,group,index})});
      if(pathField?.value.trim()===path){
        ensureGroupOption(group);groupSelect.value=group;groupSelect.dispatchEvent(new Event('change',{bubbles:true}));
      }
      await refresh(true);notify(`Страница перемещена в «${group}»`);
    }catch(e){notify('Ошибка перемещения: '+e.message,4500)}
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

  function bindGroup(title){
    if(title.dataset.groupDropReady==='1')return;title.dataset.groupDropReady='1';
    title.addEventListener('dragover',e=>{if(!draggingPath)return;e.preventDefault();e.stopPropagation();clearDropMarks();title.classList.add('group-drop-target');e.dataTransfer.dropEffect='move'});
    title.addEventListener('dragleave',()=>title.classList.remove('group-drop-target'));
    title.addEventListener('drop',e=>{
      if(!draggingPath)return;e.preventDefault();e.stopPropagation();const source=draggingPath,name=groupName(title);if(!name)return;
      const index=(inventory.pages||[]).filter(p=>(p.group||'Без раздела')===name&&p.path!==source).length;
      draggingPath='';clearDropMarks();movePage(source,name,index);
    });
  }

  function decorate(){
    ensureToolbar();ensureGroupTitles();
    pageList.querySelectorAll('.page-item').forEach(bindPage);
    pageList.querySelectorAll('.page-group-title').forEach(bindGroup);
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
  `;document.head.appendChild(style);

  const observer=new MutationObserver(queueRefresh);observer.observe(pageList,{childList:true,subtree:true});
  pageSearch?.addEventListener('input',()=>setTimeout(decorate,0));
  [0,150,400,900].forEach(ms=>setTimeout(()=>refresh(true),ms));
})();
