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
    discord: '',
    whitelist: {
      endpoint: '',
      turnstileSiteKey: ''
    }
  };

  const RULES = {
    version: '2026-11-15',
    storageKey: 'benpixel.rules.agreement'
  };

  const SEASON_CACHE_KEY = 'benpixel.lastSeason';

  const FALLBACK_DESCRIPTION = 'Benpixel runs in seasons. Each season opens a fresh world for a limited time, then closes and is archived before the next one begins.';

  const FALLBACK_HIGHLIGHTS = [
    { title: 'Seasonal worlds', body: 'Every season starts with a fresh world and a clean slate.' },
    { title: 'Vanilla-first', body: 'Lightweight quality-of-life adjustments. No pay-to-win, no clutter.' },
    { title: 'Archived history', body: 'Season worlds are archived when they close, so nothing is lost.' }
  ];

  const FALLBACK_HISTORY = [
    {
      date: 'Early 2021',
      badge: 'Genesis',
      title: 'First Deployment',
      body: 'The first server ran on G-Portal shared hosting, then moved to a self-managed PaperMC build on a local Windows machine for faster iteration.',
      tags: ['G-Portal', 'PaperMC', 'Windows Host']
    },
    {
      date: '2021 – 2022',
      badge: 'Virtualization',
      title: 'Hypervisor Leap',
      body: 'A headless Proxmox VE setup replaced the single Windows host, separating the game server into isolated Linux VMs.',
      tags: ['Proxmox VE', 'Linux VMs', 'Headless']
    },
    {
      date: '2022 – 2023',
      badge: 'Bare Metal',
      title: 'Enterprise Node',
      body: 'Consumer hardware gave way to an enterprise Supermicro Xeon node, with JVM and garbage-collection tuning for stable throughput.',
      tags: ['Supermicro Xeon', 'JVM Tuning', 'G1GC']
    },
    {
      date: '2023 – 2024',
      badge: 'Co-Location',
      title: 'Skylink, Netherlands',
      body: 'The server moved to co-located infrastructure at Skylink in the Netherlands on a dedicated Ryzen 7 7700X node for stronger single-thread performance.',
      tags: ['Skylink · NL', 'Ryzen 7 7700X', 'Co-Location']
    },
    {
      date: '2025 – Present',
      badge: 'Revolutions',
      title: 'Benpixel Revolutions',
      body: 'Since 2025 the server runs on high-performance machines at NTT Data in Frankfurt. The current chapter adds a live status page, a rules agreement, and a whitelist request flow.',
      tags: ['NTT Data · Frankfurt', 'High-performance', 'Seasonal'],
      highlight: true
    }
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
    lastFocused: null,
    whitelistToken: '',
    whitelistLoading: false,
    turnstileWidgetId: null,
    turnstileScriptRequested: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const els = {
    heroChip: $('#hero-chip'),
    heroStatus: $('#hero-status'),
    heroVersion: $('#hero-version'),
    heroHost: $('#hero-host'),
    panel: $('#status-panel'),
    statusState: $('#status-state'),
    statusHost: $('#status-host'),
    playersOnline: $('#players-online'),
    playersMax: $('#players-max'),
    motd: $('#server-motd'),
    version: $('#server-version'),
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
    historyTimeline: $('#history-timeline'),
    joinAddress: $('#join-address'),
    joinVersion: $('#join-version'),
    discordLink: $('#discord-link'),
    discordLabel: $('#discord-label'),
    copyButton: $('#copy-address'),
    addressCard: $('#address-card'),
    agreeCheckbox: $('#agree-rules'),
    agreeNote: $('#agree-note'),
    openRules: $('#open-rules'),
    rulesModal: $('#rules-modal'),
    closeRules: $('#close-rules'),
    rulesFrame: $('#rules-frame'),
    modalAgree: $('#modal-agree'),
    whitelistForm: $('#whitelist-form'),
    whitelistState: $('#whitelist-state'),
    whitelistMessage: $('#whitelist-message'),
    whitelistUsername: $('#whitelist-username'),
    whitelistDiscord: $('#whitelist-discord'),
    whitelistWebsite: $('#whitelist-website'),
    whitelistTurnstile: $('#whitelist-turnstile'),
    whitelistHint: $('#whitelist-hint'),
    whitelistResult: $('#whitelist-result'),
    whitelistSubmit: $('#whitelist-submit'),
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

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (dateOnly) {
      return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function endExclusiveDate(date) {
    return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) : null;
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
    renderHistory();
    renderWhitelist();
    updateJoin();
  }

  const VERSION_PATTERN = /(?<![.\d])\bv?(?:ersion\s*)?(\d{1,2}\.\d{1,3}(?:\.\d{1,3})?)(?:\s*[-–—]\s*(\d{1,2}\.\d{1,3}(?:\.\d{1,3})?))?/i;

  function parseSeasonNumber(motd) {
    const match = /season\s*#?\s*(\d{1,3})/i.exec(String(motd || ''));
    return match ? Number(match[1]) : null;
  }

  function parseVersion(motd) {
    const text = String(motd || '');
    const matches = Array.from(text.matchAll(new RegExp(VERSION_PATTERN.source, 'gi')));
    if (!matches.length) return '';

    const chosen = matches.find((match) => match[2]) || matches[0];
    return chosen[2] ? `${chosen[1]} – ${chosen[2]}` : chosen[1];
  }

  function readCachedSeason() {
    try {
      const raw = window.localStorage.getItem(SEASON_CACHE_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw);
      return Number.isInteger(stored?.number) ? stored.number : null;
    } catch (error) {
      return null;
    }
  }

  function writeCachedSeason(number) {
    if (!Number.isInteger(number)) return;

    try {
      window.localStorage.setItem(SEASON_CACHE_KEY, JSON.stringify({
        number,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      /* Storage can be unavailable; the live MOTD still works. */
    }
  }

  function renderSeason() {
    const season = state.season || {};
    const motd = state.server?.motd || '';
    const liveNumber = parseSeasonNumber(motd);

    if (liveNumber !== null && readCachedSeason() !== liveNumber) {
      writeCachedSeason(liveNumber);
    }

    const number = liveNumber !== null ? liveNumber : readCachedSeason();
    const title = number !== null ? `Season ${number}` : 'Season details';

    setText(els.seasonTitle, title);
    setText(els.seasonDescription, season.description || FALLBACK_DESCRIPTION);

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
      outage: { label: 'Currently offline', state: 'outage', kicker: 'Season active' },
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

  let beamFillFrame = null;

  function scheduleBeamFill() {
    if (beamFillFrame !== null) return;
    beamFillFrame = window.requestAnimationFrame(() => {
      beamFillFrame = null;
      updateBeamFill();
    });
  }

  function updateBeamFill() {
    if (!els.historyTimeline) return;

    const beam = els.historyTimeline.querySelector('.bp-timeline-beam');
    const fill = beam?.querySelector('.bp-timeline-beam-fill');
    if (!beam || !fill) return;

    const rect = beam.getBoundingClientRect();
    if (!rect.height) {
      fill.style.height = '0%';
      return;
    }

    const start = window.innerHeight * 0.82;
    const end = window.innerHeight * 0.18;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / (rect.height + start - end)));
    fill.style.height = `${Math.round(progress * 100)}%`;
  }

  function layoutHistory() {
    if (!els.historyTimeline) return;

    const timeline = els.historyTimeline;
    const beam = timeline.querySelector('.bp-timeline-beam');
    const entries = Array.from(timeline.querySelectorAll('.bp-timeline-entry'));
    if (!entries.length) return;

    const isDesktop = window.matchMedia('(min-width: 1025px)').matches;
    timeline.classList.toggle('bp-timeline--stacked', !isDesktop);

    entries.forEach((entry) => {
      entry.style.top = '';
      entry.style.left = '';
      entry.style.width = '';
    });
    timeline.style.height = '';
    if (beam) beam.style.height = '';

    if (!isDesktop) {
      updateBeamFill();
      return;
    }

    const gap = 30;
    let leftY = 0;
    let rightY = 110;
    let maxY = 0;
    const finalEntry = entries.find((entry) => entry.classList.contains('bp-timeline-entry--final'));
    const normalEntries = entries.filter((entry) => entry !== finalEntry);

    normalEntries.forEach((entry, index) => {
      const side = index % 2 === 0 ? 'left' : 'right';
      entry.dataset.side = side;
      entry.style.left = side === 'left' ? '0' : '50%';
      entry.style.width = '50%';

      const card = entry.querySelector('.bp-timeline-card');
      const height = Math.ceil(card.getBoundingClientRect().height);
      const top = side === 'left' ? leftY : rightY;

      entry.style.setProperty('--node-y', `${Math.round(height / 2)}px`);
      entry.style.top = `${top}px`;

      if (side === 'left') leftY = top + height + gap;
      else rightY = top + height + gap;
      maxY = Math.max(maxY, top + height);
    });

    let beamHeight = maxY;

    if (finalEntry) {
      finalEntry.style.left = '50%';
      finalEntry.style.width = 'min(760px, 84%)';

      const card = finalEntry.querySelector('.bp-timeline-card');
      const height = Math.ceil(card.getBoundingClientRect().height);
      const top = Math.max(leftY, rightY) + 54;

      finalEntry.style.top = `${top}px`;
      beamHeight = top;
      maxY = top + height;
    }

    timeline.style.height = `${maxY + 24}px`;
    if (beam) beam.style.height = `${beamHeight}px`;
    updateBeamFill();
  }

  function renderHistory() {
    if (!els.historyTimeline) return;

    const history = Array.isArray(state.season?.history) && state.season.history.length
      ? state.season.history
      : FALLBACK_HISTORY;

    els.historyTimeline.replaceChildren();

    const beam = document.createElement('div');
    beam.className = 'bp-timeline-beam';
    beam.setAttribute('aria-hidden', 'true');
    ['bp-timeline-beam-glow', 'bp-timeline-beam-fill', 'bp-timeline-beam-pulse'].forEach((className) => {
      const span = document.createElement('span');
      span.className = className;
      beam.appendChild(span);
    });
    els.historyTimeline.appendChild(beam);

    history.forEach((item, index) => {
      const entry = document.createElement('article');
      entry.className = 'bp-timeline-entry';
      entry.dataset.index = String(index);
      const isFinal = Boolean(item.highlight);
      if (isFinal) entry.classList.add('bp-timeline-entry--final');

      const node = document.createElement('span');
      node.className = 'bp-timeline-node';
      node.setAttribute('aria-hidden', 'true');

      const connector = document.createElement('span');
      connector.className = 'bp-timeline-connector';
      connector.setAttribute('aria-hidden', 'true');

      const indexLabel = document.createElement('span');
      indexLabel.className = 'bp-timeline-index';
      indexLabel.textContent = String(index + 1).padStart(2, '0');
      indexLabel.setAttribute('aria-hidden', 'true');

      const card = document.createElement('article');
      card.className = 'card-2 bp-timeline-card';
      if (isFinal) card.classList.add('bp-timeline-card--final');

      const head = document.createElement('header');
      head.className = 'bp-timeline-head';

      const date = document.createElement('span');
      date.className = 'bp-timeline-date';
      date.textContent = item.date || '';

      const badge = document.createElement('span');
      badge.className = 'bp-timeline-badge';
      badge.textContent = item.badge || '';

      head.append(date, badge);

      const title = document.createElement('h3');
      title.className = 'bp-timeline-title';
      title.textContent = item.title || '';

      const body = document.createElement('p');
      body.className = 'bp-timeline-body';
      body.textContent = item.body || '';

      card.append(head, title, body);

      if (Array.isArray(item.tags) && item.tags.length) {
        const tags = document.createElement('ul');
        tags.className = 'card-tags';
        item.tags.forEach((tag) => {
          const li = document.createElement('li');
          li.textContent = tag;
          tags.appendChild(li);
        });
        card.appendChild(tags);
      }

      entry.append(node, connector, indexLabel, card);
      els.historyTimeline.appendChild(entry);

      if (isFinal) {
        card.classList.add('reveal');
        observeReveal(card);
      } else {
        entry.classList.add('reveal');
        observeReveal(entry);
      }
    });

    layoutHistory();
    updateBeamFill();
  }

  /* ── Countdown ─────────────────────────────────────────────── */

  function countdownTarget() {
    const season = state.season || {};
    const now = Date.now();
    const end = endExclusiveDate(parseDate(season.end));
    const next = parseDate(season.nextStart);

    if ((state.phase === 'live' || state.phase === 'outage') && end && end.getTime() > now) {
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
    if (state.phase === 'outage') return 'The season is active, but the server is offline.';
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
    return /maint/i.test(String(motd || ''));
  }

  function isInSeason() {
    const season = state.season || {};
    const start = parseDate(season.start);
    const end = endExclusiveDate(parseDate(season.end));
    const now = Date.now();

    if (start && end) {
      return now >= start.getTime() && now < end.getTime();
    }
    if (start) return now >= start.getTime();
    if (end) return now < end.getTime();
    return false;
  }

  function resolvePhase(server) {
    const configured = state.season?.state;

    if (configured === 'maintenance') return 'maintenance';
    if (configured === 'offline') return 'offline';
    if (server.error) return 'error';
    if (server.online) return isMaintenanceMotd(server.motd) ? 'maintenance' : 'live';
    return isInSeason() ? 'outage' : 'offline';
  }

  function offlineNote() {
    const season = state.season || {};
    const next = parseDate(season.nextStart);
    const end = endExclusiveDate(parseDate(season.end));

    if (next && next.getTime() > Date.now()) {
      return `Off-season. The next season starts on ${formatDate(next)}.`;
    }
    if (end && end.getTime() <= Date.now()) {
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
      outage: {
        state: 'Currently offline',
        hero: 'Currently offline',
        note: 'The season is active, but the server is not reachable. Retrying automatically.',
        motd: 'The server is currently offline. This page will retry automatically.'
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
    const motdVersion = parseVersion(server.motd);

    setText(els.statusState, current.state);
    setText(els.heroStatus, current.hero);
    setText(els.statusNote, customMessage || current.note);
    renderMotd(current.motd);

    setText(els.playersOnline, players ? String(players.online) : '—');
    setText(els.playersMax, players ? String(players.max) : '—');
    setText(els.version, motdVersion || '—');
    setText(els.updated, phase === 'checking' ? '—' : formatTime(new Date()));
    setText(els.heroVersion, motdVersion ? `Java ${motdVersion}` : 'Java Edition');
  }

  function updateJoin() {
    const version = parseVersion(state.server?.motd);
    const invite = state.season?.discord || CONFIG.discord;

    setText(els.heroHost, CONFIG.host);
    setText(els.statusHost, CONFIG.host);
    setText(els.joinAddress, CONFIG.host);
    setText(els.joinVersion, version || '—');

    if (els.discordLink) {
      els.discordLink.href = invite || '../index.html#links';
      setText(els.discordLabel, invite ? 'Join the Discord' : 'Open contact hub');
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
      els.agreeNote,
      agreed
        ? 'Rules accepted for this rules version.'
        : 'Agree to reveal the server address.'
    );

    updateWhitelistSubmit();
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

  /* ── Whitelist request ────────────────────────────────────── */

  function renderWhitelist() {
    const config = state.season?.whitelist || {};
    const open = config.open === true;
    const endpoint = CONFIG.whitelist.endpoint;
    const siteKey = CONFIG.whitelist.turnstileSiteKey;
    const ready = open && Boolean(endpoint) && Boolean(siteKey);

    if (els.whitelistState) {
      els.whitelistState.textContent = ready ? 'Open' : 'Closed';
      setState(els.whitelistState, ready ? 'live' : 'offline');
    }

    let message = config.message || (ready
      ? 'Whitelist requests are open. Read the rules above, then send your Minecraft username.'
      : 'Whitelist requests open with the next season.');

    if (open && !endpoint) {
      message = 'Whitelist is enabled, but the request endpoint is not configured yet.';
    } else if (open && !siteKey) {
      message = 'Whitelist is enabled, but the captcha is not configured yet.';
    }

    setText(els.whitelistMessage, message);

    if (els.whitelistForm) {
      els.whitelistForm.hidden = !ready;
    }

    if (ready) {
      loadTurnstile();
    }

    updateWhitelistSubmit();
  }

  function loadTurnstile() {
    if (!CONFIG.whitelist.turnstileSiteKey || !els.whitelistTurnstile) return;

    if (window.turnstile) {
      renderTurnstileWidget();
      return;
    }

    if (state.turnstileScriptRequested) return;
    state.turnstileScriptRequested = true;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = renderTurnstileWidget;
    script.onerror = () => {
      showWhitelistResult('Could not load the captcha. Please try again later.', 'error');
    };

    document.head.appendChild(script);
  }

  function renderTurnstileWidget() {
    if (!window.turnstile || !els.whitelistTurnstile || state.turnstileWidgetId !== null) return;

    state.turnstileWidgetId = window.turnstile.render(els.whitelistTurnstile, {
      sitekey: CONFIG.whitelist.turnstileSiteKey,
      theme: 'dark',
      callback: (token) => {
        state.whitelistToken = token;
        updateWhitelistSubmit();
      },
      'expired-callback': () => {
        state.whitelistToken = '';
        updateWhitelistSubmit();
      },
      'error-callback': () => {
        state.whitelistToken = '';
        updateWhitelistSubmit();
      }
    });
  }

  function updateWhitelistSubmit() {
    if (els.whitelistSubmit) {
      els.whitelistSubmit.disabled = !state.agreed || !state.whitelistToken || state.whitelistLoading;
    }

    setText(
      els.whitelistHint,
      state.agreed
        ? 'Rules accepted. Complete the captcha and send your request.'
        : 'You need to agree to the server rules above before sending a request.'
    );
  }

  function showWhitelistResult(message, stateName) {
    if (!els.whitelistResult) return;

    els.whitelistResult.textContent = message || '';

    if (stateName) {
      els.whitelistResult.dataset.state = stateName;
    } else {
      delete els.whitelistResult.dataset.state;
    }
  }

  async function handleWhitelistSubmit(event) {
    event.preventDefault();

    const username = els.whitelistUsername?.value.trim() || '';
    const discord = els.whitelistDiscord?.value.trim() || '';
    const honeypot = els.whitelistWebsite?.value.trim() || '';

    if (honeypot) return;
    if (!state.agreed) {
      showWhitelistResult('Please agree to the server rules above first.', 'error');
      return;
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      showWhitelistResult('Please enter a valid Minecraft Java username (3-16 letters, numbers, or underscores).', 'error');
      return;
    }
    if (!CONFIG.whitelist.endpoint) {
      showWhitelistResult('Whitelist requests are not connected yet.', 'error');
      return;
    }
    if (!state.whitelistToken) {
      showWhitelistResult('Please complete the captcha first.', 'error');
      return;
    }

    state.whitelistLoading = true;
    updateWhitelistSubmit();
    showWhitelistResult('Sending request…');

    try {
      const response = await fetch(CONFIG.whitelist.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          discord,
          rulesVersion: RULES.version,
          turnstileToken: state.whitelistToken
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(data.message || `Request failed (HTTP ${response.status}).`);
      }

      showWhitelistResult(data.message || 'Request received. You will be contacted in Discord.', 'success');

      if (els.whitelistForm) els.whitelistForm.reset();
      state.whitelistToken = '';

      if (window.turnstile && state.turnstileWidgetId !== null) {
        window.turnstile.reset(state.turnstileWidgetId);
      }
    } catch (error) {
      showWhitelistResult(error.message || 'Could not send the request. Please try again later.', 'error');
    } finally {
      state.whitelistLoading = false;
      updateWhitelistSubmit();
    }
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

    if (els.whitelistForm) {
      els.whitelistForm.addEventListener('submit', handleWhitelistSubmit);
    }

    document.addEventListener('keydown', handleRulesKeydown);

    window.addEventListener('scroll', scheduleBeamFill, { passive: true });

    let historyResizeTimer = null;
    window.addEventListener('resize', () => {
      window.clearTimeout(historyResizeTimer);
      historyResizeTimer = window.setTimeout(() => {
        layoutHistory();
        updateBeamFill();
      }, 150);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        layoutHistory();
        updateBeamFill();
      });
    }

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
