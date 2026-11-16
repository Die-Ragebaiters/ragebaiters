(() => {
  const initNav = () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const toggle = nav.querySelector('.nav-toggle');
    const links = nav.querySelector('.nav-links');
    if (!toggle || !links) return;

    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      document.body.appendChild(backdrop);
    }

    const close = () => {
      links.classList.remove('open');
      backdrop.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-lock');
    };

    const open = () => {
      links.classList.add('open');
      backdrop.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-lock');
    };

    const syncDesktop = () => {
      if (window.matchMedia('(min-width: 681px)').matches) close();
    };

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.contains('open');
      if (isOpen) close();
      else open();
    });

    backdrop.addEventListener('click', close);
    links.addEventListener('click', (event) => {
      if (event.target && event.target.closest && event.target.closest('a')) close();
    }, true);

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
    window.addEventListener('resize', syncDesktop);

    syncDesktop();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNav);
  else initNav();
})();

