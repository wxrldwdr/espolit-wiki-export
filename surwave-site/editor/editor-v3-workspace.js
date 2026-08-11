(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;
  const $=s=>document.querySelector(s);
  const root=document.documentElement;
  const frame=document.getElementById('preview');
  const workspace=$('.workspace');
  const toast=document.getElementById('toast');
  let toastTimer;

  function notify(text,ms=2200){
    if(!toast)return;
    toast.textContent=text;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),ms);
  }
  async function api(url,options={}){
    const r=await fetch(url,{cache:'no-store',...options});
    let d={};try{d=await r.json()}catch(_){d={error:`HTTP ${r.status}`}}
    if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d;
  }
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  /* Drag only by the dotted handle, so text/values can be selected normally. */
  function repairDragging(){
    document.querySelectorAll('.block-card').forEach(card=>{card.draggable=false;card.removeAttribute('draggable')});
    document.querySelectorAll('.drag-handle').forEach(handle=>{handle.draggable=true;handle.setAttribute('draggable','true')});
  }

  /* Copyable rich-text fragments. We intentionally encode the marker as href="#copy":
     the existing Markdown serializer preserves it without destroying nested formatting. */
  function markSelectionCopyable(editor){
    editor.focus();
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount||sel.isCollapsed){notify('Сначала выдели текст, который нужно копировать');return;}
    const range=sel.getRangeAt(0);
    if(!editor.contains(range.commonAncestorContainer)){notify('Выделение должно находиться внутри текста блока');return;}
    const startEl=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;
    const existing=startEl?.closest?.('a[href="#copy"]');
    if(existing&&editor.contains(existing)){
      const parent=existing.parentNode;while(existing.firstChild)parent.insertBefore(existing.firstChild,existing);existing.remove();
      editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'formatRemove'}));
      notify('Режим копирования снят');return;
    }
    const a=document.createElement('a');a.href='#copy';a.setAttribute('title','Нажмите, чтобы скопировать');
    try{range.surroundContents(a)}catch(_){a.appendChild(range.extractContents());range.insertNode(a)}
    sel.removeAllRanges();const next=document.createRange();next.selectNodeContents(a);sel.addRange(next);
    editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'formatSetBlockTextDirection'}));
    notify('Фрагмент помечен для копирования');
  }

  function injectCopyToolbar(){
    document.querySelectorAll('.rich-toolbar').forEach(bar=>{
      if(bar.querySelector('.copy-text-toggle'))return;
      const editor=bar.nextElementSibling;
      if(!editor?.classList.contains('rich-editor'))return;
      const button=document.createElement('button');button.type='button';button.className='copy-text-toggle';button.textContent='⧉';button.title='Пометить выделенный текст для копирования';
      button.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();markSelectionCopyable(editor)});
      bar.appendChild(button);
      editor.addEventListener('click',e=>{const copy=e.target.closest?.('a[href="#copy"]');if(copy){e.preventDefault();e.stopPropagation()}});
    });
  }

  async function copyValue(el){
    const value=(el.textContent||'').trim();if(!value)return;
    try{await navigator.clipboard.writeText(value)}catch(_){
      const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(__){}ta.remove();
    }
    el.classList.add('is-copied');clearTimeout(el._copyTimer);el._copyTimer=setTimeout(()=>el.classList.remove('is-copied'),1600);
  }
  function bindPreviewCopy(){
    const doc=frame?.contentDocument;if(!doc)return;
    doc.querySelectorAll('a[href="#copy"]:not([data-editor-copy-bound])').forEach(el=>{
      el.dataset.editorCopyBound='1';
      el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();copyValue(el)});
    });
  }
  frame?.addEventListener('load',()=>setTimeout(bindPreviewCopy,0));

  /* Editor panel widths are editor-only and therefore live in localStorage, not the release. */
  const panelState={
    left:+localStorage.getItem('surwave-editor-left')||260,
    right:+localStorage.getItem('surwave-editor-right')||Math.round(innerWidth*.42)
  };
  function applyPanels(){
    const maxLeft=Math.max(180,innerWidth-panelState.right-500);
    panelState.left=clamp(panelState.left,180,Math.min(560,maxLeft));
    const maxRight=Math.max(280,innerWidth-panelState.left-500);
    panelState.right=clamp(panelState.right,280,Math.min(980,maxRight));
    root.style.setProperty('--left',panelState.left+'px');root.style.setProperty('--right',panelState.right+'px');
    localStorage.setItem('surwave-editor-left',String(panelState.left));localStorage.setItem('surwave-editor-right',String(panelState.right));
    document.querySelector('[data-panel-left]')?.setAttribute('value',String(panelState.left));
    document.querySelector('[data-panel-right]')?.setAttribute('value',String(panelState.right));
  }
  function makeResizer(side){
    const r=document.createElement('div');r.className='panel-resizer '+side;r.title=side==='left'?'Изменить ширину списка глав':'Изменить ширину предпросмотра';
    r.addEventListener('pointerdown',e=>{
      if(innerWidth<=980)return;e.preventDefault();r.setPointerCapture(e.pointerId);r.classList.add('is-dragging');
      const move=ev=>{if(side==='left')panelState.left=ev.clientX;else panelState.right=innerWidth-ev.clientX;applyPanels()};
      const up=()=>{r.classList.remove('is-dragging');r.removeEventListener('pointermove',move);r.removeEventListener('pointerup',up);r.removeEventListener('pointercancel',up)};
      r.addEventListener('pointermove',move);r.addEventListener('pointerup',up);r.addEventListener('pointercancel',up);
    });document.body.appendChild(r);
  }
  makeResizer('left');makeResizer('right');applyPanels();window.addEventListener('resize',applyPanels);

  /* Group titles in the left library can be renamed. */
  async function renameGroup(oldName){
    if(document.querySelector('.save-state.dirty')){notify('Сначала сохрани текущую страницу');return;}
    const next=prompt(`Новое название главы «${oldName}»:`,oldName)?.trim();
    if(!next||next===oldName)return;
    try{
      notify('Переименовываю главу…',8000);
      const inventory=await api('/api/editor/pages');
      const pages=(inventory.pages||[]).filter(p=>p.group===oldName);
      for(const p of pages){
        const page=await api('/api/editor/page?path='+encodeURIComponent(p.path));
        await api('/api/editor/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:p.path,title:p.title,group:next,content:page.content||''})});
      }
      location.reload();
    }catch(e){notify('Ошибка переименования: '+e.message,5000)}
  }
  function injectGroupRename(){
    document.querySelectorAll('.page-group-title').forEach(title=>{
      if(title.dataset.renameReady)return;title.dataset.renameReady='1';
      const name=title.textContent.trim();title.dataset.groupName=name;
      const b=document.createElement('button');b.type='button';b.className='rename-group';b.textContent='✎';b.title='Переименовать главу';b.onclick=e=>{e.preventDefault();e.stopPropagation();renameGroup(name)};title.appendChild(b);
    });
  }

  /* Global logo controls. */
  let siteSettings={logo:{src:'/surwave-site/assets/logos/surwave-wiki-logo.svg',width:226,height:58,x:0,y:0}};
  const logoUrl=src=>{
    src=String(src||'');if(/^https?:|^data:|^\//i.test(src))return src;
    if(src.includes('.gitbook/assets/'))return '/.gitbook/assets/'+encodeURIComponent(src.split('.gitbook/assets/').pop().split('/').pop());
    return '/'+src.replace(/^\.\//,'');
  };
  function globalSettingsUI(){
    if(!workspace||document.querySelector('.editor-global-settings'))return;
    const d=document.createElement('details');d.className='editor-global-settings';
    d.innerHTML=`<summary>⚙ Настройки Wiki и редактора</summary><div class="editor-global-settings-body">
      <section class="editor-settings-section"><h3>Логотип Wiki</h3><div class="editor-logo-row"><div class="editor-logo-preview"><img data-logo-preview alt="Логотип"></div><div>
        <div class="editor-settings-grid"><label>Файл логотипа<input class="field mono" data-logo-src></label><label>Ширина, px<input class="field" type="number" min="16" max="2000" step="1" data-logo-width></label><label>Высота, px<input class="field" type="number" min="16" max="1000" step="1" data-logo-height></label><label>Смещение X, px<input class="field" type="number" min="-2000" max="2000" step="1" data-logo-x></label><label>Смещение Y, px<input class="field" type="number" min="-2000" max="2000" step="1" data-logo-y></label></div>
        <div class="pixel-pad"><button class="up" data-pixel="y:-1">↑</button><button class="left" data-pixel="x:-1">←</button><button class="reset" data-pixel-reset title="Сбросить смещение">•</button><button class="right" data-pixel="x:1">→</button><button class="down" data-pixel="y:1">↓</button></div>
        <div class="settings-actions"><button class="btn" data-logo-upload>Загрузить другой логотип</button><button class="btn primary" data-logo-save>Сохранить логотип</button><button class="btn" data-logo-default>По умолчанию</button></div><div class="settings-note">Стрелки двигают логотип ровно на 1 px. Размер и X/Y применяются к логотипу Wiki на всех страницах.</div>
      </div></div></section>
      <section class="editor-settings-section"><h3>Ширина панелей редактора</h3><div class="editor-settings-grid"><label>Левая панель, px<input class="field" type="number" min="180" max="560" step="1" data-panel-left></label><label>Предпросмотр справа, px<input class="field" type="number" min="280" max="980" step="1" data-panel-right></label></div><div class="settings-note">Также панели можно тянуть мышью за тонкую границу между ними. Эта настройка относится только к редактору.</div></section>
    </div>`;
    workspace.insertBefore(d,workspace.firstChild);
    const src=d.querySelector('[data-logo-src]'),w=d.querySelector('[data-logo-width]'),h=d.querySelector('[data-logo-height]'),x=d.querySelector('[data-logo-x]'),y=d.querySelector('[data-logo-y]'),preview=d.querySelector('[data-logo-preview]');
    const refresh=()=>{const l=siteSettings.logo||(siteSettings.logo={});src.value=l.src||'';w.value=l.width||226;h.value=l.height||58;x.value=l.x||0;y.value=l.y||0;preview.src=logoUrl(l.src);preview.style.width=(+l.width||226)+'px';preview.style.height=(+l.height||58)+'px';preview.style.transform=`translate(${+l.x||0}px,${+l.y||0}px)`};
    const read=()=>{siteSettings.logo={src:src.value.trim()||'/surwave-site/assets/logos/surwave-wiki-logo.svg',width:clamp(+w.value||226,16,2000),height:clamp(+h.value||58,16,1000),x:clamp(+x.value||0,-2000,2000),y:clamp(+y.value||0,-2000,2000)};refresh()};
    [src,w,h,x,y].forEach(el=>el.addEventListener('input',read));
    d.querySelectorAll('[data-pixel]').forEach(b=>b.onclick=()=>{read();const [key,delta]=b.dataset.pixel.split(':');siteSettings.logo[key]=(+siteSettings.logo[key]||0)+(+delta);refresh()});
    d.querySelector('[data-pixel-reset]').onclick=()=>{read();siteSettings.logo.x=0;siteSettings.logo.y=0;refresh()};
    d.querySelector('[data-logo-default]').onclick=()=>{siteSettings.logo={src:'/surwave-site/assets/logos/surwave-wiki-logo.svg',width:226,height:58,x:0,y:0};refresh()};
    const picker=document.createElement('input');picker.type='file';picker.accept='image/png,image/jpeg,image/gif,image/apng,image/webp,image/svg+xml';picker.hidden=true;document.body.appendChild(picker);
    d.querySelector('[data-logo-upload]').onclick=()=>{picker.value='';picker.click()};
    picker.onchange=async()=>{const file=picker.files?.[0];if(!file)return;try{const data=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(file)});const out=await api('/api/editor/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,data})});read();siteSettings.logo.src=out.source;refresh();notify('Логотип загружен — нажми «Сохранить логотип»')}catch(e){notify('Ошибка загрузки: '+e.message,5000)}};
    d.querySelector('[data-logo-save]').onclick=async()=>{read();try{await api('/api/editor/site-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(siteSettings)});notify('Логотип и его позиция сохранены')}catch(e){notify('Ошибка сохранения логотипа: '+e.message,5000)}};
    const left=d.querySelector('[data-panel-left]'),right=d.querySelector('[data-panel-right]');left.value=panelState.left;right.value=panelState.right;
    left.oninput=()=>{panelState.left=+left.value||260;applyPanels()};right.oninput=()=>{panelState.right=+right.value||500;applyPanels()};
    refresh();
    api('/api/editor/site-settings').then(v=>{siteSettings=v&&typeof v==='object'?v:siteSettings;refresh()}).catch(()=>{});
  }
  globalSettingsUI();

  const observer=new MutationObserver(()=>{repairDragging();injectCopyToolbar();injectGroupRename();bindPreviewCopy()});
  observer.observe(document.body,{childList:true,subtree:true});
  [0,100,300,700,1400].forEach(ms=>setTimeout(()=>{repairDragging();injectCopyToolbar();injectGroupRename();bindPreviewCopy()},ms));
})();
