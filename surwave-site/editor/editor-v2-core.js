(() => {
  const TYPES = [
    ['text','Текст'],['heading','Заголовок'],['image','Изображение'],['list','Список'],
    ['hint','Hint / предупреждение'],['details','Раскрывающийся блок'],['stepper','Порядок действий 1-2-3'],
    ['recipe','Рецепт Brewery'],['mention','Ссылка на страницу'],['linkgroup','Блок ссылок'],['embed','Embed / превью ресурса'],
    ['quote','Цитата'],['table','Таблица'],['code','Код'],['divider','Разделитель'],['raw','Неизвестный блок']
  ];

  const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const stripHtml = value => { const d=document.createElement('div'); d.innerHTML=String(value??''); return (d.textContent||'').trim(); };
  const slugify = value => stripHtml(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-+|-+$/g,'') || 'page';
  const clone = value => JSON.parse(JSON.stringify(value));
  const PRIMARY = '#00ff78';

  function defaultBlock(type='text') {
    switch(type){
      case 'heading': return {type,level:2,html:'Новый заголовок',align:'left'};
      case 'image': return {type,src:'',alt:'',caption:''};
      case 'list': return {type,ordered:false,items:['Новый пункт']};
      case 'hint': return {type,style:'info',color:'',children:[defaultBlock('text')]};
      case 'details': return {type,summaryHtml:'Раскрывающийся раздел',children:[defaultBlock('text')]};
      case 'stepper': return {type,steps:[{children:[{type:'heading',level:4,html:'Шаг 1',align:'left'},defaultBlock('text')]},{children:[{type:'heading',level:4,html:'Шаг 2',align:'left'},defaultBlock('text')]}]};
      case 'recipe': return {type,nameHtml:'Новый напиток',bodyHtml:'Требуемые ресурсы:<br>Ингредиент ×1<br>Время до варки: 5 мин',align:'center'};
      case 'mention': return {type,prefixHtml:'Смотри',label:'Раздел',url:''};
      case 'linkgroup': return {type,items:[{title:'Полезная ссылка',url:'',description:'',image:''}]};
      case 'embed': return {type,url:'https://',title:'Название ресурса',description:'Краткое описание',image:''};
      case 'quote': return {type,html:'Текст цитаты'};
      case 'table': return {type,rows:[['Колонка 1','Колонка 2'],['Значение','Значение']]};
      case 'code': return {type,language:'',code:''};
      case 'divider': return {type};
      case 'raw': return {type,markdown:''};
      default: return {type:'text',html:'Новый текст',align:'left'};
    }
  }

  function colorValue(raw){
    if(!raw) return '';
    const v=raw.trim();
    if(v==='$primary') return PRIMARY;
    return v;
  }

  function inlineMarkdownToHtml(text){
    let out=String(text??'');
    out=out.replace(/\\_/g,'_').replace(/\\\[/g,'[').replace(/\\\]/g,']').replace(/&#x20;/g,' ');
    out=out.replace(/<mark style="color:([^\"]+);">([\s\S]*?)<\/mark>/g,(_,color,body)=>`<span data-gitbook-color="${esc(color)}" style="color:${esc(colorValue(color))}">${body}</span>`);
    out=out.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    out=out.replace(/(?<!\*)\*(?!\*)(.*?)\*/g,'<em>$1</em>');
    out=out.replace(/`([^`]+)`/g,'<code>$1</code>');
    out=out.replace(/\[([^\]]+)\]\(([^ )]+)(?:\s+\"([^\"]*)\")?\)/g,(_,label,url,title)=>`<a href="${esc(url)}"${title?` data-link-title="${esc(title)}"`:''}>${label}</a>`);
    return out;
  }

  function richHtmlToMarkdown(html){
    const box=document.createElement('div'); box.innerHTML=String(html??'');
    const walk=node=>{
      if(node.nodeType===Node.TEXT_NODE) return node.nodeValue || '';
      if(node.nodeType!==Node.ELEMENT_NODE) return '';
      const el=node, inner=[...el.childNodes].map(walk).join('');
      switch(el.tagName){
        case 'STRONG': case 'B': return `**${inner}**`;
        case 'EM': case 'I': return `*${inner}*`;
        case 'S': case 'STRIKE': return `~~${inner}~~`;
        case 'U': return `<u>${inner}</u>`;
        case 'CODE': return `\`${inner}\``;
        case 'A': { const href=el.getAttribute('href')||''; const title=el.dataset.linkTitle; return `[${inner}](${href}${title?` "${title}"`:''})`; }
        case 'BR': return '<br>';
        case 'MARK': { const bg=el.style.backgroundColor||'#ffe066'; return `<mark style="background:${bg};">${inner}</mark>`; }
        case 'SPAN': {
          const original=el.dataset.gitbookColor || el.style.color;
          const size=el.style.fontSize;
          let result=inner;
          if(original) result=`<mark style="color:${original};">${result}</mark>`;
          if(size) result=`<span style="font-size:${size};">${result}</span>`;
          return result;
        }
        default: return inner;
      }
    };
    return [...box.childNodes].map(walk).join('');
  }

  function splitFrontmatter(source){
    const m=String(source??'').match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/);
    return m?{frontmatter:m[1],body:source.slice(m[1].length)}:{frontmatter:'',body:String(source??'')};
  }

  function isSpecial(line){
    const t=String(line||'').trim();
    return !t || /^#{1,6}\s/.test(t) || /^\*{3,}$/.test(t) || /^[-*]\s+/.test(t) || /^\d+[.)]\s+/.test(t) || /^>\s?/.test(t) || /^```/.test(t) || t==='<details>' || /^\{% (hint|stepper|embed|content-ref|link-group)/.test(t) || /^<figure>/.test(t) || /^<(p|h[1-6]|blockquote|ul|ol)\b/i.test(t);
  }

  function parseMention(line){
    const t=line.trim();
    const m=t.match(/^(.*?)\[([^\]]+)\]\(([^ )]+)\s+"mention"\)\s*$/);
    if(!m) return null;
    return {type:'mention',prefixHtml:inlineMarkdownToHtml(m[1].trim()),label:stripHtml(inlineMarkdownToHtml(m[2])),url:m[3]};
  }

  function parseLinkGroup(lines,start){
    let i=start+1, items=[];
    while(i<lines.length && lines[i].trim()!=='{% endlink-group %}'){
      const t=lines[i].trim();
      const m=t.match(/^\{% link title="([^"]*)" url="([^"]*)"(?: image="([^"]*)")? %\}$/);
      if(m){
        const desc=[]; i++;
        while(i<lines.length && lines[i].trim()!=='{% endlink %}') { desc.push(lines[i]); i++; }
        if(lines[i]?.trim()==='{% endlink %}') i++;
        items.push({title:m[1],url:m[2],image:m[3]||'',description:inlineMarkdownToHtml(desc.join(' ').trim())});
      } else i++;
    }
    if(lines[i]?.trim()==='{% endlink-group %}') i++;
    return {block:{type:'linkgroup',items:items.length?items:defaultBlock('linkgroup').items},index:i};
  }

  function parseSequence(lines,start=0,stop=()=>false,context={}){
    const blocks=[]; let i=start;
    while(i<lines.length){
      const raw=lines[i], t=raw.trim();
      if(stop(t)) break;
      if(!t){i++;continue;}

      let m=t.match(/^\{% hint style="([^"]+)"(?: color="([^"]+)")? %\}$/);
      if(m){ const parsed=parseSequence(lines,i+1,x=>x==='{% endhint %}',context); blocks.push({type:'hint',style:m[1],color:m[2]||'',children:parsed.blocks}); i=parsed.index+(lines[parsed.index]?.trim()==='{% endhint %}'?1:0); continue; }

      if(t==='{% stepper %}'){
        const steps=[]; i++;
        while(i<lines.length && lines[i].trim()!=='{% endstepper %}'){
          if(!lines[i].trim()){i++;continue;}
          if(lines[i].trim()==='{% step %}'){
            const parsed=parseSequence(lines,i+1,x=>x==='{% endstep %}',context); steps.push({children:parsed.blocks}); i=parsed.index+(lines[parsed.index]?.trim()==='{% endstep %}'?1:0);
          } else { i++; }
        }
        if(lines[i]?.trim()==='{% endstepper %}') i++;
        blocks.push({type:'stepper',steps:steps.length?steps:[{children:[]}]}); continue;
      }

      if(t==='{% link-group %}') { const parsed=parseLinkGroup(lines,i); blocks.push(parsed.block); i=parsed.index; continue; }

      if(t==='<details>'){
        i++; while(i<lines.length&&!lines[i].trim())i++;
        let summaryHtml='Раскрывающийся раздел'; const sm=lines[i]?.trim().match(/^<summary>([\s\S]*?)<\/summary>$/i);
        if(sm){summaryHtml=inlineMarkdownToHtml(sm[1]);i++;}
        const parsed=parseSequence(lines,i,x=>x==='</details>',{...context,inDetails:true});
        blocks.push({type:'details',summaryHtml,children:parsed.blocks}); i=parsed.index+(lines[parsed.index]?.trim()==='</details>'?1:0); continue;
      }

      m=t.match(/^<h4\s+align="center">([\s\S]*?)<\/h4>$/i);
      if(context.inDetails && m){
        let j=i+1; while(j<lines.length&&!lines[j].trim())j++;
        const pm=lines[j]?.trim().match(/^<p\s+align="center">([\s\S]*?)<\/p>$/i);
        if(pm){
          let name=m[1].replace(/<br\s*\/?>(?:\s*)/gi,'<br>');
          name=name.replace(/^(?:<strong>)?[—–-]{4,}(?:<\/strong>)?<br>/i,'');
          blocks.push({type:'recipe',nameHtml:inlineMarkdownToHtml(name),bodyHtml:inlineMarkdownToHtml(pm[1]),align:'center'}); i=j+1; continue;
        }
      }

      m=t.match(/^<figure><img src="([^"]+)" alt="([^"]*)"\s*\/?>(?:<figcaption>([\s\S]*?)<\/figcaption>)?<\/figure>$/i);
      if(m){blocks.push({type:'image',src:m[1],alt:m[2],caption:stripHtml(inlineMarkdownToHtml(m[3]||''))});i++;continue;}

      m=t.match(/^\{% content-ref url="([^"]+)" %\}$/);
      if(m){let label='Открыть раздел';i++;while(i<lines.length&&lines[i].trim()!=='{% endcontent-ref %}'){const lm=lines[i].match(/\[([^\]]+)\]\(/);if(lm)label=stripHtml(inlineMarkdownToHtml(lm[1]));i++;}if(lines[i]?.trim()==='{% endcontent-ref %}')i++;blocks.push({type:'linkgroup',items:[{title:label,url:m[1],description:'',image:''}]});continue;}

      m=t.match(/^\{% embed url="([^"]+)" %\}$/);
      if(m){const url=m[1], body=[];i++;while(i<lines.length&&lines[i].trim()!=='{% endembed %}'){body.push(lines[i]);i++;}if(lines[i]?.trim()==='{% endembed %}')i++;blocks.push({type:'embed',url,title:'',description:inlineMarkdownToHtml(body.join(' ').trim()),image:''});continue;}

      const mention=parseMention(t); if(mention){blocks.push(mention);i++;continue;}

      m=t.match(/^<(h[1-6])(?:\s+align="(left|center|right)")?>([\s\S]*?)<\/\1>$/i);
      if(m){blocks.push({type:'heading',level:+m[1].slice(1),html:inlineMarkdownToHtml(m[3]),align:m[2]||'left'});i++;continue;}
      m=t.match(/^<p(?:\s+align="(left|center|right)")?>([\s\S]*?)<\/p>$/i);
      if(m){blocks.push({type:'text',html:inlineMarkdownToHtml(m[2]),align:m[1]||'left'});i++;continue;}

      m=t.match(/^(#{1,6})\s+(.+)$/); if(m){blocks.push({type:'heading',level:m[1].length,html:inlineMarkdownToHtml(m[2]),align:'left'});i++;continue;}
      if(/^\*{3,}$/.test(t)){blocks.push({type:'divider'});i++;continue;}

      if(/^```/.test(t)){const lang=t.slice(3).trim(),code=[];i++;while(i<lines.length&&!/^```/.test(lines[i].trim())){code.push(lines[i]);i++;}if(i<lines.length)i++;blocks.push({type:'code',language:lang,code:code.join('\n')});continue;}

      if(/^[-*]\s+/.test(t)){const items=[];while(i<lines.length){const lm=lines[i].trim().match(/^[-*]\s+(.+)$/);if(!lm)break;items.push(inlineMarkdownToHtml(lm[1]));i++;}blocks.push({type:'list',ordered:false,items});continue;}
      if(/^\d+[.)]\s+/.test(t)){const items=[];while(i<lines.length){const lm=lines[i].trim().match(/^\d+[.)]\s+(.+)$/);if(!lm)break;items.push(inlineMarkdownToHtml(lm[1]));i++;}blocks.push({type:'list',ordered:true,items});continue;}
      if(/^>\s?/.test(t)){const parts=[];while(i<lines.length){const qm=lines[i].trim().match(/^>\s?(.*)$/);if(!qm)break;parts.push(qm[1]);i++;}blocks.push({type:'quote',html:inlineMarkdownToHtml(parts.join('<br>'))});continue;}
      if(t.startsWith('<blockquote>')&&t.endsWith('</blockquote>')){blocks.push({type:'quote',html:inlineMarkdownToHtml(t.slice(12,-13))});i++;continue;}

      if(/^<(ul|ol)>/i.test(t)){
        const listMatch=t.match(/^<(ul|ol)>([\s\S]*?)<\/\1>$/i); if(listMatch){const items=[];const re=/<li>([\s\S]*?)<\/li>/gi;let im;while((im=re.exec(listMatch[2])))items.push(inlineMarkdownToHtml(im[1]));blocks.push({type:'list',ordered:listMatch[1].toLowerCase()==='ol',items});i++;continue;}
      }

      if(t.includes('|')&&/^\|?\s*:?-{3,}/.test((lines[i+1]||'').trim())){const rows=[],split=row=>row.trim().replace(/^\||\|$/g,'').split('|').map(c=>inlineMarkdownToHtml(c.trim()));rows.push(split(lines[i]));i+=2;while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){rows.push(split(lines[i]));i++;}blocks.push({type:'table',rows});continue;}

      if(/^<[^>]+>/.test(t)){blocks.push({type:'raw',markdown:raw});i++;continue;}

      const parts=[raw.trim()];i++;while(i<lines.length&&!isSpecial(lines[i])&&!stop(lines[i].trim())){parts.push(lines[i].trim());i++;}
      blocks.push({type:'text',html:inlineMarkdownToHtml(parts.filter(Boolean).join('<br>')),align:'left'});
    }
    return {blocks,index:i};
  }

  function parseDocument(source){const split=splitFrontmatter(source);return {frontmatter:split.frontmatter,blocks:parseSequence(split.body.replace(/\r\n/g,'\n').split('\n')).blocks};}

  function sanitizeRich(html){
    const box=document.createElement('div');box.innerHTML=String(html??'');
    box.querySelectorAll('script,iframe,object,embed,style').forEach(x=>x.remove());
    const allowedStyles=new Set(['color','font-size','background-color']);
    box.querySelectorAll('*').forEach(el=>{
      [...el.attributes].forEach(attr=>{
        if(/^on/i.test(attr.name)) el.removeAttribute(attr.name);
        if(attr.name==='style'){
          const clean=[]; for(const prop of allowedStyles){const v=el.style.getPropertyValue(prop);if(v)clean.push(`${prop}:${v}`);} if(clean.length)el.setAttribute('style',clean.join(';')); else el.removeAttribute('style');
        }
      });
    });
    return box.innerHTML.replace(/<div>/g,'<br>').replace(/<\/div>/g,'');
  }

  function serializeBlocks(blocks){
    return (blocks||[]).map(block=>{
      switch(block.type){
        case 'heading': {const n=Math.max(1,Math.min(6,+block.level||2)),inner=richHtmlToMarkdown(sanitizeRich(block.html||''));return block.align&&block.align!=='left'?`<h${n} align="${block.align}">${inner}</h${n}>`:`${'#'.repeat(n)} ${inner}`;}
        case 'text': {const inner=richHtmlToMarkdown(sanitizeRich(block.html||''));return block.align&&block.align!=='left'?`<p align="${block.align}">${inner}</p>`:`<p>${inner}</p>`;}
        case 'image': return `<figure><img src="${esc(block.src||'')}" alt="${esc(block.alt||'')}"><figcaption>${esc(block.caption||'')}</figcaption></figure>`;
        case 'list': {const tag=block.ordered?'ol':'ul';return `<${tag}>${(block.items||[]).map(x=>`<li>${sanitizeRich(x)}</li>`).join('')}</${tag}>`;}
        case 'quote': return `<blockquote>${sanitizeRich(block.html||'')}</blockquote>`;
        case 'hint': return `{% hint style="${block.style||'info'}"${block.color?` color="${esc(block.color)}"`:''} %}\n${serializeBlocks(block.children)}\n{% endhint %}`;
        case 'details': return `<details>\n\n<summary>${richHtmlToMarkdown(sanitizeRich(block.summaryHtml||'Подробнее'))}</summary>\n\n${serializeBlocks(block.children)}\n\n</details>`;
        case 'stepper': return `{% stepper %}\n${(block.steps||[]).map(step=>`{% step %}\n${serializeBlocks(step.children)}\n{% endstep %}`).join('\n\n')}\n{% endstepper %}`;
        case 'recipe': return `<h4 align="center"><strong>${richHtmlToMarkdown(sanitizeRich(block.nameHtml||''))}</strong></h4>\n\n<p align="center">${richHtmlToMarkdown(sanitizeRich(block.bodyHtml||''))}</p>`;
        case 'mention': return `${richHtmlToMarkdown(sanitizeRich(block.prefixHtml||''))}${block.prefixHtml?' ':''}[${esc(block.label||'Раздел')}](${esc(block.url||'')} "mention")`;
        case 'linkgroup': return `{% link-group %}\n${(block.items||[]).map(item=>`{% link title="${esc(item.title||'')}" url="${esc(item.url||'')}"${item.image?` image="${esc(item.image)}"`:''} %}\n${richHtmlToMarkdown(sanitizeRich(item.description||''))}\n{% endlink %}`).join('\n')}\n{% endlink-group %}`;
        case 'embed': return `{% embed url="${esc(block.url||'')}" %}\n${block.title?`<strong>${richHtmlToMarkdown(sanitizeRich(block.title))}</strong><br>`:''}${richHtmlToMarkdown(sanitizeRich(block.description||''))}${block.image?`\n<figure><img src="${esc(block.image)}" alt=""></figure>`:''}\n{% endembed %}`;
        case 'table': {const rows=block.rows||[];if(!rows.length)return '';const width=Math.max(...rows.map(r=>r.length),1),norm=r=>Array.from({length:width},(_,i)=>stripHtml(r[i]||''));const head=norm(rows[0]);return `| ${head.join(' | ')} |\n| ${head.map(()=> '---').join(' | ')} |\n${rows.slice(1).map(r=>`| ${norm(r).join(' | ')} |`).join('\n')}`;}
        case 'code': return `\`\`\`${block.language||''}\n${block.code||''}\n\`\`\``;
        case 'divider': return '***';
        case 'raw': return block.markdown||'';
        default:return '';
      }
    }).filter(Boolean).join('\n\n');
  }

  function serializeDocument(frontmatter,blocks){return `${frontmatter||''}${serializeBlocks(blocks)}\n`;}
  function mediaUrl(src){src=String(src||'');if(/^https?:|^data:/i.test(src))return src;if(src.includes('.gitbook/assets/'))return '/.gitbook/assets/'+encodeURIComponent(src.split('.gitbook/assets/').pop().split('/').pop());return src.startsWith('/')?src:'/'+src.replace(/^\.\//,'');}

  function renderBlocksHtml(blocks,base=''){
    return (blocks||[]).map((b,i)=>{const path=base?`${base}.${i}`:`${i}`,attr=` data-editor-path="${esc(path)}"`;
      switch(b.type){
        case 'heading': {const n=Math.max(1,Math.min(6,+b.level||2));return `<h${n}${attr} style="text-align:${b.align||'left'}">${sanitizeRich(b.html||'')}</h${n}>`;}
        case 'text': return `<div class="text-block"${attr} style="text-align:${b.align||'left'}">${sanitizeRich(b.html||'')}</div>`;
        case 'image': return `<figure${attr}><img src="${mediaUrl(b.src)}" alt="${esc(b.alt||'')}">${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:''}</figure>`;
        case 'list': {const tag=b.ordered?'ol':'ul';return `<${tag}${attr}>${(b.items||[]).map(x=>`<li>${sanitizeRich(x)}</li>`).join('')}</${tag}>`;}
        case 'quote': return `<blockquote${attr}>${sanitizeRich(b.html||'')}</blockquote>`;
        case 'hint': {const color=b.color||({info:'#4ea1ff',warning:'#ffd400',success:'#00ff78',danger:'#ff5c6c'}[b.style]||'#4ea1ff');return `<div class="hint ${esc(b.style||'info')}"${attr} style="--hint-color:${esc(color)}">${renderBlocksHtml(b.children,`${path}.children`)}</div>`;}
        case 'details': return `<details open${attr}><summary>${sanitizeRich(b.summaryHtml||'Подробнее')}</summary><div class="details-body">${renderBlocksHtml(b.children,`${path}.children`)}</div></details>`;
        case 'stepper': return `<div class="stepper"${attr}>${(b.steps||[]).map((s,si)=>`<div class="step">${renderBlocksHtml(s.children,`${path}.steps.${si}.children`)}</div>`).join('')}</div>`;
        case 'recipe': return `<div class="brewery-recipe"${attr}><h4>${sanitizeRich(b.nameHtml||'')}</h4><div class="brewery-body">${sanitizeRich(b.bodyHtml||'')}</div></div>`;
        case 'mention': return `<div class="mention-block"${attr}>${b.prefixHtml?`<span class="mention-prefix">${sanitizeRich(b.prefixHtml)}</span>`:''}<a href="${esc(b.url||'#')}">${esc(b.label||'Раздел')} <span>↗</span></a></div>`;
        case 'linkgroup': return `<div class="link-group"${attr}>${(b.items||[]).map(item=>`<a class="link-item" href="${esc(item.url||'#')}">${item.image?`<img src="${mediaUrl(item.image)}" alt="">`:''}<span class="link-copy"><strong>${esc(item.title||'Ссылка')}</strong>${item.description?`<small>${sanitizeRich(item.description)}</small>`:''}</span><span class="link-arrow">›</span></a>`).join('')}</div>`;
        case 'embed': {let host='';try{host=new URL(b.url).hostname}catch(_){host=b.url||''}return `<a class="embed-preview"${attr} href="${esc(b.url||'#')}">${b.image?`<img class="embed-image" src="${mediaUrl(b.image)}" alt="">`:''}<span class="embed-copy"><small>${esc(host)}</small><strong>${sanitizeRich(b.title||host||'Внешний ресурс')}</strong>${b.description?`<span>${sanitizeRich(b.description)}</span>`:''}</span><span class="embed-open">↗</span></a>`;}
        case 'table': return `<div class="table-wrap"${attr}><table>${(b.rows||[]).map((r,ri)=>`<tr>${r.map(c=>ri===0?`<th>${sanitizeRich(c)}</th>`:`<td>${sanitizeRich(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
        case 'code': return `<pre${attr}><code>${esc(b.code||'')}</code></pre>`;
        case 'divider': return `<hr${attr}>`;
        case 'raw': return `<pre class="raw-preview"${attr}>${esc(b.markdown||'')}</pre>`;
        default:return '';
      }
    }).join('');
  }

  const previewCss=`:root{--bg:#060a0c;--line:#1c292d;--text:#edf6f2;--muted:#9cafaa;--accent:#00ff78;--accent2:#00ffc0}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.65 Inter,system-ui,sans-serif}.article{max-width:820px;margin:auto;padding:34px}.article h1{font-size:42px}.article h2{font-size:27px}.article h3{font-size:21px}.article h4{font-size:18px}.article p,.text-block,.article li{color:#b7c5c0}.article a{color:var(--accent2);text-decoration:none}.article img{max-width:100%}.article figure{margin:18px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden}.article figcaption{padding:8px 11px;color:#758780}.article blockquote{padding:12px 15px;border-left:3px solid var(--accent);background:#0a1215}.hint{margin:16px 0;padding:16px 18px;border:1px solid color-mix(in srgb,var(--hint-color) 55%,#213036);border-left:4px solid var(--hint-color);border-radius:9px;background:color-mix(in srgb,var(--hint-color) 8%,#091013)}details{margin:12px 0;border:1px solid #343c3e;border-radius:10px;overflow:hidden}summary{padding:14px 16px;font-weight:700;cursor:pointer}.details-body{padding:4px 16px 16px}.stepper{counter-reset:step}.step{position:relative;margin-left:18px;padding:0 0 18px 24px;border-left:1px solid var(--line)}.step:before{counter-increment:step;content:counter(step);position:absolute;left:-14px;width:27px;height:27px;border:1px solid #1f7850;border-radius:50%;display:grid;place-items:center;background:#091312;color:var(--accent)}.brewery-recipe{text-align:center;padding:24px 12px}.brewery-recipe+.brewery-recipe{border-top:2px solid #d7d7d7}.brewery-recipe h4{margin:0 0 15px;font-size:21px}.brewery-body{font-size:17px;line-height:1.55}.mention-block{display:flex;align-items:center;gap:8px;margin:14px 0}.mention-prefix{font-weight:700;color:var(--accent)}.mention-block a{display:inline-flex;gap:7px;align-items:center;padding:8px 11px;border:1px solid #2c383b;border-radius:8px;background:#0a1114}.link-group{margin:16px 0;border:1px solid #273337;border-radius:12px;overflow:hidden;background:#091013}.link-item{display:flex;align-items:center;gap:13px;padding:13px 15px;color:var(--text)!important}.link-item+.link-item{border-top:1px solid #273337}.link-item:hover{background:#0e181b}.link-item img{width:62px;height:62px;object-fit:cover;border-radius:9px}.link-copy{display:flex;flex:1;min-width:0;flex-direction:column}.link-copy strong{color:#eef7f3}.link-copy small{color:#8da19a;margin-top:2px}.link-arrow{font-size:28px;color:#72857f}.embed-preview{margin:16px 0;display:flex;align-items:stretch;overflow:hidden;border:1px solid #2a3639;border-radius:12px;background:#0a1114;color:inherit!important}.embed-image{width:150px;min-height:110px;object-fit:cover}.embed-copy{display:flex;flex:1;flex-direction:column;justify-content:center;padding:14px 16px}.embed-copy small{color:#738680}.embed-copy strong{font-size:17px;color:#eef7f3;margin:2px 0}.embed-copy span{color:#9fb0aa}.embed-open{padding:14px;color:#71847d}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:9px;border:1px solid var(--line)}pre{padding:14px;border:1px solid var(--line);border-radius:10px;background:#081013}hr{border:0;border-top:1px solid var(--line);margin:28px 0}[data-editor-path]{cursor:pointer;transition:box-shadow .15s,outline .15s}[data-editor-path]:hover{outline:1px dashed rgba(0,255,120,.45);outline-offset:4px}`;

  window.SurwaveEditorCoreV2={TYPES,esc,stripHtml,slugify,clone,defaultBlock,parseDocument,serializeBlocks,serializeDocument,renderBlocksHtml,mediaUrl,previewCss,sanitizeRich,richHtmlToMarkdown,inlineMarkdownToHtml};
})();
