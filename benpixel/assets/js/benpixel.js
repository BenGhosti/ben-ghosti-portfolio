/* ═══════════════════════════════════════════════════════════════════
   BENPIXEL NETWORK — COMPLETE JAVASCRIPT
   Full-featured dashboard with all interactions
   ═══════════════════════════════════════════════════════════════════ */

class BenpixelDashboard {
  constructor() {
    this.statusWidget = document.querySelector('.bp-status-widget');
    this.navToggle = document.getElementById('bp-nav-toggle');
    this.nav = document.getElementById('bp-nav');
    this.header = document.getElementById('bp-header');
    this.apiURL = 'https://api.mcsrvstat.us/2/Benpixel.Ben-Ghosti.de';
    this.toastContainer = null;
    this.accordionButtons = document.querySelectorAll('.bp-accordion-button');
    this.ipCopyContainers = document.querySelectorAll('.bp-ip-copy-container');
    this.lastStatusUpdate = null;
    this.statusRefreshInterval = null;
    this.cursorDot = null;
    this.cursorRing = null;
    this.lastX = 0;
    this.lastY = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createToastContainer();
    this.observeRevealElements();
    this.setupCustomCursor();
    this.setupScrollTracking();
    this.fetchServerStatus();
    this.setupRefreshInterval();
    this.setupMobileMenu();
    this.setupSmoothScroll();
    this.setupHeaderBlur();
  }

  /* ─── Event Listeners Setup ─────────────────────────────────────── */

