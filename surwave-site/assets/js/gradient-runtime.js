(() => {
  const STATES = ['normal','hover','active','copied'];
  const DEFAULT_EDGE = '#00ff78';
  const DEFAULT_CENTER = '#00ffc0';

  const clamp = (value,min,max,fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
  };

  function hexRgb(value,fallback=DEFAULT_EDGE){
    let v=String(value||'').trim();
    if(!/^#[0-9a-f]{3,6}$/i.test(v))v=fallback;
    if(v.length===4)v='#'+[...v.slice(1)].map(x=>x+x).join('');
    const n=parseInt(v.slice(1),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }

  function rgba(color,alpha){
    const [r,g,b]=hexRgb(color);
    return `rgba(${r},${g},${b},${clamp(alpha,0,100,100)/100})`;
  }

  function defaultState(layer,name){
    const alpha=layer==='text'?[100,100]:({
      normal:[12,84],hover:[28,94],active:[38,97],copied:[42,98]
    }[name]||[20,90]);
    return {mode:'center',color1:DEFAULT_EDGE,alpha1:alpha[0],useSecond:true,color2:DEFAULT_CENTER,alpha2:alpha[1],animation:'none',speed:2.4};
  }

  function normalizeState(value,layer,name){
    const d=defaultState(layer,name),v=value&&typeof value==='object'?value:{};
    const modes=new Set(['center','left','right','top','bottom']);
    const anims=new Set(['none','pulse','flow','orbit','shimmer','wave','glow']);
    return {
      mode:modes.has(v.mode)?v.mode:d.mode,
      color1:String(v.color1||d.color1),
      alpha1:clamp(v.alpha1,0,100,d.alpha1),
      useSecond:v.useSecond!==false,
      color2:String(v.color2||d.color2),
      alpha2:clamp(v.alpha2,0,100,d.alpha2),
      animation:anims.has(v.animation)?v.animation:d.animation,
      speed:clamp(v.speed,0.2,60,d.speed)
    };
  }

  function normalizeConfig(config,type){
    const c=config&&typeof config==='object'?config:{};
    const states=c.gradientStates&&typeof c.gradientStates==='object'?c.gradientStates:{};
    const legacyBorder1=c.borderEdge||DEFAULT_EDGE,legacyBorder2=c.borderCenter||DEFAULT_CENTER;
    const legacyText1=c.textEdge||DEFAULT_EDGE,legacyText2=c.textCenter||DEFAULT_CENTER;
    const out={
      borderGradient:c.borderGradient!=null?!!c.borderGradient:type==='servercards',
      textGradient:c.textGradient!=null?!!c.textGradient:type==='servercards',
      gradientStates:{border:{},text:{}}
    };
    for(const layer of ['border','text']){
      for(const name of STATES){
        const raw=states[layer]?.[name];
        const s=normalizeState(raw,layer,name);
        if(!raw){
          s.color1=layer==='border'?legacyBorder1:legacyText1;
          s.color2=layer==='border'?legacyBorder2:legacyText2;
        }
        out.gradientStates[layer][name]=s;
      }
    }
    return out;
  }

  function decode(raw){
    try{return JSON.parse(decodeURIComponent(raw||''));}catch(_){return null;}
  }

  function gradient(state){
    const s=state;
    const c1=rgba(s.color1,s.alpha1);
    const c2=rgba(s.useSecond?s.color2:s.color1,s.alpha2);
    if(s.mode==='center')return `linear-gradient(90deg,${c1} 0%,${c2} 50%,${c1} 100%)`;
    if(s.mode==='right')return `linear-gradient(270deg,${c1} 0%,${c2} 100%)`;
    if(s.mode==='top')return `linear-gradient(180deg,${c1} 0%,${c2} 100%)`;
    if(s.mode==='bottom')return `linear-gradient(0deg,${c1} 0%,${c2} 100%)`;
    return `linear-gradient(90deg,${c1} 0%,${c2} 100%)`;
  }

  function ensureStyle(doc){
    if(doc.getElementById('surwave-gradient-runtime-style'))return;
    const style=doc.createElement('style');
    style.id='surwave-gradient-runtime-style';
    style.textContent=`
      .sw-runtime-border-host{position:relative!important;isolation:isolate!important;overflow:hidden!important;border:0!important;background:transparent!important}
      .sw-runtime-border-layer,.sw-runtime-inner-layer{position:absolute;pointer-events:none;display:block}
      .sw-runtime-border-layer{z-index:0;inset:0;border-radius:inherit;background-repeat:no-repeat;background-position:50% 50%;background-size:260% 260%;will-change:transform,background-position,opacity,filter}
      .sw-runtime-inner-layer{z-index:1;inset:3px;border-radius:calc(1em - 3px);background:#050809;transition:background-color .18s ease}
      .sw-runtime-border-host>.sw-runtime-content,.sw-runtime-border-host>*:not(.sw-runtime-border-layer):not(.sw-runtime-inner-layer){position:relative;z-index:2}
      .sw-copy-card.sw-runtime-border-host{border-radius:16px!important}
      .sw-link-gradient .link-group.sw-runtime-border-host{border-radius:12px!important}
      .sw-runtime-text{background-size:260% 260%!important;background-position:50% 50%;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important;will-change:background-position,opacity,filter}
    `;
    (doc.head||doc.documentElement).appendChild(style);
  }

  function cancelAnimation(node,key){
    const animation=node?.[key];
    if(animation){try{animation.cancel();}catch(_){} node[key]=null;}
  }

  function animationFrames(kind,isText=false){
    if(kind==='pulse')return {frames:[{opacity:.5,filter:'brightness(.82)'},{opacity:1,filter:'brightness(1.25)'},{opacity:.5,filter:'brightness(.82)'}],easing:'ease-in-out'};
    if(kind==='flow'||(kind==='orbit'&&isText))return {frames:[{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%'},{backgroundPosition:'0% 50%'}],easing:'linear'};
    if(kind==='shimmer')return {frames:[{backgroundPosition:'180% 50%',filter:'brightness(.75)'},{backgroundPosition:'45% 50%',filter:'brightness(1.4)'},{backgroundPosition:'-80% 50%',filter:'brightness(.75)'}],easing:'ease-in-out'};
    if(kind==='wave')return {frames:[{backgroundPosition:'0% 20%',opacity:.62},{backgroundPosition:'70% 0%',opacity:1},{backgroundPosition:'100% 80%',opacity:.72},{backgroundPosition:'30% 100%',opacity:1},{backgroundPosition:'0% 20%',opacity:.62}],easing:'ease-in-out'};
    if(kind==='glow')return {frames:[{opacity:.52,filter:'brightness(.86)'},{opacity:1,filter:'brightness(1.3)'},{opacity:.52,filter:'brightness(.86)'}],easing:'ease-in-out'};
    if(kind==='orbit'&&!isText)return {frames:[{transform:'rotate(0deg) scale(1.55)'},{transform:'rotate(360deg) scale(1.55)'}],easing:'linear'};
    return null;
  }

  function animateNode(node,state,isText=false){
    cancelAnimation(node,'_swGradientAnimation');
    node.style.removeProperty('transform');
    node.style.removeProperty('filter');
    node.style.opacity='1';
    node.style.backgroundPosition='50% 50%';
    node.style.backgroundSize=(state.animation==='shimmer'?'360% 360%':'260% 260%');
    if(!isText)node.style.inset=state.animation==='orbit'?'-72%':'0';
    const def=animationFrames(state.animation,isText);
    if(!def||typeof node.animate!=='function')return;
    node._swGradientAnimation=node.animate(def.frames,{duration:state.speed*1000,iterations:Infinity,easing:def.easing,fill:'both'});
  }

  function innerColor(name){
    if(name==='hover')return '#07100d';
    if(name==='active'||name==='copied')return '#08130f';
    return '#050809';
  }

  function ensureBorderLayers(target){
    target.classList.add('sw-runtime-border-host');
    let border=[...target.children].find(x=>x.classList?.contains('sw-runtime-border-layer'));
    let inner=[...target.children].find(x=>x.classList?.contains('sw-runtime-inner-layer'));
    if(!border){border=target.ownerDocument.createElement('span');border.className='sw-runtime-border-layer';target.prepend(border);}
    if(!inner){inner=target.ownerDocument.createElement('span');inner.className='sw-runtime-inner-layer';border.after(inner);}
    return {border,inner};
  }

  function clearText(elements){
    for(const el of elements){
      cancelAnimation(el,'_swGradientAnimation');
      el.classList.remove('sw-runtime-text');
      el.style.removeProperty('background-image');
      el.style.removeProperty('background-size');
      el.style.removeProperty('background-position');
      el.style.removeProperty('-webkit-text-fill-color');
      el.style.removeProperty('color');
      el.style.removeProperty('opacity');
      el.style.removeProperty('filter');
    }
  }

  function applyText(elements,state,enabled){
    if(!enabled){clearText(elements);return;}
    const bg=gradient(state);
    for(const el of elements){
      el.classList.add('sw-runtime-text');
      el.style.backgroundImage=bg;
      animateNode(el,state,true);
    }
  }

  function controller(target,config,textElements,type,preview){
    if(target.dataset.swGradientRuntime==='1')return;
    target.dataset.swGradientRuntime='1';
    const layers=ensureBorderLayers(target);
    let current='normal',copiedUntil=0,copiedTimer=null;

    function apply(name){
      current=name;
      const borderState=config.gradientStates.border[name]||config.gradientStates.border.normal;
      const textState=config.gradientStates.text[name]||config.gradientStates.text.normal;
      layers.border.hidden=!config.borderGradient;
      layers.inner.hidden=!config.borderGradient;
      if(config.borderGradient){
        layers.border.style.backgroundImage=gradient(borderState);
        layers.inner.style.backgroundColor=innerColor(name);
        animateNode(layers.border,borderState,false);
        cancelAnimation(target,'_swGlowAnimation');
        if(borderState.animation==='glow'&&typeof target.animate==='function'){
          target._swGlowAnimation=target.animate([
            {boxShadow:'0 8px 22px rgba(0,0,0,.25),0 0 0 rgba(0,255,120,0)'},
            {boxShadow:'0 10px 28px rgba(0,0,0,.30),0 0 24px rgba(0,255,192,.24)'},
            {boxShadow:'0 8px 22px rgba(0,0,0,.25),0 0 0 rgba(0,255,120,0)'}
          ],{duration:borderState.speed*1000,iterations:Infinity,easing:'ease-in-out'});
        }
      }else{
        cancelAnimation(layers.border,'_swGradientAnimation');
        cancelAnimation(target,'_swGlowAnimation');
      }
      applyText(textElements,textState,config.textGradient);
    }

    function copied(){
      copiedUntil=Date.now()+5000;
      target.classList.add('is-copied');
      const state=target.querySelector('[data-copy-state]');
      if(state)state.textContent='Скопировано';
      apply('copied');
      clearTimeout(copiedTimer);
      copiedTimer=setTimeout(()=>{
        copiedUntil=0;
        target.classList.remove('is-copied');
        if(state)state.textContent='Нажмите чтобы скопировать';
        apply(target.matches(':hover')?'hover':'normal');
      },5000);
    }

    target.addEventListener('mouseenter',()=>apply(Date.now()<copiedUntil?'copied':'hover'));
    target.addEventListener('mouseleave',()=>apply(Date.now()<copiedUntil?'copied':'normal'));
    target.addEventListener('pointerdown',()=>apply('active'));
    target.addEventListener('pointerup',()=>apply(Date.now()<copiedUntil?'copied':(target.matches(':hover')?'hover':'normal')));
    target.addEventListener('pointercancel',()=>apply(Date.now()<copiedUntil?'copied':'normal'));
    if(type==='servercards'){
      target.addEventListener('click',()=>{
        copied();
        if(preview){
          const value=target.dataset.copy||'';
          if(value&&navigator.clipboard?.writeText){navigator.clipboard.writeText(value).catch(()=>{});}
        }
      });
    }
    apply('normal');
  }

  function initServerCards(root,preview){
    const raw=decode(root.getAttribute('data-sw-copy-config'))||{};
    const config=normalizeConfig(raw,'servercards');
    root.querySelectorAll(':scope > .sw-copy-card').forEach(card=>{
      const text=[...card.querySelectorAll('.sw-copy-title,.sw-copy-ip,.sw-copy-state')];
      controller(card,config,text,'servercards',preview);
    });
  }

  function initLinkGroup(root,preview){
    const raw=decode(root.getAttribute('data-sw-link-gradient'))||{};
    const config=normalizeConfig(raw,'linkgroup');
    const group=root.querySelector(':scope > .link-group')||root.querySelector('.link-group');
    if(!group)return;
    const text=[...group.querySelectorAll('.link-copy strong,.link-copy small')];
    controller(group,config,text,'linkgroup',preview);
  }

  function init(doc=document,options={}){
    if(!doc)return;
    ensureStyle(doc);
    const preview=!!options.preview;
    doc.querySelectorAll('.sw-copy-pair[data-sw-copy-config]').forEach(root=>initServerCards(root,preview));
    doc.querySelectorAll('.sw-link-gradient[data-sw-link-gradient]').forEach(root=>initLinkGroup(root,preview));
  }

  window.SurwaveGradientRuntime={init,normalizeConfig,gradient};
})();