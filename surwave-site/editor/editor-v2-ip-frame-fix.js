(() => {
  const Core=window.SurwaveEditorCoreV2;if(!Core)return;
  Core.previewCss+=`
  .sw-copy-pair.sw-border-gradient .sw-copy-card:not(.sw-runtime-border-host),.sw-copy-pair.sw-adv-border .sw-copy-card:not(.sw-runtime-border-host){border:3px solid transparent!important;background:linear-gradient(rgb(5 8 9 / var(--sw-bg-opacity,1)),rgb(5 8 9 / var(--sw-bg-opacity,1))) padding-box,linear-gradient(var(--bg,#060a0c),var(--bg,#060a0c)) padding-box,var(--sw-b-grad,linear-gradient(90deg,rgba(0,255,120,.28),rgba(0,255,192,.96) 50%,rgba(0,255,120,.28))) border-box!important}
  .sw-copy-pair .sw-copy-card.sw-runtime-border-host>.sw-runtime-border-layer,.sw-copy-pair .sw-copy-card.sw-runtime-border-host>.sw-runtime-shade-layer{inset:0!important;padding:3px!important;border-radius:16px!important;box-sizing:border-box!important;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)!important;-webkit-mask-composite:xor!important;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)!important;mask-composite:exclude!important}
  .sw-copy-pair .sw-copy-card.sw-runtime-border-host>.sw-runtime-buffer-layer{display:block!important;inset:3px!important;border-radius:13px!important;background:var(--bg,#060a0c)!important;opacity:1!important}
  .sw-copy-pair .sw-copy-card.sw-runtime-border-host>.sw-runtime-inner-layer{inset:3px!important;border-radius:13px!important;background:#050809!important;opacity:var(--sw-bg-opacity,1)!important;transition:opacity .16s ease,inset .12s ease!important}
  .sw-copy-pair:not(.sw-border-gradient):not(.sw-adv-border) .sw-copy-card.sw-runtime-border-host>.sw-runtime-shade-layer{display:none!important}
  .sw-copy-pair .sw-copy-card.sw-runtime-border-host>*:not(.sw-runtime-border-layer):not(.sw-runtime-buffer-layer):not(.sw-runtime-inner-layer):not(.sw-runtime-shade-layer){position:relative!important;z-index:4!important}
  a[href="#copy"]{color:inherit!important;cursor:pointer!important;text-decoration:underline dotted rgba(0,255,192,.45)!important;text-underline-offset:3px;border-radius:4px;transition:background-color .15s ease,text-decoration-color .15s ease}
  a[href="#copy"]:hover{background:rgba(0,255,120,.055);text-decoration-color:#00ffc0!important}
  a[href="#copy"]::after{content:" ⧉";display:inline;color:#00ffc0;font-size:.78em;font-weight:700;text-decoration:none!important;vertical-align:.08em;opacity:.9}
  a[href="#copy"].is-copied::after{content:" ✓";color:#00ff78}
  `;
})();
