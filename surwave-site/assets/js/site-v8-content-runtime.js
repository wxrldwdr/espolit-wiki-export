(() => {
  let frame=0;

  function mediaUrl(src){
    src=String(src||'').trim();if(!src)return'';
    if(/^https?:|^data:|^blob:|^\//i.test(src))return src;
    if(src.includes('.gitbook/assets/'))return'/.gitbook/assets/'+encodeURIComponent(src.split('.gitbook/assets/').pop().split('/').pop());
    return'/'+src.replace(/^\.\//,'');
  }
  function recoverEscapedVideo(root=document){
    root.querySelectorAll?.('.article p,.article div,.article pre').forEach(node=>{
      if(node.querySelector?.('video,code'))return;
      const raw=(node.textContent||'').trim();
      if(!/^<figure[^>]*>\s*<video\b/i.test(raw)||!/(?:data-sw-media=["']video["']|class=["'][^"']*sw-video-media)/i.test(raw))return;
      const tpl=document.createElement('template');tpl.innerHTML=raw;
      const figure=tpl.content.querySelector('figure'),video=figure?.querySelector('video');if(!figure||!video)return;
      node.replaceWith(figure);
    });
  }
  function hydrateGif(img){
    if(img.dataset.swMediaHydrated==='1')return;
    img.dataset.swMediaHydrated='1';
    const raw=img.getAttribute('src')||'';const next=mediaUrl(raw);if(next&&next!==raw)img.setAttribute('src',next);
    img.closest('figure')?.classList.add('sw-gif-block');
  }
  function hydrateVideo(video){
    const figure=video.closest('figure');if(figure)figure.classList.add('sw-video-block');
    const raw=video.getAttribute('src')||'';const next=mediaUrl(raw);if(next&&next!==raw)video.setAttribute('src',next);
    const poster=video.getAttribute('poster')||'';const nextPoster=mediaUrl(poster);if(nextPoster&&nextPoster!==poster)video.setAttribute('poster',nextPoster);
    video.setAttribute('playsinline','');
    if(!video.hasAttribute('preload'))video.setAttribute('preload','metadata');
    if(video.dataset.swMediaHydrated==='1')return;
    video.dataset.swMediaHydrated='1';
    video.addEventListener('loadeddata',()=>figure?.classList.remove('is-media-error'));
    video.addEventListener('canplay',()=>figure?.classList.remove('is-media-error'));
    video.addEventListener('error',()=>figure?.classList.add('is-media-error'));
    try{video.load()}catch(_){}
  }
  function apply(){
    frame=0;recoverEscapedVideo(document);
    document.querySelectorAll('img.sw-gif-media,img[data-sw-media="gif"]').forEach(hydrateGif);
    document.querySelectorAll('video.sw-video-media,video[data-sw-media="video"]').forEach(hydrateVideo);
  }
  function schedule(){if(frame)return;frame=requestAnimationFrame(apply)}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,80,200,500,1000,1800].forEach(ms=>setTimeout(schedule,ms));
  window.SurwaveContentRuntimeV8={apply,mediaUrl};
})();
