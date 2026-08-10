(() => {
  const Core=window.SurwaveEditorCoreV2;
  if(!Core)return;

  const previousParse=Core.parseDocument;
  const previousSerializeDocument=Core.serializeDocument;
  const META_RE=/<!--SURWAVE_GRADIENTS:([^\r\n]*?)-->\s*/;

  const clone=value=>JSON.parse(JSON.stringify(value));

  function walk(blocks,base='',fn=()=>{}){
    (blocks||[]).forEach((block,i)=>{
      const path=base?`${base}.${i}`:`${i}`;
      fn(block,path);
      if(block.type==='hint'||block.type==='details')walk(block.children,`${path}.children`,fn);
      if(block.type==='stepper')(block.steps||[]).forEach((step,si)=>walk(step.children,`${path}.steps.${si}.children`,fn));
    });
  }

  function decode(source){
    const match=String(source||'').match(META_RE);
    if(!match)return{};
    try{return JSON.parse(decodeURIComponent(match[1]))||{};}catch(_){return{};}
  }

  function strip(source){return String(source||'').replace(META_RE,'');}

  function collect(blocks){
    const meta={version:2,blocks:{}};
    walk(blocks,'',(block,path)=>{
      if(!['servercards','linkgroup'].includes(block.type))return;
      meta.blocks[path]={
        type:block.type,
        borderGradient:!!block.borderGradient,
        textGradient:!!block.textGradient,
        borderEdge:block.borderEdge||'#00ff78',
        borderCenter:block.borderCenter||'#00ffc0',
        textEdge:block.textEdge||'#00ff78',
        textCenter:block.textCenter||'#00ffc0',
        gradientStates:clone(block.gradientStates||{})
      };
    });
    return meta;
  }

  function apply(blocks,meta){
    const saved=meta?.blocks||{};
    walk(blocks,'',(block,path)=>{
      const value=saved[path];
      if(!value||value.type!==block.type)return;
      block.borderGradient=value.borderGradient;
      block.textGradient=value.textGradient;
      if(value.borderEdge)block.borderEdge=value.borderEdge;
      if(value.borderCenter)block.borderCenter=value.borderCenter;
      if(value.textEdge)block.textEdge=value.textEdge;
      if(value.textCenter)block.textCenter=value.textCenter;
      if(value.gradientStates)block.gradientStates=clone(value.gradientStates);
      window.SurwaveEnsureGradientStates?.(block);
    });
  }

  Core.parseDocument=source=>{
    const meta=decode(source);
    const doc=previousParse(strip(source));
    apply(doc.blocks,meta);
    return doc;
  };

  Core.serializeDocument=(frontmatter,blocks)=>{
    let output=previousSerializeDocument(frontmatter,blocks).replace(META_RE,'');
    const meta=collect(blocks);
    const comment=`<!--SURWAVE_GRADIENTS:${encodeURIComponent(JSON.stringify(meta))}-->\n`;
    const fm=String(frontmatter||'');
    if(fm&&output.startsWith(fm))return fm+comment+output.slice(fm.length);
    return comment+output;
  };

  window.SurwaveGradientPersistence={collect,decode};
})();