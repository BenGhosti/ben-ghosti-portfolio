(() => {
  const doc = document;
  const root = doc.documentElement;

  const navBar = doc.querySelector('[data-nav]');
  const navToggle = doc.querySelector('[data-nav-toggle]');
  const navMenu = doc.getElementById('primary-nav');

  const onScroll = () => {
    if (!navBar) return;
    navBar.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (navToggle && navMenu) {
    const closeMenu = () => {
      navToggle.classList.remove('is-active');
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      root.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('is-active');
      navMenu.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      root.style.overflow = open ? 'hidden' : '';
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  const revealables = doc.querySelectorAll('.section-header, .card-2, .link-card, .status-module, .about-wrap, .project-meta, .domain-sticky');
  revealables.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  const yearNode = doc.querySelector('[data-year]');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  const statusTime = doc.querySelector('[data-status-time]');
  if (statusTime) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
    });
    statusTime.textContent = fmt.format(new Date());
  }

  const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (supportsFinePointer) {
    const cursorDot = doc.querySelector('[data-cursor-dot]');
    const cursorRing = doc.querySelector('[data-cursor-ring]');
    const globalGlow = doc.querySelector('[data-global-glow]');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let pointerInside = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const hideCursor = () => {
      pointerInside = false;
      doc.body.classList.remove('cursor-active');
      ringX = mouseX;
      ringY = mouseY;
      if (cursorRing) {
        cursorRing.classList.remove('is-hover', 'is-pressed');
      }
    };

    const updatePointer = (clientX, clientY) => {
      mouseX = clamp(clientX, 0, window.innerWidth);
      mouseY = clamp(clientY, 0, window.innerHeight);
      pointerInside = true;
      doc.body.classList.add('cursor-active');

      if (globalGlow) {
        const vw = window.innerWidth || 1;
        const vh = window.innerHeight || 1;
        globalGlow.style.setProperty('--mx', `${(mouseX / vw) * 100}%`);
        globalGlow.style.setProperty('--my', `${(mouseY / vh) * 100}%`);
      }

      if (cursorDot) {
        cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
    };

    if (cursorRing) {
      const hoverables = doc.querySelectorAll('a, button, .project-card, .card-2, .link-card, .nav-toggle, [data-cursor-hover]');
      hoverables.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          if (pointerInside) cursorRing.classList.add('is-hover');
        });
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-hover'));
      });

      doc.addEventListener('mousedown', () => {
        if (pointerInside) cursorRing.classList.add('is-pressed');
      });
      doc.addEventListener('mouseup', () => cursorRing.classList.remove('is-pressed'));
    }

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      updatePointer(e.clientX, e.clientY);
    }, { passive: true });

    doc.documentElement.addEventListener('mouseleave', hideCursor);
    window.addEventListener('blur', hideCursor);
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) hideCursor();
    });

    if (cursorDot && cursorRing) {
      const renderRing = () => {
        if (pointerInside) {
          ringX += (mouseX - ringX) * 0.18;
          ringY += (mouseY - ringY) * 0.18;
        }
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        window.requestAnimationFrame(renderRing);
      };
      renderRing();
    }
  }
})();
