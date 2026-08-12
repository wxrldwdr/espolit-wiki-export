(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;

  const MEDIA_MARK='__SURWAVE_MEDIA_BLOCK__';
  const mediaTypes=new Set(['gif','video']);

  if(!Core.TYPES.some(([type])=>type==='gif')){
    const imageIndex=Core.TYPES.findIndex(([type])=>type==='image');
    Core.TYPES.splice(imageIndex>=0?imageIndex+1:Core.TYPES.length,0,['gif','GIF'],['video','Видео']);
  }

  const baseDefault=Core.defaultBlock;
  Core.defaultBlock=type=>{
    if(type==='gif')return {type:'gif',src:'',alt:'',caption:''};
    if(type==='video')return {type:'video',src:'',poster:'',caption:'',controls:true,autoplay:false,loop:false,muted:false};
    return baseDefault(type);
  };

  function walk(blocks,fn){
    (blocks||[]).forEach(block=>{
      fn(block);
      if(block.type==='hint'||block.type==='details')walk(block.children,fn);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>walk(step.children,fn));
    });
  }
  function persistentMediaUrl(src){
    src=String(src||'').trim();
    if(!src)return'';
    if(/^https?:|^data:|^\//i.test(src))return src;
    const marker='.gitbook/assets/';
    if(src.includes(marker))return'/.gitbook/assets/'+src.split(marker).pop().split('/').pop();
    return'/'+src.replace(/^\.\//,'');
  }
  function mediaMarkup(block){
    const caption=block.caption?`<figcaption>${Core.sanitizeRich(block.caption)}</figcaption>`:'';
    if(block.type==='gif'){
      return `<figure><img class="wiki-image sw-gif-media" data-sw-media="gif" src="${Core.esc(persistentMediaUrl(block.src))}" alt="${Core.esc(block.alt||'')}">${caption}</figure>`;
    }
    return `<figure><video class="sw-video-media" data-sw-media="video" src="${Core.esc(persistentMediaUrl(block.src))}"${block.poster?` poster="${Core.esc(persistentMediaUrl(block.poster))}"`:''}${block.controls!==false?' controls':''}${block.autoplay?' autoplay':''}${block.loop?' loop':''}${block.muted?' muted':''} playsinline></video>${caption}</figure>`;
  }
  function transformForSave(blocks){
    return (blocks||[]).map(block=>{
      if(mediaTypes.has(block.type))return {type:'raw',markdown:mediaMarkup(block)};
      const copy=Core.clone(block);
      if(copy.type==='hint'||copy.type==='details')copy.children=transformForSave(copy.children);
      if(copy.type==='stepper')copy.steps=(copy.steps||[]).map(step=>({...step,children:transformForSave(step.children)}));
      return copy;
    });
  }
  function parseMediaRaw(markdown){
    const text=String(markdown||'').trim();
    let m=text.match(/^<figure><img class="wiki-image sw-gif-media" data-sw-media="gif" src="([^"]*)" alt="([^"]*)">(?:<figcaption>([\s\S]*?)<\/figcaption>)?<\/figure>$/i);
    if(m)return {type:'gif',src:m[1],alt:m[2],caption:m[3]||''};
    m=text.match(/^<figure><video class="sw-video-media" data-sw-media="video" src="([^"]*)"(?: poster="([^"]*)")?( controls)?( autoplay)?( loop)?( muted)? playsinline><\/video>(?:<figcaption>([\s\S]*?)<\/figcaption>)?<\/figure>$/i);
    if(m)return {type:'video',src:m[1],poster:m[2]||'',controls:!!m[3],autoplay:!!m[4],loop:!!m[5],muted:!!m[6],caption:m[7]||''};
    return null;
  }
  function restoreMedia(blocks){
    return (blocks||[]).map(block=>{
      if(block.type==='raw')return parseMediaRaw(block.markdown)||block;
      if(block.type==='hint'||block.type==='details')block.children=restoreMedia(block.children);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>step.children=restoreMedia(step.children));
      return block;
    });
  }

  const baseParse=Core.parseDocument;
  Core.parseDocument=source=>{
    const doc=baseParse(source);
    doc.blocks=restoreMedia(doc.blocks);
    return doc;
  };

  const baseSerializeBlocks=Core.serializeBlocks;
  Core.serializeBlocks=blocks=>baseSerializeBlocks(transformForSave(blocks));
  const baseSerializeDocument=Core.serializeDocument;
  Core.serializeDocument=(frontmatter,blocks)=>baseSerializeDocument(frontmatter,transformForSave(blocks));

  const baseRender=Core.renderBlocksHtml;
  Core.renderBlocksHtml=(blocks,base='')=>{
    const markers=new Map();let seq=0;
    function transform(list){
      return (list||[]).map(block=>{
        if(mediaTypes.has(block.type)){
          const key=`${MEDIA_MARK}${++seq}__`;
          markers.set(key,block);
          return {type:'raw',markdown:key};
        }
        const copy=Core.clone(block);
        if(copy.type==='hint'||copy.type==='details')copy.children=transform(copy.children);
        if(copy.type==='stepper')copy.steps=(copy.steps||[]).map(step=>({...step,children:transform(step.children)}));
        return copy;
      });
    }
    const html=baseRender(transform(blocks),base);
    if(!markers.size)return html;
    const tpl=document.createElement('template');tpl.innerHTML=html;
    tpl.content.querySelectorAll('pre.raw-preview[data-editor-path]').forEach(pre=>{
      const block=markers.get((pre.textContent||'').trim());if(!block)return;
      const path=pre.dataset.editorPath||'';
      const holder=document.createElement('template');
      if(block.type==='gif'){
        holder.innerHTML=`<figure class="sw-gif-block" data-editor-path="${Core.esc(path)}"><img class="sw-gif-media" src="${Core.mediaUrl(block.src)}" alt="${Core.esc(block.alt||'')}">${block.caption?`<figcaption>${Core.sanitizeRich(block.caption)}</figcaption>`:''}</figure>`;
      }else{
        holder.innerHTML=`<figure class="sw-video-block" data-editor-path="${Core.esc(path)}"><video class="sw-video-media" src="${Core.mediaUrl(block.src)}"${block.poster?` poster="${Core.mediaUrl(block.poster)}"`:''}${block.controls!==false?' controls':''}${block.autoplay?' autoplay':''}${block.loop?' loop':''}${block.muted?' muted':''} playsinline></video>${block.caption?`<figcaption>${Core.sanitizeRich(block.caption)}</figcaption>`:''}</figure>`;
      }
      pre.replaceWith(holder.content.firstElementChild);
    });
    return tpl.innerHTML;
  };

  function dirty(){
    const field=document.getElementById('pagePath');
    if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function field(value,placeholder,onInput){
    const input=document.createElement('input');input.className='field';input.value=value||'';input.placeholder=placeholder||'';
    input.addEventListener('input',()=>{onInput(input.value);dirty()});return input;
  }
  function button(text,onClick){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.addEventListener('click',onClick);return b}
  async function upload(accept){
    return new Promise((resolve,reject)=>{
      const picker=document.createElement('input');picker.type='file';picker.accept=accept;picker.hidden=true;document.body.appendChild(picker);
      picker.addEventListener('change',async()=>{
        const file=picker.files?.[0];if(!file){picker.remove();return resolve('')}
        try{
          const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
          const response=await fetch('/api/editor/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,data})});
          let out={};try{out=await response.json()}catch(_){}
          if(!response.ok)throw new Error(out.error||`HTTP ${response.status}`);
          resolve(out.source||'');
        }catch(error){reject(error)}finally{picker.remove()}
      },{once:true});picker.click();
    });
  }
  function checkbox(block,key,label,defaultValue){
    if(block[key]==null)block[key]=defaultValue;
    const row=document.createElement('label');row.className='check-line';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!block[key];
    cb.addEventListener('change',()=>{block[key]=cb.checked;dirty()});row.append(cb,document.createTextNode(label));return row;
  }
  function captionControl(block){
    if(window.SurwaveUniversalRich?.create)return window.SurwaveUniversalRich.create(block.caption||'',value=>{block.caption=value;dirty()},true);
    return field(block.caption||'','Подпись',value=>block.caption=value);
  }
  function toast(text){const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.add('visible');clearTimeout(el._swMediaToast);el._swMediaToast=setTimeout(()=>el.classList.remove('visible'),2600)}
  function decorateCard(card){
    const refs=window.SurwaveEditorBlockRefs;if(!(refs instanceof Map))return;
    const block=refs.get(card.dataset.editorPath||'');if(!block||!mediaTypes.has(block.type))return;
    const body=card.querySelector(':scope > .block-body');if(!body||body.dataset.swMediaUi==='1')return;
    body.dataset.swMediaUi='1';body.innerHTML='';
    if(block.type==='gif'){
      const src=field(block.src,'.gitbook/assets/animation.gif',value=>block.src=value);
      const choose=button('Загрузить GIF',async()=>{try{const value=await upload('image/gif,image/apng');if(value){block.src=value;src.value=value;dirty();toast('GIF загружен')}}catch(e){toast('Ошибка загрузки GIF: '+e.message)}});
      body.append(src,choose,field(block.alt,'Alt-текст',value=>block.alt=value),captionControl(block));
    }else{
      const src=field(block.src,'.gitbook/assets/video.mp4',value=>block.src=value);
      const video=button('Загрузить видео',async()=>{try{const value=await upload('video/mp4,video/webm');if(value){block.src=value;src.value=value;dirty();toast('Видео загружено')}}catch(e){toast('Ошибка загрузки видео: '+e.message)}});
      const poster=field(block.poster,'Постер (необязательно)',value=>block.poster=value);
      const posterBtn=button('Загрузить постер',async()=>{try{const value=await upload('image/png,image/jpeg,image/webp');if(value){block.poster=value;poster.value=value;dirty();toast('Постер загружен')}}catch(e){toast('Ошибка загрузки постера: '+e.message)}});
      const flags=document.createElement('div');flags.className='control-row';flags.append(checkbox(block,'controls','Показывать управление',true),checkbox(block,'autoplay','Автовоспроизведение',false),checkbox(block,'loop','Повторять',false),checkbox(block,'muted','Без звука',false));
      body.append(src,video,poster,posterBtn,captionControl(block),flags);
    }
  }
  function scan(){document.querySelectorAll('.block-card[data-editor-path]').forEach(decorateCard)}
  const observer=new MutationObserver(()=>requestAnimationFrame(scan));observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [150,350,700,1200].forEach(ms=>setTimeout(scan,ms));

  Core.previewCss+=`.article .sw-gif-block,.article .sw-video-block{overflow:hidden;border:1px solid var(--line);border-radius:12px;background:#030607}.article .sw-gif-media,.article .sw-video-media{display:block;width:100%;max-width:100%;margin:0;border:0;border-radius:0;background:#030607}.article .sw-video-media{aspect-ratio:16/9;object-fit:contain}.article .sw-gif-block figcaption,.article .sw-video-block figcaption{padding:8px 11px;color:#758780}`;
  window.SurwaveMediaBlocksLoaded=true;
})();