'use strict';
/*
 * 2vs2 Liga – Offizieller Saison-Daten-Importer (5. Saison - Die Ära)
 * - 8 Ligen (1. Diamant bis 6.2 Eisen II)
 * - 44 echte Teams (mit Original-Team-IDs) + 4 Dummy-Teams (Freispiele in 5.1, 5.2, 6.1, 6.2)
 * - 88 Spieler (mit Original-Community-IDs)
 * - Alle 240 offiziellen Saison-Paarungen (Hinrunde W1–W5 & Rückrunde W7–W11) inklusive gespielter/vereinbarter Termine
 */
const { LEAGUE_TEAMS, LEAGUE_MATCHES } = require('./seed-teams.js');
const {
  DEFAULT_SEASON_START,
  setSeasonStart,
  generateLeagueSchedule,
} = require('../public/phases.js');
const { listAvailableLogos, matchLogoForTeamName, autoAssignTeamLogos } = require('./team-logos.js');

const EXPECTED_TOTAL_TEAMS = 48; // 44 echte + 4 Dummy-Teams
const EXPECTED_TOTAL_MATCHUPS = 240; // 8 Ligen * 10 Spieltage * 3 Paarungen

async function seedDemoData(db, { force = false } = {}) {
  const existingTeams = await db.all('SELECT id, name, league_id, is_dummy FROM teams');
  const existingMatchups = await db.all('SELECT id, phase_id FROM matchups');
  const hasNewPhases = existingMatchups.some((m) => m.phase_id === 'w1');
  const hasExactTeamIds = existingTeams.some((t) => t.id === 1 && t.name === 'Black Wings') &&
    existingTeams.some((t) => t.id === 17 && t.name === 'Ballgefühl');
  const hasExactMatchIds = existingMatchups.some((m) => m.id === 763);

  if (
    !force &&
    existingTeams.length === EXPECTED_TOTAL_TEAMS &&
    existingMatchups.length >= EXPECTED_TOTAL_MATCHUPS &&
    hasNewPhases &&
    hasExactTeamIds &&
    hasExactMatchIds
  ) {
    await autoAssignTeamLogos(db);
    console.log('2vs2 Liga-Daten (44 echte Teams, 4 Dummy-Teams, 88 Spieler, 240 Paarungen) sind bereits aktuell.');
    return { ok: true, skipped: true };
  }

  let currentStart = DEFAULT_SEASON_START;
  try {
    const sRow = await db.get("SELECT value FROM settings WHERE key = 'season_start'");
    if (sRow?.value) currentStart = sRow.value;
  } catch { /* Tabelle existiert evtl. noch nicht */ }
  setSeasonStart(currentStart);

  const availableLogos = listAvailableLogos();

  return await db.tx(async (tx) => {
    try { await tx.run('DELETE FROM notifications'); } catch { /* ignore */ }
    await tx.run('DELETE FROM availabilities');
    await tx.run('DELETE FROM matchups');
    await tx.run('DELETE FROM players');
    await tx.run('DELETE FROM teams');
    try { await tx.run('DELETE FROM sqlite_sequence'); } catch { /* ignore */ }
    try {
      await tx.run('DELETE FROM settings WHERE key = ?', ['season_start']);
      await tx.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['season_start', currentStart]);
    } catch { /* ignore */ }

    const teamsByLeague = new Map();
    const allCreatedTeams = [];
    let realTeamCount = 0;
    let dummyTeamCount = 0;
    let playerCount = 0;

    // 1. Alle 8 Ligen mit ihren Teams (mit Original-Team-ID) und Spielern (mit Original-Spieler-ID) anlegen
    for (const lg of LEAGUE_TEAMS) {
      const lgTeams = [];
      for (const tDef of lg.teams) {
        const isDummy = tDef.is_dummy ? 1 : 0;
        const logo = isDummy ? null : matchLogoForTeamName(tDef.name, availableLogos);
        let teamId = tDef.id || null;
        if (teamId) {
          await tx.run(
            'INSERT INTO teams (id, name, logo, league_id, is_dummy) VALUES (?, ?, ?, ?, ?)',
            [teamId, tDef.name, logo, lg.league_id, isDummy]
          );
        } else {
          const tRow = await tx.get(
            'INSERT INTO teams (name, logo, league_id, is_dummy) VALUES (?, ?, ?, ?) RETURNING id',
            [tDef.name, logo, lg.league_id, isDummy]
          );
          teamId = tRow.id;
        }

        const pObjs = [];
        if (!isDummy) {
          realTeamCount++;
          for (const p of tDef.players.slice(0, 2)) {
            const pName = typeof p === 'string' ? p : p.name;
            const pId = typeof p === 'object' && p.id ? p.id : null;
            let finalPid = pId;
            if (pId) {
              await tx.run(
                'INSERT INTO players (id, name, team_id) VALUES (?, ?, ?)',
                [pId, pName, teamId]
              );
            } else {
              const pRow = await tx.get(
                'INSERT INTO players (name, team_id) VALUES (?, ?) RETURNING id',
                [pName, teamId]
              );
              finalPid = pRow.id;
            }
            pObjs.push({ id: finalPid, name: pName, team_id: teamId });
            playerCount++;
          }
        } else {
          dummyTeamCount++;
        }

        const teamObj = {
          id: teamId,
          name: tDef.name,
          logo,
          league_id: lg.league_id,
          is_dummy: Boolean(isDummy),
          players: pObjs,
        };
        lgTeams.push(teamObj);
        allCreatedTeams.push(teamObj);
      }
      teamsByLeague.set(lg.league_id, lgTeams);
    }

    // 2. Alle 240 offiziellen Saison-Paarungen anlegen
    let matchupCount = 0;
    if (Array.isArray(LEAGUE_MATCHES) && LEAGUE_MATCHES.length > 0) {
      for (const m of LEAGUE_MATCHES) {
        const isCompleted = m.status === 'COMPLETED' || m.status === 'WALKOVER' ? 1 : 0;
        if (m.id) {
          await tx.run(
            `INSERT INTO matchups (
              id, phase_id, team_a_id, team_b_id,
              proposed_slots, proposed_by_team_id, proposed_by_player_name,
              confirmed_slot, confirmed_by_player_name, is_completed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              m.id,
              m.phase_id,
              m.team_a_id,
              m.team_b_id,
              null,
              null,
              null,
              m.confirmed_slot || null,
              m.confirmed_by_player_name || null,
              isCompleted,
            ]
          );
        } else {
          await tx.run(
            `INSERT INTO matchups (
              phase_id, team_a_id, team_b_id,
              confirmed_slot, confirmed_by_player_name, is_completed
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              m.phase_id,
              m.team_a_id,
              m.team_b_id,
              m.confirmed_slot || null,
              m.confirmed_by_player_name || null,
              isCompleted,
            ]
          );
        }
        matchupCount++;
      }
    } else {
      for (const [, lgTeams] of teamsByLeague.entries()) {
        const schedule = generateLeagueSchedule(lgTeams.map((t) => t.id));
        for (const item of schedule) {
          await tx.run(
            'INSERT INTO matchups (phase_id, team_a_id, team_b_id) VALUES (?, ?, ?)',
            [item.phase_id, item.team_a_id, item.team_b_id]
          );
          matchupCount++;
        }
      }
    }

    // 3. SQLite-Autoincrement-Sequenzen aktualisieren
    try {
      for (const tbl of ['teams', 'players', 'matchups']) {
        const maxRow = await tx.get(`SELECT MAX(id) AS max_id FROM ${tbl}`);
        if (maxRow?.max_id) {
          await tx.run('DELETE FROM sqlite_sequence WHERE name = ?', [tbl]);
          await tx.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [tbl, maxRow.max_id]);
        }
      }
    } catch { /* ignore */ }

    console.log(
      `2vs2 Liga-Daten geladen: 8 Ligen, ${realTeamCount} echte Teams (${playerCount} Spieler), ${dummyTeamCount} Dummy-Teams, ${matchupCount} offizielle Saison-Paarungen.`
    );
    return {
      ok: true,
      leagues: 8,
      realTeams: realTeamCount,
      dummyTeams: dummyTeamCount,
      players: playerCount,
      matchups: matchupCount,
    };
  });
}

if (require.main === module) {
  const { initDb } = require('../db');
  initDb()
    .then((db) => seedDemoData(db, { force: true }))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
