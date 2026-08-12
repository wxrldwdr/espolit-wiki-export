(() => {
  const toast=document.getElementById('toast');
  const pageList=document.getElementById('pageList');
  const pathField=document.getElementById('pagePath');
  const metaRow=document.querySelector('.page-meta .title-row');
  if(!pageList||!pathField||!metaRow)return;

  let inventory={pages:[],groupMeta:[]};
  let lastPath='';
  let refreshTimer=0;
  let toastTimer=0;

  function notify(text,ms=2200){
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('visible'),ms);
  }

  async function api(url,options={}){
    const r=await fetch(url,{cache:'no-store',...options});
    let d={};
    try{d=await r.json()}catch(_){d={error:`HTTP ${r.status}`}}
    if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);
    return d;
  }

  function page(path){return(inventory.pages||[]).find(p=>p.path===path)}
  function group(name){return(inventory.groupMeta||[]).find(g=>g.title===name)}

  async function refresh(){
    try{
      inventory=await api('/api/editor/pages');
      decorate();
    }catch(e){notify('Ошибка архива: '+e.message,4500)}
  }

  async function setPage(path,archived,input){
    if(!page(path)){
      input.checked=false;
      notify('Сначала сохрани новую страницу');
      return;
    }
    input.disabled=true;
    try{
      await api('/api/editor/archive-page',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,archived})});
      notify(archived?'Страница перенесена в архив':'Страница возвращена из архива');
      await refresh();
    }catch(e){input.checked=!archived;notify('Ошибка: '+e.message,4500)}
    finally{input.disabled=false}
  }

  async function setGroup(name,archived,input){
    input.disabled=true;
    try{
      await api('/api/editor/archive-group',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({group:name,archived})});
      notify(archived?`Раздел «${name}» перенесён в архив`:`Раздел «${name}» возвращён из архива`);
      await refresh();
    }catch(e){input.checked=!archived;notify('Ошибка: '+e.message,4500)}
    finally{input.disabled=false}
  }

  async function renameGroup(oldName){
    if(document.querySelector('.save-state.dirty')){notify('Сначала сохрани текущую страницу');return}
    const next=prompt(`Новое название главы «${oldName}»:`,oldName)?.trim();
    if(!next||next===oldName)return;
    try{
      await api('/api/editor/rename-group',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({old:oldName,new:next})});
      location.reload();
    }catch(e){notify('Ошибка переименования: '+e.message,4500)}
  }

  function archiveLabel(checked,onChange,cls=''){
    const label=document.createElement('label');
    label.className='archive-toggle '+cls;
    const input=document.createElement('input');
    input.type='checkbox';
    input.checked=!!checked;
    const text=document.createElement('span');
    text.textContent='Архив';
    input.addEventListener('click',e=>e.stopPropagation());
    input.addEventListener('change',e=>{e.stopPropagation();onChange(input.checked,input)});
    label.addEventListener('click',e=>e.stopPropagation());
    label.append(input,text);
    return label;
  }

  function currentControl(){
    let label=metaRow.querySelector('.page-archive-meta');
    if(!label){
      label=archiveLabel(false,(checked,input)=>setPage(pathField.value.trim(),checked,input),'page-archive-meta');
      label.prepend(document.createTextNode('Страница: '));
      metaRow.appendChild(label);
    }
    const input=label.querySelector('input');
    const current=page(pathField.value.trim());
    input.disabled=!current;
    input.checked=!!current?.archived;
    label.classList.toggle('is-archived',!!current?.archived);
  }

  function decoratePages(){
    pageList.querySelectorAll('.page-item').forEach(button=>{
      const path=button.querySelector('small')?.textContent?.trim()||'';
      const item=page(path);
      button.classList.toggle('is-archived',!!item?.archived);
      let row=button.parentElement?.classList.contains('page-item-archive-row')?button.parentElement:null;
      if(!row){
        row=document.createElement('div');
        row.className='page-item-archive-row';
        button.parentNode.insertBefore(row,button);
        row.appendChild(button);
      }
      let label=row.querySelector('.page-list-archive');
      if(!label){
        label=archiveLabel(!!item?.archived,(checked,input)=>setPage(path,checked,input),'page-list-archive');
        row.appendChild(label);
      }
      const input=label.querySelector('input');
      input.checked=!!item?.archived;
      label.classList.toggle('is-archived',!!item?.archived);
    });
  }

  function groupName(title){
    if(title.dataset.groupName)return title.dataset.groupName;
    const text=[...title.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
    return text;
  }

  function decorateGroups(){
    pageList.querySelectorAll('.page-group-title').forEach(title=>{
      const name=groupName(title);
      if(!name)return;
      title.dataset.groupName=name;
      title.dataset.renameReady='1';
      const meta=group(name);
      title.classList.toggle('is-archived',!!meta?.archived);

      let rename=title.querySelector('.rename-group');
      if(!rename){
        rename=document.createElement('button');
        rename.type='button';rename.className='rename-group';rename.textContent='✎';rename.title='Переименовать главу';
        title.appendChild(rename);
      }
      rename.onclick=e=>{e.preventDefault();e.stopPropagation();renameGroup(name)};

      let label=title.querySelector('.group-archive-toggle');
      if(!label){
        label=archiveLabel(!!meta?.archived,(checked,input)=>setGroup(name,checked,input),'group-archive-toggle');
        title.appendChild(label);
      }
      const input=label.querySelector('input');
      input.checked=!!meta?.archived;
      label.classList.toggle('is-archived',!!meta?.archived);
    });
  }

  function decorate(){
    currentControl();
    decoratePages();
    decorateGroups();
  }

  const observer=new MutationObserver(()=>{
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(decorate,0);
  });
  observer.observe(pageList,{childList:true,subtree:true});

  setInterval(()=>{
    const now=pathField.value.trim();
    if(now!==lastPath){lastPath=now;currentControl()}
  },180);

  [0,150,400,900].forEach(ms=>setTimeout(refresh,ms));
})();