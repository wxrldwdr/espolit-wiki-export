(() => {
  const pageList = document.getElementById('pageList');
  const toast = document.getElementById('toast');
  if (!pageList) return;

  let inventory = {pages: [], groups: []};
  let scanFrame = 0;
  let toastTimer = 0;
  let busy = false;

  function notify(text, ms = 2400) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), ms);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {cache: 'no-store', ...options});
    let data = {};
    try { data = await response.json(); }
    catch (_) { data = {error: `HTTP ${response.status}`}; }
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function groupName(title) {
    if (!title) return '';
    if (title.dataset.groupName) return title.dataset.groupName;
    return [...title.childNodes]
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent)
      .join('')
      .trim();
  }

  function pagePath(button) {
    return button?.querySelector('small')?.textContent?.trim() || '';
  }

  function pageRow(button) {
    return button?.parentElement?.classList.contains('page-item-archive-row') ? button.parentElement : button;
  }

  function reorderDom() {
    const titleMap = new Map();
    pageList.querySelectorAll('.page-group-title').forEach(title => {
      const name = groupName(title);
      if (name) titleMap.set(name, title);
    });

    const pageMap = new Map();
    pageList.querySelectorAll('.page-item').forEach(button => {
      const path = pagePath(button);
      if (path) pageMap.set(path, pageRow(button));
    });

    const fragment = document.createDocumentFragment();
    const used = new Set();
    for (const group of inventory.groups || []) {
      const title = titleMap.get(group);
      if (title) {
        fragment.appendChild(title);
        used.add(title);
      }
      for (const page of (inventory.pages || []).filter(item => (item.group || 'Без раздела') === group)) {
        const row = pageMap.get(page.path);
        if (row) {
          fragment.appendChild(row);
          used.add(row);
        }
      }
    }
    for (const node of [...pageList.children]) {
      if (!used.has(node)) fragment.appendChild(node);
    }
    pageList.appendChild(fragment);
  }

  function updateButtons() {
    const groups = inventory.groups || [];
    pageList.querySelectorAll('.page-group-title').forEach(title => {
      const name = groupName(title);
      const controls = title.querySelector(':scope > .group-order-controls');
      if (!controls) return;
      const index = groups.indexOf(name);
      const up = controls.querySelector('[data-direction="-1"]');
      const down = controls.querySelector('[data-direction="1"]');
      if (up) up.disabled = busy || index <= 0;
      if (down) down.disabled = busy || index < 0 || index >= groups.length - 1;
    });
  }

  async function refresh(reorder = false) {
    inventory = await api('/api/editor/pages');
    if (reorder) reorderDom();
    schedule();
  }

  async function moveGroup(name, direction) {
    if (busy) return;
    busy = true;
    updateButtons();
    try {
      const capabilities = await api('/api/editor/capabilities');
      if (!capabilities.moveGroup) {
        throw new Error('Локальный сервер редактора не поддерживает перемещение разделов. Перезапусти START_EDITOR.bat после замены serve_editor.py.');
      }
      await api('/api/editor/move-group', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({group: name, direction})
      });
      await refresh(true);
      notify(`Раздел «${name}» перемещён ${direction < 0 ? 'выше' : 'ниже'} вместе со всеми страницами`);
    } catch (error) {
      notify('Ошибка перемещения раздела: ' + error.message, 6000);
    } finally {
      busy = false;
      updateButtons();
    }
  }

  function makeButton(symbol, title, direction, name) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'group-order-button';
    button.textContent = symbol;
    button.title = title;
    button.dataset.direction = String(direction);
    button.addEventListener('pointerdown', event => event.stopPropagation());
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      void moveGroup(name, direction);
    });
    return button;
  }

  function decorateTitle(title) {
    const name = groupName(title);
    if (!name) return;
    title.dataset.groupName = name;
    let controls = title.querySelector(':scope > .group-order-controls');
    if (!controls) {
      controls = document.createElement('span');
      controls.className = 'group-order-controls';
      controls.append(
        makeButton('↑', 'Переместить раздел выше', -1, name),
        makeButton('↓', 'Переместить раздел ниже', 1, name)
      );
      const rename = title.querySelector(':scope > .rename-group');
      if (rename) title.insertBefore(controls, rename);
      else title.appendChild(controls);
    }
    updateButtons();
  }

  function scan() {
    pageList.querySelectorAll('.page-group-title').forEach(decorateTitle);
    updateButtons();
  }

  function schedule() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(() => {
      scanFrame = 0;
      scan();
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .page-group-title{display:flex;align-items:center;gap:3px;min-width:0}
    .page-group-title>.group-order-controls{display:inline-flex;align-items:center;gap:1px;margin-left:auto}
    .group-order-button{width:22px;height:22px;padding:0;border:1px solid transparent;border-radius:5px;background:transparent;color:#71867e;cursor:pointer;font:700 12px/1 system-ui}
    .group-order-button:hover:not(:disabled){color:#00ffc0;border-color:rgba(0,255,192,.22);background:rgba(0,255,120,.06)}
    .group-order-button:disabled{opacity:.22;cursor:default}
    .page-group-title>.rename-group{flex:0 0 auto}
    .page-group-title>.group-archive-toggle{flex:0 0 auto}
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) schedule();
  });
  observer.observe(pageList, {childList: true, subtree: true});

  refresh(false).catch(error => notify('Ошибка порядка разделов: ' + error.message, 5000));
  [100, 300, 800].forEach(delay => setTimeout(schedule, delay));
  window.SurwaveGroupOrderV23 = true;
})();
