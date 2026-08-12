(() => {
  const STATES=['normal','hover','active','copied'];
  const DEFAULT_EDGE='#00ff78';
  const DEFAULT_CENTER='#00ffc0';
  const GLOBAL_PHASE_ORIGIN=0;
  const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};

  function hexRgb(value,fallback=DEFAULT_EDGE){
    let v=String(value||'').trim();
    if(!/^#[0-9a-f]{3,6}$/i.test(v))v=fallback;
    if(v.length===4)v='#'+[...v.slice(1)].map(x=>x+x).join('');
    const n=parseInt(v.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];
  }
  function rgba(color,alpha){const[r,g,b]=hexRgb(color);return`rgba(${r},${g},${b},${clamp(alpha,0,100,100)/100})`}

  function defaultState(layer,name){
    const alpha=layer==='text'?[100,100]:({normal:[12,84],hover:[28,94],active:[38,97],copied:[42,98]}[name]||[20,90]);
    const shade={normal:34,hover:20,active:10,copied:14}[name]??24;
    return{mode:'center',color1:DEFAULT_EDGE,alpha1:alpha[0],useSecond:true,color2:DEFAULT_CENTER,alpha2:alpha[1],animation:'none',speed:2.4,shade};
  }

  function normalizeState(value,layer,name){
    const d=defaultState(layer,name),v=value&&typeof value==='object'?value:{};
    const modes=new Set(['center','left','right','top','bottom']);
    const anims=new Set(['none','pulse','flow','orbit','shimmer','wave','glow']);
    return{
      mode:modes.has(v.mode)?v.mode:d.mode,
      color1:String(v.color1||d.color1),
      alpha1:clamp(v.alpha1,0,100,d.alpha1),
      useSecond:v.useSecond!==false,
      color2:String(v.color2||d.color2),
      alpha2:clamp(v.alpha2,0,100,d.alpha2),
      animation:anims.has(v.animation)?v.animation:d.animation,
      speed:clamp(v.speed,0.2,60,d.speed),
      shade:clamp(v.shade,0,100,d.shade)
    };
  }

  function normalizeConfig(config,type){
    const c=config&&typeof config==='object'?config:{};
    const states=c.gradientStates&&typeof c.gradientStates==='object'?c.gradientStates:{};
    const legacyBorder1=c.borderEdge||DEFAULT_EDGE,legacyBorder2=c.borderCenter||DEFAULT_CENTER;
    const legacyText1=c.textEdge||DEFAULT_EDGE,legacyText2=c.textCenter||DEFAULT_CENTER;
    const legacyOpacity=states?.border?.normal?.backgroundOpacity;
    const out={
      borderGradient:c.borderGradient!=null?!!c.borderGradient:type==='servercards',
      textGradient:c.textGradient!=null?!!c.textGradient:type==='servercards',
      backgroundOpacity:type==='servercards'?clamp(c.backgroundOpacity,0,100,clamp(legacyOpacity,0,100,100)):100,
      gradientStates:{border:{},text:{}}
    };
    for(const layer of ['border','text'])for(const name of STATES){
      const raw=states[layer]?.[name],s=normalizeState(raw,layer,name);
      if(!raw){s.color1=layer==='border'?legacyBorder1:legacyText1;s.color2=layer==='border'?legacyBorder2:legacyText2}
      out.gradientStates[layer][name]=s;
    }
    return out;
  }
  function decode(raw){try{return JSON.parse(decodeURIComponent(raw||''))}catch(_){return null}}

  function gradient(state){
    const s=state,c1=rgba(s.color1,s.alpha1),c2=rgba(s.useSecond?s.color2:s.color1,s.alpha2);
    if(s.mode==='center')return`linear-gradient(90deg,${c1} 0%,${c2} 50%,${c1} 100%)`;
    if(s.mode==='right')return`linear-gradient(270deg,${c1} 0%,${c2} 100%)`;
    if(s.mode==='top')return`linear-gradient(180deg,${c1} 0%,${c2} 100%)`;
    if(s.mode==='bottom')return`linear-gradient(0deg,${c1} 0%,${c2} 100%)`;
    return`linear-gradient(90deg,${c1} 0%,${c2} 100%)`;
  }

  function shadeGradient(state){
    const a=clamp(state.shade,0,100,0)/100,d=`rgba(0,0,0,${a})`,clear='rgba(0,0,0,0)';
    if(!a)return'none';
    if(state.mode==='center')return`linear-gradient(90deg,${d} 0%,${clear} 50%,${d} 100%)`;
    if(state.mode==='right')return`linear-gradient(90deg,${d} 0%,${clear} 100%)`;
    if(state.mode==='top')return`linear-gradient(180deg,${clear} 0%,${d} 100%)`;
    if(state.mode==='bottom')return`linear-gradient(180deg,${d} 0%,${clear} 100%)`;
    return`linear-gradient(90deg,${clear} 0%,${d} 100%)`;
  }

  function ensureStyle(doc){
    if(doc.getElementById('surwave-gradient-runtime-style'))return;
    const style=doc.createElement('style');style.id='surwave-gradient-runtime-style';style.textContent=`
      .sw-copy-card.sw-runtime-border-host,.sw-link-gradient .link-group.sw-runtime-border-host{position:relative!important;isolation:isolate!important;overflow:hidden!important;border:0!important;background:transparent!important}
      .sw-copy-card.sw-runtime-border-host::before,.sw-copy-card.sw-runtime-border-host::after,.sw-link-gradient .link-group.sw-runtime-border-host::before,.sw-link-gradient .link-group.sw-runtime-border-host::after{content:none!important;display:none!important;animation:none!important}
      .sw-runtime-border-layer,.sw-runtime-buffer-layer,.sw-runtime-inner-layer,.sw-runtime-shade-layer{position:absolute!important;display:block!important;margin:0!important;padding:0!important;border:0!important;border-radius:inherit!important;pointer-events:none!important}
      .sw-runtime-border-layer{z-index:0!important;inset:0!important;background-repeat:no-repeat!important;background-position:50% 50%;background-size:260% 260%;transform-origin:center center;will-change:transform,background-position,background-size,opacity,filter}
      .sw-runtime-buffer-layer{z-index:1!important;inset:3px!important;background:var(--bg,#060a0c)!important}
      .sw-runtime-inner-layer{z-index:2!important;inset:3px!important;background:#050809!important;transition:inset .12s ease,opacity .16s ease}
      .sw-runtime-shade-layer{z-index:3!important;inset:0!important;background:transparent;transition:background .16s ease}
      .sw-copy-card.sw-runtime-border-host>*:not(.sw-runtime-border-layer):not(.sw-runtime-buffer-layer):not(.sw-runtime-inner-layer):not(.sw-runtime-shade-layer),.sw-link-gradient .link-group.sw-runtime-border-host>*:not(.sw-runtime-border-layer):not(.sw-runtime-buffer-layer):not(.sw-runtime-inner-layer):not(.sw-runtime-shade-layer){position:relative!important;z-index:4!important}
      .sw-copy-card.sw-runtime-border-host{border-radius:16px!important}.sw-link-gradient .link-group.sw-runtime-border-host{border-radius:12px!important}
      .sw-runtime-text{background-size:260% 260%!important;background-position:50% 50%;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important;will-change:background-position,background-size,opacity,filter}
    `;(doc.head||doc.documentElement).appendChild(style);
  }

  function cancelAnimation(node,key){const a=node?.[key];if(a){try{a.cancel()}catch(_){}node[key]=null}}
  function syncedCurrentTime(duration){const d=Math.max(1,Number(duration)||1),now=Date.now()-GLOBAL_PHASE_ORIGIN;return((now%d)+d)%d}
  function startSyncedAnimation(node,key,frames,options){cancelAnimation(node,key);if(!node||typeof node.animate!=='function')return null;const duration=Math.max(1,Number(options?.duration)||1),animation=node.animate(frames,{...options,duration});try{animation.currentTime=syncedCurrentTime(duration)}catch(_){}node[key]=animation;return animation}

  function directionPoints(mode){
    if(mode==='right')return{start:'100% 50%',end:'0% 50%',origin:'right center'};
    if(mode==='top')return{start:'50% 0%',end:'50% 100%',origin:'center top'};
    if(mode==='bottom')return{start:'50% 100%',end:'50% 0%',origin:'center bottom'};
    if(mode==='center')return{start:'50% 50%',end:'50% 50%',origin:'center center'};
    return{start:'0% 50%',end:'100% 50%',origin:'left center'};
  }

  function animationFrames(kind,isText,state){
    const mode=state.mode,dir=directionPoints(mode),center=mode==='center';
    if(kind==='pulse'){
      if(isText)return{frames:[{opacity:.55,filter:'brightness(.82)'},{opacity:1,filter:'brightness(1.25)'},{opacity:.55,filter:'brightness(.82)'}],easing:'ease-in-out'};
      return{frames:[{opacity:.52,filter:'brightness(.82)',transform:center?'scaleX(.92)':'scale(1)'},{opacity:1,filter:'brightness(1.28)',transform:center?'scaleX(1.08)':'scale(1.025)'},{opacity:.52,filter:'brightness(.82)',transform:center?'scaleX(.92)':'scale(1)'}],easing:'ease-in-out'};
    }
    if(kind==='flow'||(kind==='orbit'&&isText)){
      if(center)return{frames:[{backgroundSize:'115% 260%',backgroundPosition:'50% 50%'},{backgroundSize:'330% 260%',backgroundPosition:'50% 50%'},{backgroundSize:'115% 260%',backgroundPosition:'50% 50%'}],easing:'ease-in-out'};
      return{frames:[{backgroundPosition:dir.start},{backgroundPosition:dir.end}],easing:'linear'};
    }
    if(kind==='shimmer'){
      if(center)return{frames:[{backgroundSize:'90% 260%',filter:'brightness(.76)'},{backgroundSize:'340% 260%',filter:'brightness(1.45)'},{backgroundSize:'90% 260%',filter:'brightness(.76)'}],easing:'ease-in-out'};
      return{frames:[{backgroundPosition:dir.start,filter:'brightness(.72)'},{backgroundPosition:dir.end,filter:'brightness(1.45)'}],easing:'ease-in-out'};
    }
    if(kind==='wave'){
      if(center)return{frames:[{backgroundSize:'120% 230%',opacity:.62},{backgroundSize:'300% 300%',opacity:1},{backgroundSize:'150% 260%',opacity:.74},{backgroundSize:'330% 280%',opacity:1},{backgroundSize:'120% 230%',opacity:.62}],easing:'ease-in-out'};
      return{frames:[{backgroundPosition:dir.start,opacity:.6},{backgroundPosition:'50% 50%',opacity:1},{backgroundPosition:dir.end,opacity:.7},{backgroundPosition:dir.start,opacity:.6}],easing:'ease-in-out'};
    }
    if(kind==='glow')return{frames:[{opacity:.52,filter:'brightness(.86)'},{opacity:1,filter:'brightness(1.32)'},{opacity:.52,filter:'brightness(.86)'}],easing:'ease-in-out'};
    if(kind==='orbit'&&!isText){
      const reverse=mode==='right'||mode==='bottom';
      if(center)return{frames:[{transform:'rotate(0deg) scale(1.35)'},{transform:'rotate(180deg) scale(1.7)'},{transform:'rotate(360deg) scale(1.35)'}],easing:'linear'};
      return{frames:[{transform:`rotate(${reverse?360:0}deg) scale(1.65)`},{transform:`rotate(${reverse?0:360}deg) scale(1.65)`}],easing:'linear'};
    }
    return null;
  }

  function animateNode(node,state,isText=false){
    cancelAnimation(node,'_swGradientAnimation');
    node.style.removeProperty('transform');node.style.removeProperty('filter');node.style.opacity='1';node.style.backgroundPosition='50% 50%';node.style.backgroundSize=state.animation==='shimmer'?'360% 360%':'260% 260%';
    const dir=directionPoints(state.mode);node.style.transformOrigin=dir.origin;
    if(!isText)node.style.setProperty('inset',state.animation==='orbit'?'-72%':'0','important');
    const def=animationFrames(state.animation,isText,state);if(!def)return;
    startSyncedAnimation(node,'_swGradientAnimation',def.frames,{duration:state.speed*1000,iterations:Infinity,easing:def.easing,fill:'both'});
  }

  function ensureLayers(target){
    target.classList.add('sw-runtime-border-host');
    let border=[...target.children].find(x=>x.classList?.contains('sw-runtime-border-layer'));
    let buffer=[...target.children].find(x=>x.classList?.contains('sw-runtime-buffer-layer'));
    let inner=[...target.children].find(x=>x.classList?.contains('sw-runtime-inner-layer'));
    let shade=[...target.children].find(x=>x.classList?.contains('sw-runtime-shade-layer'));
    if(!border){border=target.ownerDocument.createElement('span');border.className='sw-runtime-border-layer';target.prepend(border)}
    if(!buffer){buffer=target.ownerDocument.createElement('span');buffer.className='sw-runtime-buffer-layer';border.after(buffer)}
    if(!inner){inner=target.ownerDocument.createElement('span');inner.className='sw-runtime-inner-layer';buffer.after(inner)}
    if(!shade){shade=target.ownerDocument.createElement('span');shade.className='sw-runtime-shade-layer';inner.after(shade)}
    return{border,buffer,inner,shade};
  }

  function clearText(elements){for(const el of elements){cancelAnimation(el,'_swGradientAnimation');el.classList.remove('sw-runtime-text');['background-image','background-size','background-position','-webkit-text-fill-color','color','opacity','filter','transform'].forEach(p=>el.style.removeProperty(p))}}
  function applyText(elements,state,enabled){if(!enabled){clearText(elements);return}const bg=gradient(state);for(const el of elements){el.classList.add('sw-runtime-text');el.style.backgroundImage=bg;animateNode(el,state,true)}}

  function controller(target,config,textElements,type,preview){
    if(target.dataset.swGradientRuntime==='1')return;
    target.dataset.swGradientRuntime='1';
    const needsLayers=type==='servercards'||config.borderGradient;
    const layers=needsLayers?ensureLayers(target):null;
    let copiedUntil=0,copiedTimer=null;

    function apply(name){
      const borderState=config.gradientStates.border[name]||config.gradientStates.border.normal;
      const textState=config.gradientStates.text[name]||config.gradientStates.text.normal;

      if(layers){
        const inset=type==='servercards'?(config.borderGradient?'3px':'0'):'1px';
        layers.border.hidden=!config.borderGradient;
        if(config.borderGradient){layers.border.style.backgroundImage=gradient(borderState);animateNode(layers.border,borderState,false)}else cancelAnimation(layers.border,'_swGradientAnimation');

        if(type==='servercards'){
          layers.buffer.hidden=false;layers.buffer.style.setProperty('inset',inset,'important');layers.buffer.style.setProperty('background','var(--bg,#060a0c)','important');
          layers.inner.hidden=false;layers.inner.style.setProperty('inset',inset,'important');layers.inner.style.setProperty('background','#050809','important');layers.inner.style.opacity=String(config.backgroundOpacity/100);
          layers.shade.hidden=false;layers.shade.style.backgroundImage=shadeGradient(borderState);
        }else{
          layers.buffer.hidden=true;
          layers.inner.hidden=false;layers.inner.style.setProperty('inset',inset,'important');layers.inner.style.setProperty('background','#091013','important');layers.inner.style.opacity='1';
          layers.shade.hidden=true;
        }
      }

      cancelAnimation(target,'_swGlowAnimation');
      if(config.borderGradient&&borderState.animation==='glow')startSyncedAnimation(target,'_swGlowAnimation',[{boxShadow:'0 8px 22px rgba(0,0,0,.25),0 0 0 rgba(0,255,120,0)'},{boxShadow:'0 10px 28px rgba(0,0,0,.30),0 0 24px rgba(0,255,192,.28)'},{boxShadow:'0 8px 22px rgba(0,0,0,.25),0 0 0 rgba(0,255,120,0)'}],{duration:borderState.speed*1000,iterations:Infinity,easing:'ease-in-out',fill:'both'});
      applyText(textElements,textState,config.textGradient);
      target.dataset.swGradientState=name;
    }

    function copied(){
      copiedUntil=Date.now()+5000;target.classList.add('is-copied');const label=target.querySelector('[data-copy-state]');if(label)label.textContent='Скопировано';apply('copied');clearTimeout(copiedTimer);
      copiedTimer=setTimeout(()=>{copiedUntil=0;target.classList.remove('is-copied');if(label)label.textContent='Нажмите чтобы скопировать';apply(target.matches(':hover')?'hover':'normal')},5000);
    }

    target.addEventListener('pointerenter',()=>apply(Date.now()<copiedUntil?'copied':'hover'));
    target.addEventListener('pointerleave',()=>apply(Date.now()<copiedUntil?'copied':'normal'));
    target.addEventListener('pointerdown',()=>apply('active'));
    target.addEventListener('pointerup',()=>apply(Date.now()<copiedUntil?'copied':(target.matches(':hover')?'hover':'normal')));
    target.addEventListener('pointercancel',()=>apply(Date.now()<copiedUntil?'copied':'normal'));
    if(type==='servercards')target.addEventListener('click',()=>{copied();if(preview){const value=target.dataset.copy||'';if(value&&navigator.clipboard?.writeText)navigator.clipboard.writeText(value).catch(()=>{})}});
    apply('normal');
  }

  function initServerCards(root,preview){const config=normalizeConfig(decode(root.getAttribute('data-sw-copy-config'))||{},'servercards');root.querySelectorAll(':scope > .sw-copy-card').forEach(card=>controller(card,config,[...card.querySelectorAll('.sw-copy-title,.sw-copy-ip,.sw-copy-state')],'servercards',preview))}
  function initLinkGroup(root,preview){const config=normalizeConfig(decode(root.getAttribute('data-sw-link-gradient'))||{},'linkgroup'),group=root.querySelector(':scope > .link-group')||root.querySelector('.link-group');if(group)controller(group,config,[...group.querySelectorAll('.link-copy strong,.link-copy small')],'linkgroup',preview)}
  function init(doc=document,options={}){if(!doc)return;ensureStyle(doc);const preview=!!options.preview;doc.querySelectorAll('.sw-copy-pair[data-sw-copy-config]').forEach(root=>initServerCards(root,preview));doc.querySelectorAll('.sw-link-gradient[data-sw-link-gradient]').forEach(root=>initLinkGroup(root,preview))}
  window.SurwaveGradientRuntime={init,normalizeConfig,gradient,shadeGradient,syncedCurrentTime};
})();