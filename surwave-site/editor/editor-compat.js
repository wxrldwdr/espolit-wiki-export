(() => {
  const Core = window.SurwaveEditorCore;
  const parseBase = Core.parseDocument;
  const serializeBase = Core.serializeDocument;

  function repairList(block) {
    if (!block || block.type !== 'raw') return block;
    const match = String(block.markdown || '').trim().match(/^<(ul|ol)>([\s\S]*?)<\/\1>$/i);
    if (!match) return block;
    const items = [];
    const re = /<li>([\s\S]*?)<\/li>/gi;
    let item;
    while ((item = re.exec(match[2]))) items.push(item[1]);
    return items.length ? {type:'list', ordered:match[1].toLowerCase()==='ol', items} : block;
  }

  function repair(blocks) {
    return (blocks || []).map(value => {
      const block = repairList(value);
      if (block.type === 'hint' || block.type === 'details') block.children = repair(block.children);
      if (block.type === 'stepper') block.steps = (block.steps || []).map(step => ({...step, children:repair(step.children)}));
      return block;
    });
  }

  Core.parseDocument = source => {
    const doc = parseBase(source);
    doc.blocks = repair(doc.blocks);
    return doc;
  };

  function currentKnownPaths() {
    return new Set(Array.from(document.querySelectorAll('.page-item small'), node => node.textContent.trim()).filter(Boolean));
  }

  function makeRelative(from, to) {
    const left = String(from || '').replace(/\\/g,'/').split('/');
    left.pop();
    const right = String(to || '').replace(/\\/g,'/').split('/');
    while (left.length && right.length && left[0] === right[0]) { left.shift(); right.shift(); }
    return '../'.repeat(left.length) + right.join('/');
  }

  function normalize(blocks, source, known) {
    return (blocks || []).map(value => {
      const block = Core.clone(value);
      if (block.type === 'linkcard' && known.has(block.url)) block.url = makeRelative(source, block.url);
      if (block.type === 'hint' || block.type === 'details') block.children = normalize(block.children, source, known);
      if (block.type === 'stepper') block.steps = (block.steps || []).map(step => ({...step, children:normalize(step.children, source, known)}));
      return block;
    });
  }

  Core.serializeDocument = (frontmatter, blocks) => {
    const source = document.getElementById('pagePath')?.value?.trim() || '';
    return serializeBase(frontmatter, normalize(blocks, source, currentKnownPaths()));
  };
})();
