(() => {
  let frame = 0;

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  }

  function ensureRail() {
    let rail = document.querySelector('.sw-sidebar-glow-rail');
    if (rail) return rail;
    rail = document.createElement('div');
    rail.className = 'sw-sidebar-glow-rail';
    rail.hidden = true;
    rail.innerHTML = '<span class="sw-sidebar-glow-marker" aria-hidden="true"></span>';
    document.body.appendChild(rail);
    return rail;
  }

  function update() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // v9 used a traditional-looking thin scrollbar. Keep its DOM harmlessly
    // detached from the visual layer so old listeners cannot draw it again.
    document.querySelectorAll('.sw-sidebar-scroll-track').forEach(track => {
      track.hidden = true;
      track.style.display = 'none';
    });

    const rail = ensureRail();
    const marker = rail.querySelector('.sw-sidebar-glow-marker');
    if (!marker) return;

    const mobile = matchMedia('(max-width:760px)').matches;
    const rect = sidebar.getBoundingClientRect();
    const clientHeight = Math.max(1, sidebar.clientHeight);
    const scrollHeight = Math.max(clientHeight, sidebar.scrollHeight);
    const overflow = scrollHeight - clientHeight;
    const visible = !mobile && overflow > 3 && rect.right > 0 && rect.width > 0;

    rail.hidden = !visible;
    if (!visible) return;

    const inset = 10;
    const railHeight = Math.max(1, Math.round(rect.height - inset * 2));
    rail.style.left = `${Math.round(rect.right)}px`;
    rail.style.top = `${Math.round(rect.top + inset)}px`;
    rail.style.height = `${railHeight}px`;

    // The marker length represents how much of the category panel is visible.
    // Less scrolling -> larger glow; a very long navigation -> smaller glow.
    const visibleRatio = Math.max(0.02, Math.min(1, clientHeight / scrollHeight));
    const proportional = Math.round(railHeight * visibleRatio);
    const minHeight = Math.min(86, railHeight);
    const maxHeight = Math.min(300, Math.round(railHeight * 0.82));
    const markerHeight = Math.max(minHeight, Math.min(maxHeight, proportional));

    const progress = Math.max(0, Math.min(1, sidebar.scrollTop / overflow));
    const travel = Math.max(0, railHeight - markerHeight);
    const y = Math.round(travel * progress);

    marker.style.height = `${markerHeight}px`;
    marker.style.transform = `translate3d(-0.5px,${y}px,0)`;
    marker.style.setProperty('--sw-scroll-progress', progress.toFixed(4));
    marker.style.setProperty('--sw-visible-ratio', visibleRatio.toFixed(4));
  }

  function bind() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || sidebar.dataset.swAdaptiveGlow === '1') return;
    sidebar.dataset.swAdaptiveGlow = '1';
    sidebar.addEventListener('scroll', schedule, {passive: true});
    addEventListener('resize', schedule, {passive: true});

    const observer = new MutationObserver(schedule);
    observer.observe(sidebar, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(schedule);
      ro.observe(sidebar);
      sidebar._swAdaptiveGlowResizeObserver = ro;
    }
  }

  function apply() {
    bind();
    schedule();
  }

  const bootObserver = new MutationObserver(apply);
  bootObserver.observe(document.documentElement, {childList: true, subtree: true});
  [0, 80, 220, 600, 1200].forEach(delay => setTimeout(apply, delay));
  window.SurwaveScrollGlowRuntime = {apply, update: schedule};
})();
