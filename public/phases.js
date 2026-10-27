/*
 * Saison- & Ligen-Konfiguration (wird von Server UND Browser genutzt).
 * 2vs2 Liga: 8 Ligen, 11 Wochen (5 Wochen Hinrunde, 1 Woche Pause, 5 Wochen Rückrunde),
 * Zeitraster (08:00 – 24:00).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TOURNAMENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LEAGUES = [
    { id: 'liga-1',   code: '1',   name: '1. Liga Diamant',    short: '1. Diamant',    color: 'diamond',  realTeams: 6, hasDummy: false },
    { id: 'liga-2',   code: '2',   name: '2. Liga Platin',     short: '2. Platin',     color: 'platinum', realTeams: 6, hasDummy: false },
    { id: 'liga-3',   code: '3',   name: '3. Liga Gold',       short: '3. Gold',       color: 'gold',     realTeams: 6, hasDummy: false },
    { id: 'liga-4',   code: '4',   name: '4. Liga Silber',     short: '4. Silber',     color: 'silver',   realTeams: 6, hasDummy: false },
    { id: 'liga-5-1', code: '5.1', name: '5.1 Liga Bronze I',  short: '5.1 Bronze I',  color: 'bronze',   realTeams: 5, hasDummy: true  },
    { id: 'liga-5-2', code: '5.2', name: '5.2 Liga Bronze II', short: '5.2 Bronze II', color: 'bronze',   realTeams: 5, hasDummy: true  },
    { id: 'liga-6-1', code: '6.1', name: '6.1 Eisen I',        short: '6.1 Eisen I',   color: 'iron',     realTeams: 5, hasDummy: true  },
    { id: 'liga-6-2', code: '6.2', name: '6.2 Eisen II',       short: '6.2 Eisen II',  color: 'iron',     realTeams: 5, hasDummy: true  },
  ];

  const DEFAULT_SEASON_START = '2026-09-21';

  function addDays(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // 11 Saisonwochen: 5 Wochen Hinrunde (W1–W5), 1 Woche Pause (W6), 5 Wochen Rückrunde (W7–W11)
  const PHASES = [
    { id: 'w1',  week: 1,  matchday: 1,  half: 'hinrunde',   isPause: false, name: 'Spieltag 1',  subtitle: 'Hinrunde',               short: 'W1 · ST 1',  start: '2026-11-09', end: '2026-11-15', color: 'green'  },
    { id: 'w2',  week: 2,  matchday: 2,  half: 'hinrunde',   isPause: false, name: 'Spieltag 2',  subtitle: 'Hinrunde',               short: 'W2 · ST 2',  start: '2026-11-16', end: '2026-11-22', color: 'green'  },
    { id: 'w3',  week: 3,  matchday: 3,  half: 'hinrunde',   isPause: false, name: 'Spieltag 3',  subtitle: 'Hinrunde',               short: 'W3 · ST 3',  start: '2026-11-23', end: '2026-11-29', color: 'green'  },
    { id: 'w4',  week: 4,  matchday: 4,  half: 'hinrunde',   isPause: false, name: 'Spieltag 4',  subtitle: 'Hinrunde',               short: 'W4 · ST 4',  start: '2026-11-30', end: '2026-12-06', color: 'green'  },
    { id: 'w5',  week: 5,  matchday: 5,  half: 'hinrunde',   isPause: false, name: 'Spieltag 5',  subtitle: 'Hinrunde',               short: 'W5 · ST 5',  start: '2026-12-07', end: '2026-12-13', color: 'green'  },
    { id: 'w6',  week: 6,  matchday: null, half: 'pause',    isPause: true,  name: 'Saisonpause', subtitle: 'Spielfrei & Nachholwoche', short: 'W6 · Pause', start: '2026-12-14', end: '2026-12-20', color: 'silver' },
    { id: 'w7',  week: 7,  matchday: 6,  half: 'rueckrunde', isPause: false, name: 'Spieltag 6',  subtitle: 'Rückrunde',              short: 'W7 · ST 6',  start: '2026-12-21', end: '2026-12-27', color: 'blue'   },
    { id: 'w8',  week: 8,  matchday: 7,  half: 'rueckrunde', isPause: false, name: 'Spieltag 7',  subtitle: 'Rückrunde',              short: 'W8 · ST 7',  start: '2026-12-28', end: '2027-01-03', color: 'blue'   },
    { id: 'w9',  week: 9,  matchday: 8,  half: 'rueckrunde', isPause: false, name: 'Spieltag 8',  subtitle: 'Rückrunde',              short: 'W9 · ST 8',  start: '2027-01-04', end: '2027-01-10', color: 'blue'   },
    { id: 'w10', week: 10, matchday: 9,  half: 'rueckrunde', isPause: false, name: 'Spieltag 9',  subtitle: 'Rückrunde',              short: 'W10 · ST 9', start: '2027-01-11', end: '2027-01-17', color: 'blue'   },
    { id: 'w11', week: 11, matchday: 10, half: 'rueckrunde', isPause: false, name: 'Spieltag 10', subtitle: 'Rückrunde',              short: 'W11 · ST 10',start: '2027-01-18', end: '2027-01-24', color: 'blue'   },
  ];

  const WEEKS = [];

  function setSeasonStart(startDate) {
    let clean = String(startDate || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      clean = DEFAULT_SEASON_START;
    }
    const dt = new Date(clean + 'T00:00:00Z');
    const day = dt.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    if (diffToMonday !== 0) {
      dt.setUTCDate(dt.getUTCDate() + diffToMonday);
      clean = dt.toISOString().slice(0, 10);
    }
    PHASES.forEach((p, idx) => {
      p.start = addDays(clean, idx * 7);
      p.end = addDays(clean, idx * 7 + 6);
    });
    WEEKS.length = 0;
    PHASES.forEach((p) => {
      WEEKS.push({
        week: p.week,
        phaseId: p.id,
        title: `Woche ${p.week}`,
        subtitle: p.isPause ? 'Saisonpause (1 Woche Pause)' : `${p.name} · ${p.subtitle}`,
        half: p.half,
        isPause: p.isPause,
      });
    });
    return clean;
  }

  function getSeasonStart() {
    return PHASES[0]?.start || DEFAULT_SEASON_START;
  }

  setSeasonStart(DEFAULT_SEASON_START);

  // Y-Achse: 08:00 – 24:00 (Stunde 8 = 08:00–09:00 … Stunde 23 = 23:00–24:00)
  const HOURS = Array.from({ length: 16 }, (_, i) => i + 8);

  const STATUSES = ['red', 'green', 'yellow'];
  const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const pad = (n) => String(n).padStart(2, '0');

  function phaseDates(phase) {
    if (!phase) return [];
    const out = [];
    const d = new Date(phase.start + 'T00:00:00Z');
    const end = new Date(phase.end + 'T00:00:00Z');
    while (d <= end) {
      out.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }

  function allSeasonDates() {
    const out = [];
    for (const p of PHASES) {
      for (const d of phaseDates(p)) out.push(d);
    }
    return out;
  }

  function phaseForDate(isoDate) {
    if (!isoDate) return null;
    const d = String(isoDate).slice(0, 10);
    return PHASES.find((p) => d >= p.start && d <= p.end) || null;
  }

  function getPhase(id) {
    return PHASES.find((p) => p.id === id) || null;
  }

  function getLeague(id) {
    return LEAGUES.find((l) => l.id === id) || null;
  }

  function formatDay(iso) {
    const d = new Date(iso + 'T00:00:00Z');
    return {
      weekday: WEEKDAYS[d.getUTCDay()],
      weekdayLong: WEEKDAYS_LONG[d.getUTCDay()],
      short: `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`,
      full: `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`,
    };
  }

  function hourLabel(h) {
    return `${pad(h)}:00 – ${pad(h + 1)}:00`;
  }

  function formatRange(phase) {
    const a = formatDay(phase.start);
    const b = formatDay(phase.end);
    if (phase.start === phase.end) return `${a.weekday}, ${a.full}`;
    return `${a.weekday}, ${a.short} – ${b.weekday}, ${b.full}`;
  }

  /**
   * Erzeugt den kompletten 10-Spieltage-Rundenspielplan (Hin- & Rückrunde) für 6 Teams einer Liga.
   * Hinrunde: w1..w5, Pause: w6, Rückrunde: w7..w11
   */
  function generateLeagueSchedule(teamIds) {
    if (!Array.isArray(teamIds) || teamIds.length !== 6) return [];
    // Offizielles 6er-Rundensystem der 2vs2 Liga
    const roundsHin = [
      [[0, 1], [2, 3], [4, 5]], // Spieltag 1 (w1)
      [[0, 3], [1, 5], [2, 4]], // Spieltag 2 (w2)
      [[0, 5], [3, 4], [1, 2]], // Spieltag 3 (w3)
      [[0, 4], [5, 2], [3, 1]], // Spieltag 4 (w4)
      [[0, 2], [4, 1], [5, 3]], // Spieltag 5 (w5)
    ];
    const hinPhases = ['w1', 'w2', 'w3', 'w4', 'w5'];
    const rueckPhases = ['w7', 'w8', 'w9', 'w10', 'w11'];

    const schedule = [];
    roundsHin.forEach((pairs, idx) => {
      const phaseId = hinPhases[idx];
      pairs.forEach(([a, b]) => {
        schedule.push({ phase_id: phaseId, team_a_id: teamIds[a], team_b_id: teamIds[b] });
      });
    });
    roundsHin.forEach((pairs, idx) => {
      const phaseId = rueckPhases[idx];
      pairs.forEach(([a, b]) => {
        schedule.push({ phase_id: phaseId, team_a_id: teamIds[b], team_b_id: teamIds[a] });
      });
    });
    return schedule;
  }

  return {
    DEFAULT_SEASON_START,
    LEAGUES,
    PHASES,
    WEEKS,
    HOURS,
    STATUSES,
    addDays,
    setSeasonStart,
    getSeasonStart,
    phaseDates,
    allSeasonDates,
    phaseForDate,
    getPhase,
    getLeague,
    formatDay,
    hourLabel,
    formatRange,
    generateLeagueSchedule,
  };
});
