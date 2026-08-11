(() => {
  const Core=window.SurwaveEditorCoreV2;if(!Core)return;
  Core.previewCss+=`
  .sw-copy-pair.sw-border-gradient .sw-copy-card:not(.sw-runtime-border-host),.sw-copy-pair.sw-adv-border .sw-copy-card:not(.sw-runtime-border-host){border:3px solid transparent!important;background:linear-gradient(#050809,#050809) padding-box,var(--sw-b-grad,linear-gradient(90deg,rgba(0,255,120,.28),rgba(0,255,192,.96) 50%,rgba(0,255,120,.28))) border-box!important}
  a[href="#copy"]{color:inherit!important;cursor:pointer!important;text-decoration:underline dotted rgba(0,255,192,.45)!important;text-underline-offset:3px;border-radius:4px;transition:background-color .15s ease,text-decoration-color .15s ease}
  a[href="#copy"]:hover{background:rgba(0,255,120,.055);text-decoration-color:#00ffc0!important}
  a[href="#copy"]::after{content:" ⧉";display:inline;color:#00ffc0;font-size:.78em;font-weight:700;text-decoration:none!important;vertical-align:.08em;opacity:.9}
  a[href="#copy"].is-copied::after{content:" ✓";color:#00ff78}
  `;
})();