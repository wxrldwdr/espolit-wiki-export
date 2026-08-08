(() => {
  const app = document.getElementById('app');
  const source = document.body.dataset.source || 'README.md';
  const SITE_ROOT = '/surwave-site/wiki/';
  const CONTENT_ROOT = '/surwave-site/content/';
  const DATA_URL = '/surwave-site/assets/js/site-data.json';
  const LOGO_URL = '/surwave-site/assets/logos/surwave-wiki-logo.svg';

  const escapeHtml = value => String(value).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const slugify = value => value.replace(/<[^>]+>/g,'').replace(/&[^;]+;/g,'').trim().toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-+|-+$/g,'') || 'section';

  function applyBrand(text) {
    return text.replaceAll('ESPOLIT','Surwave').replaceAll('Espolit','Surwave');
  }

  function normalizePath(path) {
    const parts=[];
    for (const segment of path.split('/')) {
      if (!segment || segment==='.') continue;
      if (segment==='..') parts.pop(); else parts.push(segment);
    }
    return parts.join('/');
  }

  function dirname(path) {
    const i=path.lastIndexOf('/');
    return i===-1 ? '' : path.slice(0,i+1);
  }

  function internalHref(target) {
    if (!target) return '#';
    if (/^(https?:|mailto:|tel:|#)/i.test(target)) return target;
    const h=target.indexOf('#');
    const raw=h>=0 ? target.slice(0,h) : target;
    const hash=h>=0 ? target.slice(h) : '';
    if (!raw) return hash || '#';
    const resolved=normalizePath(dirname(source)+raw);
    const out=resolved.replace(/README\.md$/i,'index.html').replace(/\.md$/i,'.html');
    return SITE_ROOT+out+hash;
  }

  function mediaHref(raw) {
    if (/^https?:/i.test(raw)) return raw;
    if (raw.includes('.gitbook/assets/')) {
      const file=raw.split('.gitbook/assets/').pop().split('/').pop();
      return '/.gitbook/assets/'+encodeURIComponent(file);
    }
    const resolved=normalizePath(dirname(source)+raw);
    return CONTENT_ROOT+resolved.split('/').map(encodeURIComponent).join('/');
  }

  function inline(text) {
    return text
      .replace(/\\_/g,'_')
      .replace(/\\\[/g,'[').replace(/\\\]/g,']')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/(?<!\*)\*(?!\*)(.*?)\*/g,'<em>$1</em>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^ )]+)(?:\s+\"[^\"]*\")?\)/g,(_,label,url)=>{
        const href=internalHref(url); const ext=/^(https?:|mailto:|tel:)/i.test(href);
        return `<a href="${href}"${ext?' target="_blank" rel="noopener"':''}>${label}</a>`;
      });
  }

  function preprocess(md) {
    md=md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');
    md=applyBrand(md).replace(/&#x20;/g,' ');
    md=md.replace(/<mark style="color:\$primary;">([\s\S]*?)<\/mark>/g,'<mark>$1</mark>');
    md=md.replace(/<mark style="color:[^"]+;">([\s\S]*?)<\/mark>/g,'<mark>$1</mark>');
    md=md.replace(/<figure><img src="([^"]+)" alt="([^"]*)"><figcaption>([\s\S]*?)<\/figcaption><\/figure>/g,(_,src,alt,caption)=>`\n@@FIGURE@@${src}@@ALT@@${alt}@@CAPTION@@${caption}@@END@@\n`);
    md=md.replace(/\{% content-ref url="([^"]+)" %\}[\s\S]*?\{% endcontent-ref %\}/g,(_,url)=>`\n@@CONTENTREF@@${url}@@END@@\n`);
    md=md.replace(/\{% embed url="([^"]+)" %\}([\s\S]*?)\{% endembed %\}/g,(_,url,body)=>`\n@@EMBED@@${url}@@BODY@@${body.trim()}@@END@@\n`);
    md=md.replace(/\{% embed url="([^"]+)" %\}/g,(_,url)=>`\n@@EMBED@@${url}@@BODY@@@@END@@\n`);
    md=md.replace(/\{% hint style="([^"]+)" %\}/g,'\n@@HINTSTART@@$1@@END@@\n').replace(/\{% endhint %\}/g,'\n@@HINTEND@@\n');
    md=md.replace(/\{% stepper %\}/g,'\n@@STEPPERSTART@@\n').replace(/\{% endstepper %\}/g,'\n@@STEPPEREND@@\n').replace(/\{% step %\}/g,'\n@@STEPSTART@@\n').replace(/\{% endstep %\}/g,'\n@@STEPEND@@\n');
    return md;
  }

  function renderMarkdown(markdown) {
    const lines=preprocess(markdown).split(/\r?\n/), out=[];
    let list=null, details=false, detailsBody=false, table=false;
    const closeList=()=>{ if(list){out.push(`</${list}>`); list=null;} };
    const closeTable=()=>{ if(table){out.push('</tbody></table></div>'); table=false;} };
    const flush=()=>{closeList();closeTable();};

    for(let i=0;i<lines.length;i++){
      const trimmed=lines[i].trim();
      if(!trimmed){flush();continue;}
      if(trimmed.startsWith('@@FIGURE@@')){
        flush(); const m=trimmed.match(/^@@FIGURE@@(.*?)@@ALT@@(.*?)@@CAPTION@@(.*?)@@END@@$/);
        if(m) out.push(`<figure><img class="wiki-image" loading="lazy" src="${mediaHref(m[1])}" alt="${escapeHtml(m[2])}">${m[3]?`<figcaption>${inline(m[3])}</figcaption>`:''}</figure>`);
        continue;
      }
      if(trimmed.startsWith('@@CONTENTREF@@')){flush();const url=trimmed.slice(14,-7);out.push(`<a class="content-ref" href="${internalHref(url)}"><span>Открыть раздел</span><b>→</b></a>`);continue;}
      if(trimmed.startsWith('@@EMBED@@')){flush();const m=trimmed.match(/^@@EMBED@@(.*?)@@BODY@@(.*?)@@END@@$/);if(m)out.push(`<div class="embed-card"><a href="${m[1]}" target="_blank" rel="noopener">${escapeHtml(m[1])}</a>${m[2]?`<div>${inline(m[2])}</div>`:''}</div>`);continue;}
      if(trimmed.startsWith('@@HINTSTART@@')){flush();const kind=trimmed.slice(13,-7);out.push(`<div class="hint ${kind}">`);continue;}
      if(trimmed==='@@HINTEND@@'){flush();out.push('</div>');continue;}
      if(trimmed==='@@STEPPERSTART@@'){flush();out.push('<div class="stepper">');continue;}
      if(trimmed==='@@STEPPEREND@@'){flush();out.push('</div>');continue;}
      if(trimmed==='@@STEPSTART@@'){flush();out.push('<div class="step">');continue;}
      if(trimmed==='@@STEPEND@@'){flush();out.push('</div>');continue;}
      if(trimmed==='<details>'){flush();out.push('<details>');details=true;detailsBody=false;continue;}
      if(trimmed==='</details>'){flush();if(detailsBody)out.push('</div>');out.push('</details>');details=false;detailsBody=false;continue;}
      const sm=trimmed.match(/^<summary>([\s\S]*)<\/summary>$/);if(sm){flush();out.push(`<summary>${inline(sm[1])}</summary><div class="details-body">`);detailsBody=true;continue;}
      const hm=trimmed.match(/^(#{1,6})\s+(.+)$/);if(hm){flush();const n=hm[1].length,id=slugify(hm[2]);out.push(`<h${n} id="${id}">${inline(hm[2])}<a class="anchor" href="#${id}">#</a></h${n}>`);continue;}
      if(/^\*{3,}$/.test(trimmed)){flush();out.push('<hr>');continue;}
      const next=(lines[i+1]||'').trim();
      if(trimmed.includes('|')&&/^\|?\s*:?-{3,}/.test(next)){flush();const cells=trimmed.replace(/^\||\|$/g,'').split('|').map(x=>x.trim());out.push('<div class="table-wrap"><table><thead><tr>'+cells.map(c=>`<th>${inline(c)}</th>`).join('')+'</tr></thead><tbody>');table=true;i++;continue;}
      if(table&&trimmed.includes('|')){const cells=trimmed.replace(/^\||\|$/g,'').split('|').map(x=>x.trim());out.push('<tr>'+cells.map(c=>`<td>${inline(c)}</td>`).join('')+'</tr>');continue;}
      if(table)closeTable();
      let m=trimmed.match(/^[-*]\s+(.+)$/);if(m){if(list!=='ul'){closeList();out.push('<ul>');list='ul';}out.push(`<li>${inline(m[1])}</li>`);continue;}
      m=trimmed.match(/^\d+[.)]\s+(.+)$/);if(m){if(list!=='ol'){closeList();out.push('<ol>');list='ol';}out.push(`<li>${inline(m[1])}</li>`);continue;}
      if(list)closeList();
      m=trimmed.match(/^>\s?(.*)$/);if(m){out.push(`<blockquote>${inline(m[1])}</blockquote>`);continue;}
      if(/^<\/?(?:div|iframe|video|source|sup|sub)\b/i.test(trimmed)){out.push(trimmed);continue;}
      out.push(`<p>${inline(trimmed)}</p>`);
    }
    flush(); if(details){if(detailsBody)out.push('</div>');out.push('</details>');}
    return out.join('\n');
  }

  function shell(content){return `<aside class="sidebar" id="sidebar"><a class="brand" href="${SITE_ROOT}index.html"><img src="${LOGO_URL}" alt="Surwave Wiki"></a><a class="home-link active" href="${SITE_ROOT}index.html"><span>Добро пожаловать</span><span>›</span></a><nav id="nav"></nav></aside><header class="topbar"><button class="menu-button" id="menuButton">☰</button><div class="search"><input id="navSearch" type="search" placeholder="Поиск по разделам…"></div><button class="copy-link" id="copyLink">Копировать ссылку</button></header><main class="main"><div class="content-grid"><article class="article">${content}</article><aside class="toc" id="toc"><strong>На этой странице</strong></aside></div></main><div class="lightbox" id="lightbox" hidden><button>×</button><img alt=""></div>`;}

  function buildToc(){const toc=document.getElementById('toc');document.querySelectorAll('.article h2,.article h3').forEach(h=>{const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent.replace(/#$/,'').trim();if(h.tagName==='H3')a.classList.add('toc-sub');toc.appendChild(a);});}
  function buildNavigation(data){const nav=document.getElementById('nav'),current=location.pathname;data.groups.forEach(group=>{const s=document.createElement('section');s.className='nav-group';if(group.items.some(i=>current.endsWith('/'+i.href)))s.classList.add('open');s.innerHTML=`<button class="nav-title" type="button"><span>${group.title}</span><span class="chev">⌄</span></button><div class="nav-items"><div class="nav-items-inner"></div></div>`;const inner=s.querySelector('.nav-items-inner');group.items.forEach(item=>{const a=document.createElement('a');a.className='nav-link';a.href=SITE_ROOT+item.href;a.textContent=item.title;if(current.endsWith('/'+item.href))a.classList.add('active');inner.appendChild(a);});s.querySelector('.nav-title').onclick=()=>s.classList.toggle('open');nav.appendChild(s);});const input=document.getElementById('navSearch');input.oninput=()=>{const q=input.value.trim().toLowerCase();document.querySelectorAll('.nav-link').forEach(a=>a.hidden=!!q&&!a.textContent.toLowerCase().includes(q));if(q)document.querySelectorAll('.nav-group').forEach(x=>x.classList.add('open'));};}
  function bindUi(){document.getElementById('copyLink').onclick=async e=>{await navigator.clipboard.writeText(location.href);const b=e.currentTarget,o=b.textContent;b.textContent='Скопировано';setTimeout(()=>b.textContent=o,1200);};document.getElementById('menuButton').onclick=()=>document.getElementById('sidebar').classList.toggle('open');const box=document.getElementById('lightbox');document.querySelectorAll('.wiki-image').forEach(img=>img.onclick=()=>{box.querySelector('img').src=img.src;box.hidden=false;});box.onclick=e=>{if(e.target===box||e.target.tagName==='BUTTON')box.hidden=true;};document.addEventListener('keydown',e=>{if(e.key==='Escape')box.hidden=true;});}

  Promise.all([fetch(CONTENT_ROOT+source).then(r=>{if(!r.ok)throw new Error(`${source}: HTTP ${r.status}`);return r.text();}),fetch(DATA_URL).then(r=>r.json())]).then(([md,data])=>{app.innerHTML=shell(renderMarkdown(md));buildNavigation(data);buildToc();bindUi();document.documentElement.classList.add('wiki-ready');}).catch(error=>{app.innerHTML=`<main class="main"><div class="content-grid"><article class="article"><h1>Не удалось открыть страницу</h1><p>${escapeHtml(error.message||error)}</p></article></div></main>`;document.documentElement.classList.add('wiki-ready');});
})();