  setupEventListeners() {
    this.navToggle.addEventListener('click', () => this.toggleMobileMenu());
    
    this.accordionButtons.forEach(button => {
      button.addEventListener('click', () => this.toggleAccordion(button));
    });

    this.ipCopyContainers.forEach(container => {
      container.addEventListener('click', () => this.copyToClipboard(container));
    });

    document.addEventListener('click', (e) => {
      if (this.nav.classList.contains('is-open') && 
          !this.nav.contains(e.target) && 
          !this.navToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    document.addEventListener('mousemove', (e) => this.updateCursorPosition(e));
    document.addEventListener('mouseenter', () => this.showCursor());
    document.addEventListener('mouseleave', () => this.hideCursor());

    window.addEventListener('scroll', () => this.updateScrollProgress());
  }

  /* ─── Toast Notification System ────────────────────────────────── */

  createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'bp-toast-container';
    this.toastContainer.style.position = 'fixed';
    this.toastContainer.style.zIndex = '1000';
    this.toastContainer.style.pointerEvents = 'none';
    document.body.appendChild(this.toastContainer);
  }

  showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `bp-toast is-visible is-${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '32px';
    toast.style.right = '32px';
    toast.style.pointerEvents = 'auto';
    
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, duration);
  }

  /* ─── Mobile Navigation Menu ───────────────────────────────────── */

  toggleMobileMenu() {
    if (this.nav.classList.contains('is-open')) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    this.navToggle.classList.add('is-active');
    this.nav.classList.add('is-open');
    this.navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  closeMobileMenu() {
    this.navToggle.classList.remove('is-active');
    this.nav.classList.remove('is-open');
    this.navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  setupMobileMenu() {
    const navLinks = this.nav.querySelectorAll('.bp-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    });
  }

  /* ─── Accordion Toggle System ──────────────────────────────────── */

  toggleAccordion(button) {
    const isOpen = button.classList.contains('is-open');
    const content = button.nextElementSibling;

    if (!content || !content.classList.contains('bp-accordion-content')) {
      return;
    }

    if (isOpen) {
      this.closeAccordion(button, content);
    } else {
      this.closeAllAccordions();
      this.openAccordion(button, content);
    }
  }

  openAccordion(button, content) {
    button.classList.add('is-open');
    content.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
  }

  closeAccordion(button, content) {
    button.classList.remove('is-open');
    content.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
  }

  closeAllAccordions() {
    this.accordionButtons.forEach(button => {
      const content = button.nextElementSibling;
      if (content && content.classList.contains('bp-accordion-content')) {
        this.closeAccordion(button, content);
      }
    });
  }

  /* ─── Clipboard Copy Functionality ─────────────────────────────── */

  copyToClipboard(container) {
    const ipText = container.querySelector('.bp-ip-text');
    if (!ipText) return;

    const text = ipText.textContent.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.showToast('✓ Server IP copied to clipboard', 'success', 3000);
          this.animateCopyButton(container);
        })
        .catch(() => {
          this.fallbackCopyToClipboard(text, container);
        });
    } else {
      this.fallbackCopyToClipboard(text, container);
    }
  }

  fallbackCopyToClipboard(text, container) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      document.execCommand('copy');
      this.showToast('✓ Server IP copied to clipboard', 'success', 3000);
      this.animateCopyButton(container);
    } catch () {
      this.showToast('✗ Failed to copy', 'error', 3000);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  animateCopyButton(container) {
    const icon = container.querySelector('.bp-copy-icon');
    if (!icon) return;

    const originalContent = icon.innerHTML;
    icon.innerHTML = '✓';
    icon.style.color = 'var(--accent-green)';

    setTimeout(() => {
      icon.innerHTML = originalContent;
      icon.style.color = '';
    }, 2000);
  }

  /* ─── API Integration & Server Status ──────────────────────────── */

  async fetchServerStatus() {
    try {
      const response = await fetch(this.apiURL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.lastStatusUpdate = new Date();

      this.updateStatusUI(data);
      this.updatePlayerCount(data);
      this.updatePingBars(data);
      this.updateMOTD(data);
      this.updateServerVersion(data);
      this.checkMaintenanceState(data);
      this.updateAccordionStats(data);
    } catch (error) {
      console.error('Failed to fetch server status:', error);
      this.setStatusStandby();
      this.showToast('Unable to reach server API', 'error', 5000);
    }
  }

  updateStatusUI(data) {
    if (!this.statusWidget) return;

    if (data.online === true) {
      this.statusWidget.classList.remove('is-standby', 'is-maintenance');
      this.statusWidget.classList.add('is-live');
      this.updateHeaderLED('live');
    } else if (data.online === false) {
      this.setStatusStandby();
    }
  }

  setStatusStandby() {
    if (!this.statusWidget) return;

    this.statusWidget.classList.remove('is-live', 'is-maintenance');
    this.statusWidget.classList.add('is-standby');
    this.updateHeaderLED('standby');
  }

  setStatusMaintenance() {
    if (!this.statusWidget) return;

    this.statusWidget.classList.remove('is-live', 'is-standby');
    this.statusWidget.classList.add('is-maintenance');
    this.updateHeaderLED('maintenance');

    let alertBox = document.querySelector('.bp-status-alert');
    if (!alertBox) {
      alertBox = document.createElement('div');
      alertBox.className = 'bp-status-alert';
      alertBox.innerHTML = '<strong>[SYSTEM ALERT]:</strong> SERVER UNDER MAINTENANCE';
      const motdContainer = document.querySelector('.bp-motd-grid');
      if (motdContainer && motdContainer.parentElement) {
        motdContainer.parentElement.appendChild(alertBox);
      }
    }
  }

  updateHeaderLED(state) {
    const led = document.querySelector('[id*="led"]') || 
                document.querySelector('.bp-status-led') ||
                document.querySelector('.meta-dot');
    
    if (!led) return;

    if (state === 'live') {
      led.style.background = 'var(--accent-green)';
      led.style.boxShadow = '0 0 12px var(--accent-green)';
    } else if (state === 'standby') {
      led.style.background = 'var(--accent-violet)';
      led.style.boxShadow = '0 0 12px var(--accent-violet)';
    } else if (state === 'maintenance') {
      led.style.background = 'var(--accent-amber)';
      led.style.boxShadow = '0 0 12px var(--accent-amber)';
    }
  }

  updatePlayerCount(data) {
    const currentElement = document.querySelector('.bp-players-current');
    const maxElement = document.querySelector('.bp-players-max');

    if (!currentElement || !data.players) return;

    const current = data.players.online || 0;
    const max = data.players.max || 20;
    
    currentElement.textContent = current;
    if (maxElement) {
      maxElement.textContent = max;
    }
  }

  updateServerVersion(data) {
    const versionElement = document.querySelector('.bp-status-version');
    
    if (!versionElement || !data.version) return;

    const version = data.version;
    versionElement.textContent = `Java ${version}`;
  }

  updatePingBars(data) {
    const bars = document.querySelectorAll('.bp-ping-bar');
    if (!bars.length || !data.ping) return;

    const ping = parseInt(data.ping);
    let barCount = 1;

    if (ping < 20) barCount = 5;
    else if (ping < 40) barCount = 4;
    else if (ping < 80) barCount = 3;
    else if (ping < 120) barCount = 2;
    else barCount = 1;

    bars.forEach((bar, index) => {
      if (index < barCount) {
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
      }
    });
  }

  updateMOTD(data) {
    const motdGrid = document.querySelector('.bp-motd-grid');
    if (!motdGrid) return;

    motdGrid.innerHTML = '';

    if (data.motd) {
      let motdLines = [];

      if (Array.isArray(data.motd.clean)) {
        motdLines = data.motd.clean;
      } else if (typeof data.motd.clean === 'string') {
        motdLines = [data.motd.clean];
      } else if (typeof data.motd === 'string') {
        motdLines = [data.motd];
      }

      motdLines.forEach(line => {
        if (line && line.trim()) {
          const lineElement = document.createElement('div');
          lineElement.className = 'bp-motd-line';
          lineElement.textContent = line.trim();
          motdGrid.appendChild(lineElement);
        }
      });
    }

    if (motdGrid.children.length === 0) {
      const emptyLine = document.createElement('div');
      emptyLine.className = 'bp-motd-line';
      emptyLine.textContent = 'Welcome to Benpixel';
      motdGrid.appendChild(emptyLine);
    }
  }

  checkMaintenanceState(data) {
    if (!data.online || !data.motd) return;

    let motdText = '';

    if (Array.isArray(data.motd.clean)) {
      motdText = data.motd.clean.join(' ');
    } else if (typeof data.motd.clean === 'string') {
      motdText = data.motd.clean;
    } else if (typeof data.motd === 'string') {
      motdText = data.motd;
    }

    const maintenanceKeywords = [
      'wartung', 'maintenance', 'setup', 'updating', 
      'updating...', 'maintainance', 'under maintenance'
    ];

    const isMaintenance = maintenanceKeywords.some(keyword => 
      motdText.toLowerCase().includes(keyword)
    );

    if (isMaintenance) {
      this.setStatusMaintenance();
    }
  }

  updateAccordionStats(data) {
    const statElements = document.querySelectorAll('.bp-accordion-stat-value');
    
    if (!statElements.length) return;

    if (data.players && statElements.length > 0) {
      const current = data.players.online || 0;
      const max = data.players.max || 20;
      statElements[0].textContent = `${current} / ${max}`;
    }

    if (data.version && statElements.length > 1) {
      statElements[1].textContent = `Java ${data.version}`;
    }

    if (data.ping && statElements.length > 2) {
      statElements[2].textContent = `${data.ping}ms`;
    }

    if (data.hostname && statElements.length > 3) {
      statElements[3].textContent = data.hostname;
    }
  }

  setupRefreshInterval() {
    this.statusRefreshInterval = setInterval(() => {
      this.fetchServerStatus();
    }, 30000);
  }

  /* ─── Intersection Observer for Timeline Animations ────────────── */

  observeRevealElements() {
    const revealElements = document.querySelectorAll('.bp-reveal');
    
    if (!revealElements.length) return;

    const observerOptions = {
      threshold: [0, 0.15, 0.5],
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
          entry.target.classList.add('bp-reveal-active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(element => {
      observer.observe(element);
    });
  }

  /* ─── Custom Cursor System ────────────────────────────────────── */

  setupCustomCursor() {
    const html = document.documentElement;
    
    if (!html.querySelector('[data-cursor-dot]')) {
      this.cursorDot = document.createElement('div');
      this.cursorDot.setAttribute('data-cursor-dot', '');
      this.cursorDot.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: var(--accent-cyan);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        transform: translate(-50%, -50%);
        transition: opacity 200ms ease-out;
        box-shadow: 0 0 8px var(--accent-cyan);
      `;
      document.body.appendChild(this.cursorDot);
    }

    if (!html.querySelector('[data-cursor-ring]')) {
      this.cursorRing = document.createElement('div');
      this.cursorRing.setAttribute('data-cursor-ring', '');
      this.cursorRing.style.cssText = `
        position: fixed;
        width: 32px;
        height: 32px;
        border: 1px solid var(--accent-cyan);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
        transform: translate(-50%, -50%);
        transition: opacity 200ms ease-out;
      `;
      document.body.appendChild(this.cursorRing);
    }

    this.cursorDot = document.querySelector('[data-cursor-dot]');
    this.cursorRing = document.querySelector('[data-cursor-ring]');
  }

