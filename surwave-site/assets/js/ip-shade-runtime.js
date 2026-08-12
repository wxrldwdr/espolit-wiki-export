(() => {
  const observed=new WeakSet();
  const timers=new WeakMap();

  function decode(raw){try{return JSON.parse(decodeURIComponent(raw||''))}catch(_){return null}}
  function clamp(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
  function shadeGradient(state){
    const shade=clamp(state?.shade,0,100,0);
    if(!shade)return'none';
    const dark=`color-mix(in srgb,var(--bg,#060a0c) ${shade}%,transparent)`;
    const clear='transparent';
    const mode=state?.mode||'center';
    if(mode==='center')return`linear-gradient(90deg,${dark} 0%,${clear} 50%,${dark} 100%)`;
    if(mode==='right')return`linear-gradient(90deg,${dark} 0%,${clear} 100%)`;
    if(mode==='top')return`linear-gradient(180deg,${clear} 0%,${dark} 100%)`;
    if(mode==='bottom')return`linear-gradient(180deg,${dark} 0%,${clear} 100%)`;
    return`linear-gradient(90deg,${clear} 0%,${dark} 100%)`;
  }

  function updateRoot(root){
    const config=decode(root.getAttribute('data-sw-copy-config'))||{};
    if(config.borderGradient===false)return;
    const states=config.gradientStates?.border||{};
    root.querySelectorAll(':scope > .sw-copy-card').forEach(card=>{
      const stateName=card.dataset.swGradientState||'normal';
      const state=states[stateName]||states.normal||{};
      const shade=[...card.children].find(node=>node.classList?.contains('sw-runtime-shade-layer'));
      if(shade)shade.style.setProperty('background-image',shadeGradient(state),'important');
    });
  }

  function updateAll(doc){doc.querySelectorAll?.('.sw-copy-pair[data-sw-copy-config]').forEach(updateRoot)}
  function queue(doc){
    if(timers.get(doc))return;
    const id=requestAnimationFrame(()=>{timers.delete(doc);updateAll(doc)});timers.set(doc,id);
  }
  function observe(doc){
    if(!doc||observed.has(doc))return;observed.add(doc);updateAll(doc);
    const observer=new MutationObserver(()=>queue(doc));
    observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-sw-gradient-state','data-sw-copy-config']});
  }

  function bindPreview(){
    const frame=document.getElementById('preview');if(!frame)return;
    const bind=()=>{try{observe(frame.contentDocument)}catch(_){}};
    frame.addEventListener('load',()=>requestAnimationFrame(bind));
    frame.addEventListener('surwave-preview-updated',()=>requestAnimationFrame(bind));
    [100,300,800].forEach(ms=>setTimeout(bind,ms));
  }

  observe(document);bindPreview();
})();
