(() => {
  const pageList=document.getElementById('pageList');
  const groupSelect=document.getElementById('pageGroup');
  const toast=document.getElementById('toast');
  if(!pageList)return;

  let inventory={pages:[],groups:[]};
  let scanFrame=0;
  let toastTimer=0;
  let deleting=false;

  function notify(text,ms=2600){
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('visible'),ms);
  }

  async function api(url,options={}){
    const response=await fetch(url,{cache:'no-store',...options});
    let data={};
    try{data=await response.json()}catch(_){data={error:`HTTP ${response.status}`}}
    if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
    return data;
  }

  function groupName(title){
    if(!title)return'';
    if(title.dataset.groupName)return title.dataset.groupName.trim();
    return [...title.childNodes]
      .filter(node=>node.nodeType===Node.TEXT_NODE)
      .map(node=>node.textContent)
      .join('')
      .trim();
  }

  function pageCount(name){
    return (inventory.pages||[]).filter(page=>(page.group||'Без раздела')===name).length;
  }

  function removeGroupOption(name){
    if(!groupSelect)return;
    [...groupSelect.options].forEach(option=>{
      if(option.value===name)option.remove();
    });
  }

  async function deleteGroup(name){
    if(deleting)return;
    const count=pageCount(name);
    if(count>0){
      notify(`В разделе «${name}» ${count} стр. Сначала перенеси или удали их.`,6000);
      return;
    }
    if(!confirm(`Удалить пустой раздел «${name}»?`))return;

    deleting=true;
    updateDeleteButtons();
    try{
      const capabilities=await api('/api/editor/capabilities');
      if(!capabilities.deleteGroup||Number(capabilities.editorApi||0)<6){
        throw new Error('Нужен Editor API v6. Замени serve_editor.py и полностью перезапусти START_EDITOR.bat.');
      }
      await api('/api/editor/delete-group',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({group:name})
      });
      removeGroupOption(name);
      notify(`Раздел «${name}» удалён`);
      setTimeout(()=>location.reload(),180);
    }catch(error){
      deleting=false;
      updateDeleteButtons();
      notify('Ошибка удаления раздела: '+error.message,6500);
    }
  }

  function makeDeleteButton(name){
    const button=document.createElement('button');
    button.type='button';
    button.className='group-delete-button';
    button.textContent='×';
    button.title='Удалить раздел';
    button.setAttribute('aria-label',`Удалить раздел ${name}`);
    button.addEventListener('pointerdown',event=>event.stopPropagation());
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      void deleteGroup(name);
    });
    return button;
  }

  function updateDeleteButtons(){
    pageList.querySelectorAll('.page-group-title').forEach(title=>{
      const name=groupName(title);
      const button=title.querySelector(':scope > .group-delete-button');
      if(!button)return;
      button.disabled=deleting;
      const count=pageCount(name);
      button.title=count>0
        ? `В разделе ${count} стр. Сначала перенеси или удали их`
        : 'Удалить пустой раздел';
    });
  }

  function cleanupAndDecorate(){
    const managed=new Set(inventory.groups||[]);
    const seen=new Set();

    pageList.querySelectorAll('.page-group-title').forEach(title=>{
      const name=groupName(title);
      if(!name)return;
      title.dataset.groupName=name;

      const registered=managed.has(name);
      const hasPages=pageCount(name)>0;

      // Удаляем старые DOM-дубли одного и того же раздела. Ранее organizer
      // только дорисовывал отсутствующие заголовки и никогда не чистил мусор.
      if(registered){
        if(seen.has(name)){
          title.remove();
          return;
        }
        seen.add(name);
      }else if(!hasPages){
        // Заголовок уже отсутствует в editor-data и не содержит страниц —
        // это полностью осиротевший DOM-остаток старой версии редактора.
        title.remove();
        return;
      }

      // «Без раздела» и другие синтетические группы с реальными страницами
      // показываем, но удалять как nav-категорию их нельзя.
      if(!registered)return;

      let button=title.querySelector(':scope > .group-delete-button');
      if(!button){
        button=makeDeleteButton(name);
        const rename=title.querySelector(':scope > .rename-group');
        const archive=title.querySelector(':scope > .group-archive-toggle');
        if(rename)title.insertBefore(button,rename);
        else if(archive)title.insertBefore(button,archive);
        else title.appendChild(button);
      }
    });
    updateDeleteButtons();
  }

  function schedule(){
    if(scanFrame)return;
    scanFrame=requestAnimationFrame(()=>{
      scanFrame=0;
      cleanupAndDecorate();
    });
  }

  async function refresh(){
    try{
      inventory=await api('/api/editor/pages');
      // Даже если старый data-файл содержал одинаковые названия, DOM никогда
      // не должен строиться из повторов.
      inventory.groups=[...new Set((inventory.groups||[]).map(name=>String(name||'').trim()).filter(Boolean))];
      cleanupAndDecorate();
    }catch(error){
      notify('Ошибка категорий: '+error.message,5000);
    }
  }

  const style=document.createElement('style');
  style.textContent=`
    .group-delete-button{flex:0 0 auto;width:22px;height:22px;padding:0;border:1px solid transparent;border-radius:5px;background:transparent;color:#71867e;cursor:pointer;font:800 16px/1 system-ui}
    .group-delete-button:hover:not(:disabled){color:#ff6b74;border-color:rgba(255,92,108,.28);background:rgba(255,92,108,.075)}
    .group-delete-button:disabled{opacity:.3;cursor:default}
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes.length||mutation.removedNodes.length))schedule();
  });
  observer.observe(pageList,{childList:true,subtree:true});

  void refresh();
  [100,300,800,1500].forEach(delay=>setTimeout(schedule,delay));
  window.SurwaveGroupOrderV23=true;
})();
