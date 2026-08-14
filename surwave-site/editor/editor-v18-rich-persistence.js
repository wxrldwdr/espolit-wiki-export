(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;
  const ARROW='[[SW_ARROW]]';
  const LIST_RE=/\[\[SW_LIST:([^\]]+)\]\]/g;
  const IMAGE_RE=/\[\[SW_IMG:([^\]]+)\]\]/g;
  const ARROW_SRC='/surwave-site/assets/icons/inline-arrow.svg';

  function mediaUrl(source){
    source=String(source||'').trim();
    if(!source)return'';
    if(typeof Core.mediaUrl==='function')return Core.mediaUrl(source);
    if(/^https?:|^data:|^\//i.test(source))return source;
    if(source.includes('.gitbook/assets/'))return'/.gitbook/assets/'+encodeURIComponent(source.split('.gitbook/assets/').pop().split('/').pop());
    return'/'+source.replace(/^\.\//,'');
  }
  function arrowHtml(){
    return `<img class="sw-inline-arrow-image" data-sw-inline-arrow="1" data-sw-source="${ARROW_SRC}" src="${ARROW_SRC}" alt="" draggable="false" aria-hidden="true">`;
  }
  function imageHtml(source){
    source=String(source||'').trim();
    return `<img class="sw-inline-pasted-image" data-sw-inline-image="1" data-sw-source="${Core.esc(source)}" src="${Core.esc(mediaUrl(source))}" alt="" draggable="false">`;
  }
  function encodeValue(value){
    const box=document.createElement('div');box.innerHTML=String(value??'');
    [...box.querySelectorAll('[data-sw-inline-list="1"]')].reverse().forEach(list=>{
      const items=[...list.children].filter(el=>el.hasAttribute('data-sw-inline-list-item')).map(el=>el.innerHTML);
      list.replaceWith(document.createTextNode(`[[SW_LIST:${encodeURIComponent(JSON.stringify(items))}]]`));
    });
    box.querySelectorAll('img[data-sw-inline-image="1"],img.sw-inline-pasted-image').forEach(img=>{
      const source=img.dataset.swSource||img.getAttribute('src')||'';
      img.replaceWith(document.createTextNode(`[[SW_IMG:${encodeURIComponent(source)}]]`));
    });
    box.querySelectorAll('[data-sw-inline-arrow="1"],.sw-inline-arrow,.sw-inline-arrow-image').forEach(el=>el.replaceWith(document.createTextNode(ARROW)));
    return box.innerHTML;
  }
  function decodeValue(value){
    let html=String(value??'');
    html=html.replace(LIST_RE,(full,payload)=>{
      try{
        const items=JSON.parse(decodeURIComponent(payload));if(!Array.isArray(items)||!items.length)return'';
        return `<span class="sw-inline-list" data-sw-inline-list="1">${items.map(item=>`<span class="sw-inline-list-item" data-sw-inline-list-item="1">${Core.sanitizeRich(item)}</span>`).join('')}</span>`;
      }catch(_){return full}
    });
    html=html.replace(IMAGE_RE,(full,payload)=>{
      try{return imageHtml(decodeURIComponent(payload))}catch(_){return full}
    });
    return html.split(ARROW).join(arrowHtml());
  }
  function walk(blocks,mapper){
    (blocks||[]).forEach(block=>{
      for(const key of ['html','summaryHtml','nameHtml','bodyHtml','prefixHtml'])if(typeof block[key]==='string')block[key]=mapper(block[key]);
      if(block.type==='list')block.items=(block.items||[]).map(mapper);
      if(['image','gif','video'].includes(block.type)&&typeof block.caption==='string')block.caption=mapper(block.caption);
      if(block.type==='mention'&&typeof block.label==='string')block.label=mapper(block.label);
      if(block.type==='linkgroup')block.items=(block.items||[]).map(item=>({...item,title:mapper(item.title||''),description:mapper(item.description||'')}));
      if(block.type==='embed'){block.title=mapper(block.title||'');block.description=mapper(block.description||'')}
      if(block.type==='table')block.rows=(block.rows||[]).map(row=>row.map(cell=>mapper(cell||'')));
      if(block.type==='servercards')block.items=(block.items||[]).map(item=>({...item,title:mapper(item.title||item.ip||'')}));
      if(block.type==='hint'||block.type==='details')walk(block.children,mapper);
      if(block.type==='stepper')(block.steps||[]).forEach(step=>walk(step.children,mapper));
    });
    return blocks;
  }

  const previousParse=Core.parseDocument;
  Core.parseDocument=source=>{const doc=previousParse(source);walk(doc.blocks,decodeValue);return doc};
  const previousSerialize=Core.serializeDocument;
  Core.serializeDocument=(frontmatter,blocks)=>{
    const copy=Core.clone(blocks||[]);walk(copy,encodeValue);
    return previousSerialize(frontmatter,copy);
  };

  Core.previewCss+=`.sw-inline-arrow,.sw-inline-arrow-image{display:inline-block;width:1.82em;height:1.02em;vertical-align:-.18em;margin:0 .08em}.sw-inline-arrow{background-image:url('${ARROW_SRC}')!important;background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important}.sw-inline-arrow-image{max-width:none!important;max-height:none!important;object-fit:contain!important;border:0!important;background:transparent!important}.sw-inline-pasted-image{display:block!important;width:auto!important;max-width:100%!important;height:auto!important;max-height:480px!important;object-fit:contain!important;margin:.45em 0!important;border-radius:8px!important}`;
  window.SurwaveRichPersistenceV18={encodeValue,decodeValue};

  if(!window.SurwaveListPointerSortV19){
    const script=document.createElement('script');
    script.src='editor-v19-list-pointer-sort.js?v=20260814-1408';
    script.async=false;
    document.head.appendChild(script);
  }
})();
