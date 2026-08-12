(() => {
  const collapsedBlocks = new WeakSet();
  const collapsedPaths = new Set();
  let dragging = false;
  let pointerY = 0;
  let scrollFrame = 0;

  function blockMap() {
    return window.SurwaveEditorBlockRefs instanceof Map ? window.SurwaveEditorBlockRefs : null;
  }

  function blockFor(card) {
    return blockMap()?.get(card?.dataset?.editorPath || '') || null;
  }

  function setButtonState(card, collapsed) {
    const button = card.querySelector(':scope > .block-head > .block-collapse-toggle');
    if (!button) return;
    button.textContent = collapsed ? '▸' : '▾';
    button.title = collapsed ? 'Развернуть блок' : 'Свернуть блок';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function setCollapsed(card, collapsed) {
    const path = card.dataset.editorPath || '';
    const block = blockFor(card);
    if (block) {
      if (collapsed) collapsedBlocks.add(block);
      else collapsedBlocks.delete(block);
      collapsedPaths.delete(path);
    } else if (path) {
      if (collapsed) collapsedPaths.add(path);
      else collapsedPaths.delete(path);
    }
    card.classList.toggle('is-editor-collapsed', collapsed);
    setButtonState(card, collapsed);
  }

  function restoreCollapsed(card) {
    const path = card.dataset.editorPath || '';
    const block = blockFor(card);
    let collapsed = false;
    if (block && collapsedBlocks.has(block)) {
      collapsed = true;
      collapsedPaths.delete(path);
    } else if (path && collapsedPaths.has(path)) {
      collapsed = true;
      if (block) {
        collapsedBlocks.add(block);
        collapsedPaths.delete(path);
      }
    }
    card.classList.toggle('is-editor-collapsed', collapsed);
    setButtonState(card, collapsed);
  }

  function injectCollapse(card) {
    const head = card.querySelector(':scope > .block-head');
    if (!head) return;
    let button = head.querySelector(':scope > .block-collapse-toggle');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'icon-btn block-collapse-toggle';
      const spacer = head.querySelector(':scope > .block-spacer');
      if (spacer) head.insertBefore(button, spacer);
      else head.appendChild(button);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setCollapsed(card, !card.classList.contains('is-editor-collapsed'));
      });
    }
    restoreCollapsed(card);
  }

  function scan() {
    document.querySelectorAll('.block-card[data-editor-path]').forEach(injectCollapse);
  }

  function promoteCollapsedToBlocks() {
    const unresolved = new Set();
    document.querySelectorAll('.block-card.is-editor-collapsed[data-editor-path]').forEach(card => {
      const block = blockFor(card);
      if (block) collapsedBlocks.add(block);
      else if (card.dataset.editorPath) unresolved.add(card.dataset.editorPath);
    });
    collapsedPaths.clear();
    unresolved.forEach(path => collapsedPaths.add(path));
  }

  function scrollVelocity() {
    if (!dragging) return 0;
    const topbar = document.querySelector('.editor-topbar');
    const top = topbar ? topbar.getBoundingClientRect().bottom : 0;
    const edge = Math.max(90, Math.min(150, innerHeight * 0.16));
    const topEdge = top + edge;
    const bottomEdge = innerHeight - edge;
    const maxSpeed = 30;
    if (pointerY < topEdge) {
      const ratio = Math.min(1, Math.max(0, (topEdge - pointerY) / edge));
      return -Math.max(2, maxSpeed * ratio * ratio);
    }
    if (pointerY > bottomEdge) {
      const ratio = Math.min(1, Math.max(0, (pointerY - bottomEdge) / edge));
      return Math.max(2, maxSpeed * ratio * ratio);
    }
    return 0;
  }

  function autoScrollTick() {
    scrollFrame = 0;
    if (!dragging) return;
    const velocity = scrollVelocity();
    if (velocity) window.scrollBy(0, velocity);
    scrollFrame = requestAnimationFrame(autoScrollTick);
  }

  function startAutoScroll(event) {
    const handle = event.target?.closest?.('.drag-handle');
    if (!handle) return;
    dragging = true;
    pointerY = event.clientY || innerHeight / 2;
    promoteCollapsedToBlocks();
    document.documentElement.classList.add('is-block-dragging');
    if (!scrollFrame) scrollFrame = requestAnimationFrame(autoScrollTick);
  }

  function stopAutoScroll() {
    if (!dragging) return;
    dragging = false;
    document.documentElement.classList.remove('is-block-dragging');
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    setTimeout(scan, 140);
    setTimeout(scan, 260);
  }

  document.addEventListener('dragstart', startAutoScroll, true);
  document.addEventListener('dragover', event => {
    if (!dragging) return;
    pointerY = event.clientY;
  }, true);
  document.addEventListener('drop', stopAutoScroll, true);
  document.addEventListener('dragend', stopAutoScroll, true);

  const observer = new MutationObserver(() => queueMicrotask(scan));
  observer.observe(document.body, {childList:true, subtree:true});
  [0, 100, 250, 600, 1200].forEach(ms => setTimeout(scan, ms));
})();
