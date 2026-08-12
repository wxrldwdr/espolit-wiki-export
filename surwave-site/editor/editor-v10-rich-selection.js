(() => {
  const savedRanges = new WeakMap();

  function editorFromToolbar(toolbar) {
    if (!toolbar) return null;
    const wrap = toolbar.parentElement;
    return wrap?.querySelector(':scope > .rich-editor') || wrap?.querySelector('.rich-editor') || null;
  }

  function rangeInside(editor, range) {
    if (!editor || !range) return false;
    const node = range.commonAncestorContainer;
    return node === editor || editor.contains(node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode);
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
    if (!editor) return null;
    const stored = savedRanges.get(editor);
    if (!stored || !stored.startContainer?.isConnected || !stored.endContainer?.isConnected || !rangeInside(editor, stored)) return null;
    try {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(stored);
      return stored;
    } catch (_) {
      return null;
    }
  }

  function saveCurrentSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const anchor = selection.anchorNode;
    const element = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement;
    const editor = element?.closest?.('.rich-editor');
    if (editor) remember(editor);
  }

  function setSavedSelection(editor, node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    savedRanges.set(editor, range.cloneRange());
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function applyStyle(editor, property, value) {
    const restored = restore(editor);
    if (!restored || restored.collapsed) return false;

    try {
      if (
        restored.startContainer === restored.endContainer &&
        restored.startContainer.nodeType === Node.ELEMENT_NODE &&
        restored.startOffset === 0 &&
        restored.endOffset === restored.startContainer.childNodes.length &&
        restored.startContainer !== editor &&
        restored.startContainer.tagName === 'SPAN'
      ) {
        restored.startContainer.style.setProperty(property, value);
        setSavedSelection(editor, restored.startContainer);
        editor.dispatchEvent(new Event('input', {bubbles:true}));
        return true;
      }

      const range = restored.cloneRange();
      const fragment = range.extractContents();
      const span = document.createElement('span');
      span.style.setProperty(property, value);
      span.appendChild(fragment);
      range.insertNode(span);
      setSavedSelection(editor, span);
      editor.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    } catch (error) {
      console.warn('Surwave rich-text style apply failed', error);
      return false;
    }
  }

  function richControl(target) {
    const toolbar = target?.closest?.('.rich-toolbar');
    if (!toolbar) return null;
    const editor = editorFromToolbar(toolbar);
    if (!editor) return null;

    if (target.matches('input[type="color"]')) {
      const title = String(target.title || '').toLowerCase();
      return {
        editor,
        property: title.includes('выдел') ? 'background-color' : 'color',
        value: target.value
      };
    }

    if (target.matches('select.rich-size')) {
      const raw = String(target.value || '').trim();
      return {editor, property:'font-size', value:/px$/i.test(raw) ? raw : `${raw}px`};
    }

    if (target.matches('input[type="number"]')) {
      const raw = Number(target.value);
      if (Number.isFinite(raw) && raw >= 1 && raw <= 500) {
        return {editor, property:'font-size', value:`${raw}px`};
      }
    }
    return null;
  }

  document.addEventListener('selectionchange', saveCurrentSelection);

  document.addEventListener('pointerdown', event => {
    const toolbar = event.target?.closest?.('.rich-toolbar');
    if (toolbar) {
      const editor = editorFromToolbar(toolbar);
      if (editor) remember(editor);
    }

    const card = event.target?.closest?.('.block-card[data-editor-path]');
    if (!card) return;
    const handle = event.target.closest('.drag-handle');
    card.draggable = !!handle;
    if (handle) card.dataset.swDragArmed = '1';
    else delete card.dataset.swDragArmed;
  }, true);

  document.addEventListener('mousedown', event => {
    const toolbar = event.target?.closest?.('.rich-toolbar');
    if (!toolbar) return;
    const editor = editorFromToolbar(toolbar);
    if (editor) remember(editor);
  }, true);

  function handleStyleEvent(event) {
    const control = richControl(event.target);
    if (!control) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyStyle(control.editor, control.property, control.value);
    return true;
  }

  document.addEventListener('input', handleStyleEvent, true);
  document.addEventListener('change', event => {
    const target = event.target;
    if (!target?.closest?.('.rich-toolbar')) return;
    if (!target.matches('select.rich-size,input[type="number"]')) return;
    handleStyleEvent(event);
  }, true);

  function disarm(card) {
    if (!card) return;
    card.draggable = false;
    delete card.dataset.swDragArmed;
  }

  document.addEventListener('dragend', event => disarm(event.target?.closest?.('.block-card')), true);
  document.addEventListener('drop', () => {
    document.querySelectorAll('.block-card[draggable="true"]').forEach(disarm);
  }, true);
  document.addEventListener('mouseup', () => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.block-card[draggable="true"]').forEach(card => {
        if (!document.documentElement.classList.contains('is-block-dragging')) disarm(card);
      });
    });
  }, true);

  function normalizeCards(root = document) {
    root.querySelectorAll?.('.block-card[data-editor-path]').forEach(card => {
      if (card.dataset.swDragArmed !== '1') card.draggable = false;
    });
  }

  const observer = new MutationObserver(mutations => {
    if (!mutations.some(m => m.addedNodes.length)) return;
    requestAnimationFrame(() => normalizeCards());
  });
  observer.observe(document.getElementById('blocks') || document.body, {childList:true, subtree:true});
  [0,100,300,700].forEach(ms => setTimeout(() => normalizeCards(), ms));
})();