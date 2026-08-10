(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;
  const base=Core.serializeDocument;

  function relative(from,to){
    const left=String(from||'').replace(/\\/g,'/').split('/');
    left.pop();
    const right=String(to||'').replace(/\\/g,'/').split('/');
    while(left.length&&right.length&&left[0]===right[0]){left.shift();right.shift();}
    return '../'.repeat(left.length)+right.join('/');
  }

  function normalizeUrl(url,current){
    const value=String(url||'').trim();
    if(!value||/^(https?:|mailto:|tel:|#|\/surwave-site\/wiki\/)/i.test(value))return value;
    if(/\.md(?:#.*)?$/i.test(value)&&!/^\.\.?\//.test(value)){
      const hashAt=value.indexOf('#');
      const path=hashAt>=0?value.slice(0,hashAt):value;
      const hash=hashAt>=0?value.slice(hashAt):'';
      return relative(current,path)+hash;
    }
    return value;
  }

  function clean(blocks,current){
    return (blocks||[]).map(value=>{
      const b=Core.clone(value);
      if(b.type==='mention')b.url=normalizeUrl(b.url,current);
      if(b.type==='linkgroup')b.items=(b.items||[]).map(item=>({...item,url:normalizeUrl(item.url,current)}));
      if(b.type==='recipe'){
        const m=String(b.nameHtml||'').match(/^\s*<strong>([\s\S]*?)<\/strong>\s*$/i);
        if(m)b.nameHtml=m[1];
      }
      if(b.type==='hint'||b.type==='details')b.children=clean(b.children,current);
      if(b.type==='stepper')b.steps=(b.steps||[]).map(step=>({...step,children:clean(step.children,current)}));
      return b;
    });
  }

  Core.serializeDocument=(frontmatter,blocks)=>{
    const current=document.getElementById('pagePath')?.value?.trim()||'';
    return base(frontmatter,clean(blocks,current));
  };
})();