  updateCursorPosition(e) {
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    if (this.cursorDot) {
      this.cursorDot.style.left = `${e.clientX}px`;
      this.cursorDot.style.top = `${e.clientY}px`;
    }

    if (this.cursorRing) {
      this.cursorRing.style.left = `${e.clientX}px`;
      this.cursorRing.style.top = `${e.clientY}px`;
    }

    const glow = document.querySelector('.bp-global-glow');
    if (glow) {
      glow.style.setProperty('--mx', `${e.clientX}px`);
      glow.style.setProperty('--my', `${e.clientY}px`);
    }
  }

  showCursor() {
    if (this.cursorDot) this.cursorDot.style.opacity = '1';
    if (this.cursorRing) this.cursorRing.style.opacity = '0.5';
    document.body.classList.add('cursor-active');
  }

  hideCursor() {
    if (this.cursorDot) this.cursorDot.style.opacity = '0';
    if (this.cursorRing) this.cursorRing.style.opacity = '0';
    document.body.classList.remove('cursor-active');
  }

  /* ─── Scroll Tracking & Progress ───────────────────────────────── */

  setupScrollTracking() {
    window.addEventListener('scroll', () => this.updateScrollProgress(), { passive: true });
  }

  updateScrollProgress() {
    const scrolled = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrolled / docHeight) * 100;

