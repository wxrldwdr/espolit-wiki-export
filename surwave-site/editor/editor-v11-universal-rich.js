(() => {
  const Core=window.SurwaveEditorCoreV2;
  const refs=window.SurwaveEditorBlockRefs;
  if(!Core||!(refs instanceof Map))return;

  const META_RE=/<!--SURWAVE_RICH_FIELDS_V1:([^\n]*?)-->/;
  let scanFrame=0;

  function markDirty(){
    const field=document.getElementById('pagePath');
    if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function sanitize(value){return Core.sanitizeRich(String(value??''));}
  function plain(value){return Core.stripHtml(String(value??''));}
  function toast(text){
    const el=document.getElementById('toast');if(!el)return;
    el.textContent=text;el.classList.add('visible');
    clearTimeout(el._swRichTimer);el._swRichTimer=setTimeout(()=>el.classList.remove('visible'),2200);
  }

  function normalizeRich(value){
    const box=document.createElement('div');box.innerHTML=String(value??'');
    box.querySelectorAll('span[data-gitbook-color]').forEach(span=>{
      if(!span.style.color){const raw=span.dataset.gitbookColor||'';span.style.color=raw==='$primary'?'#00ff78':raw}
    });
    return box.innerHTML;
  }
  function backgroundToMark(value){
    const box=document.createElement('div');box.innerHTML=sanitize(normalizeRich(value));
    [...box.querySelectorAll('*')].forEach(el=>{
      const bg=el.style?.backgroundColor;if(!bg||el.tagName==='MARK')return;
      el.style.removeProperty('background-color');
      const mark=document.createElement('mark');mark.style.backgroundColor=bg;
      while(el.firstChild)mark.appendChild(el.firstChild);
      el.appendChild(mark);
      if(el.tagName==='SPAN'&&!el.getAttribute('style')&&el.attributes.length===0)el.replaceWith(mark);
    });
    return box.innerHTML;
  }

  function walk(blocks,fn){
    (blocks||[]).forEach(block=>{
      fn(block);
      if(block.type==='hint'||block.type==='details')walk(block.children,fn);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>walk(step.children,fn));
    });
  }

  function normalizeBlocks(blocks){
    walk(blocks,b=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(b[key]!=null)b[key]=normalizeRich(b[key]);
      if(b.type==='list')b.items=(b.items||[]).map(normalizeRich);
      if(b.type==='image')b.caption=normalizeRich(b.caption||'');
      if(b.type==='mention')b.label=normalizeRich(b.label||'Раздел');
      if(b.type==='linkgroup')b.items=(b.items||[]).map(item=>({...item,title:normalizeRich(item.title||''),description:normalizeRich(item.description||'')}));
      if(b.type==='embed'){b.title=normalizeRich(b.title||'');b.description=normalizeRich(b.description||'')}
      if(b.type==='table')b.rows=(b.rows||[]).map(row=>row.map(normalizeRich));
      if(b.type==='servercards')b.items=(b.items||[]).map(item=>({...item,title:normalizeRich(item.title||item.ip||'')}));
    });
  }

  function collectMeta(blocks){
    const meta={v:1,images:[],mentions:[],linkgroups:[],tables:[],servercards:[]};
    walk(blocks,b=>{
      if(b.type==='image')meta.images.push(sanitize(b.caption||''));
      else if(b.type==='mention')meta.mentions.push(sanitize(b.label||'Раздел'));
      else if(b.type==='linkgroup')meta.linkgroups.push((b.items||[]).map(item=>sanitize(item.title||'')));
      else if(b.type==='table')meta.tables.push((b.rows||[]).map(row=>row.map(sanitize)));
      else if(b.type==='servercards')meta.servercards.push((b.items||[]).map(item=>sanitize(item.title||item.ip||'')));
    });
    return meta;
  }
  function applyMeta(blocks,meta){
    if(!meta||meta.v!==1)return;
    const index={image:0,mention:0,linkgroup:0,table:0,servercards:0};
    walk(blocks,b=>{
      if(b.type==='image'){
        const v=meta.images?.[index.image++];if(v!=null)b.caption=normalizeRich(v);
      }else if(b.type==='mention'){
        const v=meta.mentions?.[index.mention++];if(v!=null)b.label=normalizeRich(v);
      }else if(b.type==='linkgroup'){
        const v=meta.linkgroups?.[index.linkgroup++];if(v)(b.items||[]).forEach((item,i)=>{if(v[i]!=null)item.title=normalizeRich(v[i])});
      }else if(b.type==='table'){
        const v=meta.tables?.[index.table++];if(v)b.rows=v.map(row=>row.map(normalizeRich));
      }else if(b.type==='servercards'){
        const v=meta.servercards?.[index.servercards++];if(v)(b.items||[]).forEach((item,i)=>{if(v[i]!=null)item.title=normalizeRich(v[i])});
      }
    });
  }
  function readMeta(source){
    const m=String(source||'').match(META_RE);if(!m)return null;
    try{return JSON.parse(decodeURIComponent(m[1]))}catch(_){return null}
  }

  const previousParse=Core.parseDocument;
  Core.parseDocument=source=>{
    const meta=readMeta(source);
    const doc=previousParse(String(source||'').replace(META_RE,''));
    normalizeBlocks(doc.blocks);applyMeta(doc.blocks,meta);return doc;
  };

  function cloneForSave(blocks){
    const copy=Core.clone(blocks||[]);
    walk(copy,b=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(b[key]!=null)b[key]=backgroundToMark(b[key]);
      if(b.type==='list')b.items=(b.items||[]).map(backgroundToMark);
      if(b.type==='image')b.caption=plain(b.caption||'');
      if(b.type==='mention')b.label=plain(b.label||'Раздел');
      if(b.type==='linkgroup')b.items=(b.items||[]).map(item=>({...item,title:plain(item.title||''),description:backgroundToMark(item.description||'')}));
      if(b.type==='embed'){b.title=backgroundToMark(b.title||'');b.description=backgroundToMark(b.description||'')}
      if(b.type==='table')b.rows=(b.rows||[]).map(row=>row.map(plain));
      if(b.type==='servercards')b.items=(b.items||[]).map(item=>({...item,title:plain(item.title||item.ip||'')}));
    });
    return copy;
  }

  const previousSerializeDocument=Core.serializeDocument;
  Core.serializeDocument=(frontmatter,blocks)=>{
    const meta=encodeURIComponent(JSON.stringify(collectMeta(blocks)));
    const output=previousSerializeDocument(frontmatter,cloneForSave(blocks)).replace(META_RE,'').replace(/\s+$/,'');
    return `${output}\n<!--SURWAVE_RICH_FIELDS_V1:${meta}-->\n`;
  };

  const previousRender=Core.renderBlocksHtml;
  Core.renderBlocksHtml=(blocks,base='')=>{
    const html=previousRender(blocks,base),tpl=document.createElement('template');tpl.innerHTML=html;
    tpl.content.querySelectorAll('[data-editor-path]').forEach(node=>{
      const block=refs.get(node.dataset.editorPath);if(!block)return;
      if(block.type==='image'){
        let cap=node.querySelector('figcaption');
        if(block.caption&&!cap){cap=document.createElement('figcaption');node.appendChild(cap)}
        if(cap)cap.innerHTML=sanitize(block.caption||'');
      }else if(block.type==='mention'){
        const a=node.querySelector('a');if(a)a.innerHTML=`${sanitize(block.label||'Раздел')} <span>↗</span>`;
      }else if(block.type==='linkgroup'){
        node.querySelectorAll('.link-copy strong').forEach((el,i)=>el.innerHTML=sanitize(block.items?.[i]?.title||'Ссылка'));
      }else if(block.type==='table'){
        node.querySelectorAll('th,td').forEach((el,i)=>{const cells=(block.rows||[]).flat();if(cells[i]!=null)el.innerHTML=sanitize(cells[i])});
      }else if(block.type==='servercards'){
        node.querySelectorAll('.sw-copy-title').forEach((el,i)=>el.innerHTML=sanitize(block.items?.[i]?.title||block.items?.[i]?.ip||''));
      }
    });
    return tpl.innerHTML;
  };

  function richButton(html,title,handler){
    const b=document.createElement('button');b.type='button';b.innerHTML=html;b.title=title;
    b.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();handler()});return b;
  }
  function makeRich(value,onChange,compact=true){
    const wrap=document.createElement('div');wrap.className='sw-universal-rich'+(compact?' compact':'');
    const bar=document.createElement('div');bar.className='rich-toolbar';
    const ed=document.createElement('div');ed.className='rich-editor';ed.contentEditable='true';ed.innerHTML=normalizeRich(value||'');
    const commit=()=>{onChange(ed.innerHTML);markDirty()};
    const command=(html,title,cmd)=>bar.appendChild(richButton(html,title,()=>{ed.focus();cmd();commit()}));
    command('<b>B</b>','Жирный',()=>document.execCommand('bold'));
    command('<i>I</i>','Курсив',()=>document.execCommand('italic'));
    command('<u>U</u>','Подчёркивание',()=>document.execCommand('underline'));
    command('<s>S</s>','Зачёркивание',()=>document.execCommand('strikeThrough'));
    command('&lt;/&gt;','Код',()=>document.execCommand('formatBlock',false,'code'));
    const color=document.createElement('input');color.type='color';color.value='#00ff78';color.title='Цвет текста';bar.appendChild(color);
    const highlight=document.createElement('input');highlight.type='color';highlight.value='#ffe066';highlight.title='Цвет выделения';bar.appendChild(highlight);
    const size=document.createElement('input');size.type='number';size.min='6';size.max='200';size.step='1';size.value='15';size.title='Размер текста, px';size.className='rich-size-number';bar.append(size,document.createTextNode(' px'));
    command('🔗','Гиперссылка',()=>{const u=prompt('Ссылка:','https://');if(u)document.execCommand('createLink',false,u)});
    command('⧉','Пометить выделенный текст для копирования',()=>document.execCommand('createLink',false,'#copy'));
    ed.addEventListener('input',commit);
    wrap.append(bar,ed);return wrap;
  }
  window.SurwaveUniversalRich={create:makeRich,sanitize,normalize:normalizeRich};

  function replaceInput(input,value,setter){
    if(!input||input.dataset.swRichReplaced==='1')return;
    input.dataset.swRichReplaced='1';
    const rich=makeRich(value,v=>setter(v),true);input.replaceWith(rich);
  }

  function addCopyButton(toolbar){
    if(!toolbar||toolbar.querySelector('.sw-copy-mark-button'))return;
    const wrap=toolbar.parentElement,ed=wrap?.querySelector(':scope > .rich-editor')||wrap?.querySelector('.rich-editor');if(!ed)return;
    const b=richButton('⧉','Пометить выделенный текст для копирования',()=>{ed.focus();document.execCommand('createLink',false,'#copy');ed.dispatchEvent(new Event('input',{bubbles:true}))});
    b.classList.add('sw-copy-mark-button');toolbar.appendChild(b);
  }

  function scanCard(card){
    const block=refs.get(card.dataset.editorPath||'');if(!block)return;
    const body=card.querySelector(':scope > .block-body');if(!body)return;
    if(block.type==='list'){
      body.querySelectorAll(':scope > .list-row').forEach((row,i)=>replaceInput(row.querySelector(':scope > input.field'),block.items?.[i]||'',v=>block.items[i]=v));
    }else if(block.type==='image'){
      const inputs=[...body.querySelectorAll(':scope > input.field')];if(inputs[1])replaceInput(inputs[1],block.caption||'',v=>block.caption=v);
    }else if(block.type==='mention'){
      const inputs=[...body.querySelectorAll(':scope > input.field')];if(inputs[0])replaceInput(inputs[0],block.label||'Раздел',v=>block.label=v);
    }else if(block.type==='linkgroup'){
      body.querySelectorAll('.link-editor-item').forEach((row,i)=>{const input=row.querySelector(':scope > input.field');if(input)replaceInput(input,block.items?.[i]?.title||'',v=>block.items[i].title=v)});
    }else if(block.type==='table'){
      body.querySelectorAll('td').forEach((cell,i)=>{const input=cell.querySelector('input.field');if(!input)return;const cols=Math.max(...(block.rows||[]).map(r=>r.length),1),ri=Math.floor(i/cols),ci=i%cols;if(block.rows?.[ri])replaceInput(input,block.rows[ri][ci]||'',v=>block.rows[ri][ci]=v)});
    }else if(block.type==='servercards'){
      body.querySelectorAll('.sw-server-item-editor').forEach((itemEditor,i)=>{
        const labels=itemEditor.querySelectorAll('.sw-card-field-grid > label');const input=labels[1]?.querySelector('input.field');
        if(input&&block.items?.[i])replaceInput(input,block.items[i].title||block.items[i].ip||'',v=>block.items[i].title=v);
      });
    }
  }

  function scan(){
    document.querySelectorAll('.rich-toolbar').forEach(addCopyButton);
    document.querySelectorAll('.block-card[data-editor-path]').forEach(scanCard);
  }
  function schedule(){if(scanFrame)return;scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()})}
  const observer=new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length||x.removedNodes.length))schedule()});
  observer.observe(document.getElementById('blocks')||document.body,{childList:true,subtree:true});
  [0,100,250,600,1200].forEach(ms=>setTimeout(schedule,ms));

  Core.previewCss+=`a[href="#copy"]{cursor:pointer;text-decoration:none!important;border-bottom:1px dashed rgba(0,255,192,.48)}a[href="#copy"]::after{content:" ⧉";display:inline-block;margin-left:.24em;color:#00ffc0;font-size:.82em;opacity:.9}mark[style*="background"]{color:inherit;padding:.02em .12em;border-radius:3px}`;
})();