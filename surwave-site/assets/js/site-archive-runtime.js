(() => {
  const DATA='/surwave-site/assets/js/site-data.json';
  function apply(data){
    const hide=!!data?.homeArchived;
    const run=()=>{
      const home=document.querySelector('.home-link');
      if(home)home.hidden=hide;
    };
    run();
    if(!document.querySelector('.home-link')){
      const observer=new MutationObserver(()=>{
        run();
        if(document.querySelector('.home-link'))observer.disconnect();
      });
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }
  }
  fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(apply).catch(()=>{});
})();