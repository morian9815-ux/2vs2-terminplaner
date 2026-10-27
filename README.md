# 2vs2 Liga Terminplaner

Full-Stack-Webanwendung zur synchronen 2vs2-Terminfindung für die **Walkabout Wunderland 2vs2 Liga** (8 Ligen, 44 echte Teams, 88 Spieler, 11 Saisonwochen).

---

## Highlights & Features

- **2vs2 Liga-Struktur:**
  - 8 Ligen (1. Diamant, 2. Platin, 3. Gold, 4. Silber, 5.1 & 5.2 Bronze, 6.1 & 6.2 Eisen).
  - 44 echte Teams mit offiziellen Logos und Spielernamen.
  - 11 Saisonwochen (5 Wochen Hinrunde, 1 Woche Pause, 5 Wochen Rückrunde).
  - Berger-Tabellen-Paarungen (10 Spieltage, 240 Spiele).
- **Match-Abgleich & Terminfindung:**
  - 4-Spieler-Schnittmenge (2 vs. 2) mit Verfügbarkeitsampel (Grün/Gelb/Rot).
  - Verbindliches Einigungssystem (1–3 Termine vorschlagen + Bestätigung durch das gegnerische Team).
  - 1-Klick-Option: *"Bereits gespielt / erledigt markieren"* (aus der offenen Liste entfernen).
  - Smarte Nachholspiel-Erkennung & 3-Wochen-Matchfinder zum flexiblen Vorziehen und Nachholen.
  - Exakte 1-stündige Spielzeitsperre zur Vermeidung von Doppelbelegungen.
- **Datenbank & Persistenz:**
  - **Lokal:** Eingebautes SQLite über Node.js (`data/turnier.db`), keine Konfiguration nötig.
  - **Cloud:** Automatische PostgreSQL-Unterstützung via `DATABASE_URL` oder `POSTGRES_URL` (z. B. Vercel Postgres / Neon / Supabase).
- **Vercel Serverless Ready:**
  - Mit `vercel.json` und `api/index.js` direkt per GitHub-Import auf Vercel deploybar.

---

## Lokal starten

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Server starten:**
   ```bash
   npm start
   ```
   Die App läuft unter: **http://localhost:3000**

---

## Deployment auf Vercel

1. Repository auf GitHub pushen.
2. Auf [vercel.com](https://vercel.com) importieren.
3. Im Vercel-Dashboard unter **Storage** eine kostenlose **Postgres**-Datenbank (Neon) erstellen und mit dem Projekt verbinden.
4. Fertig! Die Datenbank wird beim ersten Aufruf automatisch mit allen Teams und Paarungen initialisiert.
