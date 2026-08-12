(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  const previousParse = Core.parseDocument;
  const OPEN_RE = /^<div class="sw-link-gradient(?:\s+[^"]*)?"\s+data-sw-link-gradient="([^"]+)">$/;
  const CLOSE = '</div><!--sw-link-gradient-->';

  function decode(value) {
    try { return JSON.parse(decodeURIComponent(value)); }
    catch (_) { return null; }
  }

  function rawText(block) {
    return block?.type === 'raw' ? String(block.markdown || '').trim() : '';
  }

  function applyLegacyMeta(block, meta) {
    if (!block || block.type !== 'linkgroup' || !meta) return;
    if ('borderGradient' in meta) block.borderGradient = meta.borderGradient !== false;
    if ('textGradient' in meta) block.textGradient = !!meta.textGradient;
    if (meta.borderEdge) block.borderEdge = meta.borderEdge;
    if (meta.borderCenter) block.borderCenter = meta.borderCenter;
    if (meta.textEdge) block.textEdge = meta.textEdge;
    if (meta.textCenter) block.textCenter = meta.textCenter;
    if (meta.gradientStates && !block.gradientStates) block.gradientStates = Core.clone(meta.gradientStates);
    window.SurwaveEnsureGradientStates?.(block);
  }

  function clean(blocks) {
    const source = Array.isArray(blocks) ? blocks : [];
    const out = [];

    for (let i = 0; i < source.length; i++) {
      const block = source[i];
      const firstOpen = rawText(block).match(OPEN_RE);

      if (firstOpen) {
        let j = i;
        const metas = [];
        while (j < source.length) {
          const match = rawText(source[j]).match(OPEN_RE);
          if (!match) break;
          metas.push(decode(match[1]));
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
            // The innermost wrapper is the newest one produced by the latest save.
            const newestMeta = [...metas].reverse().find(Boolean);
            applyLegacyMeta(link, newestMeta);
            out.push(link);
            i = k - 1;
            continue;
          }
        }

        // Broken historical wrapper without a balanced pair: do not expose it as a user block.
        continue;
      }

      // Historical duplicate closing wrappers are editor implementation debris.
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

  window.SurwaveLinkWrapperCleanup = { clean };
})();
