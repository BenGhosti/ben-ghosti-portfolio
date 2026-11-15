(() => {
  'use strict';

  /* ───────────────────────────────────────────────────────────
     Configuration
     The host is also the public Minecraft address.
     `discord` is optional — leave empty to link to the contact hub.
     ─────────────────────────────────────────────────────────── */
  const CONFIG = {
    host: 'benpixel.ben-ghosti.de',
    api: 'https://api.mcsrvstat.us/3/',
    fallbackApi: 'https://api.mcstatus.io/v2/status/java/',
    seasonFile: 'season.json',
    refreshMs: 60000,
    timeoutMs: 8000,
    discord: ''
  };

  const RULES = {
    version: '2026-11-15',
    storageKey: 'benpixel.rules.agreement'
  };

  const FALLBACK_DESCRIPTION = 'Benpixel runs in seasons. Each season opens a fresh world for a limited time, then closes and is archived before the next one begins.';

  const FALLBACK_HIGHLIGHTS = [
    { title: 'Seasonal worlds', body: 'Every season starts with a fresh world and a clean slate.' },
    { title: 'Vanilla-first', body: 'Lightweight quality-of-life adjustments. No pay-to-win, no clutter.' },
    { title: 'Archived history', body: 'Season worlds are archived when they close, so nothing is lost.' }
  ];

  const state = {
    season: null,
    server: null,
    phase: 'checking',
    countdownTimer: null,
    toastTimer: null,
    lastRefreshAt: 0,
    lastMotd: null,
    agreed: false,
    lastFocused: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const els = {
    heroChip: $('#hero-chip'),
    heroStatus: $('#hero-status'),
    heroSeason: $('#hero-season'),
    heroVersion: $('#hero-version'),
    heroHost: $('#hero-host'),
    panel: $('#status-panel'),
    statusState: $('#status-state'),
    statusHost: $('#status-host'),
    playersOnline: $('#players-online'),
    playersMax: $('#players-max'),
    motd: $('#server-motd'),
    version: $('#server-version'),
    software: $('#server-software'),
    updated: $('#status-updated'),
    statusNote: $('#status-note'),
    seasonKicker: $('#season-kicker'),
    seasonStatus: $('#season-status'),
    seasonTitle: $('#season-title'),
    seasonDescription: $('#season-description'),
    seasonWindow: $('#season-window'),
    seasonNext: $('#season-next'),
    seasonNote: $('#season-note'),
    seasonCountdown: $('#season-countdown'),
    cdDays: $('#cd-days'),
    cdHours: $('#cd-hours'),
    cdMinutes: $('#cd-minutes'),
    cdSeconds: $('#cd-seconds'),
    highlights: $('#season-highlights'),
    archive: $('#season-archive'),
    archiveList: $('#archive-list'),
    joinAddress: $('#join-address'),
    joinVersion: $('#join-version'),
    discordLink: $('#discord-link'),
    copyButton: $('#copy-address'),
    addressCard: $('#address-card'),
    addressNote: $('#address-note'),
    agreeCheckbox: $('#agree-rules'),
    agreeNote: $('#agree-note'),
    openRules: $('#open-rules'),
    rulesModal: $('#rules-modal'),
    closeRules: $('#close-rules'),
    rulesFrame: $('#rules-frame'),
    modalAgree: $('#modal-agree'),
    toast: $('#bp-toast'),
    toastText: $('#bp-toast-text')
  };

  /* ── Helpers ───────────────────────────────────────────────── */

  const pad = (value) => String(value).padStart(2, '0');

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function setState(node, value) {
    if (node) node.dataset.state = value;
  }

  function stripMinecraftCodes(value) {
    return String(value ?? '')
      .replace(/§[0-9A-FK-OR]/gi, '')
      .replace(/&[0-9A-FK-OR]/gi, '')
      .trim();
  }

  function motdToText(motd) {
    if (!motd) return '';
    if (Array.isArray(motd)) {
      return motd.map(stripMinecraftCodes).filter(Boolean).join('\n');
    }
    if (typeof motd === 'object') {
      return motdToText(motd.clean ?? motd.raw ?? '');
    }
    return stripMinecraftCodes(motd);
  }

  function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /* ── Reveal animation for dynamic cards ────────────────────── */

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;

  function observeReveal(element) {
    if (!element) return;
    if (revealObserver) {
      revealObserver.observe(element);
    } else {
      element.classList.add('is-visible');
    }
  }

  /* ── Season metadata ───────────────────────────────────────── */

  async function loadSeason() {
    try {
      const response = await fetch(CONFIG.seasonFile, { cache: 'no-store' });
      if (!response.ok) throw new Error(`season.json: HTTP ${response.status}`);
      const data = await response.json();
      state.season = data && typeof data === 'object' ? data : {};
    } catch (error) {
      console.warn('[Benpixel] Could not load season.json; using fallbacks.', error);
      state.season = {};
    }

    renderSeason();
    renderHighlights(state.season || {});
    renderArchive();
  }

  function parseSeasonNumber(motd) {
    const match = /season\s*#?\s*(\d{1,3})/i.exec(String(motd || ''));
    return match ? Number(match[1]) : null;
  }

  function parseSeasonName(motd) {
    const match = /season\s*#?\s*\d{1,3}\s*[-–—:|]\s*([^\n]{2,48})/i.exec(String(motd || ''));
    return match ? match[1].trim() : '';
  }

  function renderSeason() {
    const season = state.season || {};
    const motd = state.server?.motd || '';
    const number = season.number ?? parseSeasonNumber(motd);
    const name = season.name || parseSeasonName(motd);

    let title = 'Season details';
    if (number && name) title = `Season ${number} · ${name}`;
    else if (number) title = `Season ${number}`;
    else if (name) title = name;

    setText(els.seasonTitle, title);
    setText(els.seasonDescription, season.description || FALLBACK_DESCRIPTION);
    setText(els.heroSeason, number || '—');

    const start = parseDate(season.start);
    const end = parseDate(season.end);
    const next = parseDate(season.nextStart);

    if (start && end) {
      setText(els.seasonWindow, `${formatDate(start)} — ${formatDate(end)}`);
    } else if (start) {
      setText(els.seasonWindow, `Started ${formatDate(start)}`);
    } else if (end) {
      setText(els.seasonWindow, `Ends ${formatDate(end)}`);
    } else {
      setText(els.seasonWindow, 'To be announced');
    }

    setText(els.seasonNext, next ? formatDate(next) : 'To be announced');

    renderSeasonBadge();
    updateCountdown();
  }

  function renderSeasonBadge() {
    const phase = state.phase;
    const badges = {
      checking: { label: 'Checking…', state: 'checking', kicker: 'Current season' },
      live: { label: 'Live', state: 'live', kicker: 'Now playing' },
      offline: { label: 'Off-season', state: 'offline', kicker: 'Between seasons' },
      maintenance: { label: 'Maintenance', state: 'maintenance', kicker: 'Season paused' },
      error: { label: 'Unknown', state: 'error', kicker: 'Current season' }
    };
    const badge = badges[phase] || badges.checking;
    setText(els.seasonStatus, badge.label);
    setState(els.seasonStatus, badge.state);
    setText(els.seasonKicker, badge.kicker);
  }

  function renderHighlights(season) {
    if (!els.highlights) return;

    const highlights = Array.isArray(season.highlights) && season.highlights.length
      ? season.highlights
      : FALLBACK_HIGHLIGHTS;

    els.highlights.replaceChildren();

    highlights.slice(0, 4).forEach((item) => {
      const article = document.createElement('article');
      article.className = 'card-2 bp-highlight reveal';

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = item.title || '';

      const body = document.createElement('p');
      body.className = 'card-body';
      body.textContent = item.body || '';

      article.append(title, body);
      els.highlights.appendChild(article);
      observeReveal(article);
    });
  }

  function renderArchive() {
    if (!els.archive || !els.archiveList) return;

    const archive = Array.isArray(state.season?.archive) ? state.season.archive : [];
    if (!archive.length) {
      els.archive.hidden = true;
      return;
    }

    els.archive.hidden = false;
    els.archiveList.replaceChildren();

    archive.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'bp-archive-item';

      const name = document.createElement('strong');
      name.textContent = item.name || (item.number ? `Season ${item.number}` : 'Season');

      const meta = document.createElement('span');
      meta.textContent = item.period || item.note || '';

      li.append(name, meta);
      els.archiveList.appendChild(li);
    });
  }

  /* ── Countdown ─────────────────────────────────────────────── */

  function countdownTarget() {
    const season = state.season || {};
    const now = Date.now();
    const end = parseDate(season.end);
    const next = parseDate(season.nextStart);

    if (state.phase === 'live' && end && end.getTime() > now) {
      return { date: end, label: 'Time until the season closes.' };
    }
    if (next && next.getTime() > now) {
      return { date: next, label: 'Time until the next season starts.' };
    }
    return null;
  }

  function seasonNoteText() {
    if (state.phase === 'live') return 'The season is live. Dates are published on Discord.';
    if (state.phase === 'offline') return 'Off-season. The next start is announced on Discord.';
    if (state.phase === 'maintenance') return 'Season paused while the server is maintained.';
    return 'Season dates are published on Discord before each start.';
  }

  function updateCountdown() {
    if (state.countdownTimer) {
      window.clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }

    const target = countdownTarget();

    if (!target) {
      if (els.seasonCountdown) els.seasonCountdown.hidden = true;
      setText(els.seasonNote, seasonNoteText());
      return;
    }

    if (els.seasonCountdown) els.seasonCountdown.hidden = false;

    const tick = () => {
      const remaining = target.date.getTime() - Date.now();

      if (remaining <= 0) {
        if (els.seasonCountdown) els.seasonCountdown.hidden = true;
        if (state.countdownTimer) window.clearInterval(state.countdownTimer);
        state.countdownTimer = null;
        refreshServer(true);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setText(els.cdDays, String(days));
      setText(els.cdHours, pad(hours));
      setText(els.cdMinutes, pad(minutes));
      setText(els.cdSeconds, pad(seconds));
    };

    tick();
    state.countdownTimer = window.setInterval(tick, 1000);
    setText(els.seasonNote, target.label);
  }

  /* ── Server status ─────────────────────────────────────────── */

  async function requestJson(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CONFIG.timeoutMs);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function normalizeMcSrvStat(data) {
    const players = data && data.players;
    return {
      error: false,
      online: Boolean(data && data.online),
      players: players ? {
        online: Number(players.online) || 0,
        max: Number(players.max) || 0
      } : null,
      version: typeof data?.version === 'string' ? data.version : (data?.version?.name || ''),
      software: typeof data?.software === 'string' ? data.software : '',
      motd: motdToText(data?.motd)
    };
  }

  function normalizeMcStatus(data) {
    const players = data && data.players;
    return {
      error: false,
      online: Boolean(data && data.online),
      players: players ? {
        online: Number(players.online) || 0,
        max: Number(players.max) || 0
      } : null,
      version: data?.version?.name || '',
      software: data?.software || '',
      motd: motdToText(data?.motd)
    };
  }

  async function fetchServer() {
    try {
      const data = await requestJson(CONFIG.api + encodeURIComponent(CONFIG.host));
      return normalizeMcSrvStat(data);
    } catch (primaryError) {
      try {
        const data = await requestJson(CONFIG.fallbackApi + encodeURIComponent(CONFIG.host));
        return normalizeMcStatus(data);
      } catch (fallbackError) {
        console.warn('[Benpixel] Status services unavailable.', primaryError, fallbackError);
        return { error: true, online: false };
      }
    }
  }

  function isMaintenanceMotd(motd) {
    const text = String(motd || '').toLowerCase();
    return ['maintenance', 'wartung', 'updating', 'under construction', 'restarting']
      .some((word) => text.includes(word));
  }

  function resolvePhase(server) {
    const configured = state.season?.state;

    if (configured === 'maintenance') return 'maintenance';
    if (configured === 'offline') return 'offline';
    if (server.error) return 'error';
    if (server.online) return isMaintenanceMotd(server.motd) ? 'maintenance' : 'live';
    return 'offline';
  }

  function offlineNote() {
    const season = state.season || {};
    const next = parseDate(season.nextStart);
    const end = parseDate(season.end);

    if (next && next.getTime() > Date.now()) {
      return `Off-season. The next season starts on ${formatDate(next)}.`;
    }
    if (end && end.getTime() < Date.now()) {
      return 'The season has ended. The next start is announced on Discord.';
    }
    return 'Benpixel is not online right now. The next season is announced on Discord.';
  }

  function renderMotd(text) {
    if (!els.motd) return;

    const value = String(text || '');
    if (state.lastMotd === value) return;
    state.lastMotd = value;

    els.motd.replaceChildren();
    const lines = value.split('\n').slice(0, 4);

    lines.forEach((line) => {
      const div = document.createElement('div');
      div.className = 'bp-motd-line';
      div.textContent = line || ' ';
      els.motd.appendChild(div);
    });
  }

  function renderStatus() {
    const server = state.server || {};
    const phase = state.phase;

    setState(els.panel, phase);
    setState(els.heroChip, phase);

    const players = server.online && server.players ? server.players : null;
    const customMessage = state.season?.message;

    const messages = {
      checking: {
        state: 'Checking server…',
        hero: 'Checking server…',
        note: 'Live data is fetched directly from the server and refreshes every 60 seconds.',
        motd: 'Fetching live data…'
      },
      live: {
        state: 'Server online',
        hero: players ? `Online · ${players.online}/${players.max} playing` : 'Online',
        note: `Live data from the server. Last check at ${formatTime(new Date())}. Refreshes every 60 seconds.`,
        motd: server.motd || 'No message of the day.'
      },
      offline: {
        state: 'Server offline',
        hero: 'Off-season',
        note: offlineNote(),
        motd: 'Benpixel is currently between seasons. The next start is announced on Discord.'
      },
      maintenance: {
        state: 'Maintenance in progress',
        hero: 'Maintenance',
        note: 'The server is being updated. This page refreshes automatically.',
        motd: server.motd || 'Server under maintenance. Check back soon.'
      },
      error: {
        state: 'Status unavailable',
        hero: 'Status unavailable',
        note: 'Could not reach the status service. The page will retry automatically.',
        motd: 'Live server data is temporarily unavailable.'
      }
    };

    const current = messages[phase] || messages.checking;

    setText(els.statusState, current.state);
    setText(els.heroStatus, current.hero);
    setText(els.statusNote, customMessage || current.note);
    renderMotd(current.motd);

    setText(els.playersOnline, players ? String(players.online) : '—');
    setText(els.playersMax, players ? String(players.max) : '—');
    setText(els.version, server.online && server.version ? server.version : '—');
    setText(els.software, server.online && server.software ? server.software : '—');
    setText(els.updated, phase === 'checking' ? '—' : formatTime(new Date()));
    setText(els.heroVersion, server.online && server.version ? server.version : 'Java Edition');
  }

  function updateJoin() {
    const server = state.server || {};

    setText(els.heroHost, CONFIG.host);
    setText(els.statusHost, CONFIG.host);
    setText(els.joinAddress, CONFIG.host);
    setText(
      els.joinVersion,
      server.online && server.version ? server.version : 'detected when online'
    );

    if (CONFIG.discord && els.discordLink) {
      els.discordLink.href = CONFIG.discord;
      els.discordLink.textContent = 'Join the Discord ↗';
      els.discordLink.target = '_blank';
      els.discordLink.rel = 'noopener noreferrer';
    }
  }

  async function refreshServer(force = false) {
    if (!force && Date.now() - state.lastRefreshAt < 5000) return;
    state.lastRefreshAt = Date.now();

    const server = await fetchServer();
    state.server = server;
    state.phase = resolvePhase(server);

    renderStatus();
    renderSeason();
    updateJoin();
  }

  /* ── Copy address / toast ──────────────────────────────────── */

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        /* fall through to the legacy path */
      }
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    area.remove();
    return copied;
  }

  function showToast(message) {
    if (!els.toast) return;

    setText(els.toastText, message);
    els.toast.classList.add('is-visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      els.toast.classList.remove('is-visible');
    }, 3200);
  }

  /* ── Rules agreement / PDF viewer ─────────────────────────── */

  function loadAgreement() {
    try {
      const raw = window.localStorage.getItem(RULES.storageKey);
      if (!raw) return false;
      const stored = JSON.parse(raw);
      return Boolean(stored && stored.version === RULES.version && stored.agreed === true);
    } catch (error) {
      return false;
    }
  }

  function saveAgreement(agreed) {
    try {
      if (agreed) {
        window.localStorage.setItem(RULES.storageKey, JSON.stringify({
          version: RULES.version,
          agreed: true,
          agreedAt: new Date().toISOString()
        }));
      } else {
        window.localStorage.removeItem(RULES.storageKey);
      }
    } catch (error) {
      /* Storage can be unavailable (private mode); session state still works. */
    }
  }

  function setAgreed(agreed, options = {}) {
    state.agreed = Boolean(agreed);

    if (!options.silent) saveAgreement(state.agreed);
    updateAgreementUI();

    if (state.agreed && !options.silent) {
      showToast('Rules accepted. Server address unlocked.');
    }
  }

  function updateAgreementUI() {
    const agreed = state.agreed;

    if (els.agreeCheckbox) els.agreeCheckbox.checked = agreed;
    if (els.joinAddress) els.joinAddress.classList.toggle('is-locked', !agreed);
    if (els.copyButton) els.copyButton.disabled = !agreed;
    if (els.addressCard) els.addressCard.classList.toggle('is-unlocked', agreed);

    setText(
      els.addressNote,
      agreed
        ? 'Rules accepted. The address is ready to copy.'
        : 'Agree to the server rules to reveal the address.'
    );

    setText(
      els.agreeNote,
      agreed
        ? 'Rules accepted for this rules version.'
        : 'Agree to reveal the server address.'
    );
  }

  function isRulesModalOpen() {
    return Boolean(els.rulesModal && els.rulesModal.classList.contains('is-open'));
  }

  function openRulesModal() {
    if (!els.rulesModal) return;

    state.lastFocused = document.activeElement;

    if (els.rulesFrame && els.rulesFrame.getAttribute('src') === 'about:blank') {
      els.rulesFrame.src = els.rulesFrame.dataset.src || 'rules.pdf';
    }

    els.rulesModal.classList.add('is-open');
    els.rulesModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bp-modal-open');

    if (els.closeRules) els.closeRules.focus();
  }

  function closeRulesModal() {
    if (!els.rulesModal) return;

    els.rulesModal.classList.remove('is-open');
    els.rulesModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('bp-modal-open');

    if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
      state.lastFocused.focus();
    }
  }

  function trapRulesFocus(event) {
    if (event.key !== 'Tab' || !isRulesModalOpen()) return;

    const dialog = els.rulesModal.querySelector('.bp-modal-dialog');
    if (!dialog) return;

    const focusable = Array.from(dialog.querySelectorAll(
      'a[href], button:not([disabled]), iframe, input, [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null || element === document.activeElement);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleRulesKeydown(event) {
    if (event.key === 'Escape' && isRulesModalOpen()) {
      closeRulesModal();
    }
    trapRulesFocus(event);
  }

  /* ── Init ──────────────────────────────────────────────────── */

  function init() {
    setAgreed(loadAgreement(), { silent: true });
    updateJoin();

    if (els.copyButton) {
      els.copyButton.addEventListener('click', async () => {
        if (!state.agreed) {
          showToast('Please read and agree to the rules first.');
          openRulesModal();
          return;
        }

        const copied = await copyText(CONFIG.host);
        showToast(copied ? 'Server address copied.' : 'Could not copy — select the address manually.');
      });
    }

    if (els.openRules) els.openRules.addEventListener('click', openRulesModal);
    if (els.closeRules) els.closeRules.addEventListener('click', closeRulesModal);

    if (els.rulesModal) {
      els.rulesModal.querySelectorAll('[data-close-rules]').forEach((element) => {
        element.addEventListener('click', closeRulesModal);
      });
    }

    if (els.agreeCheckbox) {
      els.agreeCheckbox.addEventListener('change', () => {
        setAgreed(els.agreeCheckbox.checked);
      });
    }

    if (els.modalAgree) {
      els.modalAgree.addEventListener('click', () => {
        setAgreed(true);
        closeRulesModal();
      });
    }

    document.addEventListener('keydown', handleRulesKeydown);

    loadSeason().then(() => {
      refreshServer();

      window.setInterval(() => {
        if (!document.hidden) refreshServer();
      }, CONFIG.refreshMs);

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshServer();
      });
    });
  }

  init();
})();
