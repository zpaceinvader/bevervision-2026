# Bevervision — Sprints

Each sprint is self-contained. Start a new context by referencing `SPEC.md` and the relevant sprint below.

**Stack recap:** Vite + React + TypeScript (client) · Node.js + Express + Socket.io (server) · SQLite (better-sqlite3) · Tailwind CSS · Railway (single service)

**Status legend:** `[ ]` todo · `[x]` done · `[~]` in progress

---

## Sprint 1 — Project Scaffold

**Goal:** A running monorepo with client and server that can be deployed to Railway. No real features yet — just the skeleton that all future sprints build on.

**Deliverables:**
- [x] npm workspaces monorepo (`client/`, `server/`, root `package.json`)
- [x] `client/`: Vite + React + TypeScript, Tailwind CSS, React Router v6
- [x] `server/`: Node.js + Express + TypeScript (tsx), dev watch mode
- [x] `server/` serves `client/dist` as static files in production
- [x] Root dev script runs both client and server concurrently
- [x] `railway.json` for Railway deploy
- [x] `.env.example` with `HOST_PASSWORD=bever2026`, `PORT=3000`
- [x] Client has placeholder pages for `/`, `/room/:code`, `/host/:code`, `/leaderboard/:code`
- [x] Server has a `GET /api/ping` → `{ ok: true }` health check
- [x] Client successfully calls `/api/ping` and renders the response

**Definition of done:** `npm run dev` starts both client (Vite HMR) and server. Navigating to the four routes shows placeholder text. No errors in console.

**COMPLETE** ✓

---

## Sprint 2 — Data Layer

**Goal:** SQLite database with full schema, seed data, and scoring algorithm. Pure backend, no UI.

**Depends on:** Sprint 1 complete (server scaffold exists)

**Deliverables:**
- [ ] `server/src/db.ts` — SQLite connection + table creation on startup
- [ ] Schema: `rooms`, `players`, `countries`, `official_results`, `scores` tables (see SPEC.md Data Model)
- [ ] `server/src/data/countries.ts` — hardcoded array of all 25 countries (id, flag, country, artist, song, performanceOrder)
- [ ] Seed countries into DB on startup if table is empty
- [ ] `server/src/scoring.ts` — jury accuracy algorithm:
  - Takes official points per country, computes reference = `round((points / maxPoints) * 12)`
  - Takes player scores, returns points per country (10/7/4/1/0 by distance)
- [ ] `server/src/scoring.ts` — prediction algorithm:
  - Top 3 exact (50 pts), top 3 correct country (20 pts), bottom 1 (100 pts)
  - Sweden/Norway position: exact (60), ±3 (30), ±6 (10)
- [ ] `server/src/scoring.ts` — `calculateFinalScores(roomId)` combines both components
- [ ] Simple test script (`npm run test:scoring`) that runs the scoring functions against mock data and prints results

**Definition of done:** Running `npm run test:scoring` prints correct scores for a mock scenario. DB file created on server start with 25 countries seeded.

---

## Sprint 3 — Room & Player Infrastructure

**Goal:** Players can create/join rooms and persist their session. Real-time connection established. No scoring UI yet.

**Depends on:** Sprint 1, Sprint 2

**Deliverables:**

**Server:**
- [ ] `POST /api/rooms` — creates a room, returns `{ code, hostUrl, playerUrl }`
- [ ] `GET /api/rooms/:code` — returns room status + player list
- [ ] Socket.io server setup on same Express server
- [ ] Socket event: `join_room` — player sends `{ code, name }`, server creates/updates player record, broadcasts `player:joined` to room
- [ ] Socket event: `rejoin_room` — player sends `{ code, playerId }` (from localStorage), server reconnects them
- [ ] Socket: player disconnect tracked, player marked offline but not deleted

