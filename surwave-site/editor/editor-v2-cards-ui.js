(() => {
  const Core = window.SurwaveEditorCoreV2;
  const refs = window.SurwaveEditorBlockRefs;
  if (!Core || !refs) return;

  const DEFAULT_EDGE = '#00ff78';
  const DEFAULT_CENTER = '#00ffc0';

  function markDirty() {
    const field = document.getElementById('pagePath');
    if (field) field.dispatchEvent(new Event('input', {bubbles:true}));
  }

  function ensureGradients(block, enabledByDefault=false) {
    if (block.borderGradient == null) block.borderGradient = enabledByDefault;
    if (block.textGradient == null) block.textGradient = enabledByDefault;
    if (!block.borderEdge) block.borderEdge = DEFAULT_EDGE;
    if (!block.borderCenter) block.borderCenter = DEFAULT_CENTER;
    if (!block.textEdge) block.textEdge = DEFAULT_EDGE;
    if (!block.textCenter) block.textCenter = DEFAULT_CENTER;
  }

  function textInput(value, placeholder='') {
    const input = document.createElement('input');
    input.className = 'field';
    input.type = 'text';
    input.value = value || '';
    input.placeholder = placeholder;
    return input;
  }

  function checkbox(label, checked, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'sw-card-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!checked;
    const text = document.createElement('span');
    text.textContent = label;
    input.addEventListener('change', () => { onChange(input.checked); markDirty(); });
    wrap.append(input, text);
    return wrap;
  }

  function colorField(label, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'sw-card-color-field';
    const title = document.createElement('span');
    title.textContent = label;
    const row = document.createElement('div');
    row.className = 'sw-card-color-row';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = /^#[0-9a-f]{6}$/i.test(value || '') ? value : DEFAULT_EDGE;
    const text = textInput(value || '', '#00ff78');
    const commit = value => { onChange(value); markDirty(); };
    picker.addEventListener('input', () => { text.value = picker.value; commit(picker.value); });
    text.addEventListener('change', () => {
      const v = text.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) picker.value = v;
      commit(v);
    });
    row.append(picker, text);
    wrap.append(title, row);
    return wrap;
  }

  function gradientEditor(block, defaultEnabled=false) {
    ensureGradients(block, defaultEnabled);
    const box = document.createElement('div');
    box.className = 'sw-gradient-editor';
    const title = document.createElement('div');
    title.className = 'sw-gradient-editor-title';
    title.textContent = 'Градиенты';
    box.appendChild(title);

    const toggles = document.createElement('div');
    toggles.className = 'sw-gradient-toggles';
    toggles.append(
      checkbox('Градиент рамки', block.borderGradient, value => block.borderGradient = value),
      checkbox('Градиент текста', block.textGradient, value => block.textGradient = value)
    );
    box.appendChild(toggles);

    const grid = document.createElement('div');
    grid.className = 'sw-gradient-grid';
    grid.append(
      colorField('Рамка · края', block.borderEdge, value => block.borderEdge = value),
      colorField('Рамка · центр', block.borderCenter, value => block.borderCenter = value),
      colorField('Текст · края', block.textEdge, value => block.textEdge = value),
      colorField('Текст · центр', block.textCenter, value => block.textCenter = value)
    );
    box.appendChild(grid);

    const help = document.createElement('div');
    help.className = 'sw-card-help';
    help.textContent = 'Градиент симметричный: самый яркий цвет находится в центре и уходит к краям. Hover и нажатие усиливают заполнение рамки, не превращая её в белую.';
    box.appendChild(help);
    return box;
  }

  async function uploadImage(target, key, onReady) {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/png,image/jpeg,image/gif,image/apng,image/webp,image/svg+xml';
    picker.addEventListener('change', async () => {
      const file = picker.files?.[0];
      if (!file) return;
      if (file.size > 48 * 1024 * 1024) {
        alert('Файл больше 48 МБ.');
        return;
      }
      try {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const response = await fetch('/api/editor/upload', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name:file.name, data})
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
        target[key] = result.source;
        markDirty();
        onReady?.(result.source);
      } catch (error) {
        alert('Не удалось загрузить изображение: ' + error.message);
      }
    }, {once:true});
    picker.click();
  }

  function imagePreview(value) {
    const wrap = document.createElement('div');
    wrap.className = 'sw-card-image-preview';
    if (!value) {
      wrap.classList.add('empty');
      wrap.textContent = 'Без изображения';
      return wrap;
    }
    const img = document.createElement('img');
    img.src = Core.mediaUrl(value);
    img.alt = '';
    wrap.appendChild(img);
    return wrap;
  }

  function serverCardItemEditor(block, item, index) {
    const card = document.createElement('div');
    card.className = 'sw-server-item-editor';
    const head = document.createElement('div');
    head.className = 'sw-server-item-head';
    head.textContent = index === 0 ? 'Левая IP-карточка' : 'Правая IP-карточка';
    card.appendChild(head);

    const ip = textInput(item.ip, index === 0 ? 'mc.surwave.ru' : 'mc.surwave.pro');
    const title = textInput(item.title, 'Текст внутри карточки');
    ip.addEventListener('input', () => { item.ip = ip.value; markDirty(); });
    title.addEventListener('input', () => { item.title = title.value; markDirty(); });

    const labels = document.createElement('div');
    labels.className = 'sw-card-field-grid';
    const ipLabel = document.createElement('label');
    ipLabel.innerHTML = '<span>IP, который копируется</span>';
    ipLabel.appendChild(ip);
    const titleLabel = document.createElement('label');
    titleLabel.innerHTML = '<span>Основной текст карточки</span>';
    titleLabel.appendChild(title);
    labels.append(ipLabel, titleLabel);
    card.appendChild(labels);

    const media = document.createElement('div');
    media.className = 'sw-card-media-editor';
    const preview = imagePreview(item.image);
    const actions = document.createElement('div');
    actions.className = 'sw-card-media-actions';
    const path = textInput(item.image, '.gitbook/assets/image.png');
    path.addEventListener('input', () => { item.image = path.value; preview.replaceWith(imagePreview(item.image)); markDirty(); });
    const upload = document.createElement('button');
    upload.type = 'button'; upload.className = 'btn'; upload.textContent = item.image ? 'Заменить изображение' : 'Добавить изображение';
    upload.addEventListener('click', () => uploadImage(item, 'image', value => { path.value = value; markDirty(); }));
    const clear = document.createElement('button');
    clear.type = 'button'; clear.className = 'btn'; clear.textContent = 'Убрать изображение';
    clear.addEventListener('click', () => { item.image = ''; path.value = ''; markDirty(); });
    actions.append(path, upload, clear);
    media.append(preview, actions);
    card.appendChild(media);

    const fixed = document.createElement('div');
    fixed.className = 'sw-card-fixed-copy';
    fixed.innerHTML = '<span>Обычное состояние: <b>Нажмите чтобы скопировать</b></span><span>После клика: <b>Скопировано</b> · возврат через 5 секунд</span>';
    card.appendChild(fixed);
    return card;
  }

  function injectServerCards(card, block) {
    const body = card.querySelector(':scope > .block-body');
    if (!body || body.querySelector('.sw-servercards-editor')) return;
    block.items = Array.isArray(block.items) ? block.items : [];
    while (block.items.length < 2) {
      const i = block.items.length;
      block.items.push({ip:i === 0 ? 'mc.surwave.ru' : 'mc.surwave.pro', title:i === 0 ? 'mc.surwave.ru' : 'mc.surwave.pro', image:''});
    }
    block.items = block.items.slice(0, 2);
    const box = document.createElement('div');
    box.className = 'sw-servercards-editor';
    box.append(gradientEditor(block, true));
    const items = document.createElement('div');
    items.className = 'sw-server-items-grid';
    items.append(serverCardItemEditor(block, block.items[0], 0), serverCardItemEditor(block, block.items[1], 1));
    box.appendChild(items);
    body.prepend(box);
  }

  function injectLinkGradients(card, block) {
    const body = card.querySelector(':scope > .block-body');
    if (!body || body.querySelector('.sw-link-gradient-settings')) return;
    const settings = gradientEditor(block, false);
    settings.classList.add('sw-link-gradient-settings');
    body.appendChild(settings);

    const editors = body.querySelectorAll('.link-editor-item');
    editors.forEach((editor, index) => {
      const item = block.items?.[index];
      if (!item || editor.querySelector('.sw-link-image-check')) return;
      const box = document.createElement('div');
      box.className = 'sw-link-image-check';
      const preview = imagePreview(item.image);
      const note = document.createElement('span');
      note.textContent = item.image ? 'Изображение этой ссылки будет показано слева в карточке.' : 'Картинка необязательна — карточка корректно выглядит и без неё.';
      box.append(preview, note);
      editor.appendChild(box);
    });
  }

  function scan() {
    document.querySelectorAll('.block-card[data-editor-path]').forEach(card => {
      const block = refs.get(card.dataset.editorPath);
      if (!block) return;
      if (block.type === 'servercards') injectServerCards(card, block);
      if (block.type === 'linkgroup') injectLinkGradients(card, block);
    });
  }

  const observer = new MutationObserver(() => queueMicrotask(scan));
  observer.observe(document.body, {childList:true, subtree:true});
  [0, 120, 260, 600, 1200].forEach(delay => setTimeout(scan, delay));
})();
