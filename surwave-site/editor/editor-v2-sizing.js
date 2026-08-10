(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  const baseDefaultBlock = Core.defaultBlock;
  const baseParseDocument = Core.parseDocument;
  const baseSerializeBlocks = Core.serializeBlocks;
  const baseRenderBlocksHtml = Core.renderBlocksHtml;

  const META_RE = /<!--SURWAVE_LAYOUT:([^\n]*?)-->/;
  const WRAPPER_OPEN_RE = /^<div class="sw-sized(?: sw-image-frame)?(?: sw-hint-color)?"[^>]*data-sw-path="[^"]+"[^>]*>\s*$/gm;
  const WRAPPER_CLOSE_RE = /^<\/div><!--sw-sized-->\s*$/gm;
  const STYLE_RE = /^<div data-sw-editor-style="1"[^>]*><style>[\s\S]*?<\/style><\/div>\s*$/gm;
  const blockRefs = new Map();
  window.SurwaveEditorBlockRefs = blockRefs;

  function ensure(block) {
    if (!block || typeof block !== 'object') return block;
    if (!block.layout || typeof block.layout !== 'object') {
      block.layout = {width:'', widthUnit:'px', height:'', align:'default'};
    }
    if (!('width' in block.layout)) block.layout.width = '';
    if (!('widthUnit' in block.layout)) block.layout.widthUnit = 'px';
    if (!('height' in block.layout)) block.layout.height = '';
    if (!('align' in block.layout)) block.layout.align = 'default';
    if (block.type === 'image') {
      if (!Number.isFinite(+block.imageScale)) block.imageScale = 100;
      if (!block.imageFit) block.imageFit = 'contain';
    }
    return block;
  }

  function walk(blocks, base='', fn=()=>{}) {
    (blocks || []).forEach((block, i) => {
      const path = base ? `${base}.${i}` : `${i}`;
      ensure(block);
      fn(block, path);
      if (block.type === 'hint' || block.type === 'details') {
        walk(block.children, `${path}.children`, fn);
      }
      if (block.type === 'stepper') {
        (block.steps || []).forEach((step, si) => walk(step.children, `${path}.steps.${si}.children`, fn));
      }
    });
  }

  Core.defaultBlock = type => ensure(baseDefaultBlock(type));

  function decodeMeta(source) {
    const match = String(source || '').match(META_RE);
    if (!match) return {};
    try { return JSON.parse(decodeURIComponent(match[1])); }
    catch (_) { return {}; }
  }

  function stripEditorMarkup(source) {
    return String(source || '')
      .replace(META_RE, '')
      .replace(STYLE_RE, '')
      .replace(WRAPPER_OPEN_RE, '')
      .replace(WRAPPER_CLOSE_RE, '');
  }

  Core.parseDocument = source => {
    const meta = decodeMeta(source);
    const doc = baseParseDocument(stripEditorMarkup(source));
    walk(doc.blocks, '', (block, path) => {
      const saved = meta[path];
      if (!saved) return;
      if (saved.layout) block.layout = {...block.layout, ...saved.layout};
      if (block.type === 'image') {
        if (saved.imageScale != null) block.imageScale = +saved.imageScale || 100;
        if (saved.imageFit) block.imageFit = saved.imageFit;
      }
      if (block.type === 'hint' && saved.color != null) block.color = saved.color;
    });
    return doc;
  };

  function hasLayout(block) {
    ensure(block);
    const l = block.layout;
    return !!(
      String(l.width || '').trim() || String(l.height || '').trim() ||
      (l.align && l.align !== 'default') ||
      (block.type === 'image' && ((+block.imageScale || 100) !== 100 || block.imageFit !== 'contain')) ||
      (block.type === 'hint' && block.color)
    );
  }

  function positiveNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function wrapperStyle(block) {
    ensure(block);
    const l = block.layout;
    const styles = ['box-sizing:border-box', 'max-width:100%'];
    const width = positiveNumber(l.width);
    const height = positiveNumber(l.height);
    if (width) styles.push(`width:${width}${l.widthUnit === '%' ? '%' : 'px'}`);
    if (height) styles.push(`height:${height}px`, 'overflow:auto');
    if (l.align === 'center') styles.push('margin-left:auto', 'margin-right:auto');
    else if (l.align === 'right') styles.push('margin-left:auto', 'margin-right:0');
    else if (l.align === 'left') styles.push('margin-left:0', 'margin-right:auto');
    if (block.type === 'image') {
      const scale = Math.max(10, Math.min(500, +block.imageScale || 100)) / 100;
      styles.push(`--sw-image-scale:${scale}`, `--sw-image-fit:${block.imageFit || 'contain'}`, 'overflow:hidden');
    }
    if (block.type === 'hint' && block.color) styles.push(`--sw-hint-color:${block.color}`);
    return styles.join(';');
  }

  function wrapperClass(block) {
    return ['sw-sized', block.type === 'image' ? 'sw-image-frame' : '', block.type === 'hint' && block.color ? 'sw-hint-color' : ''].filter(Boolean).join(' ');
  }

  function cloneWithoutEditorFields(block) {
    const copy = Core.clone(block);
    delete copy.layout;
    delete copy.imageScale;
    delete copy.imageFit;
    return copy;
  }

  function serializeList(blocks, base='') {
    return (blocks || []).map((block, i) => {
      const path = base ? `${base}.${i}` : `${i}`;
      return serializeOne(block, path);
    }).filter(Boolean).join('\n\n');
  }

  function serializeOne(block, path) {
    ensure(block);
    let body = '';
    if (block.type === 'hint') {
      body = `{% hint style="${block.style || 'info'}" %}\n${serializeList(block.children, `${path}.children`)}\n{% endhint %}`;
    } else if (block.type === 'details') {
      const summary = Core.richHtmlToMarkdown(Core.sanitizeRich(block.summaryHtml || 'Подробнее'));
      body = `<details>\n\n<summary>${summary}</summary>\n\n${serializeList(block.children, `${path}.children`)}\n\n</details>`;
    } else if (block.type === 'stepper') {
      body = `{% stepper %}\n${(block.steps || []).map((step, si) => `{% step %}\n${serializeList(step.children, `${path}.steps.${si}.children`)}\n{% endstep %}`).join('\n\n')}\n{% endstepper %}`;
    } else {
      body = baseSerializeBlocks([cloneWithoutEditorFields(block)]);
    }
    if (!hasLayout(block)) return body;
    const style = wrapperStyle(block);
    return `<div class="${wrapperClass(block)}" data-sw-path="${Core.esc(path)}" style="${Core.esc(style)}">\n${body}\n</div><!--sw-sized-->`;
  }

  function buildMeta(blocks) {
    const meta = {};
    walk(blocks, '', (block, path) => {
      if (!hasLayout(block)) return;
      meta[path] = {
        layout: {...block.layout},
        ...(block.type === 'image' ? {imageScale:+block.imageScale || 100, imageFit:block.imageFit || 'contain'} : {}),
        ...(block.type === 'hint' && block.color ? {color:block.color} : {})
      };
    });
    return meta;
  }

  const runtimeStyles = '<div data-sw-editor-style="1" style="display:none"><style>' +
    '.sw-sized{box-sizing:border-box;max-width:100%}' +
    '.sw-image-frame>figure{display:flex;flex-direction:column;height:100%;margin:0!important;overflow:hidden}' +
    '.sw-image-frame>figure>.wiki-image{flex:1;min-height:0;width:100%!important;height:100%;object-fit:var(--sw-image-fit,contain);transform:scale(var(--sw-image-scale,1));transform-origin:center center;transition:transform .18s ease}' +
    '.sw-image-frame>figure>figcaption{flex:none}' +
    '.sw-hint-color>.hint{border-color:color-mix(in srgb,var(--sw-hint-color) 55%,#213036)!important;border-left:4px solid var(--sw-hint-color)!important;background:color-mix(in srgb,var(--sw-hint-color) 8%,#091013)!important}' +
    '</style></div>';

  Core.serializeBlocks = blocks => serializeList(blocks);
  Core.serializeDocument = (frontmatter, blocks) => {
    const meta = encodeURIComponent(JSON.stringify(buildMeta(blocks)));
    return `${frontmatter || ''}<!--SURWAVE_LAYOUT:${meta}-->\n${runtimeStyles}\n${serializeList(blocks)}\n`;
  };

  function applyLayoutToNode(node, block) {
    ensure(block);
    const l = block.layout;
    const width = positiveNumber(l.width);
    const height = positiveNumber(l.height);
    node.style.boxSizing = 'border-box';
    node.style.maxWidth = '100%';
    if (width) node.style.width = `${width}${l.widthUnit === '%' ? '%' : 'px'}`;
    else node.style.removeProperty('width');
    if (height) {
      node.style.height = `${height}px`;
      node.style.overflow = block.type === 'image' ? 'hidden' : 'auto';
    } else {
      node.style.removeProperty('height');
      if (block.type !== 'image') node.style.removeProperty('overflow');
    }
    if (l.align === 'center') { node.style.marginLeft = 'auto'; node.style.marginRight = 'auto'; }
    else if (l.align === 'right') { node.style.marginLeft = 'auto'; node.style.marginRight = '0'; }
    else if (l.align === 'left') { node.style.marginLeft = '0'; node.style.marginRight = 'auto'; }
    else { node.style.removeProperty('margin-left'); node.style.removeProperty('margin-right'); }

    if (block.type === 'image') {
      node.style.overflow = 'hidden';
      const img = node.querySelector('img');
      if (img) {
        const scale = Math.max(10, Math.min(500, +block.imageScale || 100)) / 100;
        img.style.transform = `scale(${scale})`;
        img.style.transformOrigin = 'center center';
        img.style.objectFit = block.imageFit || 'contain';
        if (height) {
          img.style.width = '100%';
          img.style.height = '100%';
        }
      }
    }
  }

  Core.renderBlocksHtml = (blocks, base='') => {
    blockRefs.clear();
    walk(blocks, base, (block, path) => blockRefs.set(path, block));
    const html = baseRenderBlocksHtml(blocks, base);
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('[data-editor-path]').forEach(node => {
      const block = blockRefs.get(node.dataset.editorPath);
      if (block) applyLayoutToNode(node, block);
    });
    queueMicrotask(injectAllControls);
    return template.innerHTML;
  };

  function markDirty() {
    const path = document.getElementById('pagePath');
    if (path) path.dispatchEvent(new Event('input', {bubbles:true}));
  }

  function numberInput(value, min, max, placeholder='авто') {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = '1';
    input.placeholder = placeholder;
    input.value = value || '';
    input.className = 'field sw-number';
    return input;
  }

  function labelControl(text, control) {
    const label = document.createElement('label');
    label.className = 'sw-size-field';
    const span = document.createElement('span');
    span.textContent = text;
    label.append(span, control);
    return label;
  }

  function injectBlockControls(card) {
    if (!card || card.querySelector(':scope > .block-body > .sw-size-controls')) return;
    const path = card.dataset.editorPath;
    const block = blockRefs.get(path);
    if (!block) return;
    ensure(block);
    const body = card.querySelector(':scope > .block-body');
    if (!body) return;

    const box = document.createElement('div');
    box.className = 'sw-size-controls';
    const title = document.createElement('div');
    title.className = 'sw-size-title';
    title.textContent = block.type === 'image' ? 'Размер и масштаб изображения' : 'Размер блока';
    box.appendChild(title);

    const width = numberInput(block.layout.width, 1, 5000);
    const unit = document.createElement('select');
    unit.className = 'field sw-unit';
    unit.innerHTML = '<option value="px">px</option><option value="%">%</option>';
    unit.value = block.layout.widthUnit || 'px';
    const widthWrap = document.createElement('div');
    widthWrap.className = 'sw-inline-control';
    widthWrap.append(width, unit);
    box.appendChild(labelControl(block.type === 'image' ? 'Ширина изображения' : 'Ширина блока', widthWrap));

    const height = numberInput(block.layout.height, 1, 5000);
    box.appendChild(labelControl(block.type === 'image' ? 'Высота изображения, px' : 'Высота блока, px', height));

    const align = document.createElement('select');
    align.className = 'field';
    align.innerHTML = '<option value="default">По умолчанию</option><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option>';
    align.value = block.layout.align || 'default';
    box.appendChild(labelControl('Положение блока', align));

    const commit = () => {
      block.layout.width = width.value;
      block.layout.widthUnit = unit.value;
      block.layout.height = height.value;
      block.layout.align = align.value;
      markDirty();
    };
    width.addEventListener('change', commit);
    height.addEventListener('change', commit);
    unit.addEventListener('change', commit);
    align.addEventListener('change', commit);

    if (block.type === 'image') {
      const scaleRow = document.createElement('div');
      scaleRow.className = 'sw-scale-row';
      const range = document.createElement('input');
      range.type = 'range'; range.min = '10'; range.max = '500'; range.step = '1'; range.value = String(+block.imageScale || 100);
      const scaleNumber = numberInput(+block.imageScale || 100, 10, 500, '100');
      scaleNumber.value = String(+block.imageScale || 100);
      const percent = document.createElement('span'); percent.textContent = '%'; percent.className = 'sw-unit-label';
      scaleRow.append(range, scaleNumber, percent);
      box.appendChild(labelControl('Масштаб внутри рамки', scaleRow));

      const fit = document.createElement('select');
      fit.className = 'field';
      fit.innerHTML = '<option value="contain">Вписать целиком</option><option value="cover">Заполнить рамку</option><option value="fill">Растянуть</option>';
      fit.value = block.imageFit || 'contain';
      box.appendChild(labelControl('Заполнение рамки', fit));

      const preview = document.createElement('div');
      preview.className = 'sw-image-mini-preview';
      if (block.src) {
        const img = document.createElement('img');
        img.src = Core.mediaUrl(block.src);
        img.alt = block.alt || '';
        img.style.transform = `scale(${(+block.imageScale || 100) / 100})`;
        img.style.objectFit = block.imageFit || 'contain';
        preview.appendChild(img);
      } else preview.textContent = 'Изображение не выбрано';
      box.appendChild(preview);

      let scaleTimer;
      const applyScale = value => {
        const n = Math.max(10, Math.min(500, Number(value) || 100));
        block.imageScale = n;
        range.value = String(n);
        scaleNumber.value = String(n);
        const img = preview.querySelector('img');
        if (img) img.style.transform = `scale(${n / 100})`;
        clearTimeout(scaleTimer);
        scaleTimer = setTimeout(markDirty, 80);
      };
      range.addEventListener('input', () => applyScale(range.value));
      scaleNumber.addEventListener('change', () => applyScale(scaleNumber.value));
      fit.addEventListener('change', () => {
        block.imageFit = fit.value;
        const img = preview.querySelector('img');
        if (img) img.style.objectFit = fit.value;
        markDirty();
      });
    }

    body.prepend(box);
  }

  function rememberSelection(editor) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
  }

  function restoreSelection(range) {
    if (!range) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function replaceFontSize(select) {
    if (!select || select.dataset.swPxReady === '1') return;
    select.dataset.swPxReady = '1';
    const toolbar = select.closest('.rich-toolbar');
    const editor = toolbar?.nextElementSibling;
    if (!editor?.classList.contains('rich-editor')) return;

    let savedRange = null;
    const wrap = document.createElement('label');
    wrap.className = 'sw-font-px';
    wrap.title = 'Размер выделенного текста в пикселях';
    const px = numberInput('15', 6, 200, '15');
    px.value = '15';
    const suffix = document.createElement('span'); suffix.textContent = 'px';
    wrap.append(px, suffix);

    const capture = () => { savedRange = rememberSelection(editor) || savedRange; };
    editor.addEventListener('mouseup', capture);
    editor.addEventListener('keyup', capture);
    px.addEventListener('pointerdown', capture);
    px.addEventListener('focus', () => { if (!savedRange) savedRange = rememberSelection(editor); });
    px.addEventListener('change', () => {
      const n = Math.max(6, Math.min(200, Number(px.value) || 15));
      px.value = String(n);
      restoreSelection(savedRange);
      const value = `${n}px`;
      let option = [...select.options].find(o => o.value === value);
      if (!option) {
        option = document.createElement('option');
        option.value = value; option.textContent = value;
        select.appendChild(option);
      }
      select.value = value;
      select.dispatchEvent(new Event('change', {bubbles:true}));
      capture();
    });

    select.style.display = 'none';
    select.after(wrap);
  }

  function injectAllControls() {
    document.querySelectorAll('.block-card[data-editor-path]').forEach(injectBlockControls);
    document.querySelectorAll('select.rich-size').forEach(replaceFontSize);
  }

  const observer = new MutationObserver(() => queueMicrotask(injectAllControls));
  observer.observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', injectAllControls);
})();
