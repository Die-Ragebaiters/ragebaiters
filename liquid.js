(() => {
  const prefersReduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  let revealObserver = null;

  const liquidSelectors = [
    '.nav',
    '.card',
    '.info-box',
    '.auth-card',
    '.imp-card',
    '.upload-card',
    '.upload-dropzone',
    '.stat-card',
    '.capability-card',
    '.admin-card',
    '.team-editor-card',
    '.photo-item',
    '.member-card',
    '.dash-hero',
    '.data-table'
  ];

  const revealSelectors = [
    '.hero',
    '.section',
    '.footer',
    '.auth-wrap',
    '.dash-hero',
    '.admin-card',
    '.upload-card',
    '.stat-card'
  ];

  const liquidSelector = liquidSelectors.join(',');
  const revealSelector = revealSelectors.join(',');

  const mark = (scope) => {
    const rootEl = scope && scope.nodeType === 1 ? scope : null;
    const nodes = [];
    if (rootEl && rootEl.matches(liquidSelector)) nodes.push(rootEl);
    if (scope && scope.querySelectorAll) nodes.push(...scope.querySelectorAll(liquidSelector));
    nodes.forEach((el) => {
      el.dataset.liquid = '1';
    });

    const revealNodes = [];
    if (rootEl && rootEl.matches(revealSelector)) revealNodes.push(rootEl);
    if (scope && scope.querySelectorAll) revealNodes.push(...scope.querySelectorAll(revealSelector));
    revealNodes.forEach((el) => {
      el.classList.add('reveal');
      if (revealObserver && !prefersReduce) revealObserver.observe(el);
    });
  };

  const enhanceElements = () => {
    mark(document);
  };

  const initReveal = () => {
    if (prefersReduce) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { root: null, threshold: 0.12, rootMargin: '60px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  };

  const initPointer = () => {
    if (prefersReduce) return;

    let current = null;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const update = () => {
      raf = 0;
      if (Number.isFinite(lastX) && Number.isFinite(lastY)) {
        root.style.setProperty('--px', `${((lastX / Math.max(1, window.innerWidth)) * 100).toFixed(2)}%`);
        root.style.setProperty('--py', `${((lastY / Math.max(1, window.innerHeight)) * 100).toFixed(2)}%`);
      }

      if (!current) return;
      const rect = current.getBoundingClientRect();
      const x = Math.min(Math.max(0, lastX - rect.left), rect.width);
      const y = Math.min(Math.max(0, lastY - rect.top), rect.height);
      current.style.setProperty('--mx', `${x}px`);
      current.style.setProperty('--my', `${y}px`);
    };

    document.addEventListener(
      'pointermove',
      (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        current = e.target && e.target.closest ? e.target.closest('[data-liquid]') : null;
        if (!raf) raf = window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    document.addEventListener(
      'pointerdown',
      (e) => {
        const el = e.target && e.target.closest ? e.target.closest('[data-liquid]') : null;
        if (!el) return;
        el.animate(
          [
            { transform: 'translate3d(0,0,0) scale(1)' },
            { transform: 'translate3d(0,0,0) scale(0.985)' },
            { transform: 'translate3d(0,0,0) scale(1)' }
          ],
          { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        );
      },
      { passive: true }
    );
  };

  const initObserver = () => {
    if (!('MutationObserver' in window)) return;

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes || []) {
          if (!node || node.nodeType !== 1) continue;
          mark(node);
        }
      }
    });

    mo.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceElements();
      initReveal();
      initPointer();
      initObserver();
    });
  } else {
    enhanceElements();
    initReveal();
    initPointer();
    initObserver();
  }
})();
