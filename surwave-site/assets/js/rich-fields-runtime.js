(() => {
  const META_RE=/<!--SURWAVE_RICH_FIELDS_V1:([^\n]*?)-->/;
  const source=document.body.dataset.source||'README.md';
  const contentUrl='/surwave-site/content/'+source.split('/').map(encodeURIComponent).join('/');
  let meta=null,applied=false,scheduled=0;

  function sanitize(value){
    const tpl=document.createElement('template');tpl.innerHTML=String(value??'');
    tpl.content.querySelectorAll('script,iframe,object,embed,style').forEach(el=>el.remove());
    tpl.content.querySelectorAll('*').forEach(el=>{
      [...el.attributes].forEach(attr=>{
        if(/^on/i.test(attr.name))el.removeAttribute(attr.name);
        if((attr.name==='href'||attr.name==='src')&&/^javascript:/i.test(attr.value||''))el.removeAttribute(attr.name);
      });
    });
    return tpl.innerHTML;
  }
  function decode(text){
    const match=String(text||'').match(META_RE);if(!match)return null;
    try{return JSON.parse(decodeURIComponent(match[1]))}catch(_){return null}
  }
  function apply(){
    scheduled=0;if(!meta)return;
    const article=document.querySelector('.article');if(!article)return;
    const figures=[...article.querySelectorAll('figure.wiki-figure')];
    (meta.images||[]).forEach((html,i)=>{
      const figure=figures[i];if(!figure)return;
      let cap=figure.querySelector('figcaption');
      if(html&&!cap){cap=document.createElement('figcaption');figure.appendChild(cap)}
      if(cap)cap.innerHTML=sanitize(html||'');
    });
    const mentions=[...article.querySelectorAll('.mention-block')];
    (meta.mentions||[]).forEach((html,i)=>{const a=mentions[i]?.querySelector('a');if(a)a.innerHTML=`${sanitize(html||'Раздел')}<span>↗</span>`});
    const groups=[...article.querySelectorAll('.link-group')];
    (meta.linkgroups||[]).forEach((titles,gi)=>{
      groups[gi]?.querySelectorAll('.link-copy strong').forEach((strong,i)=>{if(titles?.[i]!=null)strong.innerHTML=sanitize(titles[i])});
    });
    const tables=[...article.querySelectorAll('.table-wrap table')];
    (meta.tables||[]).forEach((rows,ti)=>{
      const cells=[...tables[ti]?.querySelectorAll('th,td')||[]],values=(rows||[]).flat();
      cells.forEach((cell,i)=>{if(values[i]!=null)cell.innerHTML=sanitize(values[i])});
    });
    const serverPairs=[...article.querySelectorAll('.sw-copy-pair')];
    (meta.servercards||[]).forEach((titles,pi)=>{
      serverPairs[pi]?.querySelectorAll('.sw-copy-title').forEach((title,i)=>{if(titles?.[i]!=null)title.innerHTML=sanitize(titles[i])});
    });
    applied=true;
  }
  function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(apply)}

  fetch(contentUrl,{cache:'no-store'}).then(r=>r.ok?r.text():'').then(text=>{meta=decode(text);schedule()}).catch(()=>{});
  const observer=new MutationObserver(()=>{if(!applied||meta)schedule()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,100,250,600,1200].forEach(ms=>setTimeout(schedule,ms));
})();