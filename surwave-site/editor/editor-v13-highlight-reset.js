(() => {
  const savedRanges = new WeakMap();
  let scanFrame = 0;

  function editorFromToolbar(toolbar) {
    if (!toolbar) return null;
    const wrap = toolbar.parentElement;
    return wrap?.querySelector(':scope > .rich-editor') || wrap?.querySelector('.rich-editor') || null;
  }

  function rangeInside(editor, range) {
    if (!editor || !range) return false;
    const node = range.commonAncestorContainer;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentNode;
    return node === editor || !!(element && editor.contains(element));
  }

  function remember(editor) {
    if (!editor) return false;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;
    const range = selection.getRangeAt(0);
    if (!rangeInside(editor, range)) return false;
    try {
      savedRanges.set(editor, range.cloneRange());
      return true;
    } catch (_) {
      return false;
    }
  }

  function restore(editor) {
    const range = savedRanges.get(editor);
    if (!range || !range.startContainer?.isConnected || !range.endContainer?.isConnected || !rangeInside(editor, range)) return null;
    try {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return range.cloneRange();
    } catch (_) {
      return null;
    }
  }

  function isHighlightElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (element.tagName === 'MARK') return true;
    const style = element.getAttribute('style') || '';
    return !!element.style.backgroundColor || /(?:^|;)\s*background(?:-color)?\s*:/i.test(style);
  }

  function highlightAncestor(node, editor) {
    let element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    while (element && element !== editor) {
      if (isHighlightElement(element)) return element;
      element = element.parentElement;
    }
    return null;
  }

  function copyAttributes(from, to) {
    [...from.attributes].forEach(attr => to.setAttribute(attr.name, attr.value));
  }

  function clearBackgroundFromElement(element) {
    if (!element?.parentNode) return element;
    let target = element;
    if (element.tagName === 'MARK') {
      target = document.createElement('span');
      copyAttributes(element, target);
      while (element.firstChild) target.appendChild(element.firstChild);
      element.replaceWith(target);
    }
    target.style.removeProperty('background-color');
    target.style.removeProperty('background');
    const style = target.getAttribute('style');
    if (style != null && !style.trim()) target.removeAttribute('style');
    return target;
  }

  function clearedClone(element) {
    const clone = element.tagName === 'MARK' ? document.createElement('span') : element.cloneNode(false);
    if (element.tagName === 'MARK') copyAttributes(element, clone);
    clone.style.removeProperty('background-color');
    clone.style.removeProperty('background');
    const style = clone.getAttribute('style');
    if (style != null && !style.trim()) clone.removeAttribute('style');
    return clone;
  }

  function splitSingleHighlight(element, range, editor) {
    if (!element || !element.contains(range.startContainer) || !element.contains(range.endContainer)) return false;
    try {
      const beforeRange = document.createRange();
      beforeRange.selectNodeContents(element);
      beforeRange.setEnd(range.startContainer, range.startOffset);

      const selectedRange = range.cloneRange();

      const afterRange = document.createRange();
      afterRange.selectNodeContents(element);
      afterRange.setStart(range.endContainer, range.endOffset);

      const beforeFragment = beforeRange.cloneContents();
      const selectedFragment = selectedRange.cloneContents();
      const afterFragment = afterRange.cloneContents();
      if (!selectedFragment.hasChildNodes()) return false;

      const replacement = document.createDocumentFragment();
      if (beforeFragment.hasChildNodes()) {
        const before = element.cloneNode(false);
        before.appendChild(beforeFragment);
        replacement.appendChild(before);
      }

      const middle = clearedClone(element);
      middle.appendChild(selectedFragment);
      replacement.appendChild(middle);

      if (afterFragment.hasChildNodes()) {
        const after = element.cloneNode(false);
        after.appendChild(afterFragment);
        replacement.appendChild(after);
      }

      element.replaceWith(replacement);
      const selected = document.createRange();
      selected.selectNodeContents(middle);
      savedRanges.set(editor, selected.cloneRange());
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selected);
      return true;
    } catch (error) {
      console.warn('Surwave highlight reset split failed', error);
      return false;
    }
  }

  function fullyContains(range, element) {
    try {
      const contents = document.createRange();
      contents.selectNodeContents(element);
      return range.compareBoundaryPoints(Range.START_TO_START, contents) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, contents) >= 0;
    } catch (_) {
      return false;
    }
  }

  function clearHighlight(editor) {
    const range = restore(editor);
    if (!range || range.collapsed) return false;

    const startHighlight = highlightAncestor(range.startContainer, editor);
    const endHighlight = highlightAncestor(range.endContainer, editor);
    let changed = false;

    if (startHighlight && startHighlight === endHighlight) {
      changed = splitSingleHighlight(startHighlight, range, editor);
    } else {
      const candidates = [...editor.querySelectorAll('mark,[style]')]
        .filter(isHighlightElement)
        .filter(element => {
          try { return range.intersectsNode(element); } catch (_) { return false; }
        })
        .filter(element => fullyContains(range, element));

      for (const element of candidates) {
        if (!element.isConnected) continue;
        clearBackgroundFromElement(element);
        changed = true;
      }
    }

    if (changed) {
      editor.dispatchEvent(new Event('input', {bubbles:true}));
      requestAnimationFrame(() => remember(editor));
    }
    return changed;
  }

  function decorateToolbar(toolbar) {
    if (!toolbar || toolbar.querySelector('.sw-highlight-reset-button')) return;
    const highlight = [...toolbar.querySelectorAll('input[type="color"]')]
      .find(input => String(input.title || '').toLowerCase().includes('выдел'));
    if (!highlight) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sw-highlight-reset-button';
    button.textContent = 'Сброс';
    button.title = 'Убрать цвет выделения у выбранного текста';
    button.addEventListener('mousedown', event => {
      event.preventDefault();
      event.stopPropagation();
      const editor = editorFromToolbar(toolbar);
      if (!editor) return;
      remember(editor);
      clearHighlight(editor);
    });
    highlight.insertAdjacentElement('afterend', button);
  }

  function scan() {
    document.querySelectorAll('.rich-toolbar').forEach(decorateToolbar);
  }

  function scheduleScan() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(() => {
      scanFrame = 0;
      scan();
    });
  }

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const node = selection.anchorNode;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const editor = element?.closest?.('.rich-editor');
    if (editor) remember(editor);
  });

  document.addEventListener('pointerdown', event => {
    const toolbar = event.target?.closest?.('.rich-toolbar');
    if (!toolbar) return;
    remember(editorFromToolbar(toolbar));
  }, true);

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length)) scheduleScan();
  });
  observer.observe(document.getElementById('blocks') || document.body, {childList:true, subtree:true});
  [0, 100, 300, 700, 1400].forEach(delay => setTimeout(scheduleScan, delay));
})();
