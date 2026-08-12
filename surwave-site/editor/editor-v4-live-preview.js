(() => {
  const frame=document.getElementById('preview');if(!frame)return;
  const descriptor=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
  if(!descriptor?.set||!descriptor?.get)return;
  let ready=false,patching=false,pendingHashes=null;

  function hash(value){
    const s=String(value||'');let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return(h>>>0).toString(36);
  }
  function hashesFromArticle(article){
    const map=new Map();
    if(!article)return map;
    [...article.children].forEach(node=>{const path=node.getAttribute('data-editor-path');if(path)map.set(path,hash(node.outerHTML))});
    return map;
  }
  function rememberInitial(value){
    try{const parsed=new DOMParser().parseFromString(String(value||''),'text/html');pendingHashes=hashesFromArticle(parsed.querySelector('.article'))}catch(_){pendingHashes=null}
  }
  function applyInitialHashes(){
    if(!pendingHashes)return;
    const article=frame.contentDocument?.querySelector('.article');if(!article)return;
    [...article.children].forEach(node=>{const path=node.getAttribute('data-editor-path'),h=path&&pendingHashes.get(path);if(h)node.dataset.swPreviewHash=h});
    pendingHashes=null;
  }

  frame.addEventListener('load',()=>{
    if(patching)return;
    ready=true;
    requestAnimationFrame(applyInitialHashes);
  },true);

  Object.defineProperty(frame,'srcdoc',{
    configurable:true,
    enumerable:true,
    get(){return descriptor.get.call(frame)},
    set(value){
      const doc=frame.contentDocument,article=doc?.querySelector('.article');
      if(!ready||!doc||!article){rememberInitial(value);descriptor.set.call(frame,value);return}
      try{
        const next=new DOMParser().parseFromString(String(value||''),'text/html');
        const nextArticle=next.querySelector('.article');if(!nextArticle){rememberInitial(value);descriptor.set.call(frame,value);return}
        const scroller=doc.scrollingElement||doc.documentElement,top=scroller?.scrollTop||0,left=scroller?.scrollLeft||0;
        const nextStyle=next.querySelector('style'),style=doc.querySelector('style');if(nextStyle&&style&&style.textContent!==nextStyle.textContent)style.textContent=nextStyle.textContent;

        const existing=new Map();
        [...article.children].forEach(node=>{const path=node.getAttribute('data-editor-path');if(path)existing.set(path,node)});
        const keep=new Set();
        const wanted=[...nextArticle.children];

        wanted.forEach((nextNode,index)=>{
          const path=nextNode.getAttribute('data-editor-path');
          const nextHash=hash(nextNode.outerHTML);
          const old=path?existing.get(path):null;
          const reference=article.children[index]||null;
          let desired;

          if(old&&old.dataset.swPreviewHash===nextHash){
            desired=old;
            if(desired!==reference)article.insertBefore(desired,reference);
          }else{
            desired=doc.importNode(nextNode,true);
            if(path)desired.dataset.swPreviewHash=nextHash;
            if(old&&old===reference)old.replaceWith(desired);
            else{
              article.insertBefore(desired,reference);
              if(old&&old.isConnected)old.remove();
            }
          }
          keep.add(desired);
        });

        [...article.children].forEach(node=>{if(!keep.has(node))node.remove()});

        patching=true;
        requestAnimationFrame(()=>{
          if(scroller){scroller.scrollTop=Math.min(top,Math.max(0,scroller.scrollHeight-scroller.clientHeight));scroller.scrollLeft=left}
          frame.dispatchEvent(new Event('load'));
          frame.dispatchEvent(new CustomEvent('surwave-preview-updated'));
          patching=false;
        });
      }catch(_){rememberInitial(value);descriptor.set.call(frame,value)}
    }
  });
})();