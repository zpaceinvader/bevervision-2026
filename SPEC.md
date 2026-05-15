# Bevervision — Full App Specification

> Eurovision party scoring app for the 2026 Grand Final (May 16).
> Named after "bever" (Norwegian for beaver) + Eurovision.

---

## Concept

A real-time web app where 5–10 party guests join on their phones, score each Eurovision country as the show plays on TV, and submit predictions. After the show, the host enters the official results and triggers a dramatic leaderboard reveal on all screens simultaneously.

---

## Branding

- **Name:** Bevervision
- **UI language:** Swedish (player- and host-facing copy). SPEC/SPRINTS docs stay in English.
- **Visual direction:** Late-night gala — pitch-black stage, silver chrome surfaces, gold spotlight accents. No purple, no blue.
- **Background:** Pure black (`#000`) with a slow 24 s diagonal gradient drifting through near-blacks tinted with the faintest gold/blue (`#000000` → `#0a0a0a` → `#14110a` → `#0a0d12` → `#000000`). Reduced-motion users get a static black.
- **Searchlights:** A small number of soft, faint gold/silver beams sweep from the bottom edge behind the content (very low alpha, `mix-blend-mode: screen`, generous blur). They should read as atmospheric, not decorative.
- **Header art:** Owner-supplied `client/assets/header.png` (used on the landing page). No separate logo mark — favicon is a tiny gold star + beaver-tail glyph (`client/public/favicon.svg`).
- **Color palette:**
  - **Black:** `#000` page background, dark surfaces use translucent silver-900 over the gradient.
  - **Gold** (Tailwind `gold-*`): `#FBBF24` (400) · `#F59E0B` (500, primary action) · `#D97706` (600). Used for the wordmark, primary buttons, selected score chips, the voting-closed banner, the winner card, and toasts.
  - **Silver** (Tailwind `silver-*`, custom scale): `#F5F5F5` (100) → `#0F0F0F` (900). Surfaces use `silver-900/60–70` over the gradient; borders use `silver-700/800`; muted text uses `silver-300/400/500`.
  - **White:** primary text.
  - **System red** (Tailwind default `red-*`): destructive actions ("Stäng röstning") and error states only.
- **Typography:** Display wordmark in **Protest Riot** (Google Fonts, `font-display`). Body uses the system UI stack. Country names, room codes, and numeric scores use a monospaced track (`font-mono`) for that scoreboard feel.
- **Tone:** Fun, party-ready, slightly absurd — held in check by the dark, restrained palette so it reads as gala rather than carnival.

---

## Grand Final Countries (Performance Order)

| # | Flag | Country | Artist | Song |
|---|---|---|---|---|
| 01 | 🇩🇰 | Denmark | Søren Torpegaard Lund | Før Vi Går Hjem |
| 02 | 🇩🇪 | Germany | Sarah Engels | Fire |
| 03 | 🇮🇱 | Israel | Noam Bettan | Michelle |
| 04 | 🇧🇪 | Belgium | ESSYLA | Dancing on the Ice |
| 05 | 🇦🇱 | Albania | Alis | Nân |
| 06 | 🇬🇷 | Greece | Akylas | Ferto |
| 07 | 🇺🇦 | Ukraine | LELÉKA | Ridnym |
| 08 | 🇦🇺 | Australia | Delta Goodrem | Eclipse |
| 09 | 🇷🇸 | Serbia | LAVINA | Kraj Mene |
| 10 | 🇲🇹 | Malta | AIDAN | Bella |
| 11 | 🇨🇿 | Czechia | Daniel Zizka | CROSSROADS |
| 12 | 🇧🇬 | Bulgaria | DARA | Bangaranga |
| 13 | 🇭🇷 | Croatia | LELEK | Andromeda |
| 14 | 🇬🇧 | United Kingdom | LOOK MUM NO COMPUTER | Eins, Zwei, Drei |
| 15 | 🇫🇷 | France | Monroe | Regarde ! |
| 16 | 🇲🇩 | Moldova | Satoshi | Viva, Moldova! |
| 17 | 🇫🇮 | Finland | Linda Lampenius x Pete Parkkonen | Liekinheitin |
| 18 | 🇵🇱 | Poland | ALICJA | Pray |
| 19 | 🇱🇹 | Lithuania | Lion Ceccah | Sólo Quiero Más |
| 20 | 🇸🇪 | Sweden | FELICIA | My System |
| 21 | 🇨🇾 | Cyprus | Antigoni | JALLA |
| 22 | 🇮🇹 | Italy | Sal Da Vinci | Per Sempre Sì |
| 23 | 🇳🇴 | Norway | JONAS LOVV | YA YA YA |
| 24 | 🇷🇴 | Romania | Alexandra Căpitănescu | Choke Me |
| 25 | 🇦🇹 | Austria | COSMÓ | Tanzschein |

