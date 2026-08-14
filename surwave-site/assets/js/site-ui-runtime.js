(() => {
  const SETTINGS_URL='/surwave-site/assets/js/site-settings.json';
  let settings={logo:{src:'/surwave-site/assets/logos/surwave-wiki-logo.svg',width:226,height:58,x:0,y:0}};
  const shadeScript=document.createElement('script');shadeScript.src='/surwave-site/assets/js/ip-shade-runtime.js?v=20260812-2117';shadeScript.defer=true;document.head.appendChild(shadeScript);
  const richCss=document.createElement('link');richCss.rel='stylesheet';richCss.href='/surwave-site/assets/css/site-v7-rich.css?v=20260814-1420';document.head.appendChild(richCss);
  const contentCss=document.createElement('link');contentCss.rel='stylesheet';contentCss.href='/surwave-site/assets/css/site-v8-content.css?v=20260813-0945';document.head.appendChild(contentCss);
  const navigationCss=document.createElement('link');navigationCss.rel='stylesheet';navigationCss.href='/surwave-site/assets/css/site-v9-navigation.css?v=20260814-2010';document.head.appendChild(navigationCss);
  const scrollGlowCss=document.createElement('link');scrollGlowCss.rel='stylesheet';scrollGlowCss.href='/surwave-site/assets/css/site-v10-scroll-glow.css?v=20260814-2100';document.head.appendChild(scrollGlowCss);
  const richScript=document.createElement('script');richScript.src='/surwave-site/assets/js/rich-fields-runtime.js?v=20260812-2243';richScript.defer=true;document.head.appendChild(richScript);
  const mediaScript=document.createElement('script');mediaScript.src='/surwave-site/assets/js/site-media-runtime.js?v=20260813-0955';mediaScript.defer=true;document.head.appendChild(mediaScript);
  const inlineRichScript=document.createElement('script');inlineRichScript.src='/surwave-site/assets/js/site-inline-rich-runtime.js?v=20260814-1420';inlineRichScript.defer=true;document.head.appendChild(inlineRichScript);
  const navigationScript=document.createElement('script');navigationScript.src='/surwave-site/assets/js/site-navigation-runtime.js?v=20260814-2010';navigationScript.defer=true;document.head.appendChild(navigationScript);
  const scrollGlowScript=document.createElement('script');scrollGlowScript.src='/surwave-site/assets/js/site-scroll-glow-runtime.js?v=20260814-2045';scrollGlowScript.defer=true;document.head.appendChild(scrollGlowScript);
  function mediaUrl(src){src=String(src||'').trim();if(!src)return'/surwave-site/assets/logos/surwave-wiki-logo.svg';if(/^https?:|^data:|^\//i.test(src))return src;if(src.includes('.gitbook/assets/'))return'/.gitbook/assets/'+encodeURIComponent(src.split('.gitbook/assets/').pop().split('/').pop());return'/'+src.replace(/^\.\//,'')}
  function applyLogo(){
    const cfg=settings?.logo||{};
    document.querySelectorAll('.brand img').forEach(img=>{
      const frame=img.closest('.brand');if(frame){frame.style.setProperty('overflow','hidden','important');frame.style.setProperty('position','relative','important')}
      img.src=mediaUrl(cfg.src);
      const width=Math.max(16,Math.min(2000,+cfg.width||226)),height=Math.max(16,Math.min(1000,+cfg.height||58)),x=Math.max(-2000,Math.min(2000,+cfg.x||0)),y=Math.max(-2000,Math.min(2000,+cfg.y||0));
      img.style.setProperty('width',width+'px','important');img.style.setProperty('height',height+'px','important');img.style.setProperty('transform',`translate(${x}px,${y}px)`,'important');img.style.setProperty('object-fit','contain','important');img.style.setProperty('max-width','none','important');img.style.setProperty('max-height','none','important');
    });
  }
  async function copyText(el){const value=(el.textContent||'').trim();if(!value)return;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);else throw new Error('clipboard unavailable')}catch(_){const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(__){}ta.remove()}el.classList.add('is-copied');clearTimeout(el._swCopyTimer);el._swCopyTimer=setTimeout(()=>el.classList.remove('is-copied'),1600)}
  function bindCopyables(root=document){root.querySelectorAll?.('a[href="#copy"]:not([data-sw-copy-bound])').forEach(el=>{el.dataset.swCopyBound='1';el.classList.add('sw-copy-text');el.setAttribute('role','button');el.setAttribute('title','Нажмите, чтобы скопировать');el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();copyText(el)});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();copyText(el)}})})}
  function apply(){applyLogo();bindCopyables(document);window.SurwaveSiteMediaRuntime?.apply?.();window.SurwaveInlineRichRuntime?.apply?.();window.SurwaveNavigationRuntime?.apply?.();window.SurwaveScrollGlowRuntime?.apply?.()}
  fetch(SETTINGS_URL,{cache:'no-store'}).then(r=>r.ok?r.json():settings).then(data=>{settings=data||settings;apply()}).catch(()=>apply());
  const observer=new MutationObserver(()=>apply());observer.observe(document.documentElement,{childList:true,subtree:true});
})();
