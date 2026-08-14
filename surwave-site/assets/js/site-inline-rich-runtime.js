(() => {
  const ARROW='[[SW_ARROW]]';
  const TOKEN_RE=/\[\[SW_ARROW\]\]|\[\[SW_IMG:([^\]]+)\]\]|\[\[SW_LIST:([^\]]+)\]\]/g;
  const ARROW_SRC='/surwave-site/assets/icons/inline-arrow.svg';
  let scheduled=0;

  function mediaUrl(source){
    source=String(source||'').trim();
    if(!source)return'';
    if(/^https?:|^data:|^\//i.test(source))return source;
    if(source.includes('.gitbook/assets/'))return'/.gitbook/assets/'+encodeURIComponent(source.split('.gitbook/assets/').pop().split('/').pop());
    return'/'+source.replace(/^\.\//,'');
  }
  function safeHtml(value){
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
  function makeArrow(){
    const img=document.createElement('img');
    img.className='sw-inline-arrow-image';img.dataset.swInlineArrow='1';img.src=ARROW_SRC;img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');
    return img;
  }
  function makeImage(source){
    const img=document.createElement('img');
    img.className='sw-inline-pasted-image';img.dataset.swInlineImage='1';img.dataset.swSource=source;img.src=mediaUrl(source);img.alt='';img.draggable=false;
    return img;
  }
  function makeList(payload){
    try{
      const items=JSON.parse(decodeURIComponent(payload));
      if(!Array.isArray(items)||!items.length)return null;
      const list=document.createElement('span');list.className='sw-inline-list';list.dataset.swInlineList='1';
      items.forEach(value=>{
        const item=document.createElement('span');item.className='sw-inline-list-item';item.dataset.swInlineListItem='1';item.innerHTML=safeHtml(value);list.appendChild(item);
      });
      return list;
    }catch(_){return null}
  }
  function tokenNode(full,imagePayload,listPayload){
    if(full===ARROW)return makeArrow();
    if(imagePayload!=null){try{return makeImage(decodeURIComponent(imagePayload))}catch(_){return document.createTextNode(full)}}
    if(listPayload!=null)return makeList(listPayload)||document.createTextNode(full);
    return document.createTextNode(full);
  }
  function shouldSkip(node){
    const parent=node.parentElement;
    return !!parent?.closest('script,style,textarea,pre,code');
  }
  function processTextNode(node){
    const text=node.nodeValue||'';if(!text.includes('[[SW_')||shouldSkip(node))return false;
    TOKEN_RE.lastIndex=0;let match,last=0,changed=false;const fragment=document.createDocumentFragment();
    while((match=TOKEN_RE.exec(text))){
      changed=true;if(match.index>last)fragment.appendChild(document.createTextNode(text.slice(last,match.index)));
      fragment.appendChild(tokenNode(match[0],match[1],match[2]));last=match.index+match[0].length;
    }
    if(!changed)return false;if(last<text.length)fragment.appendChild(document.createTextNode(text.slice(last)));
    node.replaceWith(fragment);return true;
  }
  function normalizeExisting(root){
    root.querySelectorAll?.('span.sw-inline-arrow[data-sw-inline-arrow="1"]').forEach(span=>span.replaceWith(makeArrow()));
    root.querySelectorAll?.('img.sw-inline-pasted-image[data-sw-source]').forEach(img=>{img.src=mediaUrl(img.dataset.swSource||img.getAttribute('src')||'')});
  }
  function apply(){
    scheduled=0;const article=document.querySelector('.article');if(!article)return;
    normalizeExisting(article);
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(processTextNode);
    normalizeExisting(article);
  }
  function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(apply)}

  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,80,180,400,800,1400].forEach(delay=>setTimeout(schedule,delay));
  window.SurwaveInlineRichRuntime={apply:schedule,mediaUrl};
})();
