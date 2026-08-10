(() => {
  const frame=document.getElementById('preview');
  if(!frame)return;

  function init(){
    const runtime=window.SurwaveGradientRuntime;
    const doc=frame.contentDocument;
    if(!runtime||!doc)return;
    requestAnimationFrame(()=>runtime.init(doc,{preview:true}));
  }

  frame.addEventListener('load',init);
  setTimeout(init,250);
})();