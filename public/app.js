/* 2vs2 Liga-Terminplaner – Frontend (Vanilla JS SPA mit Hash-Routing) */
(() => {
  'use strict';

  const T = window.TOURNAMENT;
  const {
    LEAGUES,
    PHASES,
    WEEKS,
    HOURS,
    phaseDates,
    phaseForDate,
    getPhase,
    getLeague,
    formatDay,
    hourLabel,
    formatRange,
  } = T;

  const $app = document.getElementById('app');
  const LS_PLAYER = '2vs2.playerId';
  const SS_ADMIN = '2vs2.adminToken';
  try { localStorage.removeItem('2vs2.currentWeek'); } catch { /* ignore */ }
  const STATUS_LABEL = { green: 'Kann ich', yellow: 'Unsicher', red: 'Kann ich nicht' };
  const NEXT = { red: 'green', green: 'yellow', yellow: 'red' };
  const REFRESH_MS = 30000;

  const S = {
    adminPhase: PHASES[0].id,
    adminLeague: 'all',
    adminMatchupLeague: LEAGUES[0].id,
    insightLeague: LEAGUES[0].id,
    insightPlayer: null,
    insightPhase: null,
    homeMainTab: 'matches',
    homeMatchFilter: 'all',
    expandAllWeeks: false,
    selectedWeek: null,
  };
  let dirty = false;
  let ignoreHash = false;
  let currentHash = location.hash || '#/';
  let cleanups = [];

  // ---------- Helfer ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = (date, hour) => `${date}|${hour}`;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const onCleanup = (fn) => cleanups.push(fn);
  const runCleanup = () => { cleanups.forEach((fn) => { try { fn(); } catch { /* ignore */ } }); cleanups = []; };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const slotLabel = (k, showWeek = false) => {
    if (!k || !String(k).includes('|')) return String(k || '');
    const [d, h] = String(k).split('|');
    const f = formatDay(d);
    const ph = showWeek ? phaseForDate(d) : null;
    const wk = ph ? ` (W${ph.week})` : '';
    return `${f.weekday}, ${f.short}${wk} · ${hourLabel(Number(h))}`;
  };

  function leagueBadgeHTML(leagueId, extraCls = 'sm') {
    const lg = getLeague(leagueId);
    if (!lg) return '';
    return `<span class="badge league-badge lg-${lg.color} ${extraCls}" title="${esc(lg.name)}">🏅 ${esc(lg.name)}</span>`;
  }

  function teamInitials(name) {
    const words = String(name || '')
      .replace(/^(die|the|der|das)\s+/i, '')
      .trim()
      .split(/[\s.-]+/)
      .filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function teamLogoHTML(logo, name, size = 'sm', extraCls = '') {
    const isDummy = /dummy|freispiel/i.test(String(name || ''));
    const cls = `team-crest tc-${size} ${logo ? '' : 'tc-fallback'} ${isDummy ? 'tc-dummy' : ''} ${extraCls}`.trim();
    if (logo) {
      return `<span class="${cls}" title="${esc(name || '')}"><img src="${esc(logo)}" alt="${esc(name || '')}" loading="lazy"></span>`;
    }
    return `<span class="${cls}" title="${esc(name || 'Ohne Logo')}"><span>${isDummy ? '🎟' : esc(teamInitials(name))}</span></span>`;
  }

  async function api(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = sessionStorage.getItem(SS_ADMIN);
    if (token) headers.Authorization = 'Bearer ' + token;
    let res;
    try {
      res = await fetch('/api' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, cache: 'no-store' });
    } catch {
      throw new Error('Keine Verbindung zum Server. Bitte Internetverbindung prüfen.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token && !path.startsWith('/admin/login')) {
        sessionStorage.removeItem(SS_ADMIN);
        toast('Admin-Sitzung abgelaufen – bitte neu anmelden.', 'error');
        setTimeout(() => go('#/'), 0);
      }
      const err = new Error(data.error || `Fehler ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function toast(msg, type = 'ok') {
    const box = document.getElementById('toasts');
    const t = el(`<div class="toast ${type}"><span>${type === 'error' ? '⚠' : type === 'info' ? 'ℹ' : '✓'}</span><p>${esc(msg)}</p></div>`);
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, type === 'error' ? 5000 : 3000);
  }

  function modal({ title, body = '', confirmText = 'OK', cancelText = 'Abbrechen', danger = false, onConfirm }) {
    return new Promise((resolve) => {
      const m = el(`
        <div class="modal-backdrop">
          <form class="modal metal" novalidate>
            <h3>${esc(title)}</h3>
            <div class="modal-body">${body}</div>
            <p class="modal-error" hidden></p>
            <div class="modal-actions">
              ${cancelText ? `<button type="button" class="btn btn-ghost" data-cancel>${esc(cancelText)}</button>` : ''}
              <button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-primary'}">${esc(confirmText)}</button>
            </div>
          </form>
        </div>`);
      document.body.appendChild(m);
      const form = m.querySelector('form');
      const errBox = m.querySelector('.modal-error');
      const submit = form.querySelector('[type=submit]');
      const close = (val) => { m.classList.remove('show'); setTimeout(() => m.remove(), 200); document.removeEventListener('keydown', onKey); resolve(val); };
      const onKey = (e) => { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', onKey);
      m.addEventListener('mousedown', (e) => { if (e.target === m) close(null); });
      form.querySelector('[data-cancel]')?.addEventListener('click', () => close(null));
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!onConfirm) return close(true);
        submit.disabled = true;
        errBox.hidden = true;
        try {
          const result = await onConfirm(form);
          close(result === undefined ? true : result);
        } catch (err) {
          errBox.textContent = err.message;
          errBox.hidden = false;
          submit.disabled = false;
        }
      });
      requestAnimationFrame(() => {
        m.classList.add('show');
        (form.querySelector('input,select') || submit).focus();
      });
    });
  }

  const promptModal = (title, label, value, onSave) => modal({
    title,
    confirmText: 'Speichern',
    body: `<label class="field"><span>${esc(label)}</span><input name="value" value="${esc(value)}" maxlength="60" autocomplete="off" required></label>`,
    onConfirm: (form) => onSave(form.value.value.trim()),
  });

  const confirmModal = (title, text, confirmText = 'Löschen') => modal({ title, body: `<p>${text}</p>`, confirmText, danger: true });

  function brand(small = false) {
    if (small) {
      return `
        <div class="brand small">
          <img src="/logo.png?v=2vs2" alt="2vs2 Liga Logo" class="brand-crest-sm">
          <span class="logo"><b>2<i>vs</i>2</b></span>
          <span class="brand-text"><b>Liga-Terminplaner</b><small>Walkabout Wunderland · 11 Wochen Saison</small></span>
        </div>`;
    }
    return `
      <div class="brand hero-brand">
        <div class="crest-showcase">
          <div class="crest-glow"></div>
          <img src="/logo.png?v=2vs2" alt="Walkabout Wunderland 2vs2 Logo" class="crest-img">
        </div>
        <div class="brand-row">
          <span class="logo"><b>2<i>vs</i>2</b></span>
          <span class="brand-text"><b>Liga-Terminplaner</b><small>Walkabout Wunderland · 8 Ligen · Hin- & Rückrunde</small></span>
        </div>
      </div>`;
  }

  function legend(kind = 'edit') {
    if (kind === 'match') {
      return `<div class="legend">
        <span><i class="lg m-perfect"></i>Perfekt (alle 4 grün)</span>
        <span><i class="lg m-maybe"></i>Möglich (mit gelb)</span>
        <span><i class="lg m-no"></i>Nicht möglich</span>
        <span><i class="lg m-own-busy"></i>🚫 Eigenes Spiel</span>
      </div>`;
    }
    return `<div class="legend">
      <span><i class="lg s-green"></i>Grün = Kann ich</span>
      <span><i class="lg s-yellow"></i>Gelb = Unsicher</span>
      <span><i class="lg s-red"></i>Rot = Kann ich nicht</span>
    </div>`;
  }

  // ---------- Router ----------
  let handlingUnsavedHash = false;
  window.addEventListener('hashchange', async () => {
    if (ignoreHash) { ignoreHash = false; return; }
    if (dirty) {
      if (handlingUnsavedHash) return;
      handlingUnsavedHash = true;
      const targetHash = location.hash;
      ignoreHash = true;
      location.hash = currentHash;
      const ok = await modal({
        title: 'Ungespeicherte Änderungen',
        body: '<p>Du hast Änderungen an deinen Zeiten vorgenommen, die noch nicht gespeichert wurden. Möchtest du die Seite wirklich verlassen und deine Änderungen verwerfen?</p>',
        confirmText: 'Ja, verwerfen',
        cancelText: 'Zurück zum Kalender',
        danger: true,
      });
      handlingUnsavedHash = false;
      if (ok) {
        dirty = false;
        go(targetHash);
      }
      return;
    }
    dirty = false;
    route();
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  async function go(hash) {
    if (dirty) {
      if (handlingUnsavedHash) return;
      handlingUnsavedHash = true;
      const ok = await modal({
        title: 'Ungespeicherte Änderungen',
        body: '<p>Du hast Änderungen an deinen Zeiten vorgenommen, die noch nicht gespeichert wurden. Möchtest du die Seite wirklich verlassen und deine Änderungen verwerfen?</p>',
        confirmText: 'Ja, verwerfen',
        cancelText: 'Zurück zum Kalender',
        danger: true,
      });
      handlingUnsavedHash = false;
      if (!ok) return;
      dirty = false;
    }
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  let settingsLoaded = false;
  async function ensureSettings(force = false) {
    if (settingsLoaded && !force) return;
    try {
      const s = await api('/settings');
      if (s?.season_start) {
        T.setSeasonStart(s.season_start);
      }
      settingsLoaded = true;
    } catch { /* ignore */ }
  }

  function openSeasonStartModal(onSaved) {
    const currentStart = T.getSeasonStart();
    const curFmt = formatDay(currentStart);
    return modal({
      title: '📅 Saison-Startdatum festlegen',
      confirmText: '💾 Neues Startdatum speichern',
      body: `
        <p class="muted">Wähle das Startdatum für <b>Woche 1 (Spieltag 1)</b> der Saison. Alle 11 Spielwochen (Hinrunde, 1 Woche Pause, Rückrunde) berechnen sich ab diesem Montag.</p>
        <div class="modal-notice info" style="margin-bottom:12px;padding:9px 12px;background:rgba(59,156,255,0.12);border-radius:8px;border:1px solid rgba(59,156,255,0.3)">
          Aktuell eingestellt: <b>${curFmt.weekdayLong}, ${curFmt.full}</b>
        </div>
        <label class="field">
          <span>Startdatum (Woche 1, Montag)</span>
          <input type="date" name="season_start" value="${currentStart}" required>
        </label>
        <p class="hint small">💡 Falls du ein Datum wählst, das kein Montag ist, wird automatisch der Montag dieser Kalenderwoche als Starttag gewählt. Bereits gespeicherte Zeiten & Termine wandern automatisch mit.</p>`,
      onConfirm: async (form) => {
        const val = form.elements.namedItem('season_start').value;
        if (!val) throw new Error('Bitte ein Datum wählen.');
        const res = await api('/admin/settings', {
          method: 'POST',
          body: { season_start: val },
        });
        T.setSeasonStart(res.season_start);
        S.selectedWeek = null;
        const newFmt = formatDay(res.season_start);
        toast(`✓ Saison-Start auf ${newFmt.weekdayLong}, den ${newFmt.full} festgelegt!`);
        if (onSaved) await onSaved();
      },
    });
  }

  async function route() {
    currentHash = location.hash || '#/';
    runCleanup();
    window.scrollTo(0, 0);
    await ensureSettings();
    const parts = currentHash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    try {
      if (parts[0] === 'player' && parts[1] === 'phase') await renderPlayerPhase(parts[2], parts[3] === 'match' ? parts[4] : null);
      else if (parts[0] === 'player') await renderPlayerHome();
      else if (parts[0] === 'admin') await renderAdmin(parts[1] || 'teams', parts.slice(2));
      else await renderLogin();
    } catch (err) {
      console.error(err);
      $app.innerHTML = `<div class="container"><div class="card error-card"><h2>Da ist etwas schiefgelaufen</h2><p>${esc(err.message)}</p><button class="btn btn-primary" onclick="location.reload()">Neu laden</button> <a class="btn btn-ghost" href="#/">Zur Startseite</a></div></div>`;
    }
  }

  // =====================================================================
  //  STARTSEITE / LOGIN
  // =====================================================================
  async function renderLogin() {
    const players = await api('/players');
    const remembered = players.find((p) => String(p.id) === localStorage.getItem(LS_PLAYER));
    $app.innerHTML = `
      <div class="login-page">
        <div class="login-hero">
          ${brand()}
          <h1 class="hero-title">Finde deinen <span>Spieltermin</span></h1>
        </div>
        <section class="card metal login-card">
          <h2>Spieler-Login</h2>
          <p class="muted">Suche deinen Namen, dein Team oder deine Liga – kein Passwort nötig.</p>
          ${remembered ? `<button class="continue-chip" id="continue-btn">${remembered.team_name ? teamLogoHTML(remembered.team_logo, remembered.team_name, 'xs') : ''}<span>↩ Weiter als <b>${esc(remembered.name)}</b>${remembered.team_name ? ` <small class="muted">(${esc(remembered.team_name)} · ${esc(getLeague(remembered.league_id)?.short || '')})</small>` : ''}</span></button>` : ''}
          <div class="search">
            <span class="search-icon">⌕</span>
            <input id="player-search" type="search" autocomplete="off" spellcheck="false" placeholder="${players.length ? 'Spieler, Team oder Liga eingeben …' : 'Noch keine Spieler angelegt'}" ${players.length ? '' : 'disabled'} role="combobox" aria-expanded="false" aria-controls="search-results">
            <ul id="search-results" class="dropdown" role="listbox" hidden></ul>
          </div>
          <button id="login-btn" class="btn btn-primary btn-block" disabled>Einloggen</button>
          ${players.length ? '' : '<p class="hint">Der Admin muss zuerst Teams & Spieler anlegen.</p>'}
        </section>
        <div class="admin-entry">
          <button class="btn btn-ghost" id="admin-login-btn">🔒 Admin-Login</button>
        </div>
        ${phaseStrip()}
      </div>`;

    const input = document.getElementById('player-search');
    const list = document.getElementById('search-results');
    const loginBtn = document.getElementById('login-btn');
    let selected = null;
    let results = [];
    let active = -1;

    const label = (p) => `${p.name} (${p.team_name || 'ohne Team'})`;
    const highlight = (text, q) => {
      if (!q) return esc(text);
      const i = norm(text).indexOf(norm(q));
      if (i < 0) return esc(text);
      return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
    };
    const renderList = () => {
      const q = input.value.trim();
      results = players.filter((p) => {
        const lgName = getLeague(p.league_id)?.name || '';
        return !q || norm(p.name).includes(norm(q)) || norm(p.team_name).includes(norm(q)) || norm(lgName).includes(norm(q)) || String(p.id) === q || String(p.id).startsWith(q);
      }).slice(0, 60);
      list.innerHTML = results.length
        ? results.map((p, i) => {
          const lg = getLeague(p.league_id);
          return `<li role="option" data-i="${i}" class="${i === active ? 'active' : ''}">
            <span class="r-name">${highlight(p.name, q)} <small class="muted" style="font-weight: normal; opacity: 0.75;">#${p.id}</small></span>
            <span class="r-team">
              ${p.team_name ? `${teamLogoHTML(p.team_logo, p.team_name, 'xs')}<span>${highlight(p.team_name, q)}</span>` : '<em>ohne Team</em>'}
              ${lg ? `<small class="r-league">${esc(lg.short)}</small>` : ''}
            </span>
          </li>`;
        }).join('')
        : '<li class="empty">Kein Spieler gefunden</li>';
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };
    const choose = (p) => {
      selected = p;
      input.value = label(p);
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      loginBtn.disabled = false;
      loginBtn.textContent = `Einloggen als ${p.name}`;
      loginBtn.focus();
    };
    const login = (p) => { S.selectedWeek = null; localStorage.setItem(LS_PLAYER, String(p.id)); go('#/player'); };

    input.addEventListener('input', () => {
      selected = null; active = -1;
      loginBtn.disabled = true; loginBtn.textContent = 'Einloggen';
      renderList();
    });
    input.addEventListener('focus', () => { if (!selected) renderList(); });
    input.addEventListener('keydown', (e) => {
      if (list.hidden && e.key === 'Enter' && selected) { login(selected); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); renderList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); renderList(); }
      else if (e.key === 'Enter') { e.preventDefault(); const p = results[active >= 0 ? active : 0]; if (p) choose(p); }
      else if (e.key === 'Escape') { list.hidden = true; }
      list.querySelector('li.active')?.scrollIntoView({ block: 'nearest' });
    });
    list.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li) { e.preventDefault(); choose(results[Number(li.dataset.i)]); }
    });
    const outside = (e) => { if (!e.target.closest('.search')) list.hidden = true; };
    document.addEventListener('mousedown', outside);
    onCleanup(() => document.removeEventListener('mousedown', outside));
    loginBtn.addEventListener('click', () => selected && login(selected));
    document.getElementById('continue-btn')?.addEventListener('click', () => login(remembered));
    document.getElementById('admin-login-btn').addEventListener('click', openAdminLogin);
  }

  function phaseStrip() {
    return `<div class="phase-strip">${PHASES.map((p) => `<span class="strip-seg c-${p.color}" title="Woche ${p.week}: ${esc(p.name)} (${esc(p.subtitle)}) · ${formatRange(p)}"></span>`).join('')}</div>`;
  }

  function openAdminLogin() {
    modal({
      title: 'Admin-Login',
      confirmText: 'Anmelden',
      body: `<label class="field"><span>Admin-Passwort</span><input type="password" name="password" autocomplete="current-password" required></label>`,
      onConfirm: async (form) => {
        const pw = form.password.value;
        if (!pw) throw new Error('Bitte Passwort eingeben.');
        const { token } = await api('/admin/login', { method: 'POST', body: { password: pw } });
        sessionStorage.setItem(SS_ADMIN, token);
      },
    }).then((ok) => { if (ok) go('#/admin/teams'); });
  }

  // =====================================================================
  //  SPIELER-BEREICH & MITLAUFENDES 3-WOCHEN-FENSTER
  // =====================================================================
  async function loadMe() {
    const pid = localStorage.getItem(LS_PLAYER);
    if (!pid) { go('#/'); return null; }
    try {
      return await api(`/players/${pid}`);
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        localStorage.removeItem(LS_PLAYER);
        toast('Dein Spielerprofil wurde nicht gefunden. Bitte erneut einloggen.', 'error');
        go('#/');
        return null;
      }
      throw err;
    }
  }

  function notifMeta(kind) {
    switch (kind) {
      case 'proposal_received':
        return { icon: '📩', label: 'Terminvorschlag erhalten', cls: 'nc-incoming' };
      case 'counter_proposal':
        return { icon: '🔄', label: 'Gegenvorschlag erhalten', cls: 'nc-incoming' };
      case 'match_confirmed':
        return { icon: '🎉', label: 'Fester Termin bestätigt', cls: 'nc-confirmed' };
      case 'all_4_ready':
      case 'all_6_ready':
        return { icon: '🔓', label: 'Alle 4 Spieler bereit', cls: 'nc-ready' };
      case 'teammate_proposed':
        return { icon: '👥', label: 'Mitspieler-Vorschlag', cls: 'nc-team' };
      case 'teammate_availability':
        return { icon: '👥', label: 'Mitspieler-Zeiten', cls: 'nc-team' };
      case 'match_reset':
        return { icon: '⚠️', label: 'Termin zurückgesetzt', cls: 'nc-reset' };
      default:
        return { icon: '🔔', label: 'Liga-Info', cls: 'nc-team' };
    }
  }

  function notifTopbarBtn(me) {
    const unread = Number(me.unreadCount || 0);
    return `
      <button type="button" class="notif-top-btn ${unread > 0 ? 'has-unread' : ''}" id="notif-center-btn" title="Nachrichtenzentrale öffnen">
        <span class="notif-bell" aria-hidden="true">🔔</span>
        <span class="notif-btn-text">Nachrichten</span>
        ${unread > 0
          ? `<span class="notif-red-badge" id="notif-top-badge" aria-label="${unread} ungelesene Nachrichten">${unread}</span>`
          : `<span class="notif-zero-badge" id="notif-top-badge">0</span>`}
      </button>`;
  }

  function notifStartBanner() {
    return '<div id="notif-start-banner-wrap"></div>';
  }

  function playerTopbar(me) {
    const p = me.player;
    return `
      <header class="topbar metal">
        <a href="#/player" class="brand-link">${brand(true)}</a>
        <div class="who">
          <div class="who-main">
            ${p.team_name ? teamLogoHTML(p.team_logo, p.team_name, 'md') : `<span class="avatar">${esc(p.name.slice(0, 1).toUpperCase())}</span>`}
            <div>
              <b>${esc(p.name)}</b>
              <small>${p.team_name ? esc(p.team_name) : 'ohne Team'}</small>
            </div>
          </div>
          ${me.teammates.length ? `<div class="mates"><span>Partner:</span>${me.teammates.map((m) => `<span class="mate">${esc(m.name)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="topbar-actions">
          ${notifTopbarBtn(me)}
          <button class="btn btn-ghost btn-sm" id="logout-btn">Logout</button>
        </div>
      </header>`;
  }

  function updateNotifUI(me) {
    const unread = Number(me.unreadCount || 0);
    const topBtn = document.getElementById('notif-center-btn');
    if (topBtn) {
      topBtn.classList.toggle('has-unread', unread > 0);
      const badge = document.getElementById('notif-top-badge');
      if (badge) {
        badge.className = unread > 0 ? 'notif-red-badge' : 'notif-zero-badge';
        badge.textContent = String(unread);
      }
    }
  }

  function openNotificationCenter(me) {
    const existing = document.getElementById('notif-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop notif-backdrop show';
    backdrop.id = 'notif-modal-backdrop';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        backdrop.remove();
      }
    };
    document.addEventListener('keydown', onKey);
    const close = () => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
    };

    const renderModalContent = () => {
      const list = me.notifications || [];
      const unread = list.filter((n) => !n.is_read);
      const read = list.filter((n) => n.is_read);

      const renderItem = (n) => {
        const meta = notifMeta(n.kind);
        const ph = n.phase_id ? getPhase(n.phase_id) : null;
        const canJump = Boolean(n.phase_id && n.matchup_id);
        const jumpBtnCls = (n.kind === 'proposal_received' || n.kind === 'counter_proposal')
          ? 'btn-amber'
          : (n.kind === 'all_4_ready' || n.kind === 'all_6_ready' || n.kind === 'match_confirmed')
            ? 'btn-primary'
            : 'btn-blue';
        return `
          <div class="nc-card ${meta.cls} ${n.is_read ? 'is-read' : 'is-unread'}" data-nid="${n.id}">
            <div class="nc-card-top">
              <span class="nc-type-badge">${meta.icon} ${esc(meta.label)}</span>
              ${ph ? `<span class="nc-phase-tag">Woche ${ph.week} · ${esc(ph.name)}</span>` : ''}
              ${!n.is_read
                ? '<span class="nc-unread-pill"><i class="nc-red-dot"></i>NEU</span>'
                : '<span class="nc-read-pill">✓ Gelesen</span>'}
            </div>
            <h4 class="nc-card-title">${esc(n.title)}</h4>
            <p class="nc-card-body">${esc(n.body)}</p>
            <div class="nc-card-actions">
              ${canJump
                ? `<button type="button" class="btn ${jumpBtnCls} btn-sm nc-jump-btn" data-nid="${n.id}" data-phase="${esc(n.phase_id)}" data-match="${n.matchup_id}">
                    ⚔ Direkt zum Match-Abgleich ›
                  </button>`
                : ph
                ? `<button type="button" class="btn btn-steel btn-sm nc-jump-phase-btn" data-nid="${n.id}" data-phase="${esc(n.phase_id)}">
                    🗓 Zur Spielwoche ›
                  </button>`
                : ''}
              ${!n.is_read
                ? `<button type="button" class="btn btn-steel btn-sm nc-mark-btn" data-nid="${n.id}">✓ Als gelesen markieren</button>`
                : ''}
            </div>
          </div>`;
      };

      backdrop.innerHTML = `
        <div class="modal notif-modal metal" role="dialog" aria-modal="true" aria-labelledby="nc-modal-title">
          <header class="nc-head">
            <div class="nc-head-title">
              <span class="nc-head-icon">📬</span>
              <div>
                <h3 id="nc-modal-title">Nachrichtenzentrale</h3>
                <p class="muted">Alle wichtigen Updates zu Terminvorschlägen, Einigungen & deinem 2vs2-Team</p>
              </div>
              ${unread.length > 0 ? `<span class="notif-red-badge lg">${unread.length} neu</span>` : '<span class="badge ok">Alles gelesen</span>'}
            </div>
            <div class="nc-head-actions">
              ${unread.length > 0 ? `<button type="button" class="btn btn-ghost btn-sm" id="nc-mark-all-btn">✓ Alle als gelesen markieren</button>` : ''}
              <button type="button" class="btn btn-ghost btn-sm" id="nc-close-btn">✕ Schließen</button>
            </div>
          </header>
          <div class="nc-body">
            ${list.length === 0 ? `
              <div class="nc-empty">
                <p>Aktuell liegen noch keine Nachrichten für dich vor.</p>
              </div>
            ` : `
              ${unread.length > 0 ? `
                <div class="nc-section">
                  <div class="nc-sec-title"><span class="notif-red-badge sm">${unread.length}</span> Ungelesene Nachrichten</div>
                  <div class="nc-list">${unread.map(renderItem).join('')}</div>
                </div>
              ` : `
                <div class="nc-all-clear">
                  <span>🎉</span> Du bist auf dem neuesten Stand – keine ungelesenen Nachrichten!
                </div>
              `}
              ${read.length > 0 ? `
                <div class="nc-section nc-read-sec">
                  <div class="nc-sec-title muted">Bereits gelesen (${read.length})</div>
                  <div class="nc-list">${read.map(renderItem).join('')}</div>
                </div>
              ` : ''}
            `}
          </div>
        </div>`;

      backdrop.querySelector('#nc-close-btn')?.addEventListener('click', close);
      backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

      backdrop.querySelector('#nc-mark-all-btn')?.addEventListener('click', async () => {
        try {
          const res = await api(`/players/${me.player.id}/notifications/read-all`, { method: 'POST' });
          me.notifications = res.notifications;
          me.unreadCount = res.unreadCount;
          updateNotifUI(me);
          renderModalContent();
          toast('Alle Nachrichten als gelesen markiert.', 'ok');
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      backdrop.querySelectorAll('.nc-mark-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const nid = btn.dataset.nid;
          try {
            const res = await api(`/players/${me.player.id}/notifications/${nid}/read`, { method: 'POST' });
            me.notifications = res.notifications;
            me.unreadCount = res.unreadCount;
            updateNotifUI(me);
            renderModalContent();
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });

      backdrop.querySelectorAll('.nc-jump-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const nid = btn.dataset.nid;
          const phId = btn.dataset.phase;
          const mId = btn.dataset.match;
          try {
            const res = await api(`/players/${me.player.id}/notifications/${nid}/read`, { method: 'POST' });
            me.notifications = res.notifications;
            me.unreadCount = res.unreadCount;
            updateNotifUI(me);
          } catch { /* ignore */ }
          close();
          go(`#/player/phase/${phId}/match/${mId}`);
        });
      });

      backdrop.querySelectorAll('.nc-jump-phase-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const nid = btn.dataset.nid;
          const phId = btn.dataset.phase;
          try {
            const res = await api(`/players/${me.player.id}/notifications/${nid}/read`, { method: 'POST' });
            me.notifications = res.notifications;
            me.unreadCount = res.unreadCount;
            updateNotifUI(me);
          } catch { /* ignore */ }
          close();
          go(`#/player/phase/${phId}`);
        });
      });
    };

    renderModalContent();
    document.body.appendChild(backdrop);
  }

  function bindLogout(me) {
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      S.selectedWeek = null;
      localStorage.removeItem(LS_PLAYER);
      go('#/');
    });
    if (me) {
      document.getElementById('notif-center-btn')?.addEventListener('click', () => openNotificationCenter(me));
    }
  }

  function opponentOf(m, teamId) {
    return m.team_a_id === teamId ? m.team_b_name : m.team_a_name;
  }

  function opponentLogoOf(m, teamId) {
    return m.team_a_id === teamId ? m.team_b_logo : m.team_a_logo;
  }

  function myLogoOf(m, teamId, fallbackLogo = null) {
    if (m.team_a_id === teamId) return m.team_a_logo || fallbackLogo;
    if (m.team_b_id === teamId) return m.team_b_logo || fallbackLogo;
    return fallbackLogo;
  }

  /**
   * Berechnet die echte aktuelle Saisonwoche anhand des heutigen Datums (1 bis 11).
   */
  function getRealSeasonWeek() {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (const p of PHASES) {
      if (today >= p.start && today <= p.end) {
        return p.week;
      }
    }
    const firstStart = PHASES[0]?.start || '2026-11-09';
    if (today < firstStart) return 1;
    return PHASES.length;
  }

  /**
   * Ermittelt die aktuell angezeigte Saisonwoche (1 bis 11).
   */
  function getCurrentSeasonWeek() {
    const urlWeek = new URLSearchParams(location.search).get('week');
    const override = urlWeek || S.selectedWeek;
    if (override) {
      const n = Number(override);
      if (n >= 1 && n <= PHASES.length) return n;
    }
    return getRealSeasonWeek();
  }

  /**
   * Liefert die 3 mitwandernden Wochen ab currentWeek (aktuelle Woche + die darauffolgenden 2 Wochen).
   */
  function getRollingThreePhases(currentWeek) {
    const startW = Math.max(1, Math.min(currentWeek || 1, PHASES.length));
    return PHASES.filter((p) => p.week >= startW && p.week <= startW + 2);
  }

  async function renderPlayerHome() {
    await ensureSettings(true);
    const me = await loadMe();
    if (!me) return;
    const saved = new Set(me.savedPhases);
    const lg = getLeague(me.player.league_id);

    const mountHomeContent = () => {
      const realCurrentWeek = getRealSeasonWeek();
      const focusWeek = S.selectedWeek || realCurrentWeek;
      const rollingPhases = getRollingThreePhases(focusWeek);
      const rollingPhaseIds = new Set(rollingPhases.map((p) => p.id));
      const visiblePhases = S.expandAllWeeks ? PHASES : rollingPhases;
      const visiblePhaseIds = new Set(visiblePhases.map((p) => p.id));

      // Alle Paarungen des Spielers anreichern
      const allEnriched = me.matchups.map((m) => {
        const ph = getPhase(m.phase_id);
        const opponent = opponentOf(m, me.player.team_id);
        const oppLogo = opponentLogoOf(m, me.player.team_id);
        const myLogo = myLogoOf(m, me.player.team_id, me.player.team_logo);
        const mySaved = saved.has(m.phase_id);
        const propSlots = Array.isArray(m.proposed_slots) ? m.proposed_slots : [];
        const isBye = Boolean(m.is_bye);
        const isCompleted = Boolean(m.is_completed);
        const isConfirmed = Boolean(m.confirmed_slot || isCompleted);
        const isCatchup = !isConfirmed && !isBye && (ph?.week || 0) < realCurrentWeek;
        const isIncoming = !isBye && !isConfirmed && propSlots.length > 0 && m.proposed_by_team_id !== me.player.team_id;
        const isOutgoing = !isBye && !isConfirmed && propSlots.length > 0 && m.proposed_by_team_id === me.player.team_id;
        const isWaiting = !isBye && !isConfirmed && !propSlots.length && !mySaved;
        const isReady = !isBye && !isConfirmed && !propSlots.length && !isWaiting;
        const needsAction = !isBye && !isConfirmed && (isIncoming || isReady || !mySaved || isCatchup);
        const prio = isIncoming ? 1 : isCatchup ? 2 : isReady ? 3 : isWaiting ? 4 : isOutgoing ? 5 : isConfirmed ? 6 : 7;

        // Prüfen, ob ein bestätigter oder vorgeschlagener Termin in eine andere Woche vorgezogen/nachgespielt wurde
        let effectiveSlotPhase = null;
        if (m.confirmed_slot) {
          effectiveSlotPhase = phaseForDate(m.confirmed_slot.split('|')[0]);
        } else if (propSlots.length > 0) {
          effectiveSlotPhase = phaseForDate(propSlots[0].split('|')[0]);
        }
        const isRescheduled = Boolean(effectiveSlotPhase && ph && effectiveSlotPhase.id !== ph.id);

        return {
          m,
          ph,
          opponent,
          oppLogo,
          myLogo,
          mySaved,
          propSlots,
          isBye,
          isConfirmed,
          isCompleted,
          isCatchup,
          isIncoming,
          isOutgoing,
          isWaiting,
          isReady,
          needsAction,
          prio,
          effectiveSlotPhase,
          isRescheduled,
        };
      });

      // Offene Nachholspiele (aus vergangenen Wochen, die noch nicht erledigt/bestätigt sind)
      // dürfen NIE verloren gehen, auch wenn das 3-Wochen-Fenster weitergewandert ist!
      const catchupMatches = allEnriched
        .filter((x) => x.isCatchup)
        .sort((a, b) => (a.ph?.week || 0) - (b.ph?.week || 0));

      // Bei aktivem 3-Wochen-Fenster spielen die Termine & Paarungen dieser 3 Wochen + Nachholspiele die Rolle:
      const scopedEnriched = S.expandAllWeeks
        ? allEnriched
        : allEnriched.filter(
            (x) =>
              visiblePhaseIds.has(x.m.phase_id) ||
              (x.effectiveSlotPhase && visiblePhaseIds.has(x.effectiveSlotPhase.id)) ||
              x.isCatchup
          );

      const openMatches = scopedEnriched
        .filter((x) => !x.isConfirmed && !x.isBye && !x.isCatchup)
        .sort((a, b) => a.prio - b.prio || (a.ph?.week || 0) - (b.ph?.week || 0));
      const confirmedMatches = scopedEnriched.filter((x) => x.isConfirmed);
      const byeMatches = scopedEnriched.filter((x) => x.isBye);
      const savedInVisible = visiblePhases.filter((p) => saved.has(p.id)).length;

      // Fehlt in den sichtbaren 3 Wochen (bzw. der aktuellen Woche) noch ein Kalendereintrag?
      const missingPhaseInWindow = rollingPhases.find((p) => !p.isPause && !saved.has(p.id)) || null;

      const renderRollingBanner = () => {
        const wStart = rollingPhases[0];
        const wEnd = rollingPhases[rollingPhases.length - 1];
        const isExpanded = S.expandAllWeeks;
        return `
          <div class="rolling-window-bar metal">
            <div class="rwb-head">
              <span class="rwb-badge">📍 Aktuelle Woche ${realCurrentWeek}</span>
              <span class="rwb-title">${isExpanded ? 'Alle 11 Wochen geöffnet' : `3-Wochen-Fokus (W${wStart.week}–W${wEnd.week})`}</span>
            </div>
            <div class="rwb-controls">
              <label class="rwb-sim-label" title="3-Wochen-Fenster verschieben">
                <span>Woche:</span>
                <select id="sim-week-select" class="rwb-select">
                  ${PHASES.map((p) => {
                    const mInWeek = me.matchups.find((m) => m.phase_id === p.id);
                    const oppLabel = mInWeek
                      ? (mInWeek.is_bye ? 'Freispiel' : opponentOf(mInWeek, me.player.team_id))
                      : (p.isPause ? 'Saisonpause' : 'Spielfrei');
                    const isReal = p.week === realCurrentWeek;
                    return `<option value="${p.week}" ${p.week === focusWeek ? 'selected' : ''}>Woche ${p.week}: ${esc(oppLabel)}${isReal ? ' (Aktuell)' : ''}</option>`;
                  }).join('')}
                </select>
              </label>
              <button type="button" class="btn ${isExpanded ? 'btn-steel' : 'btn-blue'} btn-sm rwb-toggle-btn" id="toggle-expand-season-btn">
                ${isExpanded ? '🔼 3 Wochen' : '📅 Alle 11 Wochen'}
              </button>
            </div>
          </div>`;
      };

      const renderFocusHero = () => {
        const incoming = scopedEnriched.find((x) => x.isIncoming);
        const catchup = catchupMatches[0];

        // Prüft, ob ein Spiel bereits stattgefunden hat (erledigt oder Terminzeitpunkt verstrichen)
        const isMatchPassed = (x) => {
          if (x.isCompleted) return true;
          if (x.m.confirmed_slot && x.m.confirmed_slot.includes('|')) {
            const [d, hStr] = x.m.confirmed_slot.split('|');
            const endHour = Number(hStr) + 1; // 1 Stunde Spielzeit
            const endStr = `${d}T${String(endHour).padStart(2, '0')}:00:00`;
            const now = new Date();
            const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
            if (nowStr >= endStr) return true;
          }
          return false;
        };

        // Chronologisch noch anstehende Spiele (noch nicht vorbei/gespielt) ab der aktuellen Woche
        const upcomingMatches = scopedEnriched
          .filter((x) => !x.isBye && !isMatchPassed(x) && (x.ph?.week || 0) >= realCurrentWeek)
          .sort((a, b) => (a.ph?.week || 0) - (b.ph?.week || 0));
        const immediateNext = upcomingMatches[0] || null;

        let badge = '';
        let badgeCls = '';
        let title = '';
        let desc = '';
        let actionBtn = '';

        if (incoming) {
          badge = '📩 Rückmeldung erbeten';
          badgeCls = 'warn';
          title = `Euer Gegner ${esc(incoming.opponent)} hat Spieltermine vorgeschlagen!`;
          desc = `Für „Woche ${incoming.ph.week} · ${esc(incoming.ph.name)}“ liegen Terminvorschläge vor. Bitte wähle mit deinem Partner einen Termin aus oder schicke einen Gegenvorschlag.`;
          actionBtn = `<a href="#/player/phase/${incoming.m.phase_id}/match/${incoming.m.id}" class="btn btn-amber btn-lg focus-action-btn">📩 Jetzt Termine ansehen & wählen ›</a>`;
        } else if (catchup) {
          badge = '⚠️ Nachholspiel offen';
          badgeCls = 'warn';
          title = `Nachholspiel gegen ${esc(catchup.opponent)} (aus Woche ${catchup.ph.week}) steht noch aus!`;
          desc = `Dieses Spiel aus Spieltag ${catchup.ph.matchday || catchup.ph.week} ist noch nicht ausgetragen oder terminiert. Stimmt jetzt einen Ausweichtermin in der aktuellen Woche (${realCurrentWeek}) oder nächsten Woche ab – oder markiert es als erledigt, wenn ihr bereits gespielt habt.`;
          actionBtn = `
            <a href="#/player/phase/${catchup.m.phase_id}/match/${catchup.m.id}" class="btn btn-amber btn-lg focus-action-btn">⚔ Zum Nachhol-Abgleich ›</a>
            <button type="button" class="btn btn-ghost btn-sm mark-done-btn" data-complete-match="${catchup.m.id}">✓ Bereits gespielt / erledigt</button>
          `;
        } else if (immediateNext && immediateNext.isConfirmed) {
          // Das unmittelbar nächste Spiel steht bereits verbindlich fest!
          badge = '🏆 Spieltermin steht fest';
          badgeCls = 'ok';
          const isPauseCurr = realCurrentWeek === 6;
          title = `Euer nächstes Spiel steht fest: ${slotLabel(immediateNext.m.confirmed_slot, true)} Uhr!`;
          desc = `Das Match gegen <b>${esc(immediateNext.opponent)}</b> (Woche ${immediateNext.ph.week} · ${esc(immediateNext.ph.name)}) ist verbindlich vereinbart.${isPauseCurr ? ' In der aktuellen Woche 6 ist Saisonpause.' : ''}`;
          actionBtn = `<a href="#/player/phase/${immediateNext.m.phase_id}/match/${immediateNext.m.id}" class="btn btn-blue btn-lg focus-action-btn">🏆 Zum Spiel-Abgleich & Details ›</a>`;
        } else if (immediateNext && !immediateNext.mySaved) {
          badge = '🗓 Deine Zeiten fehlen';
          badgeCls = 'warn';
          title = `Hallo ${esc(me.player.name)}, deine Zeiten für Woche ${immediateNext.ph.week} (${esc(immediateNext.ph.name)}) fehlen noch!`;
          desc = `Damit euer 2vs2-Match gegen <b>${esc(immediateNext.opponent)}</b> abgestimmt werden kann, trage bitte im Kalender ein, wann du spielen kannst.`;
          actionBtn = `<a href="#/player/phase/${immediateNext.m.phase_id}" class="btn btn-amber btn-lg focus-action-btn">🗓 Jetzt meine freien Zeiten eintragen ›</a>`;
        } else if (immediateNext && immediateNext.isReady) {
          badge = '🤝 Bereit zur Terminauswahl';
          badgeCls = 'ready-badge';
          title = `Zeiten für Woche ${immediateNext.ph.week} (${esc(immediateNext.ph.name)}) eingetragen!`;
          desc = `Prüft im 4-Spieler-Match-Abgleich eure gemeinsamen freien Stunden und schlagt <b>${esc(immediateNext.opponent)}</b> 1 bis 3 Spieltermine vor (oder zieht das Spiel in einer anderen Saisonwoche vor).`;
          actionBtn = `<a href="#/player/phase/${immediateNext.m.phase_id}/match/${immediateNext.m.id}" class="btn btn-primary btn-lg focus-action-btn">🤝 Zum 4-Spieler-Abgleich & Termine vorschlagen ›</a>`;
        } else if (immediateNext && immediateNext.isOutgoing) {
          badge = '⏳ Warten auf Gegner';
          badgeCls = 'open';
          title = `Terminvorschlag gesendet – wir warten auf ${esc(immediateNext.opponent)}`;
          desc = `Euer Terminvorschlag für „Woche ${immediateNext.ph.week} · ${esc(immediateNext.ph.name)}“ liegt beim gegnerischen Team zur Prüfung.`;
          actionBtn = `<a href="#/player/phase/${immediateNext.m.phase_id}/match/${immediateNext.m.id}" class="btn btn-blue btn-lg focus-action-btn">🔍 Vorschlag & Status ansehen ›</a>`;
        } else if (confirmedMatches.length > 0) {
          const nextConf = confirmedMatches[0];
          badge = '🏆 Spieltermin steht fest';
          badgeCls = 'ok';
          title = `Euer bestätigtes Spiel: ${slotLabel(nextConf.m.confirmed_slot, true)} Uhr!`;
          desc = `Das Match gegen <b>${esc(nextConf.opponent)}</b> (Woche ${nextConf.ph.week} · ${esc(nextConf.ph.name)}) ist verbindlich vereinbart.`;
          actionBtn = `<a href="#/player/phase/${nextConf.m.phase_id}/match/${nextConf.m.id}" class="btn btn-blue btn-lg focus-action-btn">🏆 Zum Spiel-Abgleich & Details ›</a>`;
        } else {
          badge = '✅ Alles erledigt';
          badgeCls = 'ok';
          title = `Alles erledigt für die aktuellen 3 Wochen, ${esc(me.player.name)}!`;
          desc = `Für das aktuelle 3-Wochen-Fenster besteht kein offener Handlungsbedarf. Bei Urlaub oder Verhinderung kannst du jederzeit die gesamte Saison aufklappen.`;
          actionBtn = `<button type="button" class="btn btn-steel btn-lg focus-action-btn" data-switch-tab="calendar">🗓 Kalenderzeiten ansehen ›</button>`;
        }

        return `
          <section class="focus-hero card metal focus-${badgeCls}">
            <div class="focus-hero-head">
              <span class="focus-hero-label">👉 Was ist jetzt zu tun?</span>
              <span class="badge ${badgeCls}">${badge}</span>
            </div>
            <div class="focus-hero-body">
              <h2 class="focus-hero-title">${title}</h2>
              <p class="focus-hero-desc">${desc}</p>
              <div class="focus-hero-actions">
                ${actionBtn}
              </div>
            </div>
          </section>`;
      };

      const renderMatchRow = (item, isCatchupRow = false) => {
        const { m, ph, opponent, oppLogo, myLogo, mySaved, propSlots, isBye, isConfirmed, isCompleted, isCatchup, isIncoming, isOutgoing, isWaiting, effectiveSlotPhase, isRescheduled } = item;
        const isCurrentWk = ph && ph.week === realCurrentWeek;
        let stateCls = 'st-ready';
        let statusHTML = '';
        let primaryBtnHTML = '';

        const reschedTag = isRescheduled && effectiveSlotPhase
          ? `<span class="badge vs sm" title="Wird in Woche ${effectiveSlotPhase.week} (${effectiveSlotPhase.name}) gespielt">🔄 ${effectiveSlotPhase.week < ph.week ? 'Vorgezogen' : 'Nachgespielt'} in Woche ${effectiveSlotPhase.week}</span>`
          : '';

        if (isBye) {
          stateCls = 'st-confirmed st-bye';
          statusHTML = `
            <div class="m-row-status">
              <span class="badge ok">🎟️ Freispiel (Spielfrei)</span>
              <small class="muted">Dein Team hat in Woche ${ph ? ph.week : ''} spielfrei (Dummy-Team in ${esc(lg?.name || 'deiner Liga')}) – kein Termin nötig.</small>
            </div>`;
          primaryBtnHTML = `<span class="badge ok">✓ Spielfrei</span>`;
        } else if (isCompleted) {
          stateCls = 'st-confirmed is-completed-row';
          statusHTML = `
            <div class="m-row-status">
              <div class="m-row-status-top">
                <span class="badge ok">✓ Als erledigt markiert</span>
                ${m.confirmed_slot ? `<b class="m-row-slot">${slotLabel(m.confirmed_slot, true)} Uhr</b>` : ''}
              </div>
              <small class="muted">Bereits gespielt oder außerhalb des Tools verabredet (${m.confirmed_by_player_name ? `von ${esc(m.confirmed_by_player_name)}` : 'manuell'})</small>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}/match/${m.id}" class="btn btn-steel btn-sm">Details ansehen ›</a>`;
        } else if (isConfirmed) {
          stateCls = 'st-confirmed';
          statusHTML = `
            <div class="m-row-status">
              <div class="m-row-status-top">
                <span class="badge ok">🏆 Fester Termin</span>
                ${reschedTag}
              </div>
              <b class="m-row-slot">${slotLabel(m.confirmed_slot, true)} Uhr</b>
              <small class="muted">Bestätigt von ${esc(m.confirmed_by_player_name || 'Admin')}</small>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}/match/${m.id}" class="btn btn-blue btn-sm">🏆 Details ansehen ›</a>`;
        } else if (isIncoming) {
          stateCls = 'st-incoming';
          statusHTML = `
            <div class="m-row-status">
              <div class="m-row-status-top">
                <span class="badge warn">📩 Vorschlag von ${esc(opponent)}</span>
                ${reschedTag}
                <small class="muted">von ${esc(m.proposed_by_player_name || '')} · bitte Termin auswählen oder Gegenvorschlag senden:</small>
              </div>
              <div class="m-row-chips">${propSlots.map((s) => `<span class="prop-chip">${slotLabel(s, true)} Uhr</span>`).join('')}</div>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}/match/${m.id}" class="btn btn-amber btn-sm">📩 Termin auswählen ›</a>`;
        } else if (isOutgoing) {
          stateCls = 'st-outgoing';
          statusHTML = `
            <div class="m-row-status">
              <div class="m-row-status-top">
                <span class="badge open">⏳ Wartet auf ${esc(opponent)}</span>
                ${reschedTag}
                <small class="muted">Euer Terminvorschlag:</small>
              </div>
              <div class="m-row-chips">${propSlots.map((s) => `<span class="prop-chip subtle">${slotLabel(s, true)} Uhr</span>`).join('')}</div>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}/match/${m.id}" class="btn btn-blue btn-sm">⏳ Status ansehen ›</a>`;
        } else if (isCatchup || isCatchupRow) {
          stateCls = 'st-waiting is-catchup-card';
          statusHTML = `
            <div class="m-row-status">
              <div class="m-row-status-top">
                <span class="badge warn">⚠️ Offenes Nachholspiel</span>
                <small class="muted">Regulär Spieltag ${ph ? ph.matchday || ph.week : ''} · Termin noch offen</small>
              </div>
              <small class="muted">Wählt im Match-Abgleich einen Ausweichtermin (z. B. in Woche ${realCurrentWeek} oder ${realCurrentWeek + 1}) oder markiert es als erledigt.</small>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}/match/${m.id}" class="btn btn-amber btn-sm">⚔ Nachhol-Termin abstimmen ›</a>`;
        } else if (isWaiting) {
          stateCls = 'st-waiting';
          statusHTML = `
            <div class="m-row-status">
              <span class="badge warn">⚠️ Deine Zeiten fehlen noch</span>
              <small class="muted">Bitte trage zuerst deine eigenen freien Zeiten für Woche ${ph ? ph.week : ''} ein (oder ziehe das Spiel im Match-Abgleich in eine andere Woche vor).</small>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}" class="btn btn-amber btn-sm">🗓 Zeiten eintragen ›</a>`;
        } else {
          stateCls = 'st-ready';
          statusHTML = `
            <div class="m-row-status">
              <span class="badge ready-badge">🤝 Match-Abgleich (4 Spieler)</span>
              <small class="muted">Deine Zeiten sind drin – prüfe im 4-Spieler-Abgleich eure Schnittmenge oder ziehe das Spiel bei Urlaub vor / spiele es nach.</small>
            </div>`;
          primaryBtnHTML = `<a href="#/player/phase/${m.phase_id}/match/${m.id}" class="btn btn-primary btn-sm">⚔ Zum 4-Spieler-Abgleich ›</a>`;
        }

        const markDoneBtnHTML = (!isBye && !isConfirmed)
          ? `<button type="button" class="btn btn-ghost btn-xs mark-done-btn" data-complete-match="${m.id}" title="Match wurde bereits extern gespielt oder verabredet – aus der offenen Liste entfernen">✓ Bereits gespielt / erledigt</button>`
          : isCompleted
            ? `<button type="button" class="btn btn-ghost btn-xs uncomplete-btn" data-uncomplete-match="${m.id}" title="Spiel wieder als offen markieren">↺ Wieder öffnen</button>`
            : '';

        return `
          <article class="m-row-card c-${ph ? ph.color : 'green'} ${stateCls} ${isCurrentWk ? 'is-current-week-row' : ''} ${isCatchup ? 'is-catchup-row' : ''}">
            <div class="m-row-left">
              <div class="m-row-phase">
                <i class="dot"></i>
                <span>Woche ${ph ? ph.week : ''} · ${ph ? esc(ph.name) : ''}${ph && ph.subtitle ? ` (${esc(ph.subtitle)})` : ''}</span>
                ${isCurrentWk ? '<span class="badge current-wk-pill sm">📍 Aktuelle Woche</span>' : ''}
                ${isCatchup ? '<span class="badge warn sm">⚠️ Nachholspiel</span>' : ''}
                <small>${ph ? formatRange(ph) : ''}</small>
              </div>
              <div class="m-row-teams">
                <span class="m-team-entry">${teamLogoHTML(myLogo, me.player.team_name, 'sm')}<span class="m-team-mine">${esc(me.player.team_name || 'Dein Team')}</span></span>
                <span class="m-vs">vs.</span>
                <span class="m-team-entry">${teamLogoHTML(oppLogo, opponent, 'sm')}<span class="m-team-opp">${esc(opponent)}</span></span>
              </div>
            </div>
            <div class="m-row-center">
              ${statusHTML}
            </div>
            <div class="m-row-right">
              ${primaryBtnHTML}
              ${markDoneBtnHTML}
              ${!isBye && !isConfirmed ? `
                <a href="#/player/phase/${m.phase_id}" class="btn ${mySaved ? 'btn-steel' : 'btn-amber'} btn-xs" title="Eigene Zeiten für diese Woche bearbeiten">
                  🗓 Zeiten ${mySaved ? '✓' : 'fehlen'}
                </a>` : ''}
            </div>
          </article>`;
      };

      const activeTab = S.homeMainTab || 'matches';
      const matchFilter = S.homeMatchFilter || 'all';

      let displayMatches = [...openMatches, ...confirmedMatches, ...byeMatches];
      if (matchFilter === 'open') displayMatches = [...catchupMatches, ...openMatches];
      else if (matchFilter === 'confirmed') displayMatches = [...confirmedMatches, ...byeMatches];

      const catchupSectionHTML = (catchupMatches.length && matchFilter !== 'confirmed') ? `
        <div class="catchup-alert-card card metal">
          <div class="cac-header">
            <div class="cac-title-wrap">
              <span class="cac-icon">⚠️</span>
              <div>
                <h3>Offene Nachholspiele (${catchupMatches.length}):</h3>
                <p class="muted small">Aus früheren Spieltagen noch offen. Stimmt einen Ausweichtermin in der aktuellen Woche (${realCurrentWeek}) oder nächsten Woche ab – oder markiert das Match mit 1 Klick als erledigt, wenn ihr bereits gespielt habt.</p>
              </div>
            </div>
            <span class="badge warn sm">${catchupMatches.length} ${catchupMatches.length === 1 ? 'Spiel' : 'Spiele'} offen</span>
          </div>
          <div class="m-row-list">
            ${catchupMatches.map((item) => renderMatchRow(item, true)).join('')}
          </div>
        </div>
      ` : '';

      const matchesSectionHTML = `
        <section class="dashboard-section">
          <div class="sec-bar">
            <div>
              <h2>⚔ Deine Spiele & Termine ${S.expandAllWeeks ? '(Gesamte Saison)' : `(Woche ${rollingPhases[0].week}–${rollingPhases[rollingPhases.length - 1].week})`}</h2>
              <p class="muted">${S.expandAllWeeks
                ? 'Alle 10 Saisonspiele deines Teams (Hin- & Rückrunde). Spiele können bei Bedarf über den Match-Abgleich vorgezogen oder nachgespielt werden.'
                : 'Es werden die Spiele der aktuellen 3 Wochen sowie offene Nachholspiele angezeigt. Für spätere Wochen klappe oben die gesamte Saison auf.'}</p>
            </div>
            <div class="sub-filter-pills">
              <button type="button" class="sub-pill ${matchFilter === 'all' ? 'active' : ''}" data-match-filter="all">Alle (${scopedEnriched.length})</button>
              <button type="button" class="sub-pill ${matchFilter === 'open' ? 'active' : ''}" data-match-filter="open">In Abstimmung (${catchupMatches.length + openMatches.length})</button>
              <button type="button" class="sub-pill ${matchFilter === 'confirmed' ? 'active' : ''}" data-match-filter="confirmed">Fest / Erledigt (${confirmedMatches.length + byeMatches.length})</button>
            </div>
          </div>
          ${catchupSectionHTML}
          ${!scopedEnriched.length ? `
            <section class="player-matches-hero metal no-match">
              <div class="pmh-empty">
                <img src="/logo.png?v=2vs2" alt="" class="pmh-empty-crest">
                <div>
                  <h3>Keine Spielpaarung in diesem Zeitraum</h3>
                  <p class="muted">Klappe bei Bedarf die gesamte Saison auf, um alle 10 Spieltage zu sehen.</p>
                </div>
              </div>
            </section>
          ` : `
            <div class="m-row-list">${displayMatches.map((x) => renderMatchRow(x, false)).join('') || '<div class="notice">Keine Spiele in dieser Auswahl.</div>'}</div>
          `}
        </section>`;

      const calendarSectionHTML = `
        <section class="dashboard-section">
          <div class="sec-bar">
            <div>
              <h2>🗓 Mein Kalender ${S.expandAllWeeks ? '(Gesamte Saison: 11 Wochen)' : `(Aktuelle 3 Wochen: Woche ${rollingPhases[0].week}–${rollingPhases[rollingPhases.length - 1].week})`}</h2>
              <p class="muted">${S.expandAllWeeks
                ? 'Alle 11 Saisonwochen (5 Wochen Hinrunde, 1 Woche Pause, 5 Wochen Rückrunde) – ideal zum Eintragen von Urlaub oder zum Vorziehen/Nachspielen:'
                : 'Hier siehst du immer die aktuelle Woche (dezent hervorgehoben) und die 2 darauffolgenden Wochen. Für spätere Wochen (z. B. Urlaub in 6 Wochen) kannst du die gesamte Saison aufklappen:'}</p>
            </div>
            <div class="sec-pills">
              <span class="badge ${savedInVisible === visiblePhases.length ? 'ok' : savedInVisible > 0 ? 'warn' : 'open'}">✓ ${savedInVisible} von ${visiblePhases.length} sichtbaren Wochen gespeichert</span>
            </div>
          </div>
          <div class="weeks weeks-rolling">
            ${visiblePhases.map((p) => {
              const ms = me.matchups.filter((m) => m.phase_id === p.id);
              const isSaved = saved.has(p.id);
              const isCurrent = p.week === realCurrentWeek;
              const isRolling = rollingPhaseIds.has(p.week ? p.id : '');
              const relOffset = p.week - realCurrentWeek;
              const relLabel = isCurrent
                ? '📍 Aktuelle Woche'
                : relOffset === 1
                  ? '⏭ Nächste Woche (+1)'
                  : relOffset === 2
                    ? '⏭ Übernächste Woche (+2)'
                    : p.isPause
                      ? '⏸ 1 Woche Pause'
                      : p.half === 'hinrunde'
                        ? 'Hinrunde'
                        : 'Rückrunde';
              const oppName = ms.length === 1 ? opponentOf(ms[0], me.player.team_id) : '';
              const oppLogo = ms.length === 1 ? opponentLogoOf(ms[0], me.player.team_id) : null;
              const isBye = ms.length === 1 && ms[0].is_bye;
              return `
                <section class="week-card metal ${isCurrent ? 'is-current-week' : ''} ${isRolling && S.expandAllWeeks ? 'is-in-rolling' : ''}">
                  <header class="week-head">
                    <div class="week-head-top">
                      <span class="week-no">Woche ${p.week}</span>
                      <span class="badge ${isCurrent ? 'current-wk-pill' : 'open'} sm">${relLabel}</span>
                    </div>
                    <span class="week-range">${formatRange(p)}</span>
                    <span class="week-sub">${esc(p.name)} · ${esc(p.subtitle)}</span>
                  </header>
                  <div class="phase-list">
                    <div class="phase-bar c-${p.color}" data-phase="${p.id}">
                      <div class="pb-top">
                        <span class="pb-name">${esc(p.name)}${p.subtitle ? ` <small>${esc(p.subtitle)}</small>` : ''}</span>
                        ${isBye
                          ? `<span class="badge ok sm">🎟️ Freispiel</span>`
                          : ms.length === 1
                            ? `<span class="badge vs sm">${teamLogoHTML(oppLogo, oppName, 'xs')}<span>vs. ${esc(oppName)}</span></span>`
                            : ms.length > 1
                              ? `<span class="badge vs sm">⚔ ${ms.length} Spiele</span>`
                              : `<span class="badge open sm">${p.isPause ? 'Nachholwoche' : 'Spielfrei'}</span>`}
                      </div>
                      <span class="pb-dates">${formatRange(p)}</span>
                      <div class="pb-btn-wrap">
                        <span class="btn ${isSaved ? 'btn-steel' : 'btn-amber'} btn-xs btn-block">
                          ${isSaved ? '🗓 Zeiten bearbeiten (✓ gespeichert)' : '🗓 Jetzt freie Zeiten eintragen ›'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>`;
            }).join('')}
          </div>
          <div class="season-expand-footer">
            <button type="button" class="btn ${S.expandAllWeeks ? 'btn-steel' : 'btn-blue'} btn-block" id="cal-expand-season-btn">
              ${S.expandAllWeeks
                ? `🔼 Saison einklappen (nur Woche ${rollingPhases[0].week}–${rollingPhases[rollingPhases.length - 1].week} anzeigen)`
                : '📅 Gesamte Saison aufklappen (alle 11 Wochen anzeigen)'}
            </button>
          </div>
        </section>`;

      contentBox.innerHTML = `
        ${renderRollingBanner()}
        ${renderFocusHero()}

        <nav class="main-hub-tabs" aria-label="Hauptbereiche">
          <button type="button" class="hub-tab ${activeTab === 'matches' ? 'active' : ''}" data-hub-tab="matches">
            <span class="hub-tab-icon">⚔</span>
            <div class="hub-tab-txt">
              <strong>1. Meine Spiele & Termine ${S.expandAllWeeks ? '(Saison)' : `(3 Wochen)`}</strong>
              <small>${openMatches.length ? `${openMatches.length} Spiel(e) in Abstimmung` : 'Alle Termine im Zeitraum geklärt'}</small>
            </div>
          </button>
          <button type="button" class="hub-tab ${activeTab === 'calendar' ? 'active' : ''}" data-hub-tab="calendar">
            <span class="hub-tab-icon">🗓</span>
            <div class="hub-tab-txt">
              <strong>2. Mein Kalender (${S.expandAllWeeks ? '11 Wochen' : '3 Wochen'})</strong>
              <small>${savedInVisible} von ${visiblePhases.length} Wochen gespeichert</small>
            </div>
          </button>
        </nav>

        ${activeTab === 'matches' ? matchesSectionHTML : calendarSectionHTML}
      `;

      contentBox.querySelectorAll('[data-hub-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          S.homeMainTab = btn.dataset.hubTab;
          mountHomeContent();
        });
      });
      contentBox.querySelectorAll('[data-match-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          S.homeMatchFilter = btn.dataset.matchFilter;
          mountHomeContent();
        });
      });
      contentBox.querySelectorAll('[data-switch-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          S.homeMainTab = btn.dataset.switchTab;
          mountHomeContent();
        });
      });
      contentBox.querySelectorAll('.phase-bar').forEach((b) => {
        b.addEventListener('click', () => go(`#/player/phase/${b.dataset.phase}`));
      });
      contentBox.querySelector('#toggle-expand-season-btn')?.addEventListener('click', () => {
        S.expandAllWeeks = !S.expandAllWeeks;
        mountHomeContent();
      });
      contentBox.querySelector('#cal-expand-season-btn')?.addEventListener('click', () => {
        S.expandAllWeeks = !S.expandAllWeeks;
        mountHomeContent();
      });
      contentBox.querySelector('#sim-week-select')?.addEventListener('change', (e) => {
        const w = Number(e.target.value);
        S.selectedWeek = w === getRealSeasonWeek() ? null : w;
        toast(`Ansicht auf Woche ${w} gesetzt (3-Wochen-Fenster wandert mit).`, 'info');
        mountHomeContent();
      });

      contentBox.querySelectorAll('[data-complete-match]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const mid = btn.dataset.completeMatch;
          const ok = await confirmModal(
            'Spiel als erledigt markieren?',
            'Wurde dieses Spiel bereits gespielt oder außerhalb des Tools verabredet? Es wird dann aus der Liste der offenen Spiele entfernt.',
            '✓ Als erledigt markieren'
          );
          if (!ok) return;
          try {
            await api(`/matchups/${mid}/complete`, { method: 'POST', body: { player_id: me.player.id } });
            toast('Spiel als erledigt markiert.');
            const updatedMe = await loadMe();
            if (updatedMe) {
              me = updatedMe;
              mountHomeContent();
            }
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });

      contentBox.querySelectorAll('[data-uncomplete-match]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const mid = btn.dataset.uncompleteMatch;
          try {
            await api(`/matchups/${mid}/uncomplete`, { method: 'POST', body: { player_id: me.player.id } });
            toast('Spiel wieder geöffnet.');
            const updatedMe = await loadMe();
            if (updatedMe) {
              me = updatedMe;
              mountHomeContent();
            }
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });
    };

    $app.innerHTML = `
      ${playerTopbar(me)}
      <main class="container">
        ${notifStartBanner(me)}
        <div id="player-home-content"></div>
      </main>`;
    bindLogout(me);

    const contentBox = document.getElementById('player-home-content');
    mountHomeContent();
  }

  async function renderPlayerPhase(phaseId, matchupId) {
    const phase = getPhase(phaseId);
    if (!phase) return go('#/player');
    const me = await loadMe();
    if (!me) return;
    const myMatchups = me.matchups.filter((m) => m.phase_id === phase.id && !m.is_bye);
    const activeMatchup = me.matchups.find((x) => String(x.id) === String(matchupId)) || myMatchups[0] || null;
    const mode = matchupId ? 'match' : 'mine';
    const mySaved = me.savedPhases.includes(phase.id);

    const realCurrentWeek = getRealSeasonWeek();
    const focusWeek = S.selectedWeek || realCurrentWeek;
    const rollingPhases = getRollingThreePhases(focusWeek);
    const navPhases = S.expandAllWeeks ? PHASES : (rollingPhases.some((p) => p.id === phase.id) ? rollingPhases : PHASES);

    $app.innerHTML = `
      <div class="phase-view c-${phase.color}">
        <header class="pv-head metal">
          <button class="btn btn-ghost btn-sm" id="back-btn">← Übersicht</button>
          <div class="pv-title">
            <span class="pv-dot"></span>
            <div>
              <h1>Woche ${phase.week} · ${esc(phase.name)}${phase.subtitle ? ` <small>${esc(phase.subtitle)}</small>` : ''}</h1>
              <p>${formatRange(phase)}${phase.week === realCurrentWeek ? ' · 📍 Aktuelle Woche' : ''}</p>
            </div>
          </div>
          <div class="pv-right-actions">
            ${notifTopbarBtn(me)}
            <div class="pv-user">
              ${me.player.team_name ? teamLogoHTML(me.player.team_logo, me.player.team_name, 'sm') : `<span class="avatar sm">${esc(me.player.name.slice(0, 1).toUpperCase())}</span>`}
              <span>${esc(me.player.name)}<small>${esc(me.player.team_name || 'ohne Team')}</small></span>
            </div>
          </div>
        </header>
        <div class="pv-content">
          <div class="pv-nav-bar">
            <nav class="pv-mode-switch" aria-label="Ansicht wählen">
              <a class="pv-mode-btn ${mode === 'mine' ? 'active' : ''}" href="#/player/phase/${phase.id}">
                <span>🗓 1. Meine Zeiten (Woche ${phase.week})</span>
                <span class="badge ${mySaved ? 'ok' : 'open'} sm" id="tab-saved-badge">${mySaved ? '✓ gespeichert' : 'offen'}</span>
              </a>
              ${activeMatchup && !activeMatchup.is_bye
                ? `<a class="pv-mode-btn ${mode === 'match' ? 'active' : ''}" href="#/player/phase/${phase.id}/match/${activeMatchup.id}">
                    <span>⚔ 2. Match-Abgleich (4 Spieler)</span>
                    <span class="badge vs sm">${teamLogoHTML(opponentLogoOf(activeMatchup, me.player.team_id), opponentOf(activeMatchup, me.player.team_id), 'xs')}<span>vs. ${esc(opponentOf(activeMatchup, me.player.team_id))}</span></span>
                  </a>`
                : `<span class="pv-mode-btn disabled" title="In dieser Woche hat dein Team spielfrei / Freispiel.">⚔ 2. Match-Abgleich <small>(Freispiel / Pause)</small></span>`}
            </nav>
            <div class="week-switch">
              ${navPhases.map((p) => `<a href="#/player/phase/${p.id}" class="${p.id === phase.id ? 'active' : ''} ${p.week === realCurrentWeek ? 'is-curr-wk' : ''}">W${p.week} <small>${formatDay(p.start).short}</small></a>`).join('')}
            </div>
          </div>
          ${mode === 'mine' && myMatchups.length ? `
            <div class="pv-quick-matches">
              <span class="muted small">Direkt zum 4-Spieler-Abgleich in dieser Woche:</span>
              <div class="pv-qm-btns">
                ${myMatchups.map((m) => {
                  const ps = Array.isArray(m.proposed_slots) ? m.proposed_slots : [];
                  const isInc = !m.confirmed_slot && ps.length > 0 && m.proposed_by_team_id !== me.player.team_id;
                  const isOut = !m.confirmed_slot && ps.length > 0 && m.proposed_by_team_id === me.player.team_id;
                  const isWait = !m.confirmed_slot && !ps.length && !mySaved;
                  const btnCls = isInc ? 'btn-amber' : (!m.confirmed_slot && !ps.length && !isWait) ? 'btn-primary' : 'btn-blue';
                  const st = m.confirmed_slot ? `🏆 ${slotLabel(m.confirmed_slot, true)}` : isInc ? '📩 Vorschlag prüfen' : isOut ? '⏳ Vorschlag offen' : isWait ? '⚔ Abgleich' : '🤝 Termine vorschlagen';
                  const oppName = opponentOf(m, me.player.team_id);
                  const oppLogo = opponentLogoOf(m, me.player.team_id);
                  return `<a href="#/player/phase/${phase.id}/match/${m.id}" class="btn ${btnCls} btn-xs">${teamLogoHTML(oppLogo, oppName, 'xs')}<span>vs. ${esc(oppName)} · ${st} ›</span></a>`;
                }).join('')}
              </div>
            </div>` : ''}
          <div id="pv-body"><div class="loading"><div class="spinner"></div></div></div>
        </div>
      </div>`;
    document.getElementById('back-btn').addEventListener('click', () => go('#/player'));
    document.getElementById('notif-center-btn')?.addEventListener('click', () => openNotificationCenter(me));
    const body = document.getElementById('pv-body');

    if (mode === 'mine') {
      await mountMyTimes(body, phase, me);
    } else {
      const m = me.matchups.find((x) => String(x.id) === String(matchupId));
      if (!m || m.is_bye) return go(`#/player/phase/${phase.id}`);
      await mountMatchView(body, phase, m.id, { highlightPlayer: me.player.id });
    }
  }

  async function mountMyTimes(body, phase, me) {
    const data = await api(`/players/${me.player.id}/availability/${phase.id}`);
    const cells = new Map();
    for (const d of phaseDates(phase)) for (const h of HOURS) cells.set(key(d, h), 'red');
    for (const c of data.cells) cells.set(key(c.date, c.hour), c.status);
    let savedOnce = data.saved;

    const otherSavedPhases = PHASES.filter(
      (p) => p.id !== phase.id && me.savedPhases.includes(p.id)
    );
    const myPhaseIdx = PHASES.findIndex((p) => p.id === phase.id);
    const prevSavedPhases = PHASES.slice(0, myPhaseIdx).filter((p) => me.savedPhases.includes(p.id));
    const defaultSourcePhase = prevSavedPhases.length
      ? prevSavedPhases[prevSavedPhases.length - 1]
      : otherSavedPhases[0] || null;

    const copyBarHTML = otherSavedPhases.length ? `
      <div class="copy-week-bar metal">
        <div class="cwb-left">
          <span class="cwb-icon" aria-hidden="true">📋</span>
          <div class="cwb-txt">
            <strong>Zeiten aus anderer Saisonwoche übernehmen:</strong>
            <small class="muted">Übernimmt deine freien Wochentage & Uhrzeiten (z. B. Mo–Fr ab 19 Uhr) mit 1 Klick</small>
          </div>
        </div>
        <div class="cwb-actions">
          <select id="cwb-source-select" class="cwb-select" aria-label="Vorlage-Woche wählen">
            ${otherSavedPhases.map((sp) => `
              <option value="${sp.id}" ${sp.id === defaultSourcePhase?.id ? 'selected' : ''}>
                Woche ${sp.week}: ${esc(sp.name)}${sp.subtitle ? ` (${esc(sp.subtitle)})` : ''}
              </option>
            `).join('')}
          </select>
          <button type="button" class="btn btn-primary btn-sm" id="cwb-copy-btn">
            📋 Zeiten jetzt übernehmen
          </button>
        </div>
      </div>` : '';

    body.innerHTML = `
      ${copyBarHTML}
      <div class="cal-toolbar">
        ${legend('edit')}
        <span class="cal-help-inline muted small">💡 Klick/Ziehen = Stunden markieren · Klick auf Tag/Uhrzeit = ganze Spalte/Zeile</span>
        <div class="tool-actions">
          <button type="button" class="btn btn-steel btn-xs" data-preset="workdays-19" title="Montag bis Freitag von 19:00 bis 23:00 Uhr auf Grün setzen">⚡ Werktags ab 19 Uhr</button>
          <button type="button" class="btn btn-steel btn-xs" data-preset="evenings-20" title="Montag bis Sonntag von 20:00 bis 23:00 Uhr auf Grün setzen">⚡ Abende ab 20 Uhr</button>
          <button type="button" class="btn btn-ghost btn-xs" data-fill="green">Alles grün</button>
          <button type="button" class="btn btn-ghost btn-xs" data-fill="red">Alles rot</button>
        </div>
      </div>
      <div id="editor"></div>
      <div class="savebar metal">
        <div class="save-state" id="save-state"></div>
        <button class="btn btn-primary btn-lg" id="save-btn"><span class="btn-label">💾 Zeiten speichern</span></button>
      </div>`;

    const stateEl = document.getElementById('save-state');
    const saveBtn = document.getElementById('save-btn');
    const counts = () => { const c = { green: 0, yellow: 0, red: 0 }; cells.forEach((s) => c[s]++); return c; };
    const updateState = () => {
      const c = counts();
      const summary = `<span class="cnt g">${c.green} grün</span><span class="cnt y">${c.yellow} gelb</span><span class="cnt r">${c.red} rot</span>`;
      stateEl.innerHTML = dirty
        ? `<b class="unsaved">● Ungespeicherte Änderungen</b>${summary}`
        : `<b class="${savedOnce ? 'saved' : 'unsaved-soft'}">${savedOnce ? '✓ Gespeichert' : 'Noch nicht gespeichert'}</b>${summary}`;
      saveBtn.classList.toggle('pulse', dirty);
      const tabBadge = document.getElementById('tab-saved-badge');
      if (tabBadge && savedOnce && !dirty) {
        tabBadge.className = 'badge ok sm';
        tabBadge.textContent = '✓ gespeichert';
      }
    };

    const editor = mountEditor(document.getElementById('editor'), phase, cells, () => { dirty = true; updateState(); });
    updateState();

    body.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => {
      editor.setAll(b.dataset.fill);
    }));

    body.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      const p = b.dataset.preset;
      if (p === 'workdays-19') {
        editor.applyPreset(({ isWorkday, hour }) => (isWorkday && hour >= 19 && hour <= 22 ? 'green' : null));
        toast('Montag–Freitag ab 19 Uhr auf Grün gesetzt!');
      } else if (p === 'evenings-20') {
        editor.applyPreset(({ hour }) => (hour >= 20 && hour <= 22 ? 'green' : null));
        toast('Jeden Abend ab 20 Uhr auf Grün gesetzt!');
      }
    }));

    const copyBtn = body.querySelector('#cwb-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const sel = body.querySelector('#cwb-source-select');
        const sourceId = sel?.value;
        if (!sourceId) return;
        const sourcePhase = getPhase(sourceId);
        copyBtn.disabled = true;
        copyBtn.textContent = 'Lade Vorlage …';
        try {
          const res = await api(`/players/${me.player.id}/availability/${sourceId}`);
          if (!res.cells || !res.cells.length) {
            toast('In dieser Vorlage wurden keine Zeiten gefunden.', 'warn');
            return;
          }
          const wMap = new Map();
          res.cells.forEach((c) => {
            const wd = new Date(c.date + 'T00:00:00Z').getUTCDay();
            wMap.set(`${wd}|${c.hour}`, c.status);
          });
          editor.applyWeekdayMap(wMap);
          dirty = true;
          updateState();
          toast(`✓ Zeiten aus „Woche ${sourcePhase?.week} (${sourcePhase?.name})“ übernommen! Klicke unten auf „Zeiten speichern“, um sie zu sichern.`);
          saveBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (err) {
          toast('Fehler beim Laden der Vorlage: ' + err.message, 'error');
        } finally {
          copyBtn.disabled = false;
          copyBtn.textContent = '📋 Zeiten jetzt übernehmen';
        }
      });
    }

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.classList.add('loading');
      saveBtn.querySelector('.btn-label').textContent = 'Speichere …';
      try {
        const payload = [...cells].map(([k, status]) => { const [date, hour] = k.split('|'); return { date, hour: Number(hour), status }; });
        await api(`/players/${me.player.id}/availability/${phase.id}`, { method: 'PUT', body: { cells: payload } });
        dirty = false;
        savedOnce = true;
        if (!me.savedPhases.includes(phase.id)) me.savedPhases.push(phase.id);
        toast(`Zeiten für „Woche ${phase.week} (${phase.name})“ gespeichert!`);
        saveBtn.querySelector('.btn-label').textContent = '✓ Gespeichert';
        setTimeout(() => { saveBtn.querySelector('.btn-label').textContent = '💾 Zeiten speichern'; }, 1800);
      } catch (err) {
        toast('Speichern fehlgeschlagen: ' + err.message, 'error');
        saveBtn.querySelector('.btn-label').textContent = '💾 Zeiten speichern';
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        updateState();
      }
    });
  }

  // ---------- Kalender-Raster ----------
  function gridHTML(phase, { cellHTML, editable = false }) {
    const dates = phaseDates(phase);
    const hourCell = (h) => `<span class="hl-long">${hourLabel(h)}</span><span class="hl-short">${String(h).padStart(2, '0')}–${String(h + 1).padStart(2, '0')}</span>`;
    return `
      <div class="grid-scroll">
        <table class="cal ${editable ? 'editable' : ''} cols-${Math.min(dates.length, 7)}">
          <thead><tr>
            <th class="corner">Uhrzeit</th>
            ${dates.map((d) => { const f = formatDay(d); const inner = `<span class="wd">${f.weekday}</span><span class="dt">${f.short}</span>`;
              return `<th class="day ${['Sa', 'So'].includes(f.weekday) ? 'weekend' : ''}">${editable ? `<button type="button" class="hdr-btn" data-col="${d}" title="Ganzen Tag umschalten">${inner}</button>` : inner}</th>`; }).join('')}
          </tr></thead>
          <tbody>
            ${HOURS.map((h) => `<tr>
              <th class="hour">${editable ? `<button type="button" class="hdr-btn" data-row="${h}" title="Diese Stunde an allen Tagen umschalten">${hourCell(h)}</button>` : hourCell(h)}</th>
              ${dates.map((d) => cellHTML(d, h)).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function mountEditor(container, phase, cells, onChange) {
    const dates = phaseDates(phase);
    container.innerHTML = gridHTML(phase, {
      editable: true,
      cellHTML: (d, h) => `<td class="cell s-${cells.get(key(d, h))}" data-k="${key(d, h)}" title="${slotLabel(key(d, h))}"></td>`,
    });
    const table = container.querySelector('table');
    const tdByKey = new Map([...table.querySelectorAll('td.cell')].map((td) => [td.dataset.k, td]));

    const setCell = (k, status) => {
      if (cells.get(k) === status) return false;
      cells.set(k, status);
      tdByKey.get(k).className = 'cell s-' + status;
      return true;
    };
    const bulk = (keys) => {
      const st = keys.map((k) => cells.get(k));
      const target = st.every((s) => s === 'green') ? 'yellow' : st.every((s) => s === 'yellow') ? 'red' : 'green';
      let changed = false;
      keys.forEach((k) => { changed = setCell(k, target) || changed; });
      if (changed) onChange();
    };

    let painting = null;
    let lastPointer = 'mouse';
    table.addEventListener('pointerdown', (e) => {
      lastPointer = e.pointerType;
      const td = e.target.closest('td.cell');
      if (!td || e.pointerType === 'touch' || e.button !== 0) return;
      e.preventDefault();
      painting = NEXT[cells.get(td.dataset.k)];
      if (setCell(td.dataset.k, painting)) onChange();
    });
    table.addEventListener('pointerover', (e) => {
      if (!painting) return;
      const td = e.target.closest('td.cell');
      if (td && setCell(td.dataset.k, painting)) onChange();
    });
    const stop = () => { painting = null; };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    onCleanup(() => { window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); });

    table.addEventListener('click', (e) => {
      const hb = e.target.closest('.hdr-btn');
      if (hb) {
        if (hb.dataset.col) bulk(HOURS.map((h) => key(hb.dataset.col, h)));
        else bulk(dates.map((d) => key(d, Number(hb.dataset.row))));
        return;
      }
      if (lastPointer !== 'touch') return;
      const td = e.target.closest('td.cell');
      if (td && setCell(td.dataset.k, NEXT[cells.get(td.dataset.k)])) onChange();
    });

    return {
      setAll(status) {
        let changed = false;
        cells.forEach((_, k) => { changed = setCell(k, status) || changed; });
        if (changed) onChange();
      },
      applyWeekdayMap(weekdayMap) {
        let changed = false;
        dates.forEach((d) => {
          const wd = new Date(d + 'T00:00:00Z').getUTCDay();
          HOURS.forEach((h) => {
            const k = key(d, h);
            if (weekdayMap.has(`${wd}|${h}`)) {
              changed = setCell(k, weekdayMap.get(`${wd}|${h}`)) || changed;
            }
          });
        });
        if (changed) onChange();
      },
      applyPreset(fn) {
        let changed = false;
        dates.forEach((d) => {
          const wd = new Date(d + 'T00:00:00Z').getUTCDay();
          const isWorkday = wd >= 1 && wd <= 5;
          HOURS.forEach((h) => {
            const k = key(d, h);
            const target = fn({ date: d, weekday: wd, isWorkday, hour: h, current: cells.get(k) });
            if (target) changed = setCell(k, target) || changed;
          });
        });
        if (changed) onChange();
      },
    };
  }

  function mountReadonlyGrid(container, phase, cells) {
    container.innerHTML = gridHTML(phase, {
      cellHTML: (d, h) => { const s = cells.get(key(d, h)) || 'red'; return `<td class="cell ro s-${s}" title="${slotLabel(key(d, h))}: ${STATUS_LABEL[s]}"></td>`; },
    });
  }

  // ---------- Match-Abgleich (4 Spieler = 2vs2 + Termin-Einigung + Vorziehen/Nachspielen) ----------
  async function mountMatchView(body, initialPhase, matchupId, { prefix = '', highlightPlayer = null, isAdmin = false } = {}) {
    let data;
    let activeCalendarPhase = initialPhase;
    let showRescheduleBar = false;
    const tip = el('<div class="tooltip" hidden></div>');
    document.body.appendChild(tip);
    onCleanup(() => tip.remove());
    let pinned = null;
    const selectedPropose = new Set();
    let proposeMode = false;
    let showMaybe = false;

    const render = () => {
      const m = data.matchup;
      const regularPhase = getPhase(m.phase_id) || initialPhase;
      const viewPhase = activeCalendarPhase || regularPhase;
      const propSlots = Array.isArray(m.proposed_slots) ? m.proposed_slots : [];
      const allPlayers = [...data.teamA.players, ...data.teamB.players];
      const n = allPlayers.length;
      const savedByPhase = data.savedByPhase || {};
      const viewSavedIds = new Set(savedByPhase[viewPhase.id]?.savedPlayerIds || []);
      const hasSavedInView = (pid) => viewSavedIds.has(pid);

      const statusOf = (pid, k) => data.availability[pid]?.[k] || 'red';
      const infoForPhase = (k, phId) => {
        const phSaved = new Set(savedByPhase[phId]?.savedPlayerIds || []);
        let g = 0, y = 0, r = 0;
        allPlayers.forEach((p) => {
          const s = phSaved.has(p.id) ? statusOf(p.id, k) : 'red';
          if (s === 'green') g++;
          else if (s === 'yellow') y++;
          else r++;
        });
        const cls = n === 0 ? 'm-none' : r > 0 ? 'm-no' : y > 0 ? 'm-maybe' : 'm-perfect';
        return { g, y, r, cls };
      };
      const info = (k) => {
        const [d] = String(k).split('|');
        const slotPh = phaseForDate(d) || viewPhase;
        return infoForPhase(k, slotPh.id);
      };

      const dates = phaseDates(viewPhase);
      const perfect = [];
      const maybe = [];
      for (const d of dates) for (const h of HOURS) {
        const i = infoForPhase(key(d, h), viewPhase.id);
        if (i.cls === 'm-perfect') perfect.push(key(d, h));
        else if (i.cls === 'm-maybe') maybe.push({ k: key(d, h), ...i });
      }
      const missingInView = allPlayers.filter((p) => !hasSavedInView(p.id));
      const short = [data.teamA, data.teamB].filter((t) => !t.is_dummy && t.players.length < 2);
      const allSavedInView = data.teamA.players.length > 0 && data.teamB.players.length > 0 && missingInView.length === 0;
      const mePlayer = highlightPlayer ? allPlayers.find((p) => p.id === highlightPlayer) : null;
      const myTeamId = mePlayer ? mePlayer.team_id : null;
      const propTeamName = m.proposed_by_team_id === data.teamA.id ? data.teamA.name : m.proposed_by_team_id === data.teamB.id ? data.teamB.name : '';
      const waitTeamName = m.proposed_by_team_id === data.teamA.id ? data.teamB.name : m.proposed_by_team_id === data.teamB.id ? data.teamA.name : '';

      const pad2 = (x) => String(x).padStart(2, '0');
      const otherConfirmed = Array.isArray(data.otherConfirmed) ? data.otherConfirmed : [];
      const busyTeamNameOf = (c) => (c.team_a_id === data.teamA.id || c.team_b_id === data.teamA.id ? data.teamA.name : data.teamB.name);
      const ownConflictsFor = (slotKey) => {
        if (!slotKey || !slotKey.includes('|')) return [];
        const [d, hStr] = slotKey.split('|');
        const h = Number(hStr);
        const list = [];
        for (const oc of otherConfirmed) {
          if (!oc.confirmed_slot || !oc.confirmed_slot.includes('|')) continue;
          const [od, ohStr] = oc.confirmed_slot.split('|');
          const oh = Number(ohStr);
          if (od !== d) continue;
          if (h === oh) {
            list.push({ ...oc, otherHour: oh, diff: 0, exact: true });
          }
        }
        return list;
      };

      const conflictChipBadge = (k) => {
        const ownCs = ownConflictsFor(k);
        if (!ownCs.length) return '';
        const c = ownCs[0];
        return `<span class="sp-conflict own-busy">🚫 ${esc(busyTeamNameOf(c))} (${pad2(c.otherHour)}:00)</span>`;
      };
      const conflictTitle = (k) => {
        const ownCs = ownConflictsFor(k);
        if (!ownCs.length) return '';
        return 'Gesperrt (Eigenes Spiel ~1h): ' + ownCs.map((c) => `${busyTeamNameOf(c)} spielt bereits (${c.team_a_name} vs. ${c.team_b_name}, ${pad2(c.otherHour)}:00–${pad2(c.otherHour + 1)}:00 Uhr)`).join(', ');
      };

      const realCurrentWeek = getRealSeasonWeek();
      const isCatchup = !m.confirmed_slot && !m.is_completed && (regularPhase.week || 0) < realCurrentWeek;
      const isRescheduledView = viewPhase.id !== regularPhase.id;
      const rollingPhases = getRollingThreePhases(realCurrentWeek);

      // Vorziehen / Nachspielen Leiste (3-Wochen-Matchfinder + alle 11 Saisonwochen)
      const rescheduleBarHTML = `
        <section class="reschedule-bar card metal ${isRescheduledView ? 'is-rescheduled' : ''}">
          ${isCatchup ? `
            <div class="rsb-catchup-banner">
              <div class="rsb-cb-left">
                <span class="rsb-cb-icon">⚠️</span>
                <div>
                  <strong>Offenes Nachholspiel aus Woche ${regularPhase.week} (${esc(regularPhase.name)})</strong>
                  <p>Aus einem früheren Spieltag noch offen. Stimmt hier einen Ausweichtermin in Woche ${realCurrentWeek} oder einer Folgewoche ab – oder markiert es als erledigt, wenn ihr bereits gespielt habt.</p>
                </div>
              </div>
              <button type="button" class="btn btn-ghost btn-xs mark-done-btn" id="match-view-complete-btn" title="Match wurde bereits extern gespielt oder verabredet – aus der offenen Liste entfernen">✓ Bereits gespielt / erledigt</button>
            </div>
          ` : ''}
          <div class="rsb-top">
            <div class="rsb-info">
              <span class="rsb-icon">🔄</span>
              <div>
                <strong>${isRescheduledView
                  ? `Ausweichtermin: Woche ${viewPhase.week} (${viewPhase.week < regularPhase.week ? 'vorgezogen' : 'nachgespielt'})`
                  : `Spiel vorziehen / nachspielen`}</strong>
                <small class="muted rsb-sub">${isRescheduledView
                  ? `Reguläre Spielwoche wäre Woche ${regularPhase.week} (${formatRange(regularPhase)}).`
                  : `Bei Urlaub oder Krankheit könnt ihr das Spiel in jede Saisonwoche (1–11) verlegen.`}</small>
              </div>
            </div>
            <div class="rsb-btns">
              ${!isCatchup && !m.confirmed_slot && !m.is_completed ? `<button type="button" class="btn btn-ghost btn-xs mark-done-btn" id="match-view-complete-btn" title="Match wurde bereits extern gespielt oder verabredet">✓ Bereits gespielt / erledigt</button>` : ''}
              ${isRescheduledView ? `<button type="button" class="btn btn-amber btn-xs" id="rsb-back-regular-btn">↩ Regulär W${regularPhase.week}</button>` : ''}
              <button type="button" class="btn btn-steel btn-xs" id="rsb-toggle-weeks-btn">
                ${showRescheduleBar ? 'Alle 11 Wochen verbergen ▴' : '📅 Alle 11 Wochen ▾'}
              </button>
            </div>
          </div>
          <div class="rsb-quick-tabs">
            <div class="rsb-quick-title">
              <span class="muted small"><b>3-Wochen-Matchfinder:</b> Schnellauswahl für aktuelle & kommende Wochen:</span>
            </div>
            <div class="rsb-tabs-grid">
              ${rollingPhases.map((rp) => {
                const svCnt = (savedByPhase[rp.id]?.savedPlayerIds || []).length;
                let perfCnt = 0;
                for (const d of phaseDates(rp)) {
                  for (const h of HOURS) {
                    const i = infoForPhase(key(d, h), rp.id);
                    if (i.cls === 'm-perfect' && ownConflictsFor(key(d, h)).length === 0) perfCnt++;
                  }
                }
                const isAct = rp.id === viewPhase.id;
                const isReg = rp.id === regularPhase.id;
                const isCurr = rp.week === realCurrentWeek;
                const statusTxt = svCnt === n && n > 0
                  ? (perfCnt > 0 ? `🏆 ${perfCnt} freie Termine` : `0 freie Termine (Rot/Gelb)`)
                  : `${svCnt}/${n} Spieler bereit`;
                return `
                  <button type="button" class="rsb-quick-tab ${isAct ? 'active' : ''}" data-view-phase="${rp.id}">
                    <div class="rqt-head">
                      <b>Woche ${rp.week}</b>
                      ${isReg ? '<span class="rqt-badge regular">Regulär</span>' : isCurr ? '<span class="rqt-badge current">Aktuell</span>' : ''}
                    </div>
                    <small class="muted">${formatDay(rp.start).short}–${formatDay(rp.end).short}</small>
                    <span class="rqt-status ${svCnt === n && perfCnt > 0 ? 'ready' : ''}">${statusTxt}</span>
                  </button>`;
              }).join('')}
            </div>
          </div>
          ${showRescheduleBar ? `
            <div class="rsb-weeks-grid">
              ${PHASES.map((p) => {
                const svCnt = (savedByPhase[p.id]?.savedPlayerIds || []).length;
                const isReg = p.id === regularPhase.id;
                const isAct = p.id === viewPhase.id;
                return `
                  <button type="button" class="rsb-week-pill ${isAct ? 'active' : ''} ${isReg ? 'is-regular' : ''} ${svCnt === n && n > 0 ? 'all-ready' : ''}" data-view-phase="${p.id}">
                    <span class="rwp-top">
                      <b>Woche ${p.week}</b>
                      ${isReg ? '<span class="badge vs sm">Regulär</span>' : `<span class="badge ${svCnt === n ? 'ok' : 'open'} sm">${svCnt}/${n} bereit</span>`}
                    </span>
                    <small>${esc(p.name)} · ${formatDay(p.start).short}–${formatDay(p.end).short}</small>
                  </button>`;
              }).join('')}
            </div>` : ''}
        </section>`;

      const teamColumn = (t, side) => `
        <div class="mc-team ${side}">
          <div class="mc-team-head">
            ${teamLogoHTML(t.logo, t.name, 'lg')}
            <div class="mc-team-titles">
              <h3>${esc(t.name)}</h3>
              <span class="muted small">${t.players.filter((p) => hasSavedInView(p.id)).length}/${t.players.length} Spieler in Woche ${viewPhase.week} bereit</span>
            </div>
          </div>
          <div class="mc-players">
            ${t.players.map((p) => {
              const sv = hasSavedInView(p.id);
              return `<span class="mc-player-pill ${sv ? 'is-saved' : 'is-missing'} ${p.id === highlightPlayer ? 'is-me' : ''}">
                <i class="mcp-icon">${sv ? '✓' : '⏳'}</i>
                <span>${esc(p.name)}${p.id === highlightPlayer ? ' <em>(du)</em>' : ''}</span>
              </span>`;
            }).join('') || '<span class="muted small">Keine Spieler</span>'}
          </div>
        </div>`;

      const adminBarHTML = isAdmin ? `
        <div class="sched-admin-bar">
          <span>🔧 <b>Admin-Steuerung:</b></span>
          ${m.confirmed_slot || propSlots.length ? `<button type="button" class="btn btn-sm btn-ghost" id="admin-reset-sched">🔓 ${m.confirmed_slot ? 'Festen Termin freigeben' : 'Vorschlag zurücksetzen'}</button>` : ''}
          <button type="button" class="btn btn-sm btn-primary" id="admin-set-sched">🏆 ${m.confirmed_slot ? 'Termin ändern' : 'Termin manuell setzen'}</button>
        </div>` : '';

      let schedBoxHTML = '';
      if (m.is_completed) {
        schedBoxHTML = `
          <section class="sched-card completed-match metal">
            <div class="sched-top">
              <span class="sched-icon">✓</span>
              <div class="sched-main">
                <span class="sched-kicker">Match als erledigt markiert</span>
                <h3 class="sched-title">Dieses 2vs2-Match wurde bereits ausgetragen oder extern verabredet</h3>
                <p class="sched-sub">Das Spiel wird im Dashboard nicht mehr in der Liste der offenen Termine geführt.</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm uncomplete-btn" id="match-view-uncomplete-btn">↺ Spiel wieder öffnen</button>
            </div>
            ${isAdmin ? adminBarHTML : ''}
          </section>`;
      } else if (m.confirmed_slot) {
        const confPhase = phaseForDate(m.confirmed_slot.split('|')[0]);
        const isConfResched = confPhase && confPhase.id !== regularPhase.id;
        schedBoxHTML = `
          <section class="sched-card confirmed metal">
            <div class="sched-top">
              <span class="sched-icon">🏆</span>
              <div class="sched-main">
                <span class="sched-kicker">Verbindlicher Spieltermin ${isConfResched ? `(🔄 ${confPhase.week < regularPhase.week ? 'Vorgezogen' : 'Nachgespielt'} in Woche ${confPhase.week})` : ''}</span>
                <h3 class="sched-time">${slotLabel(m.confirmed_slot, true)} Uhr</h3>
                <p class="sched-sub">
                  ${m.confirmed_by_player_name === 'Admin'
                    ? 'Festgelegt durch die Ligaleitung (Admin).'
                    : `Bestätigt von <b>${esc(m.confirmed_by_player_name || '')}</b>${m.proposed_by_player_name ? ` · Vorschlag von ${esc(m.proposed_by_player_name)} (${esc(propTeamName)})` : ''}.`}
                </p>
              </div>
              <span class="badge ok">🔒 Steht fest</span>
            </div>
            ${isAdmin ? adminBarHTML : '<div class="sched-lock-note">🔒 Dieser Termin ist verbindlich eingetragen. Änderungen sind nur über den Admin möglich.</div>'}
          </section>`;
      } else if (propSlots.length > 0 && !proposeMode) {
        if (myTeamId && myTeamId !== m.proposed_by_team_id) {
          schedBoxHTML = `
            <section class="sched-card incoming metal">
              <div class="sched-top">
                <span class="sched-icon">📩</span>
                <div class="sched-main">
                  <span class="sched-kicker">Terminvorschlag von ${esc(propTeamName)} (${esc(m.proposed_by_player_name || '')})</span>
                  <h3 class="sched-title">${propSlots.length === 1 ? 'Termin bestätigen oder Gegenvorschlag senden' : `Einen der ${propSlots.length} Vorschläge auswählen & bestätigen`}</h3>
                  <p class="sched-sub">Mit Klick auf <b>„✓ Verbindlich bestätigen“</b> steht das 2vs2-Match für beide Teams fest.</p>
                </div>
              </div>
              <div class="prop-choice-grid">
                ${propSlots.map((k) => {
                  const i = info(k);
                  const ownCs = ownConflictsFor(k);
                  const badge = i.cls === 'm-perfect'
                    ? `<span class="badge ok">🏆 Perfekt (${i.g}/${n} Grün)</span>`
                    : `<span class="badge warn">⚡ Möglich (${i.g} Grün · ${i.y} Gelb)</span>`;
                  const busyWarn = ownCs.length
                    ? `<div class="pcc-own-busy-warn">🚫 <b>Gesperrt:</b> ${ownCs.map((c) => `${esc(busyTeamNameOf(c))} spielt bereits (${pad2(c.otherHour)}:00–${pad2(c.otherHour + 1)}:00)`).join(', ')}</div>`
                    : '';
                  const pccKind = i.cls === 'm-perfect' ? 'pcc-perfect' : 'pcc-maybe';
                  return `
                    <div class="prop-choice-card ${pccKind} ${ownCs.length ? 'is-own-busy' : ''}">
                      <div class="pcc-info">
                        <b class="pcc-slot-title">${slotLabel(k, true)} Uhr</b>
                        <div class="pcc-badges">${badge}</div>
                        ${busyWarn}
                      </div>
                      <button type="button" class="btn btn-primary btn-sm pcc-confirm-btn" data-confirm-slot="${k}" ${ownCs.length ? 'disabled' : ''}>
                        ${ownCs.length ? '🚫 Nicht wählbar' : '✓ Verbindlich bestätigen'}
                      </button>
                    </div>`;
                }).join('')}
              </div>
              <div class="sched-footer-actions">
                <button type="button" class="btn btn-ghost btn-sm" id="start-counter-btn">
                  <span>↺ Keiner passt? Gegenvorschlag (auch in anderer Woche) machen</span>
                </button>
              </div>
              ${adminBarHTML}
            </section>`;
        } else {
          schedBoxHTML = `
            <section class="sched-card outgoing metal">
              <div class="sched-top">
                <span class="sched-icon">⏳</span>
                <div class="sched-main">
                  <span class="sched-kicker">Wartet auf Antwort von ${esc(waitTeamName)}</span>
                  <h3 class="sched-title">Vorschlag von ${esc(propTeamName)} (${esc(m.proposed_by_player_name || '')}) gesendet</h3>
                  <p class="sched-sub">Sobald <b>${esc(waitTeamName)}</b> einen dieser Termine annimmt, steht das Spiel verbindlich fest:</p>
                  <div class="pmh-prop-list">${propSlots.map((k) => {
                    const i = info(k);
                    return `<span class="prop-chip prop-chip-lg"><b>${slotLabel(k, true)} Uhr</b> <small>(${i.cls === 'm-perfect' ? `${i.g}/${n} Grün` : `${i.g}✓ ${i.y}?`})</small>${conflictChipBadge(k)}</span>`;
                  }).join('')}</div>
                </div>
                ${myTeamId === m.proposed_by_team_id ? `<button type="button" class="btn btn-ghost btn-sm" id="edit-propose-btn">✎ Vorschlag ändern</button>` : ''}
              </div>
              ${adminBarHTML}
            </section>`;
        }
      } else {
        const perfectSelectable = perfect.filter((k) => ownConflictsFor(k).length === 0);
        const perfectBlocked = perfect.filter((k) => ownConflictsFor(k).length > 0);
        const maybeSelectable = maybe.filter((x) => ownConflictsFor(x.k).length === 0);
        const maybeBlocked = maybe.filter((x) => ownConflictsFor(x.k).length > 0);
        const blockedSlots = [
          ...perfectBlocked.map((k) => ({ k, label: slotLabel(k) })),
          ...maybeBlocked.map((x) => ({ k: x.k, label: `${slotLabel(x.k)} (${x.g}✓ ${x.y}?)` })),
        ];

        const hasSelectable = perfectSelectable.length > 0 || maybeSelectable.length > 0 || selectedPropose.size > 0;
        const isCounter = propSlots.length > 0 && myTeamId !== m.proposed_by_team_id;
        const isEdit = propSlots.length > 0 && myTeamId === m.proposed_by_team_id;
        const hasSelectedMaybe = maybeSelectable.some((x) => selectedPropose.has(x.k));
        const maybeOpen = showMaybe || perfectSelectable.length === 0 || hasSelectedMaybe;

        const iAmMissing = mePlayer && !hasSavedInView(mePlayer.id);
        const missingBannerHTML = !allSavedInView ? `
          <div class="sched-card-alert info-box">
            <div>
              <span>⏳ In Woche ${viewPhase.week} haben <b>${n - missingInView.length} von ${n} Spielern</b> ihre Zeiten gespeichert.</span>
              ${missingInView.length ? `<span class="muted">(Noch nicht eingetragen: ${missingInView.map((p) => esc(p.name)).join(', ')})</span>` : ''}
            </div>
            <div class="highlight-hint">💡 Ihr müsst nicht warten: Du kannst trotzdem direkt 1 bis 3 Wunschtermine im Kalender anklicken und vorschlagen!</div>
            ${iAmMissing ? `<div style="margin-top:4px"><a href="#/player/phase/${viewPhase.id}" class="btn btn-amber btn-xs">🗓 Jetzt meine Zeiten für Woche ${viewPhase.week} eintragen ›</a></div>` : ''}
          </div>` : '';

        schedBoxHTML = `
          <section class="sched-card propose metal">
            <div class="sched-top">
              <span class="sched-icon">🤝</span>
              <div class="sched-main">
                <span class="sched-kicker">Termin-Einigung in Woche ${viewPhase.week} (${esc(viewPhase.name)})${allSavedInView ? ` · Alle ${n} Spieler bereit` : ` · ${n - missingInView.length}/${n} bereit`}</span>
                <h3 class="sched-title">${isCounter ? `Gegenvorschlag an ${esc(propTeamName)} senden` : isEdit ? 'Terminvorschlag anpassen' : '1 bis 3 Spieltermine vorschlagen'}</h3>
                <p class="sched-sub">
                  ${mePlayer
                    ? 'Wähle bis zu <b>3 Termine</b> (per Klick hier oder unten im Kalender) und sende sie als Vorschlag an das gegnerische Team.'
                    : 'Hier können die Teams 1 bis 3 Termine auswählen und sich verbindlich einigen.'}
                </p>
              </div>
            </div>
            ${missingBannerHTML}
            ${!hasSelectable && allSavedInView
              ? `<div class="notice warn">In Woche ${viewPhase.week} gibt es aktuell keine gemeinsame Stunde ohne Rot. Passt eure Zeiten im Kalender an oder wählt oben über den <b>3-Wochen-Matchfinder</b> eine Ausweichwoche zum Vorziehen/Nachspielen!</div>`
              : `
                ${perfectSelectable.length ? `
                  <div class="pick-group pick-box perfect-box">
                    <h4>🏆 Perfekte wählbare Termine in Woche ${viewPhase.week} (${perfectSelectable.length}× alle ${n} Grün):</h4>
                    <div class="pick-chips">
                      ${perfectSelectable.map((k) => {
                        const sel = selectedPropose.has(k);
                        return `<button type="button" class="slot-pick perfect ${sel ? 'selected' : ''}" data-pick-slot="${k}" ${!mePlayer ? 'disabled' : ''}>
                          <span class="sp-check">${sel ? '✓' : '+'}</span>
                          <span>${slotLabel(k)}</span>
                        </button>`;
                      }).join('')}
                    </div>
                  </div>` : ''}
                ${maybeSelectable.length ? `
                  <div class="pick-group pick-box maybe-box">
                    ${perfectSelectable.length > 0 ? `
                      <button type="button" class="maybe-toggle-btn" id="toggle-maybe-btn">
                        <span>⚡ ${maybeSelectable.length} mögliche Ausweichtermine in Woche ${viewPhase.week} (kein Rot, mind. 1 Gelb)</span>
                        <span>${maybeOpen ? 'Ausblenden ▴' : 'Anzeigen ▾'}</span>
                      </button>
                    ` : `<h4>⚡ Mögliche wählbare Optionen in Woche ${viewPhase.week} (${maybeSelectable.length}× kein Rot, mind. 1 Gelb):</h4>`}
                    ${maybeOpen ? `
                      <div class="pick-chips">
                        ${maybeSelectable.slice(0, 24).map((x) => {
                          const sel = selectedPropose.has(x.k);
                          return `<button type="button" class="slot-pick maybe ${sel ? 'selected' : ''}" data-pick-slot="${x.k}" ${!mePlayer ? 'disabled' : ''}>
                            <span class="sp-check">${sel ? '✓' : '+'}</span>
                            <span>${slotLabel(x.k)} <small>(${x.g}✓ ${x.y}?)</small></span>
                          </button>`;
                        }).join('')}
                      </div>` : ''}
                  </div>` : ''}
              `}
            ${blockedSlots.length ? `
              <div class="pick-group pick-box blocked-box">
                <div class="blocked-box-head">
                  <h4>🚫 Gesperrte Stunden – Eigenes Spiel / Gegner belegt (${blockedSlots.length}):</h4>
                  <small class="muted">Nicht wählbar, da ${esc(data.teamA.name)} oder ${esc(data.teamB.name)} in dieser Stunde bereits ein festes Spiel hat</small>
                </div>
                <div class="pick-chips">
                  ${blockedSlots.map((b) => `
                    <button type="button" class="slot-pick own-busy" disabled title="${esc(conflictTitle(b.k))}">
                      <span class="sp-check">🚫</span>
                      <span>${esc(b.label)}</span>
                      ${conflictChipBadge(b.k)}
                    </button>
                  `).join('')}
                </div>
              </div>` : ''}
            ${mePlayer ? `
              <div class="propose-bar">
                <div class="pb-selected-info">
                  <b>Auswahl (${selectedPropose.size}/3):</b>
                  ${selectedPropose.size
                    ? [...selectedPropose].map((k) => `<span class="prop-chip">${slotLabel(k, true)} <button type="button" class="rm-pick" data-pick-slot="${k}" title="Entfernen">✕</button></span>`).join('')
                    : '<span class="muted">Klicke oben oder im Kalender unten 1 bis 3 Stunden an</span>'}
                </div>
                <div class="pb-btns">
                  ${proposeMode ? `<button type="button" class="btn btn-ghost btn-sm" id="cancel-propose-btn">Abbrechen</button>` : ''}
                  <button type="button" class="btn btn-primary btn-sm" id="submit-propose-btn" ${selectedPropose.size === 0 ? 'disabled' : ''}>
                    📩 ${selectedPropose.size ? `${selectedPropose.size} ${selectedPropose.size === 1 ? 'Termin' : 'Termine'} vorschlagen` : 'Vorschlag senden'}
                  </button>
                </div>
              </div>` : ''}
            ${adminBarHTML}
          </section>`;
      }

      const ownBusyInView = otherConfirmed.filter((oc) => {
        const [d] = String(oc.confirmed_slot || '').split('|');
        return dates.includes(d);
      });
      const ownBusyBoxHTML = ownBusyInView.length ? `
        <section class="radar-drawer blocked-drawer metal">
          <div class="radar-static-head">
            <span class="radar-title">
              <span>🚫</span>
              <b>Bereits belegte Termine eurer beiden Teams in Woche ${viewPhase.week}:</b>
              <span>${ownBusyInView.length} ${ownBusyInView.length === 1 ? 'festes Spiel sperrt diesen Termin' : 'feste Spiele sperren diese Termine'} (Spieldauer: 1 Stunde)</span>
            </span>
            <span class="badge danger sm">🔒 Nicht wählbar</span>
          </div>
          <div class="radar-body">
            <div class="omb-list">
              ${ownBusyInView.map((oc) => {
                const [, ohStr] = oc.confirmed_slot.split('|');
                const oh = Number(ohStr);
                const bName = busyTeamNameOf(oc);
                return `<div class="omb-chip own-busy">
                  <span class="omb-time">🚫 ${slotLabel(oc.confirmed_slot)} <small>(Dauer 1h: ${pad2(oh)}:00–${pad2(oh + 1)}:00 Uhr)</small></span>
                  <span class="omb-teams">${teamLogoHTML(oc.team_a_logo, oc.team_a_name, 'xs')}<span>${esc(oc.team_a_name)}</span> <i>vs.</i> ${teamLogoHTML(oc.team_b_logo, oc.team_b_name, 'xs')}<span>${esc(oc.team_b_name)}</span></span>
                  <span class="badge danger sm">🚫 ${esc(bName)}</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </section>` : '';

      body.innerHTML = `
        ${prefix}
        <section class="mc-cockpit metal">
          ${teamColumn(data.teamA, 'a')}
          <div class="mc-center">
            <div class="mc-vs-badge">2vs2</div>
            <div class="mc-QuickStats">
              <span class="mc-stat perfect" title="Alle ${n} Spieler haben in Woche ${viewPhase.week} Grün">🏆 <b>${perfect.length}</b> Perfekt</span>
              <span class="mc-stat maybe" title="Kein Spieler Rot, mindestens 1 Gelb in Woche ${viewPhase.week}">⚡ <b>${maybe.length}</b> Möglich</span>
            </div>
          </div>
          ${teamColumn(data.teamB, 'b')}
        </section>
        ${short.length ? `<div class="notice warn">⚠ ${short.map((t) => esc(t.name)).join(', ')} ${short.length === 1 ? 'hat' : 'haben'} noch keine 2 Spieler.</div>` : ''}
        ${rescheduleBarHTML}
        ${schedBoxHTML}
        ${ownBusyBoxHTML}
        <div class="cal-toolbar">
          ${legend('match')}
          <div class="tool-actions"><span class="muted small" id="refresh-info"></span><button class="btn btn-ghost btn-sm" id="refresh-btn">⟳ Aktualisieren</button></div>
        </div>
        <div id="match-grid"></div>`;

      body.querySelector('#toggle-maybe-btn')?.addEventListener('click', () => {
        showMaybe = !showMaybe;
        render();
      });
      body.querySelector('#rsb-toggle-weeks-btn')?.addEventListener('click', () => {
        showRescheduleBar = !showRescheduleBar;
        render();
      });
      body.querySelector('#rsb-back-regular-btn')?.addEventListener('click', () => {
        activeCalendarPhase = regularPhase;
        render();
      });
      body.querySelectorAll('[data-view-phase]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetPh = getPhase(btn.dataset.viewPhase);
          if (targetPh) {
            activeCalendarPhase = targetPh;
            render();
          }
        });
      });

      const togglePickSlot = (k) => {
        if (!mePlayer || m.confirmed_slot || m.is_completed) return;
        const ownCs = ownConflictsFor(k);
        if (ownCs.length) {
          const c = ownCs[0];
          toast(`Nicht wählbar: ${busyTeamNameOf(c)} hat dort bereits ein festes Spiel (${c.team_a_name} vs. ${c.team_b_name}, ${pad2(c.otherHour)}:00–${pad2(c.otherHour + 1)}:00 Uhr).`, 'error');
          return;
        }
        if (selectedPropose.has(k)) {
          selectedPropose.delete(k);
        } else {
          if (selectedPropose.size >= 3) {
            toast('Du kannst maximal 3 Termine gleichzeitig auswählen.', 'error');
            return;
          }
          selectedPropose.add(k);
        }
        if (propSlots.length > 0 && !proposeMode) proposeMode = true;
        render();
      };

      const confirmChosenSlot = async (k) => {
        if (!mePlayer) return;
        const ownCs = ownConflictsFor(k);
        if (ownCs.length) {
          const c = ownCs[0];
          toast(`Nicht möglich: ${busyTeamNameOf(c)} hat dort bereits ein festes Spiel (${c.team_a_name} vs. ${c.team_b_name}).`, 'error');
          return;
        }
        const ok = await modal({
          title: '🏆 Spieltermin verbindlich bestätigen',
          confirmText: '✓ Ja, verbindlich festlegen',
          body: `
            <p>Möchtest du für das 2vs2-Match <b>${esc(data.teamA.name)} vs. ${esc(data.teamB.name)}</b> folgenden Termin verbindlich einloggen?</p>
            <div class="modal-slot-preview">🏆 ${slotLabel(k, true)} Uhr</div>
            <p class="hint small" style="margin:8px 0 0">🔒 <b>Wichtig:</b> Nach der Bestätigung steht der Termin fest und kann nur noch vom Liga-Admin geändert werden.</p>`,
          onConfirm: async () => {
            await api(`/matchups/${matchupId}/confirm`, {
              method: 'POST',
              body: { player_id: mePlayer.id, slot: k },
            });
          },
        });
        if (ok) {
          toast('Spieltermin wurde verbindlich festgelegt! 🏆');
          proposeMode = false;
          selectedPropose.clear();
          await load();
        }
      };

      body.querySelectorAll('[data-pick-slot]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePickSlot(btn.dataset.pickSlot);
        });
      });

      body.querySelectorAll('[data-confirm-slot]').forEach((btn) => {
        btn.addEventListener('click', () => confirmChosenSlot(btn.dataset.confirmSlot));
      });

      body.querySelector('#start-counter-btn')?.addEventListener('click', () => {
        selectedPropose.clear();
        proposeMode = true;
        render();
      });

      body.querySelector('#edit-propose-btn')?.addEventListener('click', () => {
        selectedPropose.clear();
        propSlots.filter((s) => !ownConflictsFor(s).length).forEach((s) => selectedPropose.add(s));
        proposeMode = true;
        render();
      });

      body.querySelector('#cancel-propose-btn')?.addEventListener('click', () => {
        selectedPropose.clear();
        proposeMode = false;
        render();
      });

      body.querySelector('#match-view-complete-btn')?.addEventListener('click', async () => {
        const ok = await confirmModal(
          'Match als erledigt markieren?',
          `Wurde die Begegnung <b>${esc(data.teamA.name)} vs. ${esc(data.teamB.name)}</b> bereits ausgetragen oder extern verabredet? Sie wird dann aus der offenen Liste entfernt.`,
          '✓ Als erledigt markieren'
        );
        if (!ok) return;
        try {
          await api(`/matchups/${matchupId}/complete`, { method: 'POST', body: { player_id: mePlayer?.id } });
          toast('Match wurde als erledigt markiert.');
          await load();
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      body.querySelector('#match-view-uncomplete-btn')?.addEventListener('click', async () => {
        try {
          await api(`/matchups/${matchupId}/uncomplete`, { method: 'POST', body: { player_id: mePlayer?.id } });
          toast('Spiel wieder als offen markiert.');
          await load();
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      body.querySelector('#submit-propose-btn')?.addEventListener('click', async (e) => {
        if (!mePlayer || selectedPropose.size === 0) return;
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          await api(`/matchups/${matchupId}/propose`, {
            method: 'POST',
            body: { player_id: mePlayer.id, slots: [...selectedPropose] },
          });
          toast(`${selectedPropose.size === 1 ? 'Terminvorschlag' : `${selectedPropose.size} Terminvorschläge`} gesendet!`);
          selectedPropose.clear();
          proposeMode = false;
          await load();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
        }
      });

      body.querySelector('#admin-reset-sched')?.addEventListener('click', async () => {
        const ok = await confirmModal(
          'Termin-Einigung zurücksetzen?',
          `Der feste Termin bzw. aktuelle Vorschlag für <b>${esc(data.teamA.name)} vs. ${esc(data.teamB.name)}</b> wird aufgehoben, sodass sich die Teams neu einigen können.`,
          'Zurücksetzen'
        );
        if (!ok) return;
        try {
          await api(`/matchups/${matchupId}/schedule`, { method: 'PUT', body: { action: 'reset' } });
          toast('Termin-Einigung wurde zurückgesetzt.');
          await load();
        } catch (err) { toast(err.message, 'error'); }
      });

      body.querySelector('#admin-set-sched')?.addEventListener('click', async () => {
        const allSlots = [];
        for (const d of dates) for (const h of HOURS) allSlots.push(key(d, h));
        const otherSlots = allSlots.filter((k) => !perfect.includes(k) && !maybe.some((x) => x.k === k));
        const optSuffix = (k) => {
          const ownCs = ownConflictsFor(k);
          if (ownCs.length) return ` [🚫 EIGENES SPIEL: ${busyTeamNameOf(ownCs[0])}]`;
          return '';
        };
        const ok = await modal({
          title: `🏆 Spieltermin als Admin festlegen (Woche ${viewPhase.week})`,
          confirmText: 'Verbindlich speichern',
          body: `
            <p>Wähle den festen Spieltermin für <b>${esc(data.teamA.name)} vs. ${esc(data.teamB.name)}</b> in Woche ${viewPhase.week} (${esc(viewPhase.name)}):</p>
            <label class="field" style="margin-top:10px">
              <span>Datum & Uhrzeit</span>
              <select name="slot" required>
                ${perfect.length ? `<optgroup label="🏆 Perfekte Termine (alle ${n} Grün)">${perfect.map((k) => `<option value="${k}" ${m.confirmed_slot === k ? 'selected' : ''}>${slotLabel(k)} (${n}/${n} Grün)${optSuffix(k)}</option>`).join('')}</optgroup>` : ''}
                ${maybe.length ? `<optgroup label="⚡ Mögliche Optionen (kein Rot)">${maybe.map((x) => `<option value="${x.k}" ${m.confirmed_slot === x.k ? 'selected' : ''}>${slotLabel(x.k)} (${x.g} Grün, ${x.y} Gelb)${optSuffix(x.k)}</option>`).join('')}</optgroup>` : ''}
                <optgroup label="Alle weiteren Stunden (Woche ${viewPhase.week})">
                  ${otherSlots.map((k) => { const i = infoForPhase(k, viewPhase.id); return `<option value="${k}" ${m.confirmed_slot === k ? 'selected' : ''}>${slotLabel(k)} (${i.g}✓ ${i.y}? ${i.r}✕)${optSuffix(k)}</option>`; }).join('')}
                </optgroup>
              </select>
            </label>`,
          onConfirm: async (form) => {
            await api(`/matchups/${matchupId}/schedule`, {
              method: 'PUT',
              body: { action: 'set', slot: form.slot.value },
            });
          },
        });
        if (ok) {
          toast('Fester Spieltermin wurde vom Admin gespeichert.');
          await load();
        }
      });

      const gridBox = body.querySelector('#match-grid');
      gridBox.innerHTML = gridHTML(viewPhase, {
        cellHTML: (d, h) => {
          const k = key(d, h);
          const i = infoForPhase(k, viewPhase.id);
          const isConf = m.confirmed_slot === k;
          const isProp = !m.confirmed_slot && propSlots.includes(k);
          const isSel = !m.confirmed_slot && selectedPropose.has(k);
          const ownCs = ownConflictsFor(k);
          let txt = i.cls === 'm-perfect' ? `${i.g}/${n}` : i.cls === 'm-maybe' ? `${i.g}✓ ${i.y}?` : n ? `${n - i.r}/${n}` : '–';
          if (isConf) txt = `🏆 FIX`;
          else if (isProp) txt = `📩 ${txt}`;
          else if (isSel) txt = `✓ ${txt}`;
          const busyBadge = !isConf && ownCs.length
            ? `<span class="tv-cell-badge own-busy" title="${esc(conflictTitle(k))}">🚫</span>`
            : '';
          const extraCls = [
            isConf ? 'is-confirmed' : '',
            isProp ? 'is-proposed' : '',
            isSel ? 'is-selected' : '',
            ownCs.length ? 'has-own-busy' : '',
          ].filter(Boolean).join(' ');
          return `<td class="cell mcell ${i.cls} ${extraCls}" data-k="${k}"><span class="mc">${txt}</span>${busyBadge}</td>`;
        },
      });

      const showTip = (td) => {
        const k = td.dataset.k;
        const i = infoForPhase(k, viewPhase.id);
        const ownCs = ownConflictsFor(k);
        const row = (p) => { const s = statusOf(p.id, k); return `<li><i class="dot s-${s}"></i><span>${esc(p.name)}${p.id === highlightPlayer ? ' (du)' : ''}</span><b class="t-${s}">${hasSavedInView(p.id) ? STATUS_LABEL[s] : 'nicht eingetragen'}</b></li>`; };
        const verdict = m.confirmed_slot === k
          ? '<span class="t-green">🏆 Fester Spieltermin</span>'
          : ownCs.length
            ? '<span class="t-red">🚫 Gesperrt (Eigenes Spiel)</span>'
            : i.cls === 'm-perfect' ? '<span class="t-green">Perfekter Match-Termin</span>' : i.cls === 'm-maybe' ? '<span class="t-yellow">Mögliche Option</span>' : '<span class="t-red">Nicht möglich</span>';

        const tipOwnBusyHTML = ownCs.length ? `
          <div class="tip-own-busy">
            <b>🚫 Gesperrt – Eigenes Spiel (1h Spielzeit):</b>
            <ul>
              ${ownCs.map((c) => `<li><b>${esc(busyTeamNameOf(c))}</b> spielt bereits: <b>${esc(c.team_a_name)} vs. ${esc(c.team_b_name)}</b> (${pad2(c.otherHour)}:00–${pad2(c.otherHour + 1)}:00 Uhr)</li>`).join('')}
            </ul>
          </div>` : '';

        let tipAction = '';
        if (!m.confirmed_slot && !m.is_completed && mePlayer && !ownCs.length) {
          if (propSlots.includes(k) && myTeamId !== m.proposed_by_team_id && !proposeMode) {
            tipAction = `<div class="tip-actions"><button type="button" class="btn btn-sm btn-primary btn-block" data-tip-confirm="${k}">✓ Diesen Termin verbindlich bestätigen</button></div>`;
          } else {
            const sel = selectedPropose.has(k);
            tipAction = `<div class="tip-actions"><button type="button" class="btn btn-sm ${sel ? 'btn-ghost' : 'btn-primary'} btn-block" data-tip-pick="${k}">${sel ? '✕ Aus Auswahl entfernen' : '+ Für Vorschlag auswählen (max. 3)'}</button></div>`;
          }
        }

        tip.innerHTML = `
          <div class="tip-head"><b>${slotLabel(k, true)}</b>${verdict}</div>
          ${tipOwnBusyHTML}
          <div class="tip-teams">
            <div><h5>${teamLogoHTML(data.teamA.logo, data.teamA.name, 'xs')}<span>${esc(data.teamA.name)}</span></h5><ul>${data.teamA.players.map(row).join('')}</ul></div>
            <div><h5>${teamLogoHTML(data.teamB.logo, data.teamB.name, 'xs')}<span>${esc(data.teamB.name)}</span></h5><ul>${data.teamB.players.map(row).join('')}</ul></div>
          </div>
          <div class="tip-foot">${i.g} grün · ${i.y} gelb · ${i.r} rot</div>
          ${tipAction}`;
        tip.hidden = false;
        tip.querySelector('[data-tip-pick]')?.addEventListener('click', () => { hideTip(); togglePickSlot(k); });
        tip.querySelector('[data-tip-confirm]')?.addEventListener('click', () => { hideTip(); confirmChosenSlot(k); });
        const r = td.getBoundingClientRect();
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        let left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - 8));
        let top = r.bottom + 8;
        if (top + th > window.innerHeight - 8) top = Math.max(8, r.top - th - 8);
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      };
      const hideTip = () => { tip.hidden = true; pinned = null; };
      const table = gridBox.querySelector('table');
      table.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse' || pinned) return;
        const td = e.target.closest('td.mcell');
        if (td) showTip(td);
      });
      table.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pinned) tip.hidden = true; });
      table.addEventListener('click', (e) => {
        const td = e.target.closest('td.mcell');
        if (!td) return;
        e.stopPropagation();
        if (pinned === td) { hideTip(); return; }
        pinned = td;
        showTip(td);
      });
      body.querySelector('#refresh-btn').addEventListener('click', () => load(true));
      body.querySelector('#refresh-info').textContent = 'Stand: ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const docClick = (e) => { if (!e.target.closest('.tooltip')) { tip.hidden = true; pinned = null; } };
    const onScroll = () => { tip.hidden = true; pinned = null; };
    document.addEventListener('click', docClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    onCleanup(() => { document.removeEventListener('click', docClick); window.removeEventListener('scroll', onScroll); });

    const load = async (manual = false) => {
      try {
        data = await api(`/matchups/${matchupId}/overlap`);
        const regularPhase = getPhase(data.matchup.phase_id) || initialPhase;
        const realCurrentWeek = getRealSeasonWeek();
        const isPastOverdue = (regularPhase?.week || 0) < realCurrentWeek && !data.matchup.confirmed_slot && !data.matchup.is_completed;

        if (data.matchup.confirmed_slot) {
          const cPh = phaseForDate(data.matchup.confirmed_slot.split('|')[0]);
          if (cPh) activeCalendarPhase = cPh;
        } else if (Array.isArray(data.matchup.proposed_slots) && data.matchup.proposed_slots.length) {
          const pPh = phaseForDate(data.matchup.proposed_slots[0].split('|')[0]);
          if (pPh) activeCalendarPhase = pPh;
        } else if (isPastOverdue && (!activeCalendarPhase || activeCalendarPhase.id === regularPhase.id)) {
          const targetPh = PHASES.find((p) => p.week === realCurrentWeek) || PHASES[0];
          if (targetPh) activeCalendarPhase = targetPh;
        }
        tip.hidden = true; pinned = null;
        render();
        if (manual) toast('Abgleich aktualisiert', 'info');
      } catch (err) {
        if (!data) throw err;
        if (manual) toast(err.message, 'error');
      }
    };
    await load();
    const timer = setInterval(() => {
      if (!document.hidden && tip.hidden && selectedPropose.size === 0 && !proposeMode) load();
    }, REFRESH_MS);
    onCleanup(() => clearInterval(timer));
  }

  // =====================================================================
  //  ADMIN-BEREICH (Ligen, 2vs2-Teams, Spielplan & Einsicht)
  // =====================================================================
  async function renderAdmin(tab, rest) {
    if (!sessionStorage.getItem(SS_ADMIN)) return go('#/');
    await api('/admin/verify');
    const tabs = [
      ['teams', '👥 Ligen, Teams & Spieler'],
      ['matchups', '⚔ Spielplan & Paarungen'],
      ['insight', '📊 Zeitplan-Einsicht'],
    ];
    const activeTab = tab === 'match' ? 'insight' : tab;
    $app.innerHTML = `
      <header class="topbar metal">
        ${brand(true)}
        <div class="who"><div class="who-main"><span class="avatar admin">★</span><div><b>Admin-Dashboard</b><small>2vs2 Liga-Verwaltung (8 Ligen)</small></div></div></div>
        <button class="btn btn-ghost btn-sm" id="admin-logout">Logout</button>
      </header>
      <main class="container">
        <div id="admin-search-host"></div>
        <nav class="tabs big">${tabs.map(([id, label]) => `<a class="tab ${id === activeTab ? 'active' : ''}" href="#/admin/${id}">${label}</a>`).join('')}</nav>
        <div id="admin-body"><div class="loading"><div class="spinner"></div></div></div>
      </main>`;
    document.getElementById('admin-logout').addEventListener('click', () => { sessionStorage.removeItem(SS_ADMIN); go('#/'); });
    const body = document.getElementById('admin-body');
    const searchHost = document.getElementById('admin-search-host');

    const loadCurrentTab = async () => {
      if (tab === 'teams') await adminTeams(body);
      else if (tab === 'matchups') await adminMatchups(body);
      else if (tab === 'insight') await adminInsight(body);
      else if (tab === 'match') await adminMatch(body, rest[0]);
      else go('#/admin/teams');
    };

    await mountAdminSearch(searchHost, loadCurrentTab);
    await loadCurrentTab();
  }

  function highlightText(text, query) {
    const s = String(text ?? '');
    const q = String(query ?? '').trim();
    if (!q) return esc(s);
    const idx = s.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return esc(s);
    return `${esc(s.slice(0, idx))}<mark class="as-hl">${esc(s.slice(idx, idx + q.length))}</mark>${esc(s.slice(idx + q.length))}`;
  }

  async function mountAdminSearch(host, onDataMutated) {
    if (!host) return;
    let teams = [];
    let players = [];
    let matchups = [];
    let savedSet = new Set();
    let activeIdx = -1;
    let currentSuggestions = [];
    let calReqId = 0;

    const loadSearchData = async () => {
      const [t, p, m, st] = await Promise.all([
        api('/teams'),
        api('/players'),
        api('/matchups'),
        api('/admin/save-status'),
      ]);
      teams = t;
      players = p;
      matchups = m;
      savedSet = new Set(st.map((s) => `${s.player_id}|${s.phase_id}`));
    };

    await loadSearchData();

    host.innerHTML = `
      <section class="admin-search-section metal" aria-label="Team- und Spielersuche">
        <div class="as-bar">
          <div class="as-input-wrap">
            <span class="as-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              id="admin-omni-input"
              class="as-input"
              placeholder="Team, Spieler oder Liga suchen (z. B. Diamant, Foxhunters, Simon …) – Vorschlag anklicken für Komplett-Übersicht"
              autocomplete="off"
              spellcheck="false"
            >
            <button type="button" class="as-clear-btn" id="admin-omni-clear" hidden title="Eingabe löschen">✕</button>
          </div>
          <div class="as-dropdown" id="admin-omni-dropdown" hidden role="listbox"></div>
        </div>
        <div id="admin-dossier-wrap"></div>
      </section>`;

    const input = host.querySelector('#admin-omni-input');
    const clearBtn = host.querySelector('#admin-omni-clear');
    const dropdown = host.querySelector('#admin-omni-dropdown');
    const dossierWrap = host.querySelector('#admin-dossier-wrap');

    const closeDropdown = () => {
      dropdown.hidden = true;
      dropdown.innerHTML = '';
      activeIdx = -1;
      currentSuggestions = [];
    };

    const selectTarget = async (target, { scroll = true } = {}) => {
      S.adminSearchTarget = target;
      closeDropdown();
      await loadSearchData();
      await renderDossier();
      if (scroll && dossierWrap.firstElementChild) {
        dossierWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    const updateSuggestions = () => {
      const q = input.value.trim();
      clearBtn.hidden = !q && !S.adminSearchTarget;
      if (q.length < 1) {
        closeDropdown();
        return;
      }
      const ql = q.toLowerCase();

      const matchedTeams = teams
        .filter((t) => {
          const lgName = getLeague(t.league_id)?.name || '';
          return t.name.toLowerCase().includes(ql) || lgName.toLowerCase().includes(ql) || t.players.some((p) => p.name.toLowerCase().includes(ql));
        })
        .slice(0, 8);

      const matchedPlayers = players
        .filter((p) => {
          const lgName = getLeague(p.league_id)?.name || '';
          return p.name.toLowerCase().includes(ql) || (p.team_name || '').toLowerCase().includes(ql) || lgName.toLowerCase().includes(ql);
        })
        .slice(0, 10);

      currentSuggestions = [
        ...matchedTeams.map((t) => ({ type: 'team', id: t.id, item: t })),
        ...matchedPlayers.map((p) => ({ type: 'player', id: p.id, item: p })),
      ];
      activeIdx = currentSuggestions.length ? 0 : -1;

      if (!currentSuggestions.length) {
        dropdown.innerHTML = `<div class="as-empty">Kein Team oder Spieler für „<b>${esc(q)}</b>“ gefunden.</div>`;
        dropdown.hidden = false;
        return;
      }

      let idxCounter = 0;
      const renderTeamSug = (t) => {
        const myIdx = idxCounter++;
        const tMatches = matchups.filter((m) => (m.team_a_id === t.id || m.team_b_id === t.id) && !m.is_bye);
        const confCnt = tMatches.filter((m) => m.confirmed_slot).length;
        const pNames = t.is_dummy ? '<em>Freispiel / Dummy-Team</em>' : (t.players.map((p) => highlightText(p.name, q)).join(', ') || '<span class="muted">keine Spieler</span>');
        return `
          <button type="button" class="as-item ${myIdx === activeIdx ? 'is-active' : ''}" data-sug-idx="${myIdx}" role="option">
            <div class="as-item-main">
              ${teamLogoHTML(t.logo, t.name, 'sm')}
              <div class="as-item-txt">
                <div class="as-item-title">
                  <span class="as-type-tag team">🛡️ Team</span>
                  <b>${highlightText(t.name, q)}</b>
                  ${leagueBadgeHTML(t.league_id, 'sm')}
                  ${t.is_dummy ? '<span class="badge ok sm">🎟️ Dummy</span>' : `<span class="badge ${t.players.length === 2 ? 'ok' : 'warn'} sm">${t.players.length}/2 Spieler</span>`}
                  ${tMatches.length ? `<span class="badge vs sm">⚔ ${tMatches.length} Spiele (${confCnt} fest)</span>` : ''}
                </div>
                <small class="as-item-sub">Kader: ${pNames}</small>
              </div>
            </div>
            <span class="as-open-hint">Team-Übersicht öffnen ›</span>
          </button>`;
      };

      const renderPlayerSug = (p) => {
        const myIdx = idxCounter++;
        const savedCnt = PHASES.filter((ph) => savedSet.has(`${p.id}|${ph.id}`)).length;
        return `
          <button type="button" class="as-item ${myIdx === activeIdx ? 'is-active' : ''}" data-sug-idx="${myIdx}" role="option">
            <div class="as-item-main">
              ${p.team_name ? teamLogoHTML(p.team_logo, p.team_name, 'sm') : `<span class="avatar sm">${esc(p.name.slice(0, 1).toUpperCase())}</span>`}
              <div class="as-item-txt">
                <div class="as-item-title">
                  <span class="as-type-tag player">👤 Spieler</span>
                  <b>${highlightText(p.name, q)}</b>
                  ${p.league_id ? leagueBadgeHTML(p.league_id, 'sm') : ''}
                  <span class="badge ${savedCnt === PHASES.length ? 'ok' : savedCnt > 0 ? 'warn' : 'open'} sm">🗓 ${savedCnt}/${PHASES.length} Wochen</span>
                </div>
                <small class="as-item-sub">Team: ${p.team_name ? highlightText(p.team_name, q) : '<em>Ohne Team</em>'}</small>
              </div>
            </div>
            <span class="as-open-hint">Spieler-Übersicht öffnen ›</span>
          </button>`;
      };

      dropdown.innerHTML = `
        ${matchedTeams.length ? `<div class="as-group-label">🛡️ Teams (${matchedTeams.length})</div>${matchedTeams.map(renderTeamSug).join('')}` : ''}
        ${matchedPlayers.length ? `<div class="as-group-label">👤 Spieler (${matchedPlayers.length})</div>${matchedPlayers.map(renderPlayerSug).join('')}` : ''}
      `;
      dropdown.hidden = false;

      dropdown.querySelectorAll('[data-sug-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const chosen = currentSuggestions[Number(btn.dataset.sugIdx)];
          if (chosen) {
            input.value = chosen.item.name;
            clearBtn.hidden = false;
            selectTarget({ type: chosen.type, id: chosen.id });
          }
        });
      });
    };

    input.addEventListener('input', () => {
      if (!input.value.trim()) closeDropdown();
      else updateSuggestions();
    });
    input.addEventListener('focus', () => { if (input.value.trim().length >= 1) updateSuggestions(); });
    clearBtn.addEventListener('click', () => {
      input.value = '';
      S.adminSearchTarget = null;
      clearBtn.hidden = true;
      closeDropdown();
      dossierWrap.innerHTML = '';
      input.focus();
    });

    const onDocClick = (e) => { if (!e.target.closest('.as-bar')) closeDropdown(); };
    document.addEventListener('click', onDocClick);
    onCleanup(() => document.removeEventListener('click', onDocClick));

    const analyzeMatchup = (m, perspectiveTeamId) => {
      const ph = getPhase(m.phase_id);
      const isA = m.team_a_id === perspectiveTeamId;
      const ownTeamId = isA ? m.team_a_id : m.team_b_id;
      const oppTeamId = isA ? m.team_b_id : m.team_a_id;
      const ownTeamObj = teams.find((t) => t.id === ownTeamId);
      const oppTeamObj = teams.find((t) => t.id === oppTeamId);
      const ownPlayers = ownTeamObj ? ownTeamObj.players : [];
      const oppPlayers = oppTeamObj ? oppTeamObj.players : [];
      const all4 = [...ownPlayers, ...oppPlayers];
      const saved4 = all4.filter((p) => savedSet.has(`${p.id}|${m.phase_id}`));
      const missingOwn = ownPlayers.filter((p) => !savedSet.has(`${p.id}|${m.phase_id}`));
      const missingOpp = oppPlayers.filter((p) => !savedSet.has(`${p.id}|${m.phase_id}`));
      const propSlots = Array.isArray(m.proposed_slots) ? m.proposed_slots : [];

      let category = 'waiting_times';
      let prio = 3;
      if (m.is_bye) {
        category = 'bye';
        prio = 5;
      } else if (m.confirmed_slot) {
        category = 'confirmed';
        prio = 4;
      } else if (propSlots.length > 0) {
        category = m.proposed_by_team_id === ownTeamId ? 'proposed_by_us' : 'proposed_by_opp';
        prio = m.proposed_by_team_id === ownTeamId ? 2 : 1;
      } else if (all4.length > 0 && saved4.length === all4.length) {
        category = 'ready';
        prio = 2;
      }

      return {
        m,
        ph,
        ownTeamId,
        oppTeamId,
        ownName: isA ? m.team_a_name : m.team_b_name,
        ownLogo: isA ? m.team_a_logo : m.team_b_logo,
        oppName: isA ? m.team_b_name : m.team_a_name,
        oppLogo: isA ? m.team_b_logo : m.team_a_logo,
        ownPlayers,
        oppPlayers,
        all4,
        saved4,
        missingOwn,
        missingOpp,
        propSlots,
        category,
        prio,
      };
    };

    const renderMatchCardHTML = (info) => {
      const { m, ph, oppTeamId, ownName, ownLogo, oppName, oppLogo, all4, saved4, propSlots, category } = info;
      const propTeamName = m.proposed_by_team_id === m.team_a_id ? m.team_a_name : m.team_b_name;

      let statusHTML = '';
      if (category === 'bye') {
        statusHTML = `<div class="ad-m-status"><span class="badge ok">🎟️ Freispiel (Spielfrei)</span></div>`;
      } else if (category === 'confirmed') {
        statusHTML = `<div class="ad-m-status"><span class="badge ok">🏆 Fest: ${slotLabel(m.confirmed_slot, true)} Uhr</span></div>`;
      } else if (category === 'proposed_by_opp' || category === 'proposed_by_us') {
        statusHTML = `<div class="ad-m-status"><span class="badge warn">📩 ${propSlots.length} Vorschl. (${esc(propTeamName)})</span><div class="m-row-chips">${propSlots.map((s) => `<span class="prop-chip">${slotLabel(s, true)}</span>`).join('')}</div></div>`;
      } else if (category === 'ready') {
        statusHTML = `<div class="ad-m-status"><span class="badge ready-badge">🤝 Alle ${saved4.length}/${all4.length} Spieler bereit</span></div>`;
      } else {
        statusHTML = `<div class="ad-m-status"><span class="badge open">⏳ Wartet auf Zeiten (${saved4.length}/${all4.length} Spieler)</span></div>`;
      }

      return `
        <article class="ad-match-card c-${ph?.color || 'green'}">
          <div class="ad-m-left">
            <div class="m-row-phase"><i class="dot"></i><span>Woche ${ph?.week || '?'} · ${esc(ph?.name || m.phase_id)}</span><small>${ph ? formatRange(ph) : ''}</small></div>
            <div class="ad-m-teams">
              <span class="m-team-entry m-team-mine">${teamLogoHTML(ownLogo, ownName, 'sm')}<span>${esc(ownName)}</span></span>
              <span class="m-vs">vs.</span>
              <button type="button" class="ad-opp-btn" data-ad-open-team="${oppTeamId}">${teamLogoHTML(oppLogo, oppName, 'sm')}<span>${esc(oppName)}</span></button>
            </div>
          </div>
          <div class="ad-m-center">${statusHTML}</div>
          <div class="ad-m-right">
            ${!m.is_bye ? `<a class="btn btn-sm btn-blue" href="#/admin/match/${m.id}">📊 4-Spieler-Abgleich</a>` : ''}
          </div>
        </article>`;
    };

    const renderDossier = async () => {
      const target = S.adminSearchTarget;
      clearBtn.hidden = !input.value.trim() && !target;
      if (!target) {
        dossierWrap.innerHTML = '';
        return;
      }

      if (target.type === 'team') {
        const team = teams.find((t) => String(t.id) === String(target.id));
        if (!team) { S.adminSearchTarget = null; dossierWrap.innerHTML = ''; return; }
        const teamMatchups = matchups
          .filter((m) => m.team_a_id === team.id || m.team_b_id === team.id)
          .map((m) => analyzeMatchup(m, team.id))
          .sort((a, b) => (a.ph?.week || 0) - (b.ph?.week || 0));

        dossierWrap.innerHTML = `
          <div class="admin-dossier card metal">
            <header class="ad-head">
              <div class="ad-head-main">
                ${teamLogoHTML(team.logo, team.name, 'lg')}
                <div class="ad-head-titles">
                  <div class="ad-overline">🛡️ TEAM-DOSSIER</div>
                  <h2>${esc(team.name)}</h2>
                  <div class="ad-kpis">
                    ${leagueBadgeHTML(team.league_id)}
                    ${team.is_dummy ? '<span class="badge ok">🎟️ Dummy-Team (Freispiel)</span>' : `<span class="badge ${team.players.length === 2 ? 'ok' : 'warn'}">👥 ${team.players.length}/2 Spieler</span>`}
                    <span class="badge vs">⚔ ${teamMatchups.length} Saison-Paarungen</span>
                  </div>
                </div>
              </div>
              <div class="ad-head-actions">
                ${!team.is_dummy ? `<button type="button" class="btn btn-sm btn-blue" data-ad-act="logo-team">🖼 Logo</button>` : ''}
                <button type="button" class="btn btn-sm btn-ghost" data-ad-act="close">✕ Schließen</button>
              </div>
            </header>
            <section class="ad-sec">
              <h3>⚔ Saison-Spielplan (${teamMatchups.length} Wochen)</h3>
              <div class="ad-match-list">${teamMatchups.map((info) => renderMatchCardHTML(info)).join('')}</div>
            </section>
          </div>`;

        dossierWrap.querySelector('[data-ad-act="close"]')?.addEventListener('click', () => {
          S.adminSearchTarget = null;
          dossierWrap.innerHTML = '';
        });
        dossierWrap.querySelector('[data-ad-act="logo-team"]')?.addEventListener('click', async () => {
          await openTeamLogoModal(team, teams, async () => {
            await loadSearchData();
            await renderDossier();
            if (onDataMutated) await onDataMutated();
          });
        });
        dossierWrap.querySelectorAll('[data-ad-open-team]').forEach((btn) => {
          btn.addEventListener('click', () => selectTarget({ type: 'team', id: Number(btn.dataset.adOpenTeam) }));
        });
        return;
      }

      if (target.type === 'player') {
        const player = players.find((p) => String(p.id) === String(target.id));
        if (!player) { S.adminSearchTarget = null; dossierWrap.innerHTML = ''; return; }
        const team = teams.find((t) => t.id === player.team_id) || null;
        const savedPhases = PHASES.filter((ph) => savedSet.has(`${player.id}|${ph.id}`));
        const activePhase = getPhase(target.phaseId) || savedPhases[0] || PHASES[0];

        dossierWrap.innerHTML = `
          <div class="admin-dossier card metal">
            <header class="ad-head">
              <div class="ad-head-main">
                ${team ? teamLogoHTML(team.logo, team.name, 'lg') : `<span class="avatar">${esc(player.name.slice(0, 1).toUpperCase())}</span>`}
                <div class="ad-head-titles">
                  <div class="ad-overline">👤 SPIELER-DOSSIER</div>
                  <h2>${esc(player.name)}</h2>
                  <div class="ad-kpis">
                    ${team ? `<button type="button" class="ad-team-chip" data-ad-open-team="${team.id}">Team: <b>${esc(team.name)}</b> ›</button>` : ''}
                    ${player.league_id ? leagueBadgeHTML(player.league_id) : ''}
                    <span class="badge ok">🗓 ${savedPhases.length}/${PHASES.length} Wochen gespeichert</span>
                  </div>
                </div>
              </div>
              <div class="ad-head-actions">
                <button type="button" class="btn btn-sm btn-ghost" data-ad-act="close">✕ Schließen</button>
              </div>
            </header>
            <section class="ad-sec">
              <div class="phase-chips">
                ${PHASES.map((ph) => `
                  <button type="button" class="chip c-${ph.color} ${ph.id === activePhase.id ? 'active' : ''}" data-ad-cal-phase="${ph.id}">
                    <i class="dot"></i><span>${esc(ph.short)}</span>
                    ${savedSet.has(`${player.id}|${ph.id}`) ? '<span class="ok-mark">✓</span>' : ''}
                  </button>`).join('')}
              </div>
              <div id="ad-player-cal-box"><div class="loading"><div class="spinner"></div></div></div>
            </section>
          </div>`;

        dossierWrap.querySelector('[data-ad-act="close"]')?.addEventListener('click', () => {
          S.adminSearchTarget = null;
          dossierWrap.innerHTML = '';
        });
        dossierWrap.querySelectorAll('[data-ad-open-team]').forEach((btn) => {
          btn.addEventListener('click', () => selectTarget({ type: 'team', id: Number(btn.dataset.adOpenTeam) }));
        });
        dossierWrap.querySelectorAll('[data-ad-cal-phase]').forEach((btn) => {
          btn.addEventListener('click', () => {
            S.adminSearchTarget.phaseId = btn.dataset.adCalPhase;
            renderDossier();
          });
        });

        const myReq = ++calReqId;
        const calBox = dossierWrap.querySelector('#ad-player-cal-box');
        const data = await api(`/players/${player.id}/availability/${activePhase.id}`);
        if (myReq !== calReqId || !calBox) return;
        const cells = new Map(data.cells.map((c) => [key(c.date, c.hour), c.status]));
        calBox.innerHTML = `<div class="ro-grid ${data.saved ? '' : 'unsaved'}" style="margin-top:10px"></div>`;
        mountReadonlyGrid(calBox.querySelector('.ro-grid'), activePhase, cells);
      }
    };

    if (S.adminSearchTarget) await renderDossier();
  }

  // ---------- Team-Logo Auswahl & Upload Modal (Admin) ----------
  async function openTeamLogoModal(team, allTeams, onUpdated) {
    let { logos } = await api('/admin/logos');
    const existing = document.getElementById('logo-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop notif-backdrop show';
    backdrop.id = 'logo-modal-backdrop';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        backdrop.remove();
      }
    };
    document.addEventListener('keydown', onKey);
    const close = () => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
    };

    const assignLogo = async (logoUrl) => {
      try {
        await api(`/teams/${team.id}`, { method: 'PUT', body: { logo: logoUrl } });
        team.logo = logoUrl;
        toast(logoUrl ? `Logo für „${team.name}“ gespeichert!` : `Logo von „${team.name}“ entfernt.`);
        close();
        if (onUpdated) await onUpdated();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    const renderPicker = () => {
      const usedByOther = new Map();
      allTeams.forEach((t) => {
        if (t.id !== team.id && t.logo) usedByOther.set(t.logo, t.name);
      });

      backdrop.innerHTML = `
        <div class="modal notif-modal logo-picker-modal metal" role="dialog" aria-modal="true">
          <header class="nc-head">
            <div class="nc-head-title">
              ${teamLogoHTML(team.logo, team.name, 'lg')}
              <div>
                <h3>Team-Logo: ${esc(team.name)}</h3>
                <p class="muted">Wähle ein Logo aus dem Ordner „Team Logos“ oder lade eine neue Bilddatei hoch</p>
              </div>
            </div>
            <div class="nc-head-actions">
              ${team.logo ? `<button type="button" class="btn btn-danger btn-sm" id="lp-remove-btn">🗑 Logo entfernen</button>` : ''}
              <button type="button" class="btn btn-steel btn-sm" id="lp-close-btn">✕ Schließen</button>
            </div>
          </header>
          <div class="nc-body">
            <div class="lp-upload-bar">
              <div>
                <b>📤 Eigenes Logo vom PC hochladen</b>
                <small class="muted">Wird im Ordner „Team Logos“ gespeichert und direkt diesem Team zugeordnet (.webp, .png, .jpg, .svg)</small>
              </div>
              <label class="btn btn-primary btn-sm lp-upload-label">
                <span>📁 Bilddatei auswählen …</span>
                <input type="file" id="lp-file-input" accept=".webp,.png,.jpg,.jpeg,.svg,.gif,.avif" hidden>
              </label>
            </div>
            <div class="nc-section">
              <div class="nc-sec-title">Verfügbare Logos im Ordner „Team Logos“ (${logos.length})</div>
              ${logos.length ? `
                <div class="lp-grid">
                  ${logos.map((l) => {
                    const isCurrent = team.logo === l.url;
                    const otherTeam = usedByOther.get(l.url);
                    return `
                      <button type="button" class="lp-card ${isCurrent ? 'is-current' : ''}" data-logo-url="${esc(l.url)}">
                        <div class="lp-img-wrap">
                          <img src="${esc(l.url)}" alt="${esc(l.name)}" loading="lazy">
                        </div>
                        <span class="lp-name">${esc(l.name)}</span>
                        ${isCurrent
                          ? '<span class="badge ok sm">✓ Aktuell gewählt</span>'
                          : otherTeam
                            ? `<span class="badge open sm" title="Wird genutzt von ${esc(otherTeam)}">🔗 ${esc(otherTeam)}</span>`
                            : '<span class="badge vs sm">Auswählen</span>'}
                      </button>`;
                  }).join('')}
                </div>
              ` : '<div class="notice">Noch keine Dateien im Ordner „Team Logos“ gefunden.</div>'}
            </div>
          </div>
        </div>`;

      backdrop.querySelector('#lp-close-btn')?.addEventListener('click', close);
      backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
      backdrop.querySelector('#lp-remove-btn')?.addEventListener('click', () => assignLogo(null));
      backdrop.querySelectorAll('[data-logo-url]').forEach((btn) => {
        btn.addEventListener('click', () => assignLogo(btn.dataset.logoUrl));
      });

      const fileInput = backdrop.querySelector('#lp-file-input');
      fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const res = await api('/admin/logos/upload', {
              method: 'POST',
              body: { filename: file.name, dataUrl: String(reader.result || ''), team_id: team.id },
            });
            logos = res.logos || logos;
            team.logo = res.url;
            toast(`Logo „${res.filename}“ hochgeladen und „${team.name}“ zugeordnet!`);
            close();
            if (onUpdated) await onUpdated();
          } catch (err) {
            toast(err.message, 'error');
          }
        };
        reader.readAsDataURL(file);
      });
    };

    renderPicker();
    document.body.appendChild(backdrop);
  }

  // ---------- Tab 1: Ligen, Teams & Spieler ----------
  async function adminTeams(body) {
    const [teams, players] = await Promise.all([api('/teams'), api('/players')]);
    const unassigned = players.filter((p) => p.team_id == null);
    const realTeams = teams.filter((t) => !t.is_dummy);
    const dummyTeams = teams.filter((t) => t.is_dummy);
    const full = realTeams.filter((t) => t.players.length === 2).length;
    const withLogo = realTeams.filter((t) => Boolean(t.logo)).length;

    const teamOptions = (p) => `<option value="">— ohne Team —</option>${realTeams.map((t) => {
      const isFull = t.players.length >= 2 && t.id !== p.team_id;
      const lg = getLeague(t.league_id);
      return `<option value="${t.id}" ${t.id === p.team_id ? 'selected' : ''} ${isFull ? 'disabled' : ''}>[${esc(lg?.short || '')}] ${esc(t.name)}${isFull ? ' (voll)' : ''}</option>`;
    }).join('')}`;

    const playerRow = (p) => `
      <li class="player-row" data-player="${p.id}" data-name="${esc(p.name)}">
        <span class="pname">${esc(p.name)}</span>
        <select data-act="move" title="Einem anderen Team zuweisen" aria-label="Team von ${esc(p.name)}">${teamOptions(p)}</select>
        <button class="icon-btn" data-act="rename-player" title="Umbenennen">✎</button>
        <button class="icon-btn danger" data-act="delete-player" title="Löschen">🗑</button>
      </li>`;

    const visibleLeagues = S.adminLeague === 'all'
      ? LEAGUES
      : LEAGUES.filter((l) => l.id === S.adminLeague);

    const renderTeamCard = (t) => `
      <article class="team-card metal ${t.is_dummy ? 'is-dummy-card' : t.players.length === 2 ? 'full' : ''}" data-team="${t.id}" data-name="${esc(t.name)}">
        <header>
          ${!t.is_dummy ? `
            <button type="button" class="team-logo-trigger" data-act="logo-team" title="Team-Logo auswählen oder hochladen">
              ${teamLogoHTML(t.logo, t.name, 'md')}
              <span class="tlt-badge">🖼</span>
            </button>` : teamLogoHTML(null, t.name, 'md')}
          <h3 title="${esc(t.name)}">${esc(t.name)}</h3>
          ${t.is_dummy
            ? '<span class="badge ok">🎟️ Freispiel</span>'
            : `<span class="badge ${t.players.length === 2 ? 'ok' : 'warn'}">${t.players.length}/2</span>`}
          <div class="actions">
            ${!t.is_dummy ? `<button class="icon-btn" data-act="logo-team" title="Team-Logo zuordnen / ändern">🖼</button>` : ''}
            <button class="icon-btn" data-act="rename-team" title="Team umbenennen">✎</button>
            <button class="icon-btn danger" data-act="delete-team" title="Team löschen">🗑</button>
          </div>
        </header>
        ${t.is_dummy ? `
          <div class="dummy-team-note">
            🎟️ <b>Dummy-Team (Freispiel)</b> – füllt den 6. Startplatz der Liga auf, damit der 6er-Spielplan aufgeht. Gegner haben in dieser Woche spielfrei.
          </div>
        ` : `
          <ul class="player-list">
            ${t.players.map(playerRow).join('')}
            ${Array.from({ length: Math.max(0, 2 - t.players.length) }, (_, i) => `<li class="slot-empty">Freier Platz ${t.players.length + i + 1} (2vs2)</li>`).join('')}
          </ul>
          ${t.players.length < 2 ? `
            <form class="inline-form add-player" data-form="add-player" data-team="${t.id}">
              <input name="name" placeholder="Spielername" maxlength="60" required autocomplete="off">
              ${unassigned.length ? `<select name="existing"><option value="">oder vorhandenen wählen…</option>${unassigned.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>` : ''}
              <button class="btn btn-sm btn-primary">+ Hinzufügen</button>
            </form>` : ''}
        `}
      </article>`;

    const root = el(`
      <div>
        <div class="card metal admin-toolbar">
          <form class="inline-form" data-form="new-team">
            <select name="league_id" aria-label="Liga wählen">
              ${LEAGUES.map((l) => `<option value="${l.id}" ${S.adminLeague === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}
            </select>
            <input name="name" placeholder="Neuer Teamname" maxlength="60" required autocomplete="off">
            <label class="inline-chk"><input type="checkbox" name="is_dummy"> 🎟️ Dummy (Freispiel)</label>
            <button class="btn btn-primary">+ Team erstellen</button>
          </form>
          <div class="mini-stats">
            <span><b>${LEAGUES.length}</b> Ligen</span>
            <span><b>${realTeams.length}</b> echte Teams</span>
            <span><b>${dummyTeams.length}</b> Dummy-Teams</span>
            <span><b>${players.length}</b> Spieler</span>
            <span><b>${full}</b>/${realTeams.length} 2er-Teams voll</span>
            <span><b>${withLogo}</b>/${realTeams.length} mit Logo</span>
            <span class="season-start-pill">📅 Saison-Start: <b>${formatDay(T.getSeasonStart()).full}</b></span>
            <button type="button" class="btn btn-sm btn-steel" id="season-start-btn" title="Startdatum für Woche 1 festlegen">📅 Startdatum ändern</button>
            <button class="btn btn-sm btn-blue" id="auto-logos-btn">🖼 Logos auto-zuordnen</button>
            <button class="btn btn-sm btn-ghost" id="seed-demo-btn">🔄 44 Test-Teams & 8 Ligen zurücksetzen</button>
          </div>
        </div>

        <div class="card metal" style="margin-bottom:16px">
          <div class="phase-chips">
            <button type="button" class="chip ${S.adminLeague === 'all' ? 'active' : ''}" data-lg-filter="all">
              🏅 Alle 8 Ligen (${realTeams.length} echte + ${dummyTeams.length} Dummy)
            </button>
            ${LEAGUES.map((l) => {
              const lTeams = teams.filter((t) => t.league_id === l.id);
              const lReal = lTeams.filter((t) => !t.is_dummy).length;
              const lDummy = lTeams.filter((t) => t.is_dummy).length;
              return `
                <button type="button" class="chip ${S.adminLeague === l.id ? 'active' : ''}" data-lg-filter="${l.id}">
                  <span>${esc(l.name)}</span>
                  <span class="count">${lReal}${lDummy ? `+${lDummy}D` : ''}/6</span>
                </button>`;
            }).join('')}
          </div>
        </div>

        ${visibleLeagues.map((l) => {
          const lTeams = teams.filter((t) => t.league_id === l.id);
          const lReal = lTeams.filter((t) => !t.is_dummy).length;
          const lDummy = lTeams.filter((t) => t.is_dummy).length;
          return `
            <section class="league-admin-section" style="margin-bottom:24px">
              <div class="sec-bar" style="margin-bottom:10px">
                <div>
                  <h3>🏅 ${esc(l.name)} <small class="muted">(${lReal} echte Teams${lDummy ? ` + ${lDummy} Dummy-Team` : ''} = ${lTeams.length}/6 Startplätze)</small></h3>
                </div>
              </div>
              <div class="team-grid">${lTeams.map(renderTeamCard).join('') || '<div class="notice">Noch keine Teams in dieser Liga.</div>'}</div>
            </section>`;
        }).join('')}

        ${unassigned.length ? `
          <section class="card metal unassigned">
            <h3>Spieler ohne Team <span class="badge warn">${unassigned.length}</span></h3>
            <ul class="player-list">${unassigned.map(playerRow).join('')}</ul>
          </section>` : ''}
      </div>`);
    body.replaceChildren(root);
    const refresh = () => adminTeams(body);
    const fail = (err) => toast(err.message, 'error');

    root.querySelectorAll('[data-lg-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        S.adminLeague = btn.dataset.lgFilter;
        refresh();
      });
    });

    root.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        if (f.dataset.form === 'new-team') {
          await api('/teams', {
            method: 'POST',
            body: {
              name: f.elements.namedItem('name').value,
              league_id: f.elements.namedItem('league_id').value,
              is_dummy: f.elements.namedItem('is_dummy').checked,
            },
          });
          toast('Team erstellt');
        } else if (f.dataset.form === 'add-player') {
          const existing = f.existing?.value;
          if (existing) await api(`/players/${existing}`, { method: 'PUT', body: { team_id: Number(f.dataset.team) } });
          else await api('/players', { method: 'POST', body: { name: f.elements.namedItem('name').value, team_id: Number(f.dataset.team) } });
          toast('Spieler hinzugefügt');
        }
        await refresh();
      } catch (err) { fail(err); }
    });

    root.addEventListener('change', async (e) => {
      const sel = e.target;
      if (sel.name === 'existing') {
        const input = sel.form.elements.namedItem('name');
        input.required = !sel.value;
        input.disabled = !!sel.value;
        return;
      }
      if (sel.dataset.act !== 'move') return;
      const pid = sel.closest('[data-player]').dataset.player;
      try {
        await api(`/players/${pid}`, { method: 'PUT', body: { team_id: sel.value ? Number(sel.value) : null } });
        toast('Spieler verschoben');
      } catch (err) { fail(err); }
      await refresh();
    });

    root.querySelector('#season-start-btn')?.addEventListener('click', () => {
      openSeasonStartModal(refresh);
    });

    root.querySelector('#auto-logos-btn')?.addEventListener('click', async () => {
      try {
        const res = await api('/admin/logos/auto-assign', { method: 'POST', body: { overwrite: false } });
        toast(res.updated > 0 ? `${res.updated} Team-Logos automatisch nach Namen zugeordnet!` : `Alle passenden Team-Logos sind bereits zugeordnet.`);
        await refresh();
      } catch (err) { fail(err); }
    });

    root.querySelector('#seed-demo-btn')?.addEventListener('click', async () => {
      const ok = await confirmModal(
        '2vs2 Liga-Testdaten neu laden?',
        'Möchtest du alle 8 Ligen mit 44 echten Teams (88 Spieler), 4 Dummy-Teams und allen 240 Saison-Paarungen frisch zurücksetzen?',
        'Ja, Testdaten neu laden'
      );
      if (!ok) return;
      try {
        await api('/admin/seed-demo', { method: 'POST', body: { force: true } });
        toast('2vs2 Liga-Testdaten wurden frisch geladen!');
        await refresh();
      } catch (err) { fail(err); }
    });

    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn || btn.tagName === 'SELECT') return;
      const teamEl = btn.closest('[data-team]');
      const playerEl = btn.closest('[data-player]');
      const act = btn.dataset.act;
      try {
        if (act === 'logo-team') {
          const tObj = teams.find((x) => String(x.id) === teamEl.dataset.team);
          if (tObj) await openTeamLogoModal(tObj, teams, refresh);
        } else if (act === 'rename-team') {
          const ok = await promptModal('Team umbenennen', 'Teamname', teamEl.dataset.name, (name) => api(`/teams/${teamEl.dataset.team}`, { method: 'PUT', body: { name } }));
          if (ok) { toast('Team umbenannt'); await refresh(); }
        } else if (act === 'delete-team') {
          const ok = await confirmModal('Team löschen?', `<b>${esc(teamEl.dataset.name)}</b> wird gelöscht.`);
          if (ok) { await api(`/teams/${teamEl.dataset.team}`, { method: 'DELETE' }); toast('Team gelöscht'); await refresh(); }
        } else if (act === 'rename-player') {
          const ok = await promptModal('Spieler umbenennen', 'Spielername', playerEl.dataset.name, (name) => api(`/players/${playerEl.dataset.player}`, { method: 'PUT', body: { name } }));
          if (ok) { toast('Spieler umbenannt'); await refresh(); }
        } else if (act === 'delete-player') {
          const ok = await confirmModal('Spieler löschen?', `<b>${esc(playerEl.dataset.name)}</b> und alle gespeicherten Zeiten werden gelöscht.`);
          if (ok) { await api(`/players/${playerEl.dataset.player}`, { method: 'DELETE' }); toast('Spieler gelöscht'); await refresh(); }
        }
      } catch (err) { fail(err); }
    });
  }

  // ---------- Tab 2: Spielplan & Paarungen ----------
  async function adminMatchups(body) {
    const [teams, matchups] = await Promise.all([api('/teams'), api('/matchups')]);
    const activeLeague = getLeague(S.adminMatchupLeague) || LEAGUES[0];
    const phase = getPhase(S.adminPhase) || PHASES[0];
    const leagueTeams = teams.filter((t) => t.league_id === activeLeague.id);
    const list = matchups.filter((m) => m.phase_id === phase.id && m.league_id === activeLeague.id);
    const used = new Set(list.flatMap((m) => [m.team_a_id, m.team_b_id]));
    const free = leagueTeams.filter((t) => !used.has(t.id));
    const opts = (sel) => leagueTeams.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)} ${t.is_dummy ? '(Dummy)' : `(${t.players.length}/2)`}</option>`).join('');

    const viewRow = (m) => {
      const propSlots = Array.isArray(m.proposed_slots) ? m.proposed_slots : [];
      const schedBadge = m.is_bye
        ? `<span class="badge ok">🎟️ Freispiel</span>`
        : m.confirmed_slot
          ? `<span class="badge ok">🏆 Fest: ${slotLabel(m.confirmed_slot, true)}</span>`
          : propSlots.length
            ? `<span class="badge warn">📩 ${propSlots.length} Vorschl. offen</span>`
            : `<span class="badge open">⏳ Termin offen</span>`;
      return `
        <li class="mu-row" data-id="${m.id}">
          <div class="mu-teams">
            <span class="mu-team">${teamLogoHTML(m.team_a_logo, m.team_a_name, 'sm')}<span>${esc(m.team_a_name)}</span></span>
            <span class="vs-sm">vs.</span>
            <span class="mu-team">${teamLogoHTML(m.team_b_logo, m.team_b_name, 'sm')}<span>${esc(m.team_b_name)}</span></span>
            ${schedBadge}
          </div>
          <div class="actions">
            ${!m.is_bye && (m.confirmed_slot || propSlots.length) ? `<button class="btn btn-sm btn-ghost" data-act="reset-sched">🔓 Freigeben</button>` : ''}
            ${!m.is_bye ? `<a class="btn btn-sm btn-blue" href="#/admin/match/${m.id}">📊 4-Spieler-Abgleich</a>` : ''}
            <button class="icon-btn" data-act="edit" title="Bearbeiten">✎</button>
            <button class="icon-btn danger" data-act="delete" title="Löschen">🗑</button>
          </div>
        </li>`;
    };

    const curStart = T.getSeasonStart();
    const curFmt = formatDay(curStart);
    const lastPhase = PHASES[PHASES.length - 1];
    const endFmt = formatDay(lastPhase.end);

    const root = el(`
      <div>
        <div class="card metal season-start-card">
          <div class="ssc-head">
            <div class="ssc-info">
              <span class="ssc-icon">📅</span>
              <div>
                <h3 class="card-title" style="margin:0 0 3px 0">Saison-Startdatum festlegen</h3>
                <p class="muted small" style="margin:0">
                  Woche 1 startet am <b>${curFmt.weekdayLong}, ${curFmt.full}</b> · Saisonende (W11) am <b>${endFmt.weekdayLong}, ${endFmt.full}</b>
                </p>
              </div>
            </div>
            <form class="inline-form ssc-form" id="season-start-form">
              <label class="ssc-label" for="ssc-date-input">Startdatum (Woche 1, Mo):</label>
              <input type="date" id="ssc-date-input" name="season_start" value="${curStart}" required>
              <button type="submit" class="btn btn-sm btn-primary">💾 Startdatum speichern</button>
            </form>
          </div>
        </div>

        <div class="card metal">
          <h3 class="card-title">1. Liga wählen</h3>
          <div class="phase-chips">
            ${LEAGUES.map((l) => {
              const cnt = matchups.filter((m) => m.league_id === l.id).length;
              return `<button class="chip ${l.id === activeLeague.id ? 'active' : ''}" data-league="${l.id}">🏅 ${esc(l.name)} <span class="count">${cnt}</span></button>`;
            }).join('')}
          </div>
        </div>
        <div class="card metal">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <h3 class="card-title" style="margin:0">2. Saisonwoche wählen (${esc(activeLeague.name)})</h3>
            <button type="button" class="btn btn-sm btn-steel" id="regen-league-btn">🔄 10-Wochen-Spielplan für ${esc(activeLeague.short)} neu generieren</button>
          </div>
          <div class="phase-chips">${PHASES.map((p) => {
            const c = matchups.filter((m) => m.phase_id === p.id && m.league_id === activeLeague.id).length;
            return `<button class="chip c-${p.color} ${p.id === phase.id ? 'active' : ''}" data-phase="${p.id}"><i class="dot"></i>W${p.week} · ${esc(p.name)}${c ? `<span class="count">${c}</span>` : ''}</button>`;
          }).join('')}</div>
        </div>
        <section class="card metal phase-card c-${phase.color}">
          <header class="phase-card-head">
            <i class="pv-dot"></i>
            <div>
              <h3>${esc(activeLeague.name)} · Woche ${phase.week}: ${esc(phase.name)} (${esc(phase.subtitle)})</h3>
              <p class="muted">${formatRange(phase)}</p>
            </div>
          </header>
          ${leagueTeams.length < 2 ? '<div class="notice">Es werden mindestens 2 Teams in dieser Liga benötigt.</div>' : `
          <form class="matchup-form" data-form="add">
            <select name="a" aria-label="Team A">${opts(free[0]?.id ?? leagueTeams[0].id)}</select>
            <span class="vs-badge sm">VS</span>
            <select name="b" aria-label="Team B">${opts(free[1]?.id ?? leagueTeams[1].id)}</select>
            <button class="btn btn-primary">+ Paarung hinzufügen</button>
          </form>`}
          <ul class="mu-list">${list.map(viewRow).join('') || `<li class="empty-row">${phase.isPause ? 'Saisonpause (1 Woche Pause & Nachholfenster) – keine regulären Pflichtspiele.' : 'Noch keine Paarungen in dieser Woche.'}</li>`}</ul>
        </section>
      </div>`);
    body.replaceChildren(root);
    const refresh = () => adminMatchups(body);

    root.querySelector('#season-start-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = e.target.elements.namedItem('season_start')?.value;
      if (!val) return toast('Bitte ein gültiges Datum wählen.', 'error');
      try {
        const res = await api('/admin/settings', {
          method: 'POST',
          body: { season_start: val },
        });
        T.setSeasonStart(res.season_start);
        S.selectedWeek = null;
        const newFmt = formatDay(res.season_start);
        toast(`✓ Saison-Start auf ${newFmt.weekdayLong}, den ${newFmt.full} festgelegt!`);
        await refresh();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    root.querySelectorAll('[data-league]').forEach((b) => b.addEventListener('click', () => { S.adminMatchupLeague = b.dataset.league; refresh(); }));
    root.querySelectorAll('[data-phase]').forEach((b) => b.addEventListener('click', () => { S.adminPhase = b.dataset.phase; refresh(); }));
    root.querySelector('#regen-league-btn')?.addEventListener('click', async () => {
      const ok = await confirmModal(
        `Spielplan für ${activeLeague.name} neu generieren?`,
        `Alle 30 Paarungen (Hinrunde W1–W5 & Rückrunde W7–W11) für <b>${esc(activeLeague.name)}</b> werden neu berechnet.`,
        'Ja, neu generieren'
      );
      if (!ok) return;
      try {
        await api('/admin/generate-league-schedule', { method: 'POST', body: { league_id: activeLeague.id } });
        toast(`Spielplan für ${activeLeague.name} wurde erstellt!`);
        await refresh();
      } catch (err) { toast(err.message, 'error'); }
    });

    root.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        if (f.dataset.form === 'add') {
          await api('/matchups', { method: 'POST', body: { phase_id: phase.id, team_a_id: Number(f.a.value), team_b_id: Number(f.b.value) } });
          toast('Paarung angelegt');
        } else if (f.dataset.form === 'edit') {
          await api(`/matchups/${f.dataset.id}`, { method: 'PUT', body: { team_a_id: Number(f.a.value), team_b_id: Number(f.b.value) } });
          toast('Paarung aktualisiert');
        }
        await refresh();
      } catch (err) { toast(err.message, 'error'); }
    });

    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const row = btn.closest('[data-id]');
      const m = list.find((x) => String(x.id) === row?.dataset.id);
      if (btn.dataset.act === 'edit' && m) {
        row.replaceChildren(el(`
          <form class="matchup-form editing" data-form="edit" data-id="${m.id}">
            <select name="a">${opts(m.team_a_id)}</select><span class="vs-sm">vs.</span><select name="b">${opts(m.team_b_id)}</select>
            <button class="btn btn-sm btn-primary">Speichern</button><button type="button" class="btn btn-sm btn-ghost" data-act="cancel">Abbrechen</button>
          </form>`));
      } else if (btn.dataset.act === 'cancel') {
        refresh();
      } else if (btn.dataset.act === 'reset-sched' && m) {
        const ok = await confirmModal('Termin-Einigung zurücksetzen?', `Der feste Termin bzw. Vorschlag für <b>${esc(m.team_a_name)} vs. ${esc(m.team_b_name)}</b> wird aufgehoben.`, 'Zurücksetzen');
        if (!ok) return;
        try { await api(`/matchups/${m.id}/schedule`, { method: 'PUT', body: { action: 'reset' } }); toast('Termin freigegeben'); await refresh(); } catch (err) { toast(err.message, 'error'); }
      } else if (btn.dataset.act === 'delete' && m) {
        const ok = await confirmModal('Paarung löschen?', `<b>${esc(m.team_a_name)}</b> vs. <b>${esc(m.team_b_name)}</b> wird gelöscht.`);
        if (!ok) return;
        try { await api(`/matchups/${m.id}`, { method: 'DELETE' }); toast('Paarung gelöscht'); await refresh(); } catch (err) { toast(err.message, 'error'); }
      }
    });
  }

  // ---------- Tab 3: Einsicht ----------
  async function adminInsight(body) {
    const [teams, players, matchups, status] = await Promise.all([api('/teams'), api('/players'), api('/matchups'), api('/admin/save-status')]);
    const activeLeague = getLeague(S.insightLeague) || LEAGUES[0];
    const saved = new Set(status.map((s) => `${s.player_id}|${s.phase_id}`));
    const lgTeams = teams.filter((t) => t.league_id === activeLeague.id && !t.is_dummy);
    const lgMatchups = matchups.filter((m) => m.league_id === activeLeague.id);
    const groups = lgTeams.map((t) => ({ label: t.name, logo: t.logo, players: t.players }));

    const root = el(`
      <div>
        <div class="card metal" style="margin-bottom:16px">
          <h3 class="card-title">Liga für Einsicht wählen</h3>
          <div class="phase-chips">
            ${LEAGUES.map((l) => `<button type="button" class="chip ${l.id === activeLeague.id ? 'active' : ''}" data-ins-lg="${l.id}">🏅 ${esc(l.name)}</button>`).join('')}
          </div>
        </div>

        <section class="card metal">
          <h3 class="card-title">⚔ Paarungs-Abgleich & Vereinbarte Spieltermine (${esc(activeLeague.name)})</h3>
          <p class="muted">Klicke auf eine Paarung, um den 4-Spieler-Abgleich zu öffnen oder den festen Termin als Admin zu verwalten.</p>
          ${lgMatchups.length ? PHASES.filter((p) => lgMatchups.some((m) => m.phase_id === p.id)).map((p) => `
            <div class="mu-group c-${p.color}">
              <h4><i class="dot"></i>Woche ${p.week} · ${esc(p.name)} (${esc(p.subtitle)}) <span class="muted small">${formatRange(p)}</span></h4>
              <div class="mu-buttons">${lgMatchups.filter((m) => m.phase_id === p.id).map((m) => {
                if (m.is_bye) {
                  return `<span class="mu-btn is-bye-btn">${teamLogoHTML(m.team_a_logo, m.team_a_name, 'xs')}<span>${esc(m.team_a_name)}</span> <span>vs</span> <span>${esc(m.team_b_name)}</span> <small class="mu-sched-tag ok">🎟️ Freispiel</small></span>`;
                }
                const propLen = Array.isArray(m.proposed_slots) ? m.proposed_slots.length : 0;
                const badge = m.confirmed_slot
                  ? `<small class="mu-sched-tag ok">🏆 ${slotLabel(m.confirmed_slot, true)}</small>`
                  : propLen
                    ? `<small class="mu-sched-tag warn">📩 ${propLen} Vorschl.</small>`
                    : '';
                return `<a class="mu-btn" href="#/admin/match/${m.id}">${teamLogoHTML(m.team_a_logo, m.team_a_name, 'xs')}<span>${esc(m.team_a_name)}</span> <span>vs</span> ${teamLogoHTML(m.team_b_logo, m.team_b_name, 'xs')}<span>${esc(m.team_b_name)}</span>${badge}</a>`;
              }).join('')}</div>
            </div>`).join('') : '<div class="notice">Noch keine Paarungen in dieser Liga.</div>'}
        </section>

        <section class="card metal">
          <h3 class="card-title">✓ Eintragungs-Status (${esc(activeLeague.name)})</h3>
          <p class="muted">Welche Spieler haben für welche Saisonwoche bereits Zeiten gespeichert?</p>
          <div class="grid-scroll">
            <table class="status-matrix">
              <thead><tr><th>Spieler</th>${PHASES.map((p) => `<th class="c-${p.color}" title="Woche ${p.week}: ${esc(p.name)} · ${formatRange(p)}"><i class="dot"></i>W${p.week}</th>`).join('')}<th>Σ</th></tr></thead>
              <tbody>${groups.map((g) => `
                <tr class="grp"><td colspan="${PHASES.length + 2}"><span class="grp-team-cell">${g.logo ? teamLogoHTML(g.logo, g.label, 'xs') : ''}<span>${esc(g.label)}</span></span></td></tr>
                ${g.players.map((p) => {
                  const n = PHASES.filter((ph) => saved.has(`${p.id}|${ph.id}`)).length;
                  return `<tr><td class="pn">${esc(p.name)}</td>${PHASES.map((ph) => saved.has(`${p.id}|${ph.id}`)
                    ? `<td><span class="mx ok">✓</span></td>`
                    : `<td><span class="mx">·</span></td>`).join('')}<td class="sum">${n}/${PHASES.length}</td></tr>`;
                }).join('')}`).join('')}
              </tbody>
            </table>
          </div>
        </section>
      </div>`);
    body.replaceChildren(root);

    root.querySelectorAll('[data-ins-lg]').forEach((btn) => {
      btn.addEventListener('click', () => {
        S.insightLeague = btn.dataset.insLg;
        adminInsight(body);
      });
    });
  }

  async function adminMatch(body, matchupId) {
    const matchups = await api('/matchups');
    const m = matchups.find((x) => String(x.id) === String(matchupId));
    if (!m) { toast('Paarung nicht gefunden', 'error'); return go('#/admin/insight'); }
    const phase = getPhase(m.phase_id);
    const siblings = matchups.filter((x) => x.phase_id === m.phase_id && x.league_id === m.league_id && !x.is_bye);
    body.innerHTML = `
      <div class="phase-view embedded c-${phase.color}">
        <div class="pv-head metal">
          <a class="btn btn-ghost btn-sm" href="#/admin/insight">← Zurück</a>
          <div class="pv-title"><img src="/logo.png?v=2vs2" alt="2vs2" class="pv-crest"><span class="pv-dot"></span><div><h1>Woche ${phase.week} · ${esc(phase.name)} (${esc(getLeague(m.league_id)?.name || '')})</h1><p>${formatRange(phase)} · 4-Spieler-Abgleich</p></div></div>
        </div>
        <div class="pv-content" id="am-body"></div>
      </div>`;
    const chooser = siblings.length > 1
      ? `<div class="mu-chooser">${siblings.map((x) => `<a href="#/admin/match/${x.id}" class="chip ${x.id === m.id ? 'active' : ''}">${teamLogoHTML(x.team_a_logo, x.team_a_name, 'xs')}<span>${esc(x.team_a_name)} vs. ${esc(x.team_b_name)}</span>${teamLogoHTML(x.team_b_logo, x.team_b_name, 'xs')} ${x.confirmed_slot ? '🏆' : ''}</a>`).join('')}</div>`
      : '';
    await mountMatchView(body.querySelector('#am-body'), phase, m.id, { prefix: chooser, isAdmin: true });
  }

  // ---------- Start ----------
  route();
})();
