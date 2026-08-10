(() => {
  const Core = window.SurwaveEditorCore;
  if (!Core) return;

  const baseParse = Core.parseDocument;
  const baseSerialize = Core.serializeDocument;
  const baseRender = Core.renderBlocksHtml;
  const baseDefault = Core.defaultBlock;

  const type = Core.TYPES.find(item => item[0] === 'linkcard');
  if (type) type[1] = 'Ссылка на страницу';

  Core.defaultBlock = kind => {
    if (kind === 'linkcard') {
      return {type:'linkcard', label:'# Раздел', url:'', mention:true, prefix:'Смотри'};
    }
    return baseDefault(kind);
  };

  function parseMention(markdown) {
    const text = String(markdown || '').trim();
    let match = text.match(/^<mark\s+style="color:[^"]+;">\*\*([\s\S]*?)\*\*<\/mark>\s+\[([^\]]+)\]\((\S+)\s+"mention"\)$/i);
    if (match) return {type:'linkcard', mention:true, prefix:match[1], label:match[2], url:match[3]};

    match = text.match(/^\*\*([\s\S]*?)\*\*\s+\[([^\]]+)\]\((\S+)\s+"mention"\)$/i);
    if (match) return {type:'linkcard', mention:true, prefix:match[1], label:match[2], url:match[3]};

    match = text.match(/^\[([^\]]+)\]\((\S+)\s+"mention"\)$/i);
    if (match) return {type:'linkcard', mention:true, prefix:'', label:match[1], url:match[2]};
    return null;
  }

  function repair(blocks) {
    return (blocks || []).map(block => {
      if (block?.type === 'raw') {
        const mention = parseMention(block.markdown);
        if (mention) return mention;
      }
      if (block?.type === 'hint' || block?.type === 'details') block.children = repair(block.children);
      if (block?.type === 'stepper') block.steps = (block.steps || []).map(step => ({...step, children:repair(step.children)}));
      return block;
    });
  }

  Core.parseDocument = source => {
    const doc = baseParse(source);
    doc.blocks = repair(doc.blocks);
    return doc;
  };

  const mdEscape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\]/g, '\\]').replace(/\)/g, '\\)');

  function prepareForSerialize(blocks) {
    return (blocks || []).map(block => {
      if (block?.type === 'linkcard' && block.mention) {
        const prefix = String(block.prefix ?? 'Смотри').trim();
        const lead = prefix ? `<mark style="color:$primary;">**${prefix}**</mark> ` : '';
        return {type:'raw', markdown:`${lead}[${mdEscape(block.label || '# Раздел')}](${mdEscape(block.url || '')} "mention")`};
      }
      const copy = Core.clone(block);
      if (copy?.type === 'hint' || copy?.type === 'details') copy.children = prepareForSerialize(copy.children);
      if (copy?.type === 'stepper') copy.steps = (copy.steps || []).map(step => ({...step, children:prepareForSerialize(step.children)}));
      return copy;
    });
  }

  Core.serializeDocument = (frontmatter, blocks) => baseSerialize(frontmatter, prepareForSerialize(blocks));

  function prettyLabel(label, url) {
    const raw = String(label || '').trim();
    if (raw && !/^#[a-z0-9_-]+$/i.test(raw)) return raw;
    const hash = String(url || '').split('#')[1] || raw.replace(/^#/, '');
    if (!hash) return raw || 'Открыть раздел';
    const text = decodeURIComponent(hash).replace(/[-_]+/g, ' ').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Открыть раздел';
  }

  function prepareForPreview(blocks) {
    return (blocks || []).map(block => {
      if (block?.type === 'linkcard' && block.mention) {
        const prefix = Core.escapeHtml(String(block.prefix ?? 'Смотри').trim());
        const label = Core.escapeHtml(prettyLabel(block.label, block.url));
        const href = Core.escapeHtml(block.url || '#');
        return {type:'text', html:`${prefix ? `<strong class="mention-prefix">${prefix}</strong> ` : ''}<a class="wiki-mention" href="${href}">${label}</a>`};
      }
      const copy = Core.clone(block);
      if (copy?.type === 'hint' || copy?.type === 'details') copy.children = prepareForPreview(copy.children);
      if (copy?.type === 'stepper') copy.steps = (copy.steps || []).map(step => ({...step, children:prepareForPreview(step.children)}));
      return copy;
    });
  }

  Core.renderBlocksHtml = blocks => baseRender(prepareForPreview(blocks));
  Core.previewCss += '.mention-prefix{color:#ffe600}.wiki-mention{display:inline-block;padding:.06em .35em;border-radius:5px;background:rgba(75,139,255,.24);color:#a9caff!important;text-decoration:none}.wiki-mention:hover{background:rgba(75,139,255,.34)}';
})();
