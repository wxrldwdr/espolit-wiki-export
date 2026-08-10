(() => {
  const Core=window.SurwaveEditorCore;
  const $=id=>document.getElementById(id);
  const refs={
    pageList:$('pageList'),pageSearch:$('pageSearch'),title:$('pageTitle'),group:$('pageGroup'),path:$('pagePath'),
    blocks:$('blocks'),preview:$('preview'),saveState:$('saveState'),toast:$('toast'),picker:$('mediaPicker'),
    workspace:document.querySelector('.workspace'),previewPanel:$('previewPanel')
  };
  const state={pages:[],groups:[],path:'',originalPath:'',title:'',group:'',frontmatter:'',blocks:[],dirty:false,currentHref:'',newMode:false,pathTouched:false};
  let dragging=null,pendingImage=null,previewTimer=null,toastTimer=null;

  function notify(text){refs.toast.textContent=text;refs.toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>refs.toast.classList.remove('visible'),1900);}
  function setStatus(text,kind=''){refs.saveState.textContent=text;refs.saveState.className='save-state '+kind;}
  function markDirty(){if(!state.dirty){state.dirty=true;setStatus('Есть изменения','dirty');}schedulePreview();}
  function safeConfirmLose(){return !state.dirty||confirm('Есть несохранённые изменения. Продолжить без сохранения?');}

  async function api(url,options={}){
    const res=await fetch(url,{cache:'no-store',...options});
    let data={};try{data=await res.json();}catch(_){data={error:`HTTP ${res.status}`};}
    if(!res.ok)throw new Error(data.error||`HTTP ${res.status}`);return data;
  }

  function pageByPath(path){return state.pages.find(p=>p.path===path);}
  function groupOptions(selected){
    const values=[...new Set([...state.groups,selected].filter(Boolean))];
    refs.group.innerHTML=values.map(g=>`<option value="${Core.escapeHtml(g)}">${Core.escapeHtml(g)}</option>`).join('')+'<option value="__new__">+ Новый раздел…</option>';
    refs.group.value=selected&&values.includes(selected)?selected:(values[0]||'');
  }

  async function refreshPages(render=true){
    const data=await api('/api/editor/pages');state.pages=data.pages||[];state.groups=data.groups||[];
    groupOptions(state.group||state.groups[0]||'Главная');if(render)renderPageList();
  }

  function renderPageList(){
    const q=refs.pageSearch.value.trim().toLowerCase();refs.pageList.innerHTML='';
    const grouped=new Map();
    state.pages.forEach(page=>{if(q&&!`${page.title} ${page.path}`.toLowerCase().includes(q))return;const g=page.group||'Без раздела';if(!grouped.has(g))grouped.set(g,[]);grouped.get(g).push(page);});
    grouped.forEach((pages,group)=>{
      const title=document.createElement('div');title.className='page-group-title';title.textContent=group;refs.pageList.appendChild(title);
      pages.forEach(page=>{const b=document.createElement('button');b.className='page-item'+(page.path===state.originalPath?' active':'');b.innerHTML=`${Core.escapeHtml(page.title)}<small>${Core.escapeHtml(page.path)}</small>`;b.onclick=()=>loadPage(page.path);refs.pageList.appendChild(b);});
    });
  }

  async function loadPage(path){
    if(path===state.originalPath&&!state.newMode)return;if(!safeConfirmLose())return;
    try{setStatus('Открываю…');const [data]=await Promise.all([api('/api/editor/page?path='+encodeURIComponent(path)),refreshPages(false)]);const meta=pageByPath(path)||{};const parsed=Core.parseDocument(data.content||'');state.path=path;state.originalPath=path;state.title=meta.title||firstHeading(parsed.blocks)||'Без названия';state.group=meta.group||state.groups[0]||'Главная';state.frontmatter=parsed.frontmatter;state.blocks=parsed.blocks;state.dirty=false;state.currentHref='/surwave-site/wiki/'+(meta.href||sourceToHref(path));state.newMode=false;state.pathTouched=false;syncMeta();renderAll();setStatus('Загружено','saved');}
    catch(e){notify('Ошибка: '+e.message);setStatus('Ошибка');}
  }

  function firstHeading(blocks){const h=(blocks||[]).find(b=>b.type==='heading'&&b.level===1);return h?.text||'';}
  function sourceToHref(path){if(/(^|\/)README\.md$/i.test(path))return path.replace(/README\.md$/i,'index.html');return path.replace(/\.md$/i,'.html');}
  function syncMeta(){refs.title.value=state.title;refs.path.value=state.path;groupOptions(state.group);}

  function newPage(){
    if(!safeConfirmLose())return;state.path='pages/novaya-stranica.md';state.originalPath='';state.title='Новая страница';state.group=state.groups[0]||'Главная';state.frontmatter='';state.blocks=[{type:'heading',level:1,text:'Новая страница'},{type:'text',html:'Начните писать содержимое страницы…'}];state.dirty=true;state.currentHref='';state.newMode=true;state.pathTouched=false;syncMeta();renderAll();renderPageList();setStatus('Новая страница','dirty');
  }

  function duplicatePage(){
    if(!state.blocks.length)return;state.originalPath='';state.title=`${state.title} — копия`;state.path=state.path.replace(/\.md$/i,'-copy.md');state.blocks=Core.clone(state.blocks);state.dirty=true;state.newMode=true;state.pathTouched=true;syncMeta();renderAll();setStatus('Копия — не сохранена','dirty');
  }

  function makeAddBar(host,array,compact=false){
    host.innerHTML='';const wrap=document.createElement('div');wrap.className='add-bar';const select=document.createElement('select');select.className='field small-select';Core.TYPES.filter(([t])=>t!=='raw').forEach(([type,label])=>{const o=document.createElement('option');o.value=type;o.textContent=label;select.appendChild(o);});const btn=document.createElement('button');btn.className='btn';btn.type='button';btn.textContent=compact?'+ Блок':'+ Добавить блок';btn.onclick=()=>{array.push(Core.defaultBlock(select.value));markDirty();renderBlocks(refs.blocks,state.blocks);makeAddBar($('bottomAddBar'),state.blocks);};wrap.append(select,btn);host.appendChild(wrap);
  }

  function rerender(){renderBlocks(refs.blocks,state.blocks);makeAddBar($('mainAddBar'),state.blocks);makeAddBar($('bottomAddBar'),state.blocks);schedulePreview();}
  function renderAll(){makeAddBar($('mainAddBar'),state.blocks);makeAddBar($('bottomAddBar'),state.blocks);renderBlocks(refs.blocks,state.blocks);updatePreview();}

  function blockName(type){return Core.TYPES.find(([t])=>t===type)?.[1]||type;}
  function button(text,title,handler,extra=''){const b=document.createElement('button');b.type='button';b.className='icon-btn '+extra;b.textContent=text;b.title=title;b.onclick=e=>{e.stopPropagation();handler();};return b;}

  function renderBlocks(container,array){
    container.innerHTML='';if(!array.length){const empty=document.createElement('div');empty.className='empty-blocks';empty.textContent='Страница пока пустая. Добавь первый блок.';container.appendChild(empty);return;}
    array.forEach((block,index)=>{
      const card=document.createElement('section');card.className='block-card';card.draggable=true;
      const head=document.createElement('div');head.className='block-head';const drag=document.createElement('span');drag.className='drag-handle';drag.textContent='⠿';drag.title='Перетащить';const kind=document.createElement('span');kind.className='block-kind';kind.textContent=blockName(block.type);const spacer=document.createElement('span');spacer.className='block-spacer';head.append(drag,kind,spacer);
      head.append(button('↑','Выше',()=>move(array,index,-1)),button('↓','Ниже',()=>move(array,index,1)),button('⧉','Дублировать',()=>{array.splice(index+1,0,Core.clone(block));markDirty();rerender();}),button('×','Удалить',()=>{array.splice(index,1);markDirty();rerender();},'remove'));card.appendChild(head);
      const body=document.createElement('div');body.className='block-body';renderBlockBody(body,block);card.appendChild(body);
      card.addEventListener('dragstart',()=>{dragging={array,index};card.classList.add('dragging');});card.addEventListener('dragend',()=>{dragging=null;card.classList.remove('dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));});card.addEventListener('dragover',e=>{if(dragging?.array===array){e.preventDefault();card.classList.add('drag-over');}});card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));card.addEventListener('drop',e=>{if(dragging?.array!==array)return;e.preventDefault();card.classList.remove('drag-over');const item=array.splice(dragging.index,1)[0];let target=index;if(dragging.index<index)target--;array.splice(target,0,item);markDirty();rerender();});container.appendChild(card);
    });
  }

  function move(array,index,delta){const to=index+delta;if(to<0||to>=array.length)return;[array[index],array[to]]=[array[to],array[index]];markDirty();rerender();}
  function field(value,onInput,placeholder=''){const input=document.createElement('input');input.className='field';input.value=value??'';input.placeholder=placeholder;input.oninput=()=>{onInput(input.value);markDirty();};return input;}
  function textarea(value,onInput,code=false){const ta=document.createElement('textarea');ta.className='field textarea'+(code?' codearea':'');ta.value=value??'';ta.oninput=()=>{onInput(ta.value);markDirty();};return ta;}
  function selectField(options,value,onChange){const s=document.createElement('select');s.className='field small-select';options.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;s.appendChild(o);});s.value=String(value);s.onchange=()=>{onChange(s.value);markDirty();};return s;}

  function richEditor(block,key='html'){
    const wrap=document.createElement('div');const toolbar=document.createElement('div');toolbar.className='rich-toolbar';const editor=document.createElement('div');editor.className='rich-editor';editor.contentEditable='true';editor.innerHTML=block[key]||'';
    const cmd=(label,title,fn)=>{const b=document.createElement('button');b.type='button';b.innerHTML=label;b.title=title;b.onmousedown=e=>{e.preventDefault();fn();editor.focus();block[key]=editor.innerHTML;markDirty();};toolbar.appendChild(b);};
    cmd('<b>B</b>','Жирный',()=>document.execCommand('bold'));cmd('<i>I</i>','Курсив',()=>document.execCommand('italic'));cmd('<u>U</u>','Подчёркивание',()=>document.execCommand('underline'));cmd('<s>S</s>','Зачёркивание',()=>document.execCommand('strikeThrough'));
    cmd('&lt;/&gt;','Код',()=>wrapSelection(editor,'code'));cmd('▰','Выделение',()=>wrapSelection(editor,'mark'));cmd('🔗','Ссылка',()=>{const url=prompt('Ссылка (https://… или адрес страницы):','https://');if(url)document.execCommand('createLink',false,url);});
    const internal=document.createElement('select');internal.title='Ссылка на страницу Wiki';internal.innerHTML='<option value="">Страница…</option>'+state.pages.map(p=>`<option value="/surwave-site/wiki/${Core.escapeHtml(p.href)}">${Core.escapeHtml(p.title)}</option>`).join('');internal.onchange=()=>{if(internal.value){editor.focus();document.execCommand('createLink',false,internal.value);block[key]=editor.innerHTML;internal.value='';markDirty();}};toolbar.appendChild(internal);
    editor.oninput=()=>{block[key]=editor.innerHTML;markDirty();};wrap.append(toolbar,editor);return wrap;
  }

  function wrapSelection(editor,tag){editor.focus();const sel=window.getSelection();if(!sel.rangeCount)return;const range=sel.getRangeAt(0);if(!editor.contains(range.commonAncestorContainer))return;const node=document.createElement(tag);try{range.surroundContents(node);sel.removeAllRanges();const nr=document.createRange();nr.selectNodeContents(node);sel.addRange(nr);}catch(_){document.execCommand('insertHTML',false,`<${tag}>${Core.escapeHtml(sel.toString())}</${tag}>`);}}

  function nestedEditor(parent,title,children){const zone=document.createElement('div');zone.className='nested-zone';const h=document.createElement('div');h.className='nested-title';h.textContent=title;const add=document.createElement('div');makeAddBar(add,children,true);h.appendChild(add);zone.appendChild(h);const list=document.createElement('div');list.className='blocks';zone.appendChild(list);renderBlocks(list,children);parent.appendChild(zone);}

  function renderBlockBody(body,block){
    if(block.type==='heading'){
      const row=document.createElement('div');row.className='control-row';row.append(selectField([[1,'H1'],[2,'H2'],[3,'H3'],[4,'H4'],[5,'H5'],[6,'H6']],block.level,v=>block.level=+v),field(block.text,v=>block.text=v,'Заголовок'));body.appendChild(row);return;
    }
    if(block.type==='text'){body.appendChild(richEditor(block));return;}
    if(block.type==='image'){
      const grid=document.createElement('div');grid.className='image-edit';const img=document.createElement('img');img.src=Core.mediaUrl(block.src)||'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="100%25" height="100%25" fill="%23070e10"/%3E%3Ctext x="50%25" y="50%25" fill="%23657972" text-anchor="middle" dominant-baseline="middle"%3EНет изображения%3C/text%3E%3C/svg%3E';const fields=document.createElement('div');fields.className='image-fields';fields.append(field(block.src,v=>{block.src=v;img.src=Core.mediaUrl(v);},'.gitbook/assets/image.png'),field(block.alt,v=>block.alt=v,'Alt-текст'),field(block.caption,v=>block.caption=v,'Подпись'));const actions=document.createElement('div');actions.className='image-actions';const upload=document.createElement('button');upload.className='btn';upload.textContent=block.src?'Заменить файл':'Загрузить файл';upload.onclick=()=>{pendingImage={block};refs.picker.value='';refs.picker.click();};const clear=document.createElement('button');clear.className='btn';clear.textContent='Убрать';clear.onclick=()=>{block.src='';markDirty();rerender();};actions.append(upload,clear);fields.appendChild(actions);grid.append(img,fields);body.appendChild(grid);return;
    }
    if(block.type==='list'){
      const top=document.createElement('div');top.className='control-row';top.append(selectField([['false','Маркированный'],['true','Нумерованный']],String(!!block.ordered),v=>block.ordered=v==='true'));const add=document.createElement('button');add.className='btn';add.textContent='+ Пункт';add.onclick=()=>{block.items.push('Новый пункт');markDirty();rerender();};top.appendChild(add);body.appendChild(top);const list=document.createElement('div');list.className='list-items';(block.items||[]).forEach((item,i)=>{const row=document.createElement('div');row.className='list-row';row.append(field(item,v=>block.items[i]=v,'Пункт'));const del=document.createElement('button');del.className='icon-btn remove';del.textContent='×';del.onclick=()=>{block.items.splice(i,1);markDirty();rerender();};row.appendChild(del);list.appendChild(row);});body.appendChild(list);return;
    }
    if(block.type==='quote'){body.appendChild(richEditor(block));return;}
    if(block.type==='hint'){const row=document.createElement('div');row.className='control-row';row.append(document.createTextNode('Тип окна: '),selectField([['info','Информация'],['warning','Предупреждение'],['success','Успех'],['danger','Опасность']],block.style,v=>block.style=v));body.appendChild(row);nestedEditor(body,'Содержимое окна',block.children||(block.children=[]));return;}
    if(block.type==='details'){body.append(field(block.summary,v=>block.summary=v,'Заголовок раскрывающегося блока'));nestedEditor(body,'Содержимое раскрывающегося блока',block.children||(block.children=[]));return;}
    if(block.type==='stepper'){
      (block.steps||(block.steps=[])).forEach((step,i)=>{const card=document.createElement('div');card.className='step-card';const head=document.createElement('div');head.className='step-head';head.append(document.createTextNode(`Шаг ${i+1}`));const sp=document.createElement('span');sp.className='block-spacer';head.append(sp,button('↑','Шаг выше',()=>moveStep(block,i,-1)),button('↓','Шаг ниже',()=>moveStep(block,i,1)),button('×','Удалить шаг',()=>{block.steps.splice(i,1);markDirty();rerender();},'remove'));const inner=document.createElement('div');inner.className='step-body';nestedEditor(inner,`Блоки шага ${i+1}`,step.children||(step.children=[]));card.append(head,inner);body.appendChild(card);});const add=document.createElement('button');add.className='btn';add.textContent='+ Добавить шаг';add.onclick=()=>{block.steps.push({children:[Core.defaultBlock('heading'),Core.defaultBlock('text')]});const s=block.steps.at(-1);s.children[0].level=4;s.children[0].text=`Шаг ${block.steps.length}`;markDirty();rerender();};body.appendChild(add);return;
    }
    if(block.type==='linkcard'){
      const select=document.createElement('select');select.className='field';select.innerHTML='<option value="">Выбрать страницу Wiki…</option>'+state.pages.map(p=>`<option value="${Core.escapeHtml(p.path)}">${Core.escapeHtml(p.title)}</option>`).join('');select.onchange=()=>{if(select.value){block.url=select.value;block.label=pageByPath(select.value)?.title||block.label;markDirty();rerender();}};body.append(select,field(block.label,v=>block.label=v,'Текст карточки'),field(block.url,v=>block.url=v,'Ссылка или путь .md'));return;
    }
    if(block.type==='embed'){body.append(field(block.url,v=>block.url=v,'https://…'),field(block.label,v=>block.label=v,'Подпись (необязательно)'));return;}
    if(block.type==='table'){
      const wrap=document.createElement('div');wrap.className='table-scroll';const table=document.createElement('table');table.className='table-grid';(block.rows||(block.rows=[['Заголовок']])).forEach((row,r)=>{const tr=document.createElement('tr');row.forEach((cell,c)=>{const td=document.createElement('td');td.append(field(cell,v=>block.rows[r][c]=v));tr.appendChild(td);});table.appendChild(tr);});wrap.appendChild(table);body.appendChild(wrap);const actions=document.createElement('div');actions.className='control-row';[['+ Строка',()=>{const w=Math.max(...block.rows.map(r=>r.length),1);block.rows.push(Array(w).fill(''));}],['+ Столбец',()=>block.rows.forEach(r=>r.push(''))],['− Строка',()=>{if(block.rows.length>1)block.rows.pop();}],['− Столбец',()=>{if(Math.max(...block.rows.map(r=>r.length))>1)block.rows.forEach(r=>r.pop());}]].forEach(([t,fn])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.onclick=()=>{fn();markDirty();rerender();};actions.appendChild(b);});body.appendChild(actions);return;
    }
    if(block.type==='code'){body.append(field(block.language,v=>block.language=v,'Язык, например yaml'),textarea(block.code,v=>block.code=v,true));return;}
    if(block.type==='divider'){body.innerHTML='<span class="mini-label">Горизонтальный разделитель</span>';return;}
    if(block.type==='raw'){body.append(document.createTextNode('Этот фрагмент пока не распознан редактором. Его можно сохранить как есть или заменить обычными блоками.'),textarea(block.markdown,v=>block.markdown=v,true));return;}
  }

  function moveStep(block,index,delta){const to=index+delta;if(to<0||to>=block.steps.length)return;[block.steps[index],block.steps[to]]=[block.steps[to],block.steps[index]];markDirty();rerender();}

  function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(updatePreview,130);}
  function updatePreview(){
    let html=Core.renderBlocksHtml(state.blocks).replaceAll('ESPOLIT','Surwave').replaceAll('Espolit','Surwave');const title=Core.escapeHtml(state.title||'Surwave Wiki');refs.preview.srcdoc=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><base href="${location.origin}/"><title>${title}</title><style>${Core.previewCss}</style></head><body><article class="article">${html}</article></body></html>`;
  }

  function currentContent(){return Core.serializeDocument(state.frontmatter,state.blocks);}
  async function savePage(){
    state.title=refs.title.value.trim()||'Без названия';state.group=refs.group.value||'Разделы';state.path=normalizeSourcePath(refs.path.value);refs.path.value=state.path;if(!state.path){notify('Укажи файл страницы');return;}
    try{setStatus('Сохраняю…');const old=state.originalPath;const data=await api('/api/editor/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:state.path,title:state.title,group:state.group,content:currentContent()})});if(old&&old!==state.path)await api('/api/editor/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:old})});state.originalPath=state.path;state.currentHref=data.href;state.dirty=false;state.newMode=false;state.pathTouched=false;await refreshPages();setStatus('Сохранено','saved');notify('Страница сохранена');}
    catch(e){setStatus('Ошибка');notify('Не удалось сохранить: '+e.message);}
  }

  function normalizeSourcePath(value){let p=String(value||'').trim().replace(/\\/g,'/').replace(/^\/+|\/+$/g,'');if(!p)return '';p=p.replace(/\s+/g,'-');if(!/\.md$/i.test(p))p+='.md';return p;}
  async function deletePage(){if(!state.originalPath){newPage();return;}if(!confirm(`Удалить страницу «${state.title}»?\n\nФайл будет удалён из content и из меню Wiki.`))return;try{await api('/api/editor/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:state.originalPath})});state.dirty=false;await refreshPages();notify('Страница удалена');if(state.pages.length)await loadPage(state.pages[0].path);else newPage();}catch(e){notify('Ошибка удаления: '+e.message);}}

  function downloadBlob(name,content,type='text/plain;charset=utf-8'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
  function fileName(ext){const base=(state.path.split('/').pop()||Core.slugify(state.title)).replace(/\.md$/i,'');return base+'.'+ext;}
  function downloadMd(){downloadBlob(fileName('md'),currentContent(),'text/markdown;charset=utf-8');}

  async function downloadStandalone(){
    try{setStatus('Готовлю HTML…');let content=Core.renderBlocksHtml(state.blocks).replaceAll('ESPOLIT','Surwave').replaceAll('Espolit','Surwave');const doc=new DOMParser().parseFromString(`<div id="x">${content}</div>`,'text/html');const images=[...doc.querySelectorAll('img')];for(const img of images){const src=img.getAttribute('src')||'';if(!src||/^data:/.test(src))continue;try{const res=await fetch(src);if(!res.ok)continue;img.src=await blobToDataUrl(await res.blob());}catch(_){}}
      content=doc.getElementById('x').innerHTML;const standalone=`<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${Core.escapeHtml(state.title)} — Surwave Wiki</title><style>${Core.previewCss}</style></head><body><article class="article">${content}</article></body></html>`;downloadBlob(fileName('html'),standalone,'text/html;charset=utf-8');setStatus(state.dirty?'Есть изменения':'Готово',state.dirty?'dirty':'saved');notify('Автономный HTML скачан');}
    catch(e){setStatus('Ошибка');notify('Ошибка экспорта: '+e.message);}
  }
  function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});}

  async function uploadMedia(file){if(!pendingImage)return;try{if(file.size>48*1024*1024)throw new Error('Файл больше 48 МБ');setStatus('Загружаю медиа…');const data=await blobToDataUrl(file);const result=await api('/api/editor/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,data})});pendingImage.block.src=result.source;if(!pendingImage.block.alt)pendingImage.block.alt=file.name.replace(/\.[^.]+$/,'');markDirty();rerender();notify('Файл добавлен');}catch(e){notify('Ошибка загрузки: '+e.message);}finally{pendingImage=null;}}

  function openWiki(){const href=state.currentHref||('/surwave-site/wiki/'+sourceToHref(state.path));window.open(href,'_blank','noopener');}

  refs.title.oninput=()=>{state.title=refs.title.value;if(state.newMode&&!state.pathTouched){state.path=`pages/${Core.slugify(state.title)}.md`;refs.path.value=state.path;}const h=state.blocks.find(b=>b.type==='heading'&&b.level===1);if(h)h.text=state.title;markDirty();renderBlocks(refs.blocks,state.blocks);};
  refs.path.oninput=()=>{state.path=refs.path.value;state.pathTouched=true;markDirty();};
  refs.group.onchange=()=>{if(refs.group.value==='__new__'){const name=prompt('Название нового раздела:','Новый раздел');if(name){state.group=name.trim();if(state.group&&!state.groups.includes(state.group))state.groups.push(state.group);groupOptions(state.group);}else groupOptions(state.group);}else state.group=refs.group.value;markDirty();};
  refs.pageSearch.oninput=renderPageList;refs.picker.onchange=()=>{const file=refs.picker.files?.[0];if(file)uploadMedia(file);};
  $('newPage').onclick=newPage;$('duplicatePage').onclick=duplicatePage;$('savePage').onclick=savePage;$('deletePage').onclick=deletePage;$('downloadMd').onclick=downloadMd;$('downloadHtml').onclick=downloadStandalone;$('openWiki').onclick=openWiki;
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();savePage();}});window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
  document.querySelectorAll('.mobile-tabs button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.mobile-tabs button').forEach(x=>x.classList.toggle('active',x===btn));const preview=btn.dataset.view==='preview';refs.previewPanel.classList.toggle('mobile-visible',preview);refs.workspace.classList.toggle('mobile-hidden',preview);if(preview)updatePreview();});

  (async()=>{try{await refreshPages();const requested=new URLSearchParams(location.search).get('path');if(requested&&pageByPath(requested))await loadPage(requested);else if(state.pages.length)await loadPage(state.pages[0].path);else newPage();}catch(e){notify('Редактор не запустился: '+e.message);newPage();}})();
})();
