(() => {
  const TYPES = [
    ['text','Текст'],['heading','Заголовок'],['image','Изображение'],['list','Список'],
    ['hint','Окошко / подсказка'],['details','Раскрывающийся блок'],['stepper','Порядок действий 1-2-3'],
    ['linkcard','Карточка-ссылка'],['embed','Видео / внешняя вставка'],['quote','Цитата'],
    ['table','Таблица'],['code','Код'],['divider','Разделитель'],['raw','Неизвестный блок']
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const stripHtml = value => {
    const div=document.createElement('div'); div.innerHTML=String(value??''); return (div.textContent||'').trim();
  };
  const slugify = value => stripHtml(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-+|-+$/g,'') || 'page';
  const clone = value => JSON.parse(JSON.stringify(value));

  function defaultBlock(type='text') {
    switch(type){
      case 'heading': return {type,level:2,text:'Новый заголовок'};
      case 'image': return {type,src:'',alt:'',caption:''};
      case 'list': return {type,ordered:false,items:['Новый пункт']};
      case 'hint': return {type,style:'info',children:[defaultBlock('text')]};
      case 'details': return {type,summary:'Раскрывающийся раздел',children:[defaultBlock('text')]};
      case 'stepper': return {type,steps:[{children:[{type:'heading',level:4,text:'Шаг 1'},{type:'text',html:'Описание действия'}]},{children:[{type:'heading',level:4,text:'Шаг 2'},{type:'text',html:'Описание действия'}]}]};
      case 'linkcard': return {type,label:'Открыть раздел',url:''};
      case 'embed': return {type,url:'',label:''};
      case 'quote': return {type,html:'Текст цитаты'};
      case 'table': return {type,rows:[['Колонка 1','Колонка 2'],['Значение','Значение']]};
      case 'code': return {type,language:'',code:''};
      case 'divider': return {type};
      case 'raw': return {type,markdown:''};
      default: return {type:'text',html:'Новый текст'};
    }
  }

  function inlineMarkdownToHtml(text) {
    let out=String(text??'');
    out=out.replace(/\\_/g,'_').replace(/\\\[/g,'[').replace(/\\\]/g,']');
    out=out.replace(/<mark style="color:\$primary;">([\s\S]*?)<\/mark>/g,'<mark>$1</mark>');
    out=out.replace(/<mark style="color:[^"]+;">([\s\S]*?)<\/mark>/g,'<mark>$1</mark>');
    out=out.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    out=out.replace(/(?<!\*)\*(?!\*)(.*?)\*/g,'<em>$1</em>');
    out=out.replace(/`([^`]+)`/g,'<code>$1</code>');
    out=out.replace(/\[([^\]]+)\]\(([^ )]+)(?:\s+\"[^\"]*\")?\)/g,(_,label,url)=>`<a href="${escapeHtml(url)}">${label}</a>`);
    return out.replace(/&#x20;/g,' ');
  }

  function splitFrontmatter(source){
    const match=String(source??'').match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/);
    return match ? {frontmatter:match[1],body:source.slice(match[1].length)} : {frontmatter:'',body:String(source??'')};
  }

  function special(line){
    const t=line.trim();
    return !t || /^#{1,6}\s/.test(t) || /^\*{3,}$/.test(t) || /^[-*]\s+/.test(t) || /^\d+[.)]\s+/.test(t) || /^>\s?/.test(t) || /^```/.test(t) || t==='<details>' || /^\{% (hint|stepper|embed|content-ref)/.test(t) || /^<figure>/.test(t) || /^<p>/.test(t) || /^<blockquote>/.test(t);
  }

  function parseSequence(lines,start=0,stop=()=>false){
    const blocks=[]; let i=start;
    while(i<lines.length){
      const raw=lines[i], t=raw.trim();
      if(stop(t)) break;
      if(!t){i++;continue;}

      let m=t.match(/^\{% hint style="([^"]+)" %\}$/);
      if(m){
        const parsed=parseSequence(lines,i+1,x=>x==='{% endhint %}');
        blocks.push({type:'hint',style:m[1],children:parsed.blocks});
        i=parsed.index+(lines[parsed.index]?.trim()==='{% endhint %}'?1:0); continue;
      }

      if(t==='{% stepper %}'){
        const steps=[]; i++;
        while(i<lines.length && lines[i].trim()!=='{% endstepper %}'){
          if(!lines[i].trim()){i++;continue;}
          if(lines[i].trim()==='{% step %}'){
            const parsed=parseSequence(lines,i+1,x=>x==='{% endstep %}');
            steps.push({children:parsed.blocks});
            i=parsed.index+(lines[parsed.index]?.trim()==='{% endstep %}'?1:0);
          } else {
            const parsed=parseSequence(lines,i,x=>x==='{% step %}'||x==='{% endstepper %}');
            if(parsed.blocks.length) steps.push({children:parsed.blocks});
            i=parsed.index;
          }
        }
        if(lines[i]?.trim()==='{% endstepper %}')i++;
        blocks.push({type:'stepper',steps:steps.length?steps:[{children:[]}]}); continue;
      }

      if(t==='<details>'){
        i++; while(i<lines.length&&!lines[i].trim())i++;
        let summary='Раскрывающийся раздел';
        const sm=lines[i]?.trim().match(/^<summary>([\s\S]*?)<\/summary>$/);
        if(sm){summary=stripHtml(inlineMarkdownToHtml(sm[1]));i++;}
        const parsed=parseSequence(lines,i,x=>x==='</details>');
        blocks.push({type:'details',summary,children:parsed.blocks});
        i=parsed.index+(lines[parsed.index]?.trim()==='</details>'?1:0); continue;
      }

      m=t.match(/^<figure><img src="([^"]+)" alt="([^"]*)"><figcaption>([\s\S]*?)<\/figcaption><\/figure>$/);
      if(m){blocks.push({type:'image',src:m[1],alt:m[2],caption:stripHtml(inlineMarkdownToHtml(m[3]))});i++;continue;}
      m=t.match(/^<figure><img src="([^"]+)" alt="([^"]*)"\s*\/?>(?:<figcaption>([\s\S]*?)<\/figcaption>)?<\/figure>$/);
      if(m){blocks.push({type:'image',src:m[1],alt:m[2],caption:stripHtml(inlineMarkdownToHtml(m[3]||''))});i++;continue;}

      m=t.match(/^\{% content-ref url="([^"]+)" %\}$/);
      if(m){let label='Открыть раздел';i++;while(i<lines.length&&lines[i].trim()!=='{% endcontent-ref %}'){const lm=lines[i].match(/\[([^\]]+)\]\(/);if(lm)label=stripHtml(inlineMarkdownToHtml(lm[1]));i++;}if(lines[i]?.trim()==='{% endcontent-ref %}')i++;blocks.push({type:'linkcard',url:m[1],label});continue;}

      m=t.match(/^\{% embed url="([^"]+)" %\}$/);
      if(m){
        const url=m[1]; let body=[]; let j=i+1;
        while(j<lines.length&&lines[j].trim()!=='{% endembed %}'&&!special(lines[j])){body.push(lines[j]);j++;}
        if(lines[j]?.trim()==='{% endembed %}')i=j+1;else i++;
        blocks.push({type:'embed',url,label:stripHtml(inlineMarkdownToHtml(body.join(' ').trim()))}); continue;
      }

      m=t.match(/^(#{1,6})\s+(.+)$/);
      if(m){blocks.push({type:'heading',level:m[1].length,text:stripHtml(inlineMarkdownToHtml(m[2]))});i++;continue;}
      if(/^\*{3,}$/.test(t)){blocks.push({type:'divider'});i++;continue;}

      if(/^```/.test(t)){
        const lang=t.slice(3).trim(); const code=[]; i++;
        while(i<lines.length&&!/^```/.test(lines[i].trim())){code.push(lines[i]);i++;}
        if(i<lines.length)i++;
        blocks.push({type:'code',language:lang,code:code.join('\n')});continue;
      }

      if(/^[-*]\s+/.test(t)){
        const items=[];
        while(i<lines.length){const lm=lines[i].trim().match(/^[-*]\s+(.+)$/);if(!lm)break;items.push(inlineMarkdownToHtml(lm[1]));i++;}
        blocks.push({type:'list',ordered:false,items});continue;
      }
      if(/^\d+[.)]\s+/.test(t)){
        const items=[];
        while(i<lines.length){const lm=lines[i].trim().match(/^\d+[.)]\s+(.+)$/);if(!lm)break;items.push(inlineMarkdownToHtml(lm[1]));i++;}
        blocks.push({type:'list',ordered:true,items});continue;
      }

      if(/^>\s?/.test(t)){
        const parts=[];
        while(i<lines.length){const qm=lines[i].trim().match(/^>\s?(.*)$/);if(!qm)break;parts.push(qm[1]);i++;}
        blocks.push({type:'quote',html:inlineMarkdownToHtml(parts.join('<br>'))});continue;
      }

      if(t.startsWith('<p>')&&t.endsWith('</p>')){blocks.push({type:'text',html:t.slice(3,-4)});i++;continue;}
      if(t.startsWith('<blockquote>')&&t.endsWith('</blockquote>')){blocks.push({type:'quote',html:t.slice(12,-13)});i++;continue;}

      if(t.includes('|')&&/^\|?\s*:?-{3,}/.test((lines[i+1]||'').trim())){
        const rows=[]; const split=row=>row.trim().replace(/^\||\|$/g,'').split('|').map(c=>inlineMarkdownToHtml(c.trim()));
        rows.push(split(lines[i]));i+=2;
        while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){rows.push(split(lines[i]));i++;}
        blocks.push({type:'table',rows});continue;
      }

      if(/^<[^>]+>/.test(t)){blocks.push({type:'raw',markdown:raw});i++;continue;}

      const parts=[raw.trim()];i++;
      while(i<lines.length&&!special(lines[i])&&!stop(lines[i].trim())){parts.push(lines[i].trim());i++;}
      blocks.push({type:'text',html:inlineMarkdownToHtml(parts.filter(Boolean).join('<br>'))});
    }
    return {blocks,index:i};
  }

  function parseDocument(source){
    const split=splitFrontmatter(source); const lines=split.body.replace(/\r\n/g,'\n').split('\n');
    return {frontmatter:split.frontmatter,blocks:parseSequence(lines).blocks};
  }

  function cleanRich(html){
    const box=document.createElement('div'); box.innerHTML=String(html??'');
    box.querySelectorAll('script,style,iframe,object,embed').forEach(x=>x.remove());
    box.querySelectorAll('*').forEach(el=>{
      [...el.attributes].forEach(attr=>{if(/^on/i.test(attr.name)||attr.name==='style')el.removeAttribute(attr.name);});
      if(el.tagName==='A'){const href=el.getAttribute('href')||'';el.setAttribute('href',href);}
    });
    return box.innerHTML.replace(/<div>/g,'<br>').replace(/<\/div>/g,'');
  }

  function serializeBlocks(blocks){
    return (blocks||[]).map(block=>{
      switch(block.type){
        case 'heading': return `${'#'.repeat(Math.min(6,Math.max(1,+block.level||2)))} ${stripHtml(block.text||'Заголовок')}`;
        case 'text': return `<p>${cleanRich(block.html||'')}</p>`;
        case 'image': return `<figure><img src="${escapeHtml(block.src||'')}" alt="${escapeHtml(block.alt||'')}"><figcaption>${escapeHtml(block.caption||'')}</figcaption></figure>`;
        case 'list': {const tag=block.ordered?'ol':'ul';return `<${tag}>${(block.items||[]).map(x=>`<li>${cleanRich(x)}</li>`).join('')}</${tag}>`;}
        case 'quote': return `<blockquote>${cleanRich(block.html||'')}</blockquote>`;
        case 'hint': return `{% hint style="${block.style||'info'}" %}\n${serializeBlocks(block.children)}\n{% endhint %}`;
        case 'details': return `<details>\n\n<summary>${escapeHtml(block.summary||'Подробнее')}</summary>\n\n${serializeBlocks(block.children)}\n\n</details>`;
        case 'stepper': return `{% stepper %}\n${(block.steps||[]).map(step=>`{% step %}\n${serializeBlocks(step.children)}\n{% endstep %}`).join('\n\n')}\n{% endstepper %}`;
        case 'linkcard': return `{% content-ref url="${escapeHtml(block.url||'')}" %}\n[${escapeHtml(block.label||'Открыть раздел')}](${escapeHtml(block.url||'')})\n{% endcontent-ref %}`;
        case 'embed': return block.label ? `{% embed url="${escapeHtml(block.url||'')}" %}\n${escapeHtml(block.label)}\n{% endembed %}` : `{% embed url="${escapeHtml(block.url||'')}" %}`;
        case 'table': {const rows=block.rows||[];if(!rows.length)return '';const width=Math.max(...rows.map(r=>r.length),1);const norm=r=>Array.from({length:width},(_,i)=>stripHtml(r[i]||''));const head=norm(rows[0]);return `| ${head.join(' | ')} |\n| ${head.map(()=> '---').join(' | ')} |\n${rows.slice(1).map(r=>`| ${norm(r).join(' | ')} |`).join('\n')}`;}
        case 'code': return `\`\`\`${block.language||''}\n${block.code||''}\n\`\`\``;
        case 'divider': return '***';
        case 'raw': return block.markdown||'';
        default: return '';
      }
    }).filter(Boolean).join('\n\n');
  }

  function serializeDocument(frontmatter,blocks){return `${frontmatter||''}${serializeBlocks(blocks)}\n`;}

  function mediaUrl(src){
    src=String(src||'');
    if(/^https?:|^data:/i.test(src))return src;
    if(src.includes('.gitbook/assets/'))return '/.gitbook/assets/'+encodeURIComponent(src.split('.gitbook/assets/').pop().split('/').pop());
    return src.startsWith('/')?src:'/'+src.replace(/^\.\//,'');
  }

  function renderBlocksHtml(blocks){
    return (blocks||[]).map(block=>{
      switch(block.type){
        case 'heading': {const n=Math.min(6,Math.max(1,+block.level||2));const text=escapeHtml(block.text||'');return `<h${n} id="${slugify(text)}">${text}</h${n}>`;}
        case 'text': return `<p>${cleanRich(block.html||'')}</p>`;
        case 'image': return `<figure><img src="${mediaUrl(block.src)}" alt="${escapeHtml(block.alt||'')}">${block.caption?`<figcaption>${escapeHtml(block.caption)}</figcaption>`:''}</figure>`;
        case 'list': {const tag=block.ordered?'ol':'ul';return `<${tag}>${(block.items||[]).map(x=>`<li>${cleanRich(x)}</li>`).join('')}</${tag}>`;}
        case 'quote': return `<blockquote>${cleanRich(block.html||'')}</blockquote>`;
        case 'hint': return `<div class="hint ${escapeHtml(block.style||'info')}">${renderBlocksHtml(block.children)}</div>`;
        case 'details': return `<details open><summary>${escapeHtml(block.summary||'Подробнее')}</summary><div class="details-body">${renderBlocksHtml(block.children)}</div></details>`;
        case 'stepper': return `<div class="stepper">${(block.steps||[]).map(step=>`<div class="step">${renderBlocksHtml(step.children)}</div>`).join('')}</div>`;
        case 'linkcard': return `<a class="content-ref" href="${escapeHtml(block.url||'#')}"><span>${escapeHtml(block.label||'Открыть раздел')}</span><b>→</b></a>`;
        case 'embed': return `<div class="embed-card"><a href="${escapeHtml(block.url||'#')}">${escapeHtml(block.url||'Ссылка')}</a>${block.label?`<div>${escapeHtml(block.label)}</div>`:''}</div>`;
        case 'table': return `<div class="table-wrap"><table>${(block.rows||[]).map((r,ri)=>`<tr>${r.map(c=>ri===0?`<th>${cleanRich(c)}</th>`:`<td>${cleanRich(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
        case 'code': return `<pre><code>${escapeHtml(block.code||'')}</code></pre>`;
        case 'divider': return '<hr>';
        case 'raw': return `<pre class="raw-preview">${escapeHtml(block.markdown||'')}</pre>`;
        default:return '';
      }
    }).join('');
  }

  const previewCss=`:root{--bg:#060a0c;--line:#182429;--text:#edf6f2;--muted:#9cafaa;--accent:#00ff78;--accent2:#00ffc0}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,rgba(0,255,192,.045),transparent 28rem),var(--bg);color:var(--text);font:15px/1.65 Inter,system-ui,sans-serif}.article{max-width:780px;margin:auto;padding:38px 34px 90px}.article h1{font-size:44px;line-height:1.08}.article h2{font-size:26px;margin-top:38px}.article h3{font-size:20px;margin-top:30px}.article p,.article li{color:#acbbb5}.article a{color:var(--accent2);text-decoration:none}.article img{max-width:100%;border-radius:10px}.article figure{margin:18px 0;border:1px solid var(--line);border-radius:11px;overflow:hidden;background:#071013}.article figure img{display:block;width:100%}.article figcaption{padding:8px 11px;color:#758780;font-size:12px}.article blockquote{padding:12px 15px;border-left:2px solid var(--accent);background:rgba(0,255,120,.04);color:#c6d4cf}.article hr{border:0;border-top:1px solid var(--line);margin:30px 0}.article code{color:#86ffc1}.article pre{padding:15px;overflow:auto;border:1px solid var(--line);border-radius:10px;background:#081013}.hint{margin:16px 0;padding:13px 15px;border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:9px;background:#091013}.hint.warning{border-left-color:#ffd166}.hint.danger{border-left-color:#ff6b6b}.hint.success{border-left-color:#64ff9a}.stepper{counter-reset:step;margin:18px 0}.step{position:relative;margin:0 0 18px 20px;padding:0 0 0 22px;border-left:1px solid var(--line)}.step:before{counter-increment:step;content:counter(step);position:absolute;left:-14px;top:0;width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#0b1517;border:1px solid rgba(0,255,120,.25);color:var(--accent);font-weight:700}details{margin:10px 0;border:1px solid var(--line);border-radius:10px;background:#091013;overflow:hidden}summary{padding:12px 14px;cursor:pointer;font-weight:700}.details-body{padding:0 14px 12px}.content-ref,.embed-card{display:block;margin:14px 0;padding:13px 15px;border:1px solid var(--line);border-radius:10px;background:#091013}.content-ref{display:flex;justify-content:space-between}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;border:1px solid var(--line)}th,td{padding:9px 11px;border:1px solid var(--line);text-align:left}th{background:#0c1518}.raw-preview{white-space:pre-wrap;color:#ffb3b8}mark{background:rgba(0,255,120,.12);color:var(--accent);padding:0 .15em;border-radius:3px}`;

  window.SurwaveEditorCore={TYPES,escapeHtml,stripHtml,slugify,clone,defaultBlock,parseDocument,serializeBlocks,serializeDocument,renderBlocksHtml,mediaUrl,previewCss,cleanRich};
})();
