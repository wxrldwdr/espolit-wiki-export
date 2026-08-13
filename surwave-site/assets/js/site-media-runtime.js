(() => {
  let scheduled=0;
  function assetUrl(value){
    const src=String(value||'').trim();if(!src)return'';
    if(/^https?:|^data:|^blob:/i.test(src))return src;
    if(src.includes('.gitbook/assets/')){
      let name=src.split('.gitbook/assets/').pop().split('/').pop();
      try{name=decodeURIComponent(name)}catch(_){}
      return '/.gitbook/assets/'+encodeURIComponent(name);
    }
    return src;
  }
  function apply(){
    scheduled=0;
    document.querySelectorAll('video[data-sw-media="video"],video.sw-video-media').forEach(video=>{
      video.classList.add('sw-video-media');video.dataset.swMedia='video';
      const figure=video.closest('figure');if(figure)figure.classList.add('sw-video-block');
      const src=video.getAttribute('src');if(src){const next=assetUrl(src);if(next&&next!==src)video.setAttribute('src',next)}
      const poster=video.getAttribute('poster');if(poster){const next=assetUrl(poster);if(next&&next!==poster)video.setAttribute('poster',next)}
      if(!video.hasAttribute('preload'))video.setAttribute('preload','metadata');
      video.setAttribute('playsinline','');
    });
    document.querySelectorAll('img[data-sw-media="gif"],img.sw-gif-media').forEach(img=>{
      img.classList.add('sw-gif-media');img.dataset.swMedia='gif';
      const figure=img.closest('figure');if(figure)figure.classList.add('sw-gif-block');
      const src=img.getAttribute('src');if(src){const next=assetUrl(src);if(next&&next!==src)img.setAttribute('src',next)}
    });
  }
  function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(apply)}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,80,220,600,1200].forEach(delay=>setTimeout(schedule,delay));
})();