Sweden = entry #20, Norway = entry #23. These are hardcoded as the special prediction targets.

---

## Game Flow

```
1. Host creates room → receives shareable link + host URL
2. Players open link on phone → enter display name → stored in localStorage
3. Live show plays on TV
4. Players score countries (any time, any score value, multiple countries same score)
5. Players submit predictions (any time before voting closes)
6. Host closes voting when TV voting stops
7. All player inputs are locked
8. Host enters official full ranking + total points per country
9. Host triggers leaderboard reveal
10. All screens simultaneously transition to dramatic leaderboard reveal
```

---

## Features

### Player View (`/room/:code`)

**Scoring Tab**
- Grid of all 25 countries (flag, country name, artist, song)
- Per-country score picker: `1 2 3 4 5 6 7 8 10 12` (or "no score")
- Same score value can be given to multiple countries (not like real Eurovision)
- Scoring is optional per country — players don't have to score all
- Changes saved in real-time to server
- When host closes voting: all inputs locked with a clear "Voting is closed" banner

**Predictions Tab**
- Top 1, Top 2, Top 3: dropdown (select country)
- Bottom 1: dropdown (select country)
- Sweden final position: number input or dropdown (#1–25)
- Norway final position: number input or dropdown (#1–25)
- Locked together with scoring when host closes voting

**State persistence**
- Display name stored in localStorage keyed by room code
- Player rejoins same session if they close/reopen browser

---

### Host Panel (`/host/:code`)

Accessed via `/host/:code` + hardcoded password prompt on entry.

**Live Overview (during show)**
- Player list with progress: name + how many countries scored (e.g. "Alex — 14/25")
- Current crowd favourite: country with the highest total points across all players so far
- "Close Voting" button (irreversible, asks for confirmation)

**Results Entry (after voting closed)**
- Form to enter official final ranking: drag-to-reorder or numbered inputs for all 25 countries
- For each country: total official points received
- Save button → system calculates all scores
- "Reveal Leaderboard" button → triggers transition on all connected devices

---

### Leaderboard Screen

- Triggered by host, shown simultaneously on all devices
- Dramatic animated reveal: players shown bottom-to-top, one by one with a delay between each
- Each player card shows:
  - Rank (#1, #2, etc.)
  - Display name
  - Total score
  - Breakdown: Jury Accuracy pts + Prediction pts
- After full reveal: static rankings stay on screen

---

## Scoring Algorithm

### Component 1: Jury Accuracy Score

After the host enters official results, the system computes a **reference score** for each country:

```
reference = round((country_official_points / max_country_official_points) * 12)
```

This normalizes the winning country to 12, and the rest proportionally.

For each country a player scored, points are awarded based on distance from the reference:

| |player score − reference| | Points |
|---|---|
| 0 (exact match) | 10 |
| 1 | 7 |
| 2 | 4 |
| 3 | 1 |
| 4+ | 0 |

Countries the player did not score are skipped (no penalty).

**Max possible: 25 countries × 10 = 250 pts**

---

### Component 2: Prediction Score

| Prediction | Condition | Points |
|---|---|---|
| Top 3 | Correct country in exact position | 50 pts each |
| Top 3 | Correct country, wrong position | 20 pts each |
| Bottom 1 | Correct country | 100 pts |
| Sweden position | Exact | 60 pts |
| Sweden position | Within ±3 places | 30 pts |
| Sweden position | Within ±6 places | 10 pts |
| Norway position | Exact | 60 pts |
| Norway position | Within ±3 places | 30 pts |
| Norway position | Within ±6 places | 10 pts |

**Max possible: 150 + 100 + 60 + 60 = 370 pts** (plus partial credit for near-misses)

---

### Total Score

```
total = jury_accuracy_score + prediction_score
```

Predictions are worth ~60% of the maximum total, making good predictions the dominant factor.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Vite + React + TypeScript | Requested, fast DX |
| Styling | Tailwind CSS | Mobile-first, fast iteration |
| Backend | Node.js + Express | Simple, familiar |
| Real-time | Socket.io | Bidirectional events for live sync |
| Database | SQLite (better-sqlite3) | No external DB, single file, Railway-compatible |
| Hosting | Railway (single service) | Serves built React + API + WebSocket on one port |

Single Railway service: Express serves the Vite-built React app as static files, plus REST API routes, plus Socket.io — all on one port.

---

## Routes

| Path | View | Notes |
|---|---|---|
| `/` | Landing page | Enter room code or create room |
| `/room/:code` | Player view | Scoring + predictions |
| `/host/:code` | Host panel | Password-protected |
| `/leaderboard/:code` | Leaderboard | Auto-navigated by socket event |

---

## Real-time Socket.io Events

| Event | Direction | Payload | When |
|---|---|---|---|
| `player:join` | server → all | `{ name, playerId }` | Player joins room |
| `player:score_update` | client → server | `{ countryId, score }` | Player changes a score |
| `player:prediction_update` | client → server | `{ field, value }` | Player changes a prediction |
| `host:score_progress` | server → host | `{ playerId, scored, total }` | Any player score change |
| `voting:closed` | server → all | — | Host closes voting |
| `results:saved` | server → host | — | Official results stored |
| `leaderboard:reveal` | server → all | `{ rankings[] }` | Host triggers reveal |

---

## Data Model

```
Room {
  id: string (6-char code)
  hostPassword: string (hardcoded, not stored per-room)
  status: 'open' | 'closed' | 'revealed'
  createdAt: datetime
}

Player {
  id: string
  roomId: string
  name: string
  socketId: string (nullable, for reconnect)
  scores: JSON  // { countryId: score | null }
  predictions: JSON // { top1, top2, top3, bottom1, swedenPos, norwayPos }
}

Country {
  id: number (1-25, performance order)
  flag: string
  country: string
  artist: string
  song: string
  officialRank: number | null
  officialPoints: number | null
}

Result {
  roomId: string
  playerId: string
  juryAccuracyScore: number
  predictionScore: number
  totalScore: number
  breakdown: JSON
}
```

---

## Host Password

Hardcoded in server environment variable: `HOST_PASSWORD`.  
Set in Railway environment config. Default for dev: `bever2026`.

---

## Deployment

- **Live URL:** https://bevervision-production.up.railway.app
- **Hosting:** Railway, single service, EU West region
- **Source:** GitHub repo `zpaceinvader/bevervision-2026`, branch `main`. Every push to `main` triggers an auto-deploy.
- **Build:** `npm install && npm run build` (root workspace command; builds client into `client/dist` and compiles server to `server/dist`)
- **Start:** `npm start` → `node server/dist/index.js`
- **Healthcheck:** `GET /api/ping` → `{ ok: true }`, 10s timeout (configured in `railway.json`)
- **Env vars (set in Railway dashboard, not committed):**
  - `HOST_PASSWORD` (required)
  - `NODE_ENV=production`
  - `PORT` is auto-injected by Railway — do not override
- **CORS:** prod uses same-origin (Express serves the React build from the same domain). Dev allows `http://localhost:5173`.
- **SQLite storage:** ephemeral container filesystem (no Railway Volume). The DB file is re-created and re-seeded with the 25 countries on every container start. Acceptable for a one-night party — if Railway redeploys mid-party, room state is lost. If durability is later required, mount a Railway Volume (e.g. at `/data`) and set the DB path via env var.
- **Socket.io transport:** configure with `transports: ['polling', 'websocket']` (websocket preferred, polling fallback) so traffic survives Railway's proxy regardless of which transport upgrades.

---

## Project Structure

```
bevervision/
  SPEC.md           ← this file
  client/           ← Vite + React app
    src/
      pages/
        Landing.tsx
        Room.tsx
        Host.tsx
        Leaderboard.tsx
      components/
        CountryScoreCard.tsx
        PredictionForm.tsx
        PlayerList.tsx
        LeaderboardReveal.tsx
      lib/
        socket.ts
        storage.ts   ← localStorage helpers
  server/           ← Node.js + Express + Socket.io
    src/
      index.ts
      db.ts          ← SQLite setup + queries
      routes/
        room.ts
        host.ts
      socket/
        handlers.ts
      data/
        countries.ts  ← hardcoded country list
      scoring.ts     ← jury accuracy + prediction algorithms
  railway.json
  package.json (root, with workspaces)
```

---

## Open Questions Resolved

| Question | Answer |
|---|---|
| Country list | Pre-populated with 2026 Grand Final list (hardcoded in server) |
| Host access | Hardcoded password, prompted on `/host/:code` entry |
| Countdown timer | Not needed |
| Leaderboard reveal style | Dramatic animated reveal, bottom to top, one player at a time |