    document.documentElement.style.setProperty('--scroll-progress', `${scrollPercent}%`);
  }

  /* ─── Smooth Scroll Anchor Links ───────────────────────────────– */

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        
        const offset = 72;
        const targetPosition = target.offsetTop - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        history.pushState(null, null, href);
      });
    });
  }

  /* ─── Header Blur Effect on Scroll ─────────────────────────────– */

  setupHeaderBlur() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        this.header.style.borderBottomColor = 'rgba(255, 255, 255, 0.1)';
      } else {
        this.header.style.borderBottomColor = 'var(--line)';
      }
    }, { passive: true });
  }

  /* ─── Navigation Active Link Tracking ──────────────────────────– */

  updateActiveNavLink() {
    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll('.bp-nav-link');

    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${section.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  /* ─── Keyboard Navigation ──────────────────────────────────────– */

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.nav.classList.contains('is-open')) {
        this.closeMobileMenu();
      }

      if (e.key === 'c' && e.ctrlKey) {
        const active = document.activeElement;
        if (active && active.classList.contains('bp-ip-copy-container')) {
          this.copyToClipboard(active);
        }
      }
    });
  }

  /* ─── Lazy Load Images ─────────────────────────────────────────– */

  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  /* ─── Performance Monitoring ───────────────────────────────────– */

  logPerformanceMetrics() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log(`${entry.name}: ${entry.duration}ms`);
          }
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported');
      }
    }
  }

  /* ─── Cleanup on Destroy ───────────────────────────────────────– */

  destroy() {
    if (this.statusRefreshInterval) {
      clearInterval(this.statusRefreshInterval);
    }

    document.removeEventListener('mousemove', (e) => this.updateCursorPosition(e));
    document.removeEventListener('mouseenter', () => this.showCursor());
    document.removeEventListener('mouseleave', () => this.hideCursor());
    window.removeEventListener('scroll', () => this.updateScrollProgress());
  }
}

/* ═══════════════════════════════════════════════════════════════════
   INITIALIZATION & PAGE LOAD
   ═══════════════════════════════════════════════════════════════════ */

let dashboardInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Benpixel Dashboard Initializing...');
  
  dashboardInstance = new BenpixelDashboard();
  
  console.log('✓ Benpixel Dashboard Ready');
});

window.addEventListener('beforeunload', () => {
  if (dashboardInstance) {
    dashboardInstance.destroy();
  }
});

/* ─── Global Error Handler ─────────────────────────────────────── */

window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

/* ─── Service Worker Registration (Optional) ───────────────────── */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.log('Service Worker registration failed');
    });
  });
}