**Client:**
- [ ] `Landing.tsx` — input for display name + room code, "Join" button
- [ ] On join: POST to create or GET to validate room, then connect Socket.io, navigate to `/room/:code`
- [ ] `lib/storage.ts` — `saveSession(code, playerId, name)` / `getSession(code)` using localStorage
- [ ] On page load in `/room/:code`: check localStorage for existing session, auto-rejoin if found
- [ ] Room page shows connected player list (live, from socket events)

**Definition of done:** Two browser tabs can join the same room with different names. Refreshing a tab reconnects without re-entering name. Player list updates in real-time.

---

## Sprint 4 — Player Scoring & Predictions UI

**Goal:** Players can score all countries and submit predictions. Data persists on server. Inputs lock when host closes voting.

**Depends on:** Sprint 3

**Deliverables:**

**Server:**
- [ ] Socket event: `player:score` — `{ countryId, score | null }` → upsert to `scores` table, emit `score_progress` to host room
- [ ] Socket event: `player:prediction` — `{ field, value }` → update player predictions JSON
- [ ] Socket event: `host:close_voting` — password check, set room status to `'closed'`, broadcast `voting:closed` to all players
- [ ] `GET /api/rooms/:code/my-scores?playerId=` — returns existing scores + predictions for reconnect

**Client:**
- [ ] `Room.tsx` — tabbed layout: "Score" tab + "Predictions" tab
- [ ] `CountryScoreCard.tsx` — flag, country, artist, song, row of score buttons (1 2 3 4 5 6 7 8 10 12 + clear). Selected score highlighted. Tapping a new score replaces old one.
- [ ] Score grid: all 25 countries, scrollable
- [ ] On mount: fetch existing scores from server and pre-populate
- [ ] `PredictionForm.tsx` — dropdowns for Top 1/2/3, Bottom 1 (all 25 countries), number inputs for Sweden pos and Norway pos (#1–25)
- [ ] On `voting:closed` socket event: lock all inputs, show "Voting is closed" banner
- [ ] Scores and predictions sent to server on every change (debounced 300ms)

**Definition of done:** Player can score countries and set predictions on mobile. Refreshing restores all scores. When host sends close event (via Postman/curl for now), all inputs lock immediately.

---

## Sprint 5 — Host Panel

**Goal:** Host can monitor the room live, close voting, enter official results, and trigger the leaderboard reveal.

**Depends on:** Sprint 4

**Deliverables:**

**Server:**
- [ ] `GET /api/rooms/:code/host-overview` — returns players with score counts + current crowd favourite (country with most total points)
- [ ] Socket event: `host:enter_results` — password check, accepts `{ rankings: [{ countryId, officialRank, officialPoints }] }`, stores in DB, emits `results:saved`
- [ ] Socket event: `host:reveal_leaderboard` — password check, calls `calculateFinalScores`, stores results, broadcasts `leaderboard:reveal` with full rankings payload
- [ ] Validate password server-side for all `host:*` events (compare against `HOST_PASSWORD` env var)

**Client:**
- [ ] `Host.tsx` — password prompt modal on first load, stored in sessionStorage
- [ ] Live player list: name, scores given count (e.g. "14/25"), online/offline indicator
- [ ] Crowd favourite: big display of current leading country (flag + name + total pts)
- [ ] "Close Voting" button with confirmation dialog → emits `host:close_voting`
- [ ] After voting closed: results entry form appears
- [ ] Results entry: list of all 25 countries with rank input (#1–25) and points input. Auto-sort by rank as values entered. Or drag-to-reorder list.
- [ ] "Save Results" button → emits `host:enter_results`
- [ ] After results saved: "Reveal Leaderboard" button appears → emits `host:reveal_leaderboard`

**Definition of done:** Full host flow works end-to-end: monitor players → close voting → enter results → reveal. Wrong password is rejected silently (prompt re-shown).

---

## Sprint 6 — Leaderboard Reveal

**Goal:** Dramatic animated leaderboard shown on all devices simultaneously when host triggers reveal.

**Depends on:** Sprint 5

**Deliverables:**

**Client:**
- [ ] On `leaderboard:reveal` socket event: all connected clients navigate to `/leaderboard/:code`
- [ ] `Leaderboard.tsx` receives rankings payload (passed via router state or re-fetched from server)
- [ ] `LeaderboardReveal.tsx` — animated reveal component:
  - Players hidden initially
  - Reveal from bottom (last place) to top (winner), one card at a time
  - Each card animates in (slide up + fade, or dramatic zoom)
  - ~2 second delay between each card
  - Final card (winner) gets extra fanfare (larger animation, gold styling)
- [ ] Player card shows: rank, name, total score, jury accuracy pts, prediction pts breakdown
- [ ] After full reveal: all cards remain visible, static
- [ ] "Play again" or "Back to lobby" button for host only

**Server:**
- [ ] `GET /api/rooms/:code/results` — returns stored final results for late-joiners or page refresh

**Definition of done:** Triggering reveal on host panel causes all open player tabs to simultaneously show the animated leaderboard. Refreshing the leaderboard page re-fetches and shows the final (non-animated) result.

---

## Sprint 7 — Branding & Polish

**Goal:** App looks like a real party app — Bevervision branded, mobile-optimized, party-ready.

**Depends on:** Sprint 6 (all features complete)

**Deliverables:**

**Branding:**
- [ ] Bevervision logo — Eurovision star/heart motif with beaver tail or silhouette. SVG, used in header.
- [ ] Color palette applied: deep purple (`#3B0764`), gold (`#F59E0B`), electric blue (`#2563EB`), white text
- [ ] Bold camp font (Google Fonts — e.g. Protest Riot, or similar Eurovision-esque display font)
- [ ] Favicon with beaver/logo

**Mobile UX:**
- [ ] All views tested and optimized for 390px wide (iPhone 14 size)
- [ ] Score buttons are large enough to tap without misfire
- [ ] Sticky tab bar on Room page (Score / Predictions)
- [ ] No horizontal scroll anywhere
- [ ] Voting closed banner is prominent and unmissable

**Polish:**
- [ ] Loading states (connecting to server, saving scores)
- [ ] Toast notification when a score or prediction is saved
- [ ] Error state if room code not found
- [ ] Graceful handling of socket disconnect/reconnect (auto-reconnect with backoff)
- [ ] Host panel: prevent accidental double-submit on reveal

**Definition of done:** App is visually distinct and on-brand. Tested on a real phone. No layout issues at mobile widths.

---

## Sprint 8 — Deploy to Railway

**Goal:** App is live on Railway and accessible from phones at the party.

**Depends on:** Sprint 7

**Deliverables:**
- [ ] Railway project created, linked to repo or manual deploy
- [ ] Environment variables set in Railway: `HOST_PASSWORD`, `PORT`, `NODE_ENV=production`
- [ ] Build command: `npm run build` (builds client into `client/dist`, compiles server)
- [ ] Start command: `node server/dist/index.js` (or `tsx server/src/index.ts`)
- [ ] SQLite DB file path uses Railway persistent volume or `/tmp` (note: `/tmp` is ephemeral — for a one-night party this is fine)
- [ ] CORS configured correctly for production domain
- [ ] Socket.io transport tested over Railway's infrastructure (may need to disable websocket and fall back to polling if proxying causes issues — set `transports: ['polling', 'websocket']`)
- [ ] Final end-to-end test: create room, join from two phones, score, host closes, enter results, reveal
- [ ] Share URL with party guests

**Definition of done:** App is live at a Railway URL. Full flow works on real phones over the internet. Party is ready.

---

## Sprint Order Summary

```
Sprint 1 — Scaffold       (no deps)
Sprint 2 — Data Layer     (needs Sprint 1)
Sprint 3 — Room & Players (needs 1, 2)
Sprint 4 — Scoring UI     (needs 3)
Sprint 5 — Host Panel     (needs 4)
Sprint 6 — Leaderboard    (needs 5)
Sprint 7 — Polish         (needs 6)
Sprint 8 — Deploy         (needs 7)
```

Sprints 1–6 are the critical path for a working app. Sprint 7–8 can be compressed if time is short.
