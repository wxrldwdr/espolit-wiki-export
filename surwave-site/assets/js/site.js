(() => {
  const sidebar = document.querySelector('#sidebar');
  const mobileMenu = document.querySelector('#mobileMenu');
  const searchInput = document.querySelector('#searchInput');
  const searchResults = document.querySelector('#searchResults');
  const copyLink = document.querySelector('#copyLink');

  document.querySelectorAll('.nav-group').forEach(group => {
    const btn = group.querySelector('.nav-title');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = !group.classList.contains('open');
      group.classList.toggle('open', open);
      try { localStorage.setItem('surwave-nav-' + btn.textContent.trim(), open ? '1' : '0'); } catch (_) {}
    });
    try {
      const stored = localStorage.getItem('surwave-nav-' + btn.textContent.trim());
      if (stored === '1') group.classList.add('open');
    } catch (_) {}
  });

  mobileMenu?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  copyLink?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const old = copyLink.textContent;
      copyLink.textContent = 'Скопировано';
      setTimeout(() => copyLink.textContent = old, 1200);
    } catch (_) {}
  });

  const pages = Array.isArray(window.SURWAVE_PAGES) ? window.SURWAVE_PAGES : [];
  const renderSearch = () => {
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (!searchResults) return;
    searchResults.innerHTML = '';
    if (q.length < 2) { searchResults.classList.remove('visible'); return; }
    const found = pages.filter(p => (p.title + ' ' + p.group).toLowerCase().includes(q)).slice(0, 12);
    if (!found.length) searchResults.innerHTML = '<div class="search-empty">Ничего не найдено</div>';
    found.forEach(p => {
      const a = document.createElement('a');
      a.href = p.href;
      a.className = 'search-result';
      a.innerHTML = `<strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(p.group)}</span>`;
      searchResults.appendChild(a);
    });
    searchResults.classList.add('visible');
  };
  searchInput?.addEventListener('input', renderSearch);
  document.addEventListener('click', e => { if (!e.target.closest('.search')) searchResults?.classList.remove('visible'); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput?.focus(); }
    if (e.key === 'Escape') { searchResults?.classList.remove('visible'); closeLightbox(); }
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  // Click-to-zoom for every content image copied from GitBook.
  document.querySelectorAll('.article img').forEach(img => {
    img.classList.add('zoomable');
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  function openLightbox(src, alt) {
    closeLightbox();
    const box = document.createElement('div');
    box.className = 'lightbox'; box.id = 'lightbox';
    box.innerHTML = `<button aria-label="Закрыть">×</button><img src="${src}" alt="${escapeHtml(alt || '')}">`;
    box.addEventListener('click', e => { if (e.target === box || e.target.tagName === 'BUTTON') closeLightbox(); });
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add('visible'));
  }
  function closeLightbox() {
    const box = document.querySelector('#lightbox');
    if (!box) return;
    box.classList.remove('visible');
    setTimeout(() => box.remove(), 160);
  }

  // Smooth details animation while preserving native semantics.
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector('summary');
    if (!summary) return;
    const rest = [...details.children].filter(n => n !== summary);
    if (!rest.length) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'details-anim';
    rest.forEach(n => wrapper.appendChild(n));
    details.appendChild(wrapper);
    wrapper.style.height = details.open ? 'auto' : '0px';
    wrapper.style.opacity = details.open ? '1' : '0';
    summary.addEventListener('click', e => {
      e.preventDefault();
      if (details.dataset.busy === '1') return;
      details.dataset.busy = '1';
      if (!details.open) {
        details.open = true;
        wrapper.style.height = '0px'; wrapper.style.opacity = '0';
        requestAnimationFrame(() => {
          wrapper.style.height = wrapper.scrollHeight + 'px'; wrapper.style.opacity = '1';
        });
        setTimeout(() => { wrapper.style.height = 'auto'; details.dataset.busy = '0'; }, 300);
      } else {
        wrapper.style.height = wrapper.scrollHeight + 'px';
        requestAnimationFrame(() => { wrapper.style.height = '0px'; wrapper.style.opacity = '0'; });
        setTimeout(() => { details.open = false; details.dataset.busy = '0'; }, 280);
      }
    });
  });
})();
