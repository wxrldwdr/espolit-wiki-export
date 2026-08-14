(() => {
  const NAV_PREFIX = 'surwave.wiki.nav.v1:';
  const DETAILS_PREFIX = 'surwave.wiki.details.v1:';
  const DATA_URL = '/surwave-site/assets/js/site-data.json';
  const CONTENT_ROOT = '/surwave-site/content/';
  const SITE_ROOT = '/surwave-site/wiki/';
  const pageSource = document.body.dataset.source || location.pathname;

  let scanFrame = 0;
  let searchIndexPromise = null;
  let searchSequence = 0;

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); }
      catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, String(value)); }
      catch (_) {}
    }
  };

  const esc = value => String(value ?? '').replace(/[&<>\"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[char]));

  const fold = value => String(value ?? '')
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

  function groupTitle(section) {
    return section.querySelector(':scope > .nav-title > span')?.textContent?.trim() || '';
  }

  function applyNavigationState() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.querySelectorAll(':scope > .nav-group').forEach(section => {
      const title = groupTitle(section);
      if (!title) return;
      const key = NAV_PREFIX + title;
      const saved = storage.get(key);
      section.classList.toggle('open', saved == null ? true : saved === '1');

      const button = section.querySelector(':scope > .nav-title');
      if (!button || button.dataset.swPersistentNav === '1') return;
      button.dataset.swPersistentNav = '1';
      button.addEventListener('click', () => {
        // migrated-wiki toggles .open itself. Read the final state after its handler.
        setTimeout(() => storage.set(key, section.classList.contains('open') ? '1' : '0'), 0);
      });
    });
  }

  function detailsKey(details, index) {
    const summary = fold(details.querySelector(':scope > summary')?.textContent || 'details').slice(0, 90);
    return `${DETAILS_PREFIX}${pageSource}:${index}:${summary}`;
  }

  function applyDetailsState() {
    const article = document.querySelector('.article');
    if (!article) return;
    [...article.querySelectorAll('details')].forEach((details, index) => {
      const key = detailsKey(details, index);
      if (details.dataset.swPersistentDetails !== key) {
        details.dataset.swPersistentDetails = key;
        const saved = storage.get(key);
        details.open = saved == null ? true : saved === '1';
      }
      if (details.dataset.swPersistentDetailsBound === '1') return;
      details.dataset.swPersistentDetailsBound = '1';
      details.addEventListener('toggle', () => {
        storage.set(details.dataset.swPersistentDetails, details.open ? '1' : '0');
      });
    });
  }

  function sourceUrl(source) {
    return CONTENT_ROOT + String(source || '')
      .replace(/^\/+/, '')
      .split('/')
      .map(encodeURIComponent)
      .join('/');
  }

  function markdownText(raw) {
    return String(raw || '')
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ' ')
      .replace(/<!--[^]*?-->/g, ' ')
      .replace(/<style\b[^>]*>[^]*?<\/style>/gi, ' ')
      .replace(/```[^]*?```/g, ' ')
      .replace(/\[\[SW_IMG:[^\]]+\]\]/g, ' ')
      .replace(/\{%[^%]*%\}/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_~`|]+/g, ' ')
      .replace(/&nbsp;|&#x20;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function loadSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;
    searchIndexPromise = (async () => {
      const response = await fetch(DATA_URL, {cache: 'force-cache'});
      if (!response.ok) throw new Error(`site-data.json: HTTP ${response.status}`);
      const data = await response.json();
      const pages = [];
      if (!data.homeArchived) {
        pages.push({title: 'Добро пожаловать', group: 'Главная', href: 'index.html', source: 'README.md'});
      }
      for (const group of data.groups || []) {
        for (const item of group.items || []) {
          pages.push({
            title: String(item.title || item.source || 'Страница'),
            group: String(group.title || 'Раздел'),
            href: String(item.href || ''),
            source: String(item.source || '')
          });
        }
      }

      await Promise.all(pages.map(async page => {
        try {
          const r = await fetch(sourceUrl(page.source), {cache: 'force-cache'});
          page.text = r.ok ? markdownText(await r.text()) : '';
        } catch (_) {
          page.text = '';
        }
        page.titleFold = fold(page.title);
        page.groupFold = fold(page.group);
        page.textFold = fold(page.text);
      }));
      return pages;
    })().catch(error => {
      searchIndexPromise = null;
      throw error;
    });
    return searchIndexPromise;
  }

  function scorePage(page, query) {
    const terms = query.split(/\s+/).filter(Boolean);
    let score = 0;
    if (page.titleFold.includes(query)) score += 220;
    if (page.groupFold.includes(query)) score += 130;
    if (page.textFold.includes(query)) score += 90;
    for (const term of terms) {
      if (page.titleFold.includes(term)) score += 42;
      if (page.groupFold.includes(term)) score += 24;
      if (page.textFold.includes(term)) score += 12;
      else return score ? score - 30 : 0;
    }
    return score;
  }

  function snippet(page, query) {
    const text = page.text || '';
    if (!text) return 'Совпадение найдено в названии страницы или раздела.';
    const folded = fold(text);
    let at = folded.indexOf(query);
    if (at < 0) {
      const term = query.split(/\s+/).find(Boolean) || query;
      at = folded.indexOf(term);
    }
    if (at < 0) return text.slice(0, 180) + (text.length > 180 ? '…' : '');
    const start = Math.max(0, at - 72);
    const end = Math.min(text.length, at + query.length + 118);
    return (start ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
  }

  function highlight(value, rawQuery) {
    const query = String(rawQuery || '').trim();
    if (!query) return esc(value);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let re;
    try { re = new RegExp(`(${escaped})`, 'ig'); }
    catch (_) { return esc(value); }
    return String(value || '').split(re).map((part, index) => index % 2 ? `<mark>${esc(part)}</mark>` : esc(part)).join('');
  }

  function ensureSearchPanel(input) {
    const search = input.closest('.search');
    if (!search) return null;
    let panel = search.querySelector(':scope > .sw-search-results');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'sw-search-results';
    panel.hidden = true;
    panel.innerHTML = '<div class="sw-search-status">Введите хотя бы 2 символа</div>';
    search.appendChild(panel);
    document.addEventListener('pointerdown', event => {
      if (!search.contains(event.target)) panel.hidden = true;
    });
    return panel;
  }

  function renderSearch(panel, pages, rawQuery) {
    const query = fold(rawQuery);
    const ranked = pages
      .map(page => ({page, score: scorePage(page, query)}))
      .filter(row => row.score > 0)
      .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title, 'ru'))
      .slice(0, 12);

    if (!ranked.length) {
      panel.innerHTML = '<div class="sw-search-empty"><strong>Ничего не найдено</strong><span>Попробуйте другое слово или часть команды.</span></div>';
      panel.hidden = false;
      return;
    }

    panel.innerHTML = `<div class="sw-search-head"><span>Найдено по страницам</span><small>${ranked.length}${ranked.length === 12 ? '+' : ''}</small></div>` + ranked.map(({page}) => {
      const href = SITE_ROOT + page.href.replace(/^\/+/, '');
      return `<a class="sw-search-result" href="${esc(href)}">
        <span class="sw-search-result-meta">${highlight(page.group, rawQuery)}</span>
        <strong>${highlight(page.title, rawQuery)}</strong>
        <small>${highlight(snippet(page, query), rawQuery)}</small>
      </a>`;
    }).join('');
    panel.hidden = false;
  }

  function bindSearch() {
    const input = document.getElementById('navSearch');
    if (!input || input.dataset.swFullSearch === '1') return;
    input.dataset.swFullSearch = '1';
    input.placeholder = 'Поиск по Wiki…';
    const panel = ensureSearchPanel(input);
    if (!panel) return;

    const run = async () => {
      const raw = input.value.trim();
      const query = fold(raw);
      const sequence = ++searchSequence;
      if (query.length < 2) {
        panel.hidden = true;
        return;
      }
      panel.hidden = false;
      panel.innerHTML = '<div class="sw-search-loading"><span></span>Ищу по содержимому Wiki…</div>';
      try {
        const pages = await loadSearchIndex();
        if (sequence !== searchSequence || fold(input.value) !== query) return;
        renderSearch(panel, pages, raw);
      } catch (_) {
        if (sequence !== searchSequence) return;
        panel.innerHTML = '<div class="sw-search-empty"><strong>Поиск временно недоступен</strong><span>Не удалось загрузить индекс страниц.</span></div>';
      }
    };

    // Capture phase prevents the legacy title-only filter from hiding the whole sidebar.
    input.addEventListener('input', event => {
      event.stopImmediatePropagation();
      void run();
    }, true);
    input.addEventListener('focus', () => {
      if (fold(input.value).length >= 2) void run();
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') panel.hidden = true;
      if (event.key === 'Enter') {
        const first = panel.querySelector('.sw-search-result');
        if (first && !panel.hidden) {
          event.preventDefault();
          first.click();
        }
      }
    });
  }

  function ensureSidebarGlow() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    let track = document.querySelector('.sw-sidebar-scroll-track');
    if (!track) {
      track = document.createElement('div');
      track.className = 'sw-sidebar-scroll-track';
      track.innerHTML = '<span class="sw-sidebar-scroll-glow"></span>';
      document.body.appendChild(track);
    }
    const glow = track.firstElementChild;

    const update = () => {
      const mobile = matchMedia('(max-width:760px)').matches;
      const rect = sidebar.getBoundingClientRect();
      const overflow = sidebar.scrollHeight - sidebar.clientHeight;
      const visible = !mobile && overflow > 3 && rect.right > 0;
      track.hidden = !visible;
      if (!visible) return;
      track.style.left = `${Math.round(rect.right - 3)}px`;
      const trackHeight = Math.max(1, track.clientHeight);
      const glowHeight = Math.min(78, Math.max(52, Math.round(trackHeight * .085)));
      const progress = Math.max(0, Math.min(1, sidebar.scrollTop / overflow));
      glow.style.height = `${glowHeight}px`;
      glow.style.transform = `translateY(${Math.round((trackHeight - glowHeight) * progress)}px)`;
    };

    if (sidebar.dataset.swGlowBound !== '1') {
      sidebar.dataset.swGlowBound = '1';
      sidebar.addEventListener('scroll', () => requestAnimationFrame(update), {passive: true});
      addEventListener('resize', () => requestAnimationFrame(update), {passive: true});
    }
    requestAnimationFrame(update);
  }

  function applyAll() {
    applyNavigationState();
    applyDetailsState();
    bindSearch();
    ensureSidebarGlow();
  }

  function schedule() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(() => {
      scanFrame = 0;
      applyAll();
    });
  }

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) schedule();
  });
  observer.observe(document.documentElement, {childList: true, subtree: true});
  [0, 80, 220, 600, 1200].forEach(delay => setTimeout(schedule, delay));
  window.SurwaveNavigationRuntime = {apply: applyAll};
})();
