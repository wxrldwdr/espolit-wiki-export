(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  const previousParse = Core.parseDocument;
  const CLOSE = '</div><!--sw-link-gradient-->';

  function decode(value) {
    try { return JSON.parse(decodeURIComponent(value)); }
    catch (_) { return null; }
  }

  function rawText(block) {
    return block?.type === 'raw' ? String(block.markdown || '').trim() : '';
  }

  function parseOpen(block) {
    const text = rawText(block);
    if (!/^<div\b/i.test(text)) return null;

    const classMatch = text.match(/\bclass="([^"]*)"/i);
    if (!classMatch) return null;
    const classes = classMatch[1].trim().split(/\s+/).filter(Boolean);
    if (!classes.includes('sw-link-gradient')) return null;

    const dataMatch = text.match(/\bdata-sw-link-gradient="([^"]+)"/i);
    if (!dataMatch) return null;

    return {
      encoded: dataMatch[1],
      meta: decode(dataMatch[1])
    };
  }

  function applySavedMeta(block, meta) {
    if (!block || block.type !== 'linkgroup' || !meta) return;
    if ('borderGradient' in meta) block.borderGradient = meta.borderGradient !== false;
    if ('textGradient' in meta) block.textGradient = !!meta.textGradient;
    if (meta.borderEdge) block.borderEdge = meta.borderEdge;
    if (meta.borderCenter) block.borderCenter = meta.borderCenter;
    if (meta.textEdge) block.textEdge = meta.textEdge;
    if (meta.textCenter) block.textCenter = meta.textCenter;
    if (meta.gradientStates && typeof meta.gradientStates === 'object') {
      block.gradientStates = Core.clone(meta.gradientStates);
    }
    window.SurwaveEnsureGradientStates?.(block);
  }

  function clean(blocks) {
    const source = Array.isArray(blocks) ? blocks : [];
    const out = [];

    for (let i = 0; i < source.length; i++) {
      const block = source[i];
      const firstOpen = parseOpen(block);

      if (firstOpen) {
        let j = i;
        const metas = [];

        // Accept any historical/future wrapper variant. The tag may contain
        // data-sw-gradient-v, style, extra classes or attributes in any order.
        while (j < source.length) {
          const parsed = parseOpen(source[j]);
          if (!parsed) break;
          metas.push(parsed.meta);
          j++;
        }

        if (source[j]?.type === 'linkgroup') {
          const link = source[j];
          let k = j + 1;
          let closeCount = 0;
          while (k < source.length && rawText(source[k]) === CLOSE) {
            closeCount++;
            k++;
          }

          if (closeCount > 0) {
            // The innermost wrapper is the latest wrapper around the actual link block.
            const newestMeta = [...metas].reverse().find(Boolean);
            applySavedMeta(link, newestMeta);
            out.push(link);
            i = k - 1;
            continue;
          }
        }

        // Historical orphan wrapper: implementation debris, never a user block.
        continue;
      }

      // Historical duplicate closing wrappers are implementation debris too.
      if (rawText(block) === CLOSE) continue;

      if (block?.type === 'hint' || block?.type === 'details') {
        block.children = clean(block.children);
      } else if (block?.type === 'stepper') {
        block.steps = (block.steps || []).map(step => ({...step, children: clean(step.children)}));
      }

      out.push(block);
    }

    return out;
  }

  Core.parseDocument = source => {
    const doc = previousParse(source);
    doc.blocks = clean(doc.blocks);
    return doc;
  };

  window.SurwaveLinkWrapperCleanup = { clean, parseOpen };
})();
