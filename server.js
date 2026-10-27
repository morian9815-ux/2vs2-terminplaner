'use strict';
try { process.loadEnvFile(); } catch { /* keine .env vorhanden */ }

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initDb } = require('./db');
const {
  DEFAULT_SEASON_START,
  LEAGUES,
  PHASES,
  HOURS,
  STATUSES,
  addDays,
  setSeasonStart,
  getSeasonStart,
  getPhase,
  getLeague,
  phaseDates,
  phaseForDate,
  generateLeagueSchedule,
} = require('./public/phases.js');
const { seedDemoData } = require('./scripts/seed-demo.js');
const {
  LOGOS_DIR,
  ALLOWED_EXT,
  logoUrlFromFilename,
  listAvailableLogos,
  matchLogoForTeamName,
  autoAssignTeamLogos,
} = require('./scripts/team-logos.js');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';
const SECRET = process.env.SESSION_SECRET
  || crypto.createHash('sha256').update('2vs2-terminfinder:' + ADMIN_PASSWORD).digest('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_PLAYERS_PER_TEAM = 2;

let db;
let dbReadyPromise = null;

async function ensureDb() {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      const database = await initDb();
      db = database;
      try {
        const sRow = await db.get("SELECT value FROM settings WHERE key = 'season_start'");
        if (sRow?.value) {
          setSeasonStart(sRow.value);
        } else {
          await db.run("INSERT INTO settings (key, value) VALUES ('season_start', ?)", [DEFAULT_SEASON_START]);
        }
      } catch (err) {
        console.error('Hinweis beim Laden der Settings:', err.message);
      }
      return db;
    })();
  }
  await dbReadyPromise;

  if (process.env.AUTO_SEED !== 'false') {
    try {
      const teamCheck = await db.get('SELECT COUNT(*) AS cnt FROM teams');
      const teamCount = Number(teamCheck?.cnt || 0);
      if (teamCount < 44) {
        console.log(`Datenbank hat nur ${teamCount} Teams. Starte automatischen Seed...`);
        await seedDemoData(db, { force: true });
        await autoAssignTeamLogos(db);
      }
    } catch (err) {
      console.error('Hinweis beim Demo-Seed / Logo-Abgleich:', err.message);
    }
  }

  return db;
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));
app.use('/api', async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});
app.use('/team-logos', express.static(LOGOS_DIR, { maxAge: 0 }));
app.get('/team-logos/:file', (req, res) => {
  const requested = String(req.params.file || '').normalize('NFC').toLowerCase();
  const logos = listAvailableLogos();
  const hit = logos.find((l) => l.filename.normalize('NFC').toLowerCase() === requested);
  if (hit) return res.sendFile(path.join(LOGOS_DIR, hit.filename));
  res.status(404).end();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

// ---------- Helfer ----------
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (msg) => new HttpError(400, msg);
const notFound = (msg) => new HttpError(404, msg);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function toId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw bad('Ungültige ID.');
  return n;
}
function cleanName(value, label) {
  const s = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!s) throw bad(`${label} darf nicht leer sein.`);
  if (s.length > 60) throw bad(`${label} ist zu lang (max. 60 Zeichen).`);
  return s;
}

const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
function signToken() {
  const exp = String(Date.now() + TOKEN_TTL_MS);
  return `${exp}.${hmac(exp)}`;
}
function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = hmac(exp);
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!verifyToken(token)) return res.status(401).json({ error: 'Admin-Anmeldung erforderlich bzw. abgelaufen.' });
  next();
}

const MATCHUP_SELECT = `
  SELECT m.id, m.phase_id, m.team_a_id, m.team_b_id,
         ta.name AS team_a_name, ta.logo AS team_a_logo, ta.league_id AS team_a_league_id, ta.is_dummy AS team_a_is_dummy,
         tb.name AS team_b_name, tb.logo AS team_b_logo, tb.league_id AS team_b_league_id, tb.is_dummy AS team_b_is_dummy,
         m.proposed_slots, m.proposed_by_team_id, m.proposed_by_player_name,
         m.confirmed_slot, m.confirmed_by_player_name,
         coalesce(m.is_completed, 0) AS is_completed
  FROM matchups m
  JOIN teams ta ON ta.id = m.team_a_id
  JOIN teams tb ON tb.id = m.team_b_id`;

function formatMatchup(m) {
  if (!m) return null;
  let proposed_slots = [];
  if (m.proposed_slots) {
    try { proposed_slots = JSON.parse(m.proposed_slots); } catch { proposed_slots = []; }
  }
  const aDummy = Boolean(m.team_a_is_dummy);
  const bDummy = Boolean(m.team_b_is_dummy);
  return {
    ...m,
    league_id: m.team_a_league_id || m.team_b_league_id || 'liga-1',
    team_a_is_dummy: aDummy,
    team_b_is_dummy: bDummy,
    is_bye: aDummy || bDummy,
    is_completed: Boolean(m.is_completed),
    proposed_slots: Array.isArray(proposed_slots) ? proposed_slots : [],
  };
}

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function formatSlotLabel(slotKey) {
  if (!slotKey || !String(slotKey).includes('|')) return String(slotKey || '');
  const [d, hStr] = String(slotKey).split('|');
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  const wd = WEEKDAYS_SHORT[dt.getUTCDay()] || '';
  const hh = String(Number(hStr)).padStart(2, '0');
  const ph = phaseForDate(d);
  const wkSuffix = ph ? ` (W${ph.week})` : '';
  return `${wd}, ${String(day).padStart(2, '0')}.${String(m).padStart(2, '0')}.${wkSuffix} · ${hh}:00 Uhr`;
}

function formatSlotsList(slots) {
  return (slots || []).map(formatSlotLabel).join(' / ');
}

