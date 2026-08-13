(() => {
  let scheduled=0;
  function assetUrl(value){
    const src=String(value||'').trim();if(!src)return'';
    if(/^https?:|^data:|^blob:|^\//i.test(src))return src;
    if(src.includes('.gitbook/assets/')){
      let name=src.split('.gitbook/assets/').pop().split('/').pop();
      try{name=decodeURIComponent(name)}catch(_){}
      return '/.gitbook/assets/'+encodeURIComponent(name);
    }
    return '/'+src.replace(/^\.\//,'');
  }
  function recoverEscapedVideo(){
    document.querySelectorAll('.article p,.article div,.article pre').forEach(node=>{
      if(node.querySelector?.('video,code'))return;
      const raw=(node.textContent||'').trim();
      if(!/^<figure[^>]*>\s*<video\b/i.test(raw)||!/(?:data-sw-media=["']video["']|class=["'][^"']*sw-video-media)/i.test(raw))return;
      const tpl=document.createElement('template');tpl.innerHTML=raw;
      const figure=tpl.content.querySelector('figure'),video=figure?.querySelector('video');
      if(figure&&video)node.replaceWith(figure);
    });
  }
  function hydrateVideo(video){
    video.classList.add('sw-video-media');video.dataset.swMedia='video';
    const figure=video.closest('figure');if(figure)figure.classList.add('sw-video-block');
    const src=video.getAttribute('src');if(src){const next=assetUrl(src);if(next&&next!==src)video.setAttribute('src',next)}
    const poster=video.getAttribute('poster');if(poster){const next=assetUrl(poster);if(next&&next!==poster)video.setAttribute('poster',next)}
    if(!video.hasAttribute('preload'))video.setAttribute('preload','metadata');
    video.setAttribute('playsinline','');
    if(video.dataset.swMediaHydrated==='1')return;
    video.dataset.swMediaHydrated='1';
    video.addEventListener('loadeddata',()=>figure?.classList.remove('is-media-error'));
    video.addEventListener('canplay',()=>figure?.classList.remove('is-media-error'));
    video.addEventListener('error',()=>figure?.classList.add('is-media-error'));
    try{video.load()}catch(_){}
  }
  function hydrateGif(img){
    img.classList.add('sw-gif-media');img.dataset.swMedia='gif';
    const figure=img.closest('figure');if(figure)figure.classList.add('sw-gif-block');
    const src=img.getAttribute('src');if(src){const next=assetUrl(src);if(next&&next!==src)img.setAttribute('src',next)}
  }
  function apply(){
    scheduled=0;recoverEscapedVideo();
    document.querySelectorAll('video[data-sw-media="video"],video.sw-video-media').forEach(hydrateVideo);
    document.querySelectorAll('img[data-sw-media="gif"],img.sw-gif-media').forEach(hydrateGif);
  }
  function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(apply)}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,80,220,600,1200,2000].forEach(delay=>setTimeout(schedule,delay));
  window.SurwaveSiteMediaRuntime={apply,assetUrl};
})();
