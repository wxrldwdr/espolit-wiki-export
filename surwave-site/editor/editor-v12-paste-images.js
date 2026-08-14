(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;
  let scanFrame=0;

  function notify(text,ms=2400){
    const el=document.getElementById('toast');if(!el)return;
    el.textContent=text;el.classList.add('visible');
    clearTimeout(el._swPasteTimer);el._swPasteTimer=setTimeout(()=>el.classList.remove('visible'),ms);
  }
  function markDirty(){const field=document.getElementById('pagePath');if(field)field.dispatchEvent(new Event('input',{bubbles:true}))}

  function nestedOptions(){
    return Core.TYPES.filter(([type])=>type!=='raw'&&type!=='servercards').map(([value,label])=>({value,label}));
  }
  function decorateNested(zone){
    const title=zone.querySelector(':scope > .nested-title');if(!title||title.querySelector('.sw-nested-type'))return;
    const add=[...title.querySelectorAll('button')].find(b=>/^\+\s*Блок/.test(b.textContent||''));if(!add)return;
    const select=document.createElement('select');select.className='field small-select sw-nested-type';
    for(const option of nestedOptions()){
      const el=document.createElement('option');el.value=option.value;el.textContent=option.label;select.appendChild(el);
    }
    select.value='text';title.insertBefore(select,add);
    const originalClick=add.onclick;
    add.onclick=event=>{
      const type=select.value||'text';
      if(type==='text'||typeof originalClick!=='function')return originalClick?.call(add,event);
      const previous=Core.defaultBlock;
      const replacement=previous(type);
      Core.defaultBlock=requested=>requested==='text'?Core.clone(replacement):previous(requested);
      try{return originalClick.call(add,event)}
      finally{Core.defaultBlock=previous}
    };
  }

  function scheduleScan(){if(scanFrame)return;scanFrame=requestAnimationFrame(()=>{scanFrame=0;document.querySelectorAll('.nested-zone').forEach(decorateNested)})}
  const observer=new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))scheduleScan()});
  observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [0,120,350,800].forEach(ms=>setTimeout(scheduleScan,ms));

  async function imageBlobToPng(file){
    let bitmap=null;
    try{if(window.createImageBitmap)bitmap=await createImageBitmap(file)}catch(_){}
    let width=bitmap?.width||0,height=bitmap?.height||0,source=bitmap;
    if(!source){
      const url=URL.createObjectURL(file);
      try{
        const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=url});
        width=img.naturalWidth||img.width;height=img.naturalHeight||img.height;source=img;
      }finally{URL.revokeObjectURL(url)}
    }
    if(!width||!height)throw new Error('Не удалось прочитать изображение из буфера обмена');
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw new Error('Canvas недоступен');
    ctx.drawImage(source,0,0,width,height);if(bitmap?.close)bitmap.close();
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Не удалось преобразовать изображение в PNG')),'image/png'));
  }
  function dataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
  async function uploadPng(file){
    const blob=await imageBlobToPng(file),stamp=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,17);
    const response=await fetch('/api/editor/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:`paste-${stamp}.png`,data:await dataUrl(blob)})});
    let result={};try{result=await response.json()}catch(_){}
    if(!response.ok)throw new Error(result.error||`HTTP ${response.status}`);
    if(!result.source)throw new Error('Сервер не вернул постоянный путь изображения');
    return result.source;
  }

  function rangeInside(editor,range){
    if(!editor||!range)return false;
    const node=range.commonAncestorContainer;
    const el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    return node===editor||!!(el&&editor.contains(el));
  }
  function captureRange(editor){
    const sel=window.getSelection();if(!sel?.rangeCount)return null;
    const range=sel.getRangeAt(0);if(!rangeInside(editor,range))return null;
    try{return range.cloneRange()}catch(_){return null}
  }
  function displaySource(source){
    source=String(source||'').trim();
    if(typeof Core.mediaUrl==='function')return Core.mediaUrl(source);
    if(/^https?:|^data:|^\//i.test(source))return source;
    if(source.includes('.gitbook/assets/'))return'/.gitbook/assets/'+encodeURIComponent(source.split('.gitbook/assets/').pop().split('/').pop());
    return'/'+source.replace(/^\.\//,'');
  }
  function insertInlineImage(source,editor,savedRange){
    if(!editor?.isConnected)return false;
    let range=savedRange;
    if(!range?.startContainer?.isConnected||!range?.endContainer?.isConnected||!rangeInside(editor,range))range=captureRange(editor);
    if(!range){range=document.createRange();range.selectNodeContents(editor);range.collapse(false)}
    try{
      range.deleteContents();
      const img=document.createElement('img');
      img.className='sw-inline-pasted-image';
      img.dataset.swInlineImage='1';
      img.dataset.swSource=source;
      img.src=displaySource(source);
      img.alt='';img.draggable=false;img.contentEditable='false';
      range.insertNode(img);
      const spacer=document.createTextNode('\u200B');img.after(spacer);
      range.setStartAfter(spacer);range.collapse(true);
      editor.focus({preventScroll:true});
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
      editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:null}));
      return true;
    }catch(error){console.warn('Surwave inline paste failed',error);return false}
  }

  function directCards(zone){
    const list=zone?.querySelector(':scope > .blocks');
    return list?[...list.children].filter(el=>el.classList?.contains('block-card')):[];
  }
  function nestedBase(zone){
    const cards=directCards(zone);
    if(cards.length){const path=cards[0].dataset.editorPath||'';return path.replace(/\.\d+$/,'')}
    const owner=zone.closest('.block-card[data-editor-path]');
    const ownerPath=owner?.dataset.editorPath||'';if(!ownerPath)return'';
    const step=zone.closest('.step-card');
    if(step){
      const body=owner.querySelector(':scope > .block-body');
      const steps=body?[...body.querySelectorAll(':scope > .step-card')]:[];
      const index=steps.indexOf(step);if(index>=0)return `${ownerPath}.steps.${index}.children`;
    }
    return `${ownerPath}.children`;
  }
  function sourceField(card){
    if(!card)return null;
    return [...card.querySelectorAll(':scope > .block-body input.field')].find(input=>
      input.placeholder==='.gitbook/assets/image.png'||/gitbook\/assets\/image\.png/i.test(input.placeholder||'')
    )||card.querySelector(':scope > .block-body input.field');
  }
  function commitSource(path,source){
    const card=document.querySelector(`.block-card[data-editor-path="${CSS.escape(path)}"]`);
    const input=sourceField(card);if(!input)return false;
    input.value=source;input.dispatchEvent(new Event('input',{bubbles:true}));return true;
  }

  function insertNestedImage(source,zone){
    const title=zone.querySelector(':scope > .nested-title');
    const add=[...title?.querySelectorAll('button')||[]].find(b=>/^\+\s*Блок/.test(b.textContent||''));
    const typeSelect=title?.querySelector('.sw-nested-type');
    if(!add||!typeSelect)return false;
    const base=nestedBase(zone);if(!base)return false;
    const previous=typeSelect.value;
    typeSelect.value='image';add.click();
    const path=`${base}.0`;
    const ok=commitSource(path,source);
    const freshZone=document.querySelector(`.block-card[data-editor-path="${CSS.escape(path)}"]`)?.closest('.nested-zone');
    const freshSelect=freshZone?.querySelector(':scope > .nested-title .sw-nested-type');
    if(freshSelect)freshSelect.value=previous||'text';
    return ok;
  }

  function insertTopLevelImage(source){
    const bar=document.getElementById('mainAddBar');
    const select=bar?.querySelector('select'),button=bar?.querySelector('button');
    if(!select||!button)return false;
    const previous=select.value;select.value='image';button.click();
    const ok=commitSource('0',source);
    const fresh=document.getElementById('mainAddBar')?.querySelector('select');if(fresh)fresh.value=previous||'text';
    return ok;
  }

  function insertImageBlock(source,target){
    const zone=target?.closest?.('.nested-zone');
    if(zone&&insertNestedImage(source,zone))return true;
    return insertTopLevelImage(source);
  }

  document.addEventListener('paste',async event=>{
    const items=[...(event.clipboardData?.items||[])];
    const imageItem=items.find(item=>item.kind==='file'&&/^image\//i.test(item.type||''));
    if(!imageItem)return;
    const file=imageItem.getAsFile();if(!file)return;
    const target=event.target;
    const richEditor=target?.closest?.('.rich-editor')||null;
    const savedRange=richEditor?captureRange(richEditor):null;
    event.preventDefault();event.stopPropagation();
    try{
      notify('Загружаю изображение из буфера обмена…',5000);
      const source=await uploadPng(file);
      if(richEditor){
        if(!insertInlineImage(source,richEditor,savedRange))throw new Error('PNG сохранён, но изображение не удалось вставить в текст');
        markDirty();notify('PNG сохранён в .gitbook/assets и вставлен в текст',3200);return;
      }
      if(!insertImageBlock(source,target))throw new Error('PNG сохранён, но блок изображения не удалось добавить в страницу');
      markDirty();notify('PNG сохранён в .gitbook/assets и вставлен как блок изображения',3200);
    }catch(error){notify('Ошибка вставки изображения: '+error.message,5000)}
  },true);
})();