async function createNotifications(runner, recipientIds, { kind, title, body, phase_id = null, matchup_id = null, created_at = null }) {
  const uniqueIds = [...new Set((recipientIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueIds.length) return;
  const ts = created_at || new Date().toISOString();
  for (const pid of uniqueIds) {
    await runner.run(
      `INSERT INTO notifications (player_id, kind, title, body, phase_id, matchup_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [pid, kind, title, body, phase_id, matchup_id, ts]
    );
  }
}

async function loadPlayerNotifications(pid) {
  try {
    const rows = await db.all(
      `SELECT id, player_id, kind, title, body, phase_id, matchup_id, is_read, created_at
       FROM notifications
       WHERE player_id = ?
       ORDER BY is_read ASC, id DESC
       LIMIT 60`,
      [pid]
    );
    const notifications = rows.map((r) => ({ ...r, is_read: Boolean(r.is_read) }));
    const unreadCount = notifications.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);
    return { notifications, unreadCount };
  } catch (err) {
    console.warn('Hinweis beim Laden der Benachrichtigungen:', err.message);
    return { notifications: [], unreadCount: 0 };
  }
}

async function loadMatchupContext(mid) {
  const raw = await db.get(`${MATCHUP_SELECT} WHERE m.id = ?`, [mid]);
  if (!raw) throw notFound('Paarung nicht gefunden.');
  const m = formatMatchup(raw);
  const phase = getPhase(m.phase_id);
  const players = await db.all(
    'SELECT id, name, team_id FROM players WHERE team_id IN (?, ?) ORDER BY id',
    [m.team_a_id, m.team_b_id]
  );
  const ids = players.map((p) => p.id);

  // Alle gespeicherten Zeiten der beteiligten Spieler über die GESAMTE Saison laden
  // (damit Spiele bei Urlaub/Krankheit flexibel vorgezogen oder nachgespielt werden können)
  const avail = ids.length
    ? await db.all(
      `SELECT player_id, phase_id, date, hour, status
       FROM availabilities
       WHERE player_id IN (${ids.map(() => '?').join(', ')})`,
      ids
    )
    : [];

  const availability = {};
  const savedPhasesByPlayer = {};
  for (const p of players) {
    availability[p.id] = {};
    savedPhasesByPlayer[p.id] = new Set();
  }
  for (const a of avail) {
    availability[a.player_id][`${a.date}|${a.hour}`] = a.status;
    savedPhasesByPlayer[a.player_id].add(a.phase_id);
  }

  const teamAPlayers = players.filter((p) => p.team_id === m.team_a_id);
  const teamBPlayers = players.filter((p) => p.team_id === m.team_b_id);
  const hasBothTeams = (m.team_a_is_dummy || teamAPlayers.length > 0) && (m.team_b_is_dummy || teamBPlayers.length > 0);

  // Für jede Saisonwoche prüfen, welche Spieler bereits Zeiten gespeichert haben
  const savedByPhase = {};
  for (const ph of PHASES) {
    const savedPlayerIds = players.filter((p) => savedPhasesByPlayer[p.id]?.has(ph.id)).map((p) => p.id);
    savedByPhase[ph.id] = {
      savedPlayerIds,
      allSaved: hasBothTeams && players.length > 0 && savedPlayerIds.length === players.length,
    };
  }

  const regularAllSaved = Boolean(phase && savedByPhase[phase.id]?.allSaved);
  const anyPhaseAllSaved = Object.values(savedByPhase).some((x) => x.allSaved);

  const checkSlot = (slotKey) => {
    if (typeof slotKey !== 'string' || !slotKey.includes('|')) return 'invalid';
    const [d, hStr] = slotKey.split('|');
    const h = Number(hStr);
    const slotPhase = phaseForDate(d);
    if (!slotPhase || !HOURS.includes(h)) return 'invalid';
    if (!savedByPhase[slotPhase.id]?.allSaved) return 'missing_times';
    let r = 0, y = 0;
    for (const p of players) {
      const s = availability[p.id]?.[slotKey] || 'red';
      if (s === 'red') r++;
      else if (s === 'yellow') y++;
    }
    return r > 0 ? 'no' : y > 0 ? 'maybe' : 'perfect';
  };

  // Nur eigene feste Spiele der beiden beteiligten Teams prüfen (Stream-Radar ist entfernt)
  const rawOthers = await db.all(
    `${MATCHUP_SELECT}
     WHERE m.id <> ?
       AND m.confirmed_slot IS NOT NULL
       AND (m.team_a_id IN (?, ?) OR m.team_b_id IN (?, ?))
     ORDER BY m.confirmed_slot, m.id`,
    [mid, m.team_a_id, m.team_b_id, m.team_a_id, m.team_b_id]
  );
  const otherConfirmed = rawOthers.map(formatMatchup).map((x) => ({
    id: x.id,
    phase_id: x.phase_id,
    team_a_id: x.team_a_id,
    team_b_id: x.team_b_id,
    team_a_name: x.team_a_name,
    team_a_logo: x.team_a_logo || null,
    team_b_name: x.team_b_name,
    team_b_logo: x.team_b_logo || null,
    confirmed_slot: x.confirmed_slot,
    is_own_team: true,
  }));

  const ownTeamConflict = (slotKey) => {
    if (typeof slotKey !== 'string' || !slotKey.includes('|')) return null;
    const [d, hStr] = slotKey.split('|');
    const h = Number(hStr);
    for (const oc of otherConfirmed) {
      if (!oc.confirmed_slot) continue;
      const [od, ohStr] = oc.confirmed_slot.split('|');
      const oh = Number(ohStr);
      if (od === d && h === oh) return oc;
    }
    return null;
  };

  return {
    matchup: m,
    phase,
    players,
    teamA: {
      id: m.team_a_id,
      name: m.team_a_name,
      logo: m.team_a_logo || null,
      league_id: m.team_a_league_id,
      is_dummy: m.team_a_is_dummy,
      players: teamAPlayers,
    },
    teamB: {
      id: m.team_b_id,
      name: m.team_b_name,
      logo: m.team_b_logo || null,
      league_id: m.team_b_league_id,
      is_dummy: m.team_b_is_dummy,
      players: teamBPlayers,
    },
    availability,
    savedByPhase,
    allSaved: regularAllSaved,
    anyPhaseAllSaved,
    checkSlot,
    otherConfirmed,
    ownTeamConflict,
  };
}

async function loadTeams() {
  const teams = await db.all('SELECT id, name, logo, league_id, is_dummy FROM teams ORDER BY league_id, is_dummy ASC, LOWER(name), id');
  const players = await db.all('SELECT id, name, team_id FROM players ORDER BY id');
  return teams.map((t) => ({
    ...t,
    logo: t.logo || null,
    league_id: t.league_id || 'liga-1',
    is_dummy: Boolean(t.is_dummy),
    players: players.filter((p) => p.team_id === t.id),
  }));
}

async function ensureUniqueTeamName(name, exceptId = 0) {
  const row = await db.get('SELECT id FROM teams WHERE LOWER(name) = LOWER(?) AND id <> ?', [name, exceptId]);
  if (row) throw bad('Ein Team mit diesem Namen existiert bereits.');
}
async function ensureUniquePlayerName(name, exceptId = 0) {
  const row = await db.get('SELECT id FROM players WHERE LOWER(name) = LOWER(?) AND id <> ?', [name, exceptId]);
  if (row) throw bad('Ein Spieler mit diesem Namen existiert bereits (Namen müssen für den Login eindeutig sein).');
}
async function ensureTeamCapacity(teamId, exceptPlayerId = 0) {
  if (teamId == null) return;
  const team = await db.get('SELECT id, is_dummy FROM teams WHERE id = ?', [teamId]);
  if (!team) throw bad('Team existiert nicht.');
  if (team.is_dummy) throw bad('Einem Dummy-Team (Freispiel) können keine Spieler zugewiesen werden.');
  const rows = await db.all('SELECT id FROM players WHERE team_id = ? AND id <> ?', [teamId, exceptPlayerId]);
  if (rows.length >= MAX_PLAYERS_PER_TEAM) throw bad(`Dieses Team hat bereits ${MAX_PLAYERS_PER_TEAM} Spieler (2vs2).`);
}
function parseTeamId(value) {
  if (value === null || value === undefined || value === '') return null;
  return toId(value);
}

// ---------- Öffentliche API ----------
app.get('/api/health', wrap(async (req, res) => {
  await db.get('SELECT 1 AS ok');
  const tRow = await db.get('SELECT COUNT(*) AS cnt FROM teams');
  const mRow = await db.get('SELECT COUNT(*) AS cnt FROM matchups');
  res.json({
    ok: true,
    db: db.kind,
    teams: Number(tRow?.cnt || 0),
    matchups: Number(mRow?.cnt || 0)
  });
}));

app.get('/api/settings', wrap(async (req, res) => {
  const row = await db.get("SELECT value FROM settings WHERE key = 'season_start'");
  const currentStart = row?.value || getSeasonStart();
  res.json({
    season_start: currentStart,
    default_season_start: DEFAULT_SEASON_START,
  });
}));

app.get('/api/players', wrap(async (req, res) => {
  res.json(await db.all(`
    SELECT p.id, p.name, p.team_id, t.name AS team_name, t.logo AS team_logo, t.league_id AS league_id
    FROM players p LEFT JOIN teams t ON t.id = p.team_id
    ORDER BY LOWER(p.name), p.id`));
}));

app.get('/api/teams', wrap(async (req, res) => {
  res.json(await loadTeams());
}));

app.get('/api/matchups', wrap(async (req, res) => {
  const phase = typeof req.query.phase === 'string' ? req.query.phase : null;
  const league = typeof req.query.league === 'string' ? req.query.league : null;
  let sql = MATCHUP_SELECT;
  const params = [];
  const conds = [];
  if (phase) {
    conds.push('m.phase_id = ?');
    params.push(phase);
  }
  if (league) {
    conds.push('(ta.league_id = ? OR tb.league_id = ?)');
    params.push(league, league);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY m.id';
  const rows = await db.all(sql, params);
  res.json(rows.map(formatMatchup));
}));

app.get('/api/players/:id', wrap(async (req, res) => {
  const pid = toId(req.params.id);
  const player = await db.get(`
    SELECT p.id, p.name, p.team_id, t.name AS team_name, t.logo AS team_logo, t.league_id AS league_id
    FROM players p LEFT JOIN teams t ON t.id = p.team_id WHERE p.id = ?`, [pid]);
  if (!player) throw notFound('Spieler nicht gefunden.');
  const teammates = player.team_id
    ? await db.all('SELECT id, name FROM players WHERE team_id = ? AND id <> ? ORDER BY id', [player.team_id, pid])
    : [];
  const rawMatchups = player.team_id
    ? await db.all(`${MATCHUP_SELECT} WHERE m.team_a_id = ? OR m.team_b_id = ? ORDER BY m.id`, [player.team_id, player.team_id])
    : [];
  const saved = await db.all('SELECT DISTINCT phase_id FROM availabilities WHERE player_id = ?', [pid]);
  const { notifications, unreadCount } = await loadPlayerNotifications(pid);
  res.json({
    player,
    teammates,
    matchups: rawMatchups.map(formatMatchup),
    savedPhases: saved.map((r) => r.phase_id),
    notifications,
    unreadCount,
  });
}));

app.get('/api/players/:id/notifications', wrap(async (req, res) => {
  const pid = toId(req.params.id);
  res.json(await loadPlayerNotifications(pid));
}));

app.post('/api/players/:id/notifications/read-all', wrap(async (req, res) => {
  const pid = toId(req.params.id);
  await db.run('UPDATE notifications SET is_read = 1 WHERE player_id = ? AND is_read = 0', [pid]);
  res.json(await loadPlayerNotifications(pid));
}));

app.post('/api/players/:id/notifications/:notifId/read', wrap(async (req, res) => {
  const pid = toId(req.params.id);
  const nid = toId(req.params.notifId);
  await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND player_id = ?', [nid, pid]);
  res.json(await loadPlayerNotifications(pid));
}));

app.get('/api/players/:id/availability/:phaseId', wrap(async (req, res) => {
  const pid = toId(req.params.id);
  const phase = getPhase(req.params.phaseId);
  if (!phase) throw notFound('Unbekannte Saisonwoche.');
  const cells = await db.all(
    'SELECT date, hour, status FROM availabilities WHERE player_id = ? AND phase_id = ? ORDER BY date, hour',
    [pid, phase.id]);
  res.json({ saved: cells.length > 0, cells });
}));

app.put('/api/players/:id/availability/:phaseId', wrap(async (req, res) => {
  const pid = toId(req.params.id);
  const phase = getPhase(req.params.phaseId);
  if (!phase) throw notFound('Unbekannte Saisonwoche.');
  const player = await db.get('SELECT id, name, team_id FROM players WHERE id = ?', [pid]);
  if (!player) throw notFound('Spieler nicht gefunden.');
  const input = Array.isArray(req.body?.cells) ? req.body.cells : null;
  if (!input) throw bad('Keine Kalenderdaten übermittelt.');

  const prevRow = await db.get('SELECT 1 AS ok FROM availabilities WHERE player_id = ? AND phase_id = ? LIMIT 1', [pid, phase.id]);
  const hadSavedBefore = Boolean(prevRow);

  const dates = phaseDates(phase);
  const dateSet = new Set(dates);
  const map = new Map();
  for (const c of input) {
    const hour = Number(c?.hour);
    if (!dateSet.has(c?.date) || !HOURS.includes(hour) || !STATUSES.includes(c?.status)) {
      throw bad('Ungültiger Eintrag im Kalender.');
    }
    map.set(`${c.date}|${hour}`, c.status);
  }
  const rows = [];
  for (const d of dates) for (const h of HOURS) rows.push([pid, phase.id, d, h, map.get(`${d}|${h}`) || 'red']);

  await db.tx(async (q) => {
    await q.run('DELETE FROM availabilities WHERE player_id = ? AND phase_id = ?', [pid, phase.id]);
    const placeholders = rows.map(() => '(?, ?, ?, ?, ?)').join(', ');
    await q.run(`INSERT INTO availabilities (player_id, phase_id, date, hour, status) VALUES ${placeholders}`, rows.flat());
  });

  if (player.team_id) {
    const teammates = await db.all('SELECT id FROM players WHERE team_id = ? AND id <> ?', [player.team_id, pid]);
    const tmIds = teammates.map((t) => t.id);
    const phaseMatchups = await db.all(
      `${MATCHUP_SELECT} WHERE m.phase_id = ? AND (m.team_a_id = ? OR m.team_b_id = ?) ORDER BY m.id`,
      [phase.id, player.team_id, player.team_id]
    );
    const firstMatchupId = phaseMatchups[0]?.id || null;

    if (tmIds.length) {
      await createNotifications(db, tmIds, {
        kind: 'teammate_availability',
        title: `Mitspieler ${player.name} hat Zeiten ${hadSavedBefore ? 'aktualisiert' : 'eingetragen'}`,
        body: `Dein Mitspieler ${player.name} hat seine Verfügbarkeiten für „Woche ${phase.week} (${phase.name})“ gespeichert.`,
        phase_id: phase.id,
        matchup_id: firstMatchupId,
      });
    }

    if (!hadSavedBefore && phaseMatchups.length) {
      for (const rawM of phaseMatchups) {
        const m = formatMatchup(rawM);
        if (m.is_bye) continue;
        const ctx = await loadMatchupContext(m.id);
        if (ctx.allSaved && !ctx.matchup.confirmed_slot) {
          const otherThreeIds = ctx.players.filter((p) => p.id !== pid).map((p) => p.id);
          await createNotifications(db, otherThreeIds, {
            kind: 'all_4_ready',
            title: `Alle 4 Spieler bereit: ${m.team_a_name} vs. ${m.team_b_name}`,
            body: `Alle 4 Spieler haben ihre Zeiten für „Woche ${phase.week} (${phase.name})“ eingetragen! Ihr könnt euch ab sofort im Match-Abgleich auf einen Spieltermin einigen.`,
            phase_id: phase.id,
            matchup_id: m.id,
          });
        }
      }
    }
  }

  const counts = { green: 0, yellow: 0, red: 0 };
  rows.forEach((r) => counts[r[4]]++);
  res.json({ ok: true, saved: true, counts });
}));

app.get('/api/matchups/:id/overlap', wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const ctx = await loadMatchupContext(mid);
  res.json({
    matchup: ctx.matchup,
    teamA: ctx.teamA,
    teamB: ctx.teamB,
    availability: ctx.availability,
    savedByPhase: ctx.savedByPhase,
    otherConfirmed: ctx.otherConfirmed,
  });
}));

// ---------- Termin-Einigung (1–3 Vorschläge + Team-Handshake, inkl. Vorziehen / Nachspielen) ----------
app.post('/api/matchups/:id/propose', wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const pid = toId(req.body?.player_id);
  const rawSlots = Array.isArray(req.body?.slots) ? req.body.slots : [];
  const slots = [...new Set(rawSlots.map(String))];

  const ctx = await loadMatchupContext(mid);
  const { matchup: m } = ctx;

  if (m.is_bye) {
    throw bad('Dies ist ein Freispiel gegen ein Dummy-Team – es muss kein Spieltermin vereinbart werden.');
  }
  if (m.confirmed_slot) {
    throw bad('Der Spieltermin steht bereits verbindlich fest und kann nur noch vom Admin geändert werden.');
  }
  const player = ctx.players.find((p) => p.id === pid);
  if (!player) {
    throw new HttpError(403, 'Du gehörst keinem der beiden Teams dieser Paarung an.');
  }
  if (slots.length < 1 || slots.length > 3) {
    throw bad('Bitte wähle zwischen 1 und 3 Terminen für deinen Vorschlag aus.');
  }
  for (const s of slots) {
    if (typeof s !== 'string' || !s.includes('|')) {
      throw bad('Ungültiges Terminslot-Format.');
    }
    const [d, hStr] = s.split('|');
    const h = Number(hStr);
    const slotPhase = phaseForDate(d);
    if (!slotPhase || !HOURS.includes(h)) {
      throw bad(`Ungültiger Spieltermin (${s}).`);
    }
    const ownBusy = ctx.ownTeamConflict(s);
    if (ownBusy) {
      const busyTeam = (ownBusy.team_a_id === m.team_a_id || ownBusy.team_b_id === m.team_a_id) ? m.team_a_name : m.team_b_name;
      throw bad(`Nicht möglich: ${busyTeam} hat zu dieser Zeit (1h Spielzeit) bereits ein eigenes festes Spiel (${ownBusy.team_a_name} vs. ${ownBusy.team_b_name}).`);
    }
  }

  const wasCounterProposal = Boolean(m.proposed_slots.length && m.proposed_by_team_id && m.proposed_by_team_id !== player.team_id);
  const myTeamName = player.team_id === m.team_a_id ? m.team_a_name : m.team_b_name;
  const oppTeamName = player.team_id === m.team_a_id ? m.team_b_name : m.team_a_name;
  const phaseName = ctx.phase ? `Woche ${ctx.phase.week} (${ctx.phase.name})` : m.phase_id;
  const slotsText = formatSlotsList(slots);

  await db.run(
    'UPDATE matchups SET proposed_slots = ?, proposed_by_team_id = ?, proposed_by_player_name = ? WHERE id = ?',
    [JSON.stringify(slots), player.team_id, player.name, mid]
  );

  const oppIds = ctx.players.filter((p) => p.team_id !== player.team_id).map((p) => p.id);
  const mateIds = ctx.players.filter((p) => p.team_id === player.team_id && p.id !== pid).map((p) => p.id);

  if (wasCounterProposal) {
    await createNotifications(db, oppIds, {
      kind: 'counter_proposal',
      title: `Gegenvorschlag von ${myTeamName}`,
      body: `${player.name} (${myTeamName}) hat für euer Match (${phaseName}) ${slots.length === 1 ? 'einen neuen Termin' : `${slots.length} neue Termine`} vorgeschlagen: ${slotsText}. Bitte bestätigen oder Gegenvorschlag senden!`,
      phase_id: m.phase_id,
      matchup_id: mid,
    });
    await createNotifications(db, mateIds, {
      kind: 'teammate_proposed',
      title: `Gegenvorschlag an ${oppTeamName} gesendet`,
      body: `Dein Mitspieler ${player.name} hat ${oppTeamName} einen Gegenvorschlag (${slotsText}) für „${phaseName}“ geschickt.`,
      phase_id: m.phase_id,
      matchup_id: mid,
    });
  } else {
    await createNotifications(db, oppIds, {
      kind: 'proposal_received',
      title: `Terminvorschlag von ${myTeamName}`,
      body: `${player.name} (${myTeamName}) hat euch ${slots.length === 1 ? '1 Terminvorschlag' : `${slots.length} Terminvorschläge`} für „${phaseName}“ geschickt: ${slotsText}. Bitte wählt einen Termin aus oder sendet einen Gegenvorschlag!`,
      phase_id: m.phase_id,
      matchup_id: mid,
    });
    await createNotifications(db, mateIds, {
      kind: 'teammate_proposed',
      title: `Mitspieler ${player.name} hat Termine vorgeschlagen`,
      body: `Dein Mitspieler ${player.name} hat ${oppTeamName} folgende Termine für „${phaseName}“ vorgeschlagen: ${slotsText}.`,
      phase_id: m.phase_id,
      matchup_id: mid,
    });
  }

  res.json(formatMatchup(await db.get(`${MATCHUP_SELECT} WHERE m.id = ?`, [mid])));
}));



app.post('/api/matchups/:id/confirm', wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const pid = toId(req.body?.player_id);
  const slot = String(req.body?.slot || '');

  const ctx = await loadMatchupContext(mid);
  const { matchup: m } = ctx;

  if (m.confirmed_slot) {
    throw bad('Der Spieltermin steht bereits verbindlich fest.');
  }
  const player = ctx.players.find((p) => p.id === pid);
  if (!player) {
    throw new HttpError(403, 'Du gehörst keinem der beiden Teams dieser Paarung an.');
  }
  if (!m.proposed_slots.length || !m.proposed_by_team_id) {
    throw bad('Es liegt aktuell kein Terminvorschlag vor.');
  }
  if (player.team_id === m.proposed_by_team_id) {
    throw bad('Das gegnerische Team muss den Terminvorschlag bestätigen.');
  }
  if (!m.proposed_slots.includes(slot)) {
    throw bad('Dieser Termin gehört nicht zu den vorgeschlagenen Terminen.');
  }
  const ownBusy = ctx.ownTeamConflict(slot);
  if (ownBusy) {
    const busyTeam = (ownBusy.team_a_id === m.team_a_id || ownBusy.team_b_id === m.team_a_id) ? m.team_a_name : m.team_b_name;
    throw bad(`Nicht möglich: ${busyTeam} hat zu dieser Zeit (1h Spielzeit) bereits ein eigenes festes Spiel (${ownBusy.team_a_name} vs. ${ownBusy.team_b_name}).`);
  }

  await db.run(
    'UPDATE matchups SET confirmed_slot = ?, confirmed_by_player_name = ? WHERE id = ?',
    [slot, player.name, mid]
  );

  const otherThreeIds = ctx.players.filter((p) => p.id !== pid).map((p) => p.id);
  const myTeamName = player.team_id === m.team_a_id ? m.team_a_name : m.team_b_name;
  const phaseName = ctx.phase ? `Woche ${ctx.phase.week} (${ctx.phase.name})` : m.phase_id;
  const slotFormatted = formatSlotLabel(slot);

  await createNotifications(db, otherThreeIds, {
    kind: 'match_confirmed',
    title: `Fester Spieltermin bestätigt: ${m.team_a_name} vs. ${m.team_b_name}`,
    body: `${player.name} (${myTeamName}) hat den Terminvorschlag angenommen! Euer Match (${phaseName}) findet verbindlich am ${slotFormatted} statt.`,
    phase_id: m.phase_id,
    matchup_id: mid,
  });

  res.json(formatMatchup(await db.get(`${MATCHUP_SELECT} WHERE m.id = ?`, [mid])));
}));



// Match als bereits gespielt / erledigt markieren (z. B. auf Discord/extern verabredet)
app.post('/api/matchups/:id/complete', wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const pid = toId(req.body?.player_id);
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const isAdmin = verifyToken(token);

  const ctx = await loadMatchupContext(mid);
  const player = ctx.players.find((p) => p.id === pid);
  if (!isAdmin && !player) {
    throw new HttpError(403, 'Du gehörst keinem der beiden Teams dieser Paarung an.');
  }

  const actorName = isAdmin ? 'Admin' : (player?.name || 'Spieler');
  await db.run(
    'UPDATE matchups SET is_completed = 1, confirmed_by_player_name = coalesce(confirmed_by_player_name, ?) WHERE id = ?',
    [actorName, mid]
  );
  res.json({ ok: true, is_completed: true, message: 'Spiel wurde als erledigt markiert.' });
}));

// Erledigt-Status wieder aufheben (Spiel wieder öffnen)
app.post('/api/matchups/:id/uncomplete', wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const pid = toId(req.body?.player_id);
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const isAdmin = verifyToken(token);

  const ctx = await loadMatchupContext(mid);
  const player = ctx.players.find((p) => p.id === pid);
  if (!isAdmin && !player) {
    throw new HttpError(403, 'Du gehörst keinem der beiden Teams dieser Paarung an.');
  }

  await db.run('UPDATE matchups SET is_completed = 0 WHERE id = ?', [mid]);
  res.json({ ok: true, is_completed: false, message: 'Spiel wurde wieder als offen markiert.' });
}));

// ---------- Admin-API ----------
app.post('/api/admin/login', wrap(async (req, res) => {
  if (!safeEqual(req.body?.password ?? '', ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 400));
    throw new HttpError(401, 'Falsches Passwort.');
  }
  res.json({ token: signToken() });
}));

app.get('/api/admin/verify', requireAdmin, (req, res) => res.json({ ok: true }));

app.get('/api/admin/save-status', requireAdmin, wrap(async (req, res) => {
  res.json(await db.all('SELECT DISTINCT player_id, phase_id FROM availabilities'));
}));

// Teams & Logos
app.get('/api/admin/logos', requireAdmin, wrap(async (req, res) => {
  res.json({ logos: listAvailableLogos() });
}));

app.post('/api/admin/logos/auto-assign', requireAdmin, wrap(async (req, res) => {
  const overwrite = Boolean(req.body?.overwrite);
  const result = await autoAssignTeamLogos(db, { overwrite });
  res.json(result);
}));

app.post('/api/admin/logos/upload', requireAdmin, wrap(async (req, res) => {
  const rawName = String(req.body?.filename || '').trim();
  const dataUrl = String(req.body?.dataUrl || '');
  const teamId = req.body?.team_id ? toId(req.body.team_id) : null;
  if (!rawName || !dataUrl) throw bad('Dateiname und Bilddaten erforderlich.');

  const ext = path.extname(rawName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw bad('Ungültiges Bildformat. Erlaubt sind: .webp, .png, .jpg, .jpeg, .svg, .gif, .avif');
  }
  const base = path.basename(rawName, ext).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'team-logo';
  const safeFilename = `${base}${ext}`;
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match) throw bad('Ungültige Bilddaten (Data-URL erwartet).');
  const buf = Buffer.from(match[1], 'base64');
  if (!buf.length || buf.length > 5 * 1024 * 1024) {
    throw bad('Bilddatei ist leer oder größer als 5 MB.');
  }

  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOGOS_DIR, safeFilename), buf);
  const url = logoUrlFromFilename(safeFilename);

  if (teamId) {
    await db.run('UPDATE teams SET logo = ? WHERE id = ?', [url, teamId]);
  }
  res.json({ ok: true, filename: safeFilename, url, logos: listAvailableLogos() });
}));

app.post('/api/teams', requireAdmin, wrap(async (req, res) => {
  const name = cleanName(req.body?.name, 'Teamname');
  await ensureUniqueTeamName(name);
  const leagueId = getLeague(req.body?.league_id)?.id || LEAGUES[0].id;
  const isDummy = req.body?.is_dummy ? 1 : 0;
  const rawLogo = req.body?.logo ? String(req.body.logo).trim() : null;
  const logo = isDummy ? null : (rawLogo || matchLogoForTeamName(name));
  const row = await db.get(
    'INSERT INTO teams (name, logo, league_id, is_dummy) VALUES (?, ?, ?, ?) RETURNING id, name, logo, league_id, is_dummy',
    [name, logo, leagueId, isDummy]
  );
  res.status(201).json({ ...row, is_dummy: Boolean(row.is_dummy) });
}));

app.put('/api/teams/:id', requireAdmin, wrap(async (req, res) => {
  const tid = toId(req.params.id);
  const existing = await db.get('SELECT id, name, logo, league_id, is_dummy FROM teams WHERE id = ?', [tid]);
  if (!existing) throw notFound('Team nicht gefunden.');
  const body = req.body || {};
  const name = body.name !== undefined ? cleanName(body.name, 'Teamname') : existing.name;
  if (name !== existing.name) await ensureUniqueTeamName(name, tid);
  const leagueId = body.league_id !== undefined ? (getLeague(body.league_id)?.id || existing.league_id) : existing.league_id;
  const isDummy = body.is_dummy !== undefined ? (body.is_dummy ? 1 : 0) : existing.is_dummy;
  let logo = existing.logo || null;
  if (Object.prototype.hasOwnProperty.call(body, 'logo')) {
    logo = body.logo ? String(body.logo).trim() : null;
  } else if (!logo && name !== existing.name && !isDummy) {
    logo = matchLogoForTeamName(name);
  }
  await db.run('UPDATE teams SET name = ?, logo = ?, league_id = ?, is_dummy = ? WHERE id = ?', [name, logo, leagueId, isDummy, tid]);
  res.json({ id: tid, name, logo, league_id: leagueId, is_dummy: Boolean(isDummy) });
}));

app.delete('/api/teams/:id', requireAdmin, wrap(async (req, res) => {
  const tid = toId(req.params.id);
  const r = await db.tx(async (q) => {
    await q.run('DELETE FROM matchups WHERE team_a_id = ? OR team_b_id = ?', [tid, tid]);
    await q.run('UPDATE players SET team_id = NULL WHERE team_id = ?', [tid]);
    return q.run('DELETE FROM teams WHERE id = ?', [tid]);
  });
  if (!r.changes) throw notFound('Team nicht gefunden.');
  res.json({ ok: true });
}));

// Spieler
app.post('/api/players', requireAdmin, wrap(async (req, res) => {
  const name = cleanName(req.body?.name, 'Spielername');
  const teamId = parseTeamId(req.body?.team_id);
  await ensureUniquePlayerName(name);
  await ensureTeamCapacity(teamId);
  const row = await db.get('INSERT INTO players (name, team_id) VALUES (?, ?) RETURNING id, name, team_id', [name, teamId]);
  res.status(201).json(row);
}));

app.put('/api/players/:id', requireAdmin, wrap(async (req, res) => {
  const pid = toId(req.params.id);
  const existing = await db.get('SELECT id, name, team_id FROM players WHERE id = ?', [pid]);
  if (!existing) throw notFound('Spieler nicht gefunden.');
  const body = req.body || {};
  const name = body.name !== undefined ? cleanName(body.name, 'Spielername') : existing.name;
  const teamId = Object.prototype.hasOwnProperty.call(body, 'team_id') ? parseTeamId(body.team_id) : existing.team_id;
  if (name !== existing.name) await ensureUniquePlayerName(name, pid);
  if (teamId !== existing.team_id) await ensureTeamCapacity(teamId, pid);
  await db.run('UPDATE players SET name = ?, team_id = ? WHERE id = ?', [name, teamId, pid]);
  res.json({ id: pid, name, team_id: teamId });
}));

app.delete('/api/players/:id', requireAdmin, wrap(async (req, res) => {
  const pid = toId(req.params.id);
  const r = await db.tx(async (q) => {
    await q.run('DELETE FROM availabilities WHERE player_id = ?', [pid]);
    return q.run('DELETE FROM players WHERE id = ?', [pid]);
  });
  if (!r.changes) throw notFound('Spieler nicht gefunden.');
  res.json({ ok: true });
}));

// Paarungen
async function validateMatchup(body, exceptId = 0) {
  const phase = getPhase(body?.phase_id);
  if (!phase) throw bad('Bitte eine gültige Saisonwoche wählen.');
  const a = toId(body?.team_a_id);
  const b = toId(body?.team_b_id);
  if (a === b) throw bad('Ein Team kann nicht gegen sich selbst spielen.');
  const teams = await db.all('SELECT id FROM teams WHERE id IN (?, ?)', [a, b]);
  if (teams.length !== 2) throw bad('Team nicht gefunden.');
  const dup = await db.get(
    `SELECT id FROM matchups WHERE phase_id = ? AND id <> ?
       AND ((team_a_id = ? AND team_b_id = ?) OR (team_a_id = ? AND team_b_id = ?))`,
    [phase.id, exceptId, a, b, b, a]);
  if (dup) throw bad('Diese Paarung existiert in dieser Woche bereits.');
  return { phaseId: phase.id, a, b };
}

app.post('/api/matchups', requireAdmin, wrap(async (req, res) => {
  const { phaseId, a, b } = await validateMatchup(req.body);
  const row = await db.get('INSERT INTO matchups (phase_id, team_a_id, team_b_id) VALUES (?, ?, ?) RETURNING id', [phaseId, a, b]);
  res.status(201).json(formatMatchup(await db.get(`${MATCHUP_SELECT} WHERE m.id = ?`, [row.id])));
}));

app.put('/api/matchups/:id', requireAdmin, wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const existing = await db.get('SELECT id, phase_id FROM matchups WHERE id = ?', [mid]);
  if (!existing) throw notFound('Paarung nicht gefunden.');
  const { phaseId, a, b } = await validateMatchup({ phase_id: existing.phase_id, ...req.body }, mid);
  await db.run(
    `UPDATE matchups
     SET phase_id = ?, team_a_id = ?, team_b_id = ?,
         proposed_slots = NULL, proposed_by_team_id = NULL, proposed_by_player_name = NULL,
         confirmed_slot = NULL, confirmed_by_player_name = NULL
     WHERE id = ?`,
    [phaseId, a, b, mid]
  );
  res.json(formatMatchup(await db.get(`${MATCHUP_SELECT} WHERE m.id = ?`, [mid])));
}));



app.put('/api/matchups/:id/schedule', requireAdmin, wrap(async (req, res) => {
  const mid = toId(req.params.id);
  const ctx = await loadMatchupContext(mid);
  const { matchup: m } = ctx;
  const phaseName = ctx.phase ? `Woche ${ctx.phase.week} (${ctx.phase.name})` : m.phase_id;
  const allPlayerIds = ctx.players.map((p) => p.id);
  const action = req.body?.action;
  if (action === 'reset') {
    await db.run(
      `UPDATE matchups
       SET proposed_slots = NULL, proposed_by_team_id = NULL, proposed_by_player_name = NULL,
           confirmed_slot = NULL, confirmed_by_player_name = NULL
       WHERE id = ?`,
      [mid]
    );
    await createNotifications(db, allPlayerIds, {
      kind: 'match_reset',
      title: `Termin zurückgesetzt: ${m.team_a_name} vs. ${m.team_b_name}`,
      body: `Der Termin bzw. Vorschlag für euer Match (${phaseName}) wurde vom Admin zurückgesetzt. Bitte stimmt euch im Match-Abgleich neu ab.`,
      phase_id: m.phase_id,
      matchup_id: mid,
    });
  } else if (action === 'set') {
    const slot = String(req.body?.slot || '');
    if (!slot.includes('|')) throw bad('Ungültiges Datum oder Uhrzeit.');
    const [d, hStr] = slot.split('|');
    if (!phaseForDate(d) || !HOURS.includes(Number(hStr))) {
      throw bad('Ungültiges Datum oder Uhrzeit (muss innerhalb der Saison liegen).');
    }
    await db.run(
      `UPDATE matchups
       SET confirmed_slot = ?, confirmed_by_player_name = 'Admin'
       WHERE id = ?`,
      [slot, mid]
    );
    await createNotifications(db, allPlayerIds, {
      kind: 'match_confirmed',
      title: `Fester Spieltermin festgelegt: ${m.team_a_name} vs. ${m.team_b_name}`,
      body: `Die Ligaleitung (Admin) hat euer Match (${phaseName}) verbindlich auf ${formatSlotLabel(slot)} festgelegt.`,
      phase_id: m.phase_id,
      matchup_id: mid,
    });
  } else {
    throw bad('Unbekannte Aktion.');
  }
  res.json(formatMatchup(await db.get(`${MATCHUP_SELECT} WHERE m.id = ?`, [mid])));
}));



app.delete('/api/matchups/:id', requireAdmin, wrap(async (req, res) => {
  const r = await db.run('DELETE FROM matchups WHERE id = ?', [toId(req.params.id)]);
  if (!r.changes) throw notFound('Paarung nicht gefunden.');
  res.json({ ok: true });
}));

app.post('/api/admin/generate-league-schedule', requireAdmin, wrap(async (req, res) => {
  const leagueId = getLeague(req.body?.league_id)?.id;
  if (!leagueId) throw bad('Ungültige Liga.');
  const lgTeams = await db.all('SELECT id FROM teams WHERE league_id = ? ORDER BY is_dummy ASC, id ASC', [leagueId]);
  if (lgTeams.length !== 6) {
    throw bad(`Für den Spielplan-Generator muss die Liga genau 6 Teams (inkl. ggf. Dummy-Team) haben (aktuell: ${lgTeams.length}).`);
  }
  const teamIds = lgTeams.map((t) => t.id);
  const schedule = generateLeagueSchedule(teamIds);
  await db.tx(async (tx) => {
    await tx.run(
      `DELETE FROM matchups WHERE team_a_id IN (${teamIds.map(() => '?').join(',')}) OR team_b_id IN (${teamIds.map(() => '?').join(',')})`,
      [...teamIds, ...teamIds]
    );
    for (const s of schedule) {
      await tx.run('INSERT INTO matchups (phase_id, team_a_id, team_b_id) VALUES (?, ?, ?)', [s.phase_id, s.team_a_id, s.team_b_id]);
    }
  });
  res.json({ ok: true, created: schedule.length });
}));

app.post('/api/admin/settings', requireAdmin, wrap(async (req, res) => {
  const rawDate = String(req.body?.season_start || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    throw bad('Ungültiges Datumsformat (YYYY-MM-DD erwartet).');
  }
  const oldStart = getSeasonStart();
  const newStart = setSeasonStart(rawDate);
  const diffDays = Math.round((new Date(newStart + 'T00:00:00Z') - new Date(oldStart + 'T00:00:00Z')) / 86400000);

  await db.tx(async (q) => {
    await q.run('DELETE FROM settings WHERE key = ?', ['season_start']);
    await q.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['season_start', newStart]);

    if (diffDays !== 0) {
      const avails = await q.all('SELECT id, date FROM availabilities');
      for (const a of avails) {
        const shifted = addDays(a.date, diffDays);
        await q.run('UPDATE availabilities SET date = ? WHERE id = ?', [shifted, a.id]);
      }
      const matchups = await q.all('SELECT id, proposed_slots, confirmed_slot FROM matchups');
      for (const m of matchups) {
        let changed = false;
        let newConf = m.confirmed_slot;
        let newProps = m.proposed_slots;
        if (m.confirmed_slot && m.confirmed_slot.includes('|')) {
          const [d, h] = m.confirmed_slot.split('|');
          newConf = `${addDays(d, diffDays)}|${h}`;
          changed = true;
        }
        if (m.proposed_slots) {
          try {
            const slots = JSON.parse(m.proposed_slots);
            if (Array.isArray(slots) && slots.length) {
              const shifted = slots.map((s) => {
                if (s && s.includes('|')) {
                  const [d, h] = s.split('|');
                  return `${addDays(d, diffDays)}|${h}`;
                }
                return s;
              });
              newProps = JSON.stringify(shifted);
              changed = true;
            }
          } catch { /* ignore */ }
        }
        if (changed) {
          await q.run('UPDATE matchups SET confirmed_slot = ?, proposed_slots = ? WHERE id = ?', [newConf, newProps, m.id]);
        }
      }
    }
  });

  res.json({
    ok: true,
    season_start: newStart,
    shiftedDays: diffDays,
  });
}));

app.post('/api/admin/seed-demo', requireAdmin, wrap(async (req, res) => {
  const result = await seedDemoData(db, { force: req.body?.force !== false });
  res.json(result);
}));

// ---------- Fallbacks & Fehler ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpunkt nicht gefunden.' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültige Anfrage (JSON).' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Interner Serverfehler. Bitte erneut versuchen.' : err.message });
});

if (require.main === module) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`2vs2 Liga-Terminplaner läuft auf http://localhost:${PORT}  (Datenbank: ${db.kind}${db.file ? ' → ' + db.file : ''})`);
        if (!process.env.ADMIN_PASSWORD) console.log('Hinweis: Standard-Admin-Passwort "admin2026" aktiv (über ADMIN_PASSWORD änderbar).');
      });
    })
    .catch((err) => {
      console.error('Datenbank konnte nicht initialisiert werden:', err);
      process.exit(1);
    });
}

module.exports = app;
