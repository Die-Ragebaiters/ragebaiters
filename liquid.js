(() => {
  const prefersReduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;

  const enhanceElements = () => {
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
      '.photo-item',
      '.member-card',
      '.dash-hero',
      '.data-table'
    ];

    document.querySelectorAll(liquidSelectors.join(',')).forEach((el) => {
      el.dataset.liquid = '1';
    });

    // Progressive reveal only when JS is available.
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
    document.querySelectorAll(revealSelectors.join(',')).forEach((el) => el.classList.add('reveal'));
  };

  const initReveal = () => {
    if (prefersReduce) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { root: null, threshold: 0.12, rootMargin: '60px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceElements();
      initReveal();
      initPointer();
    });
  } else {
    enhanceElements();
    initReveal();
    initPointer();
  }
})();

