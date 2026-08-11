(() => {
  const frame=document.getElementById('preview');if(!frame)return;
  const descriptor=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
  if(!descriptor?.set||!descriptor?.get)return;
  let ready=false,patching=false;
  frame.addEventListener('load',()=>{if(!patching)ready=true},true);
  Object.defineProperty(frame,'srcdoc',{
    configurable:true,
    enumerable:true,
    get(){return descriptor.get.call(frame)},
    set(value){
      const doc=frame.contentDocument,article=doc?.querySelector('.article');
      if(!ready||!doc||!article){descriptor.set.call(frame,value);return}
      try{
        const next=new DOMParser().parseFromString(String(value||''),'text/html');
        const nextArticle=next.querySelector('.article');if(!nextArticle){descriptor.set.call(frame,value);return}
        const scroller=doc.scrollingElement||doc.documentElement,top=scroller?.scrollTop||0,left=scroller?.scrollLeft||0;
        const nextStyle=next.querySelector('style'),style=doc.querySelector('style');if(nextStyle&&style)style.textContent=nextStyle.textContent;
        article.innerHTML=nextArticle.innerHTML;
        patching=true;
        requestAnimationFrame(()=>{
          if(scroller){scroller.scrollTop=Math.min(top,Math.max(0,scroller.scrollHeight-scroller.clientHeight));scroller.scrollLeft=left}
          frame.dispatchEvent(new Event('load'));
          frame.dispatchEvent(new CustomEvent('surwave-preview-updated'));
          patching=false;
        });
      }catch(_){descriptor.set.call(frame,value)}
    }
  });
})();