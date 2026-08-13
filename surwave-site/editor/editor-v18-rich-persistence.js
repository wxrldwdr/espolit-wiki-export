(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;
  const ARROW='[[SW_ARROW]]';
  const LIST_RE=/\[\[SW_LIST:([^\]]+)\]\]/g;

  function encodeValue(value){
    const box=document.createElement('div');box.innerHTML=String(value??'');
    [...box.querySelectorAll('[data-sw-inline-list="1"]')].reverse().forEach(list=>{
      const items=[...list.children].filter(el=>el.hasAttribute('data-sw-inline-list-item')).map(el=>el.innerHTML);
      list.replaceWith(document.createTextNode(`[[SW_LIST:${encodeURIComponent(JSON.stringify(items))}]]`));
    });
    box.querySelectorAll('[data-sw-inline-arrow="1"],.sw-inline-arrow').forEach(el=>el.replaceWith(document.createTextNode(ARROW)));
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
    return html.split(ARROW).join('<span class="sw-inline-arrow" data-sw-inline-arrow="1" aria-hidden="true"></span>');
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

  Core.previewCss+=`.sw-inline-arrow{background-image:url('/surwave-site/assets/icons/inline-arrow.svg')!important}`;
  window.SurwaveRichPersistenceV18={encodeValue,decodeValue};
})();
