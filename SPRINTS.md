# Bevervision — Sprints

Each sprint is self-contained. Start a new context by referencing `SPEC.md` and the relevant sprint below.

**Stack recap:** Vite + React + TypeScript (client) · Node.js + Express + Socket.io (server) · SQLite (better-sqlite3) · Tailwind CSS · Railway (single service)

**Live:** https://bevervision-production.up.railway.app — auto-deploys from `main` on every push (set up during Sprint 1; see Sprint 8 for what's left).

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
- [x] `server/src/db.ts` — SQLite connection + table creation on startup
- [x] Schema: `rooms`, `players`, `countries`, `official_results`, `scores` tables (see SPEC.md Data Model)
- [x] `server/src/data/countries.ts` — hardcoded array of all 25 countries (id, flag, country, artist, song, performanceOrder)
- [x] Seed countries into DB on startup if table is empty
- [x] `server/src/scoring.ts` — jury accuracy algorithm:
  - Takes official points per country, computes reference = `round((points / maxPoints) * 12)`
  - Takes player scores, returns points per country (10/7/4/1/0 by distance)
- [x] `server/src/scoring.ts` — prediction algorithm:
  - Top 3 exact (50 pts), top 3 correct country (20 pts), bottom 1 (100 pts)
  - Sweden/Norway position: exact (60), ±3 (30), ±6 (10)
- [x] `server/src/scoring.ts` — `calculateFinalScores(roomId)` combines both components
- [x] Simple test script (`npm run test:scoring`) that runs the scoring functions against mock data and prints results

**Definition of done:** Running `npm run test:scoring` prints correct scores for a mock scenario. DB file created on server start with 25 countries seeded.

**COMPLETE** ✓

---

## Sprint 3 — Room & Player Infrastructure

**Goal:** Players can create/join rooms and persist their session. Real-time connection established. No scoring UI yet.

**Depends on:** Sprint 1, Sprint 2

**Deliverables:**

**Server:**
- [x] `POST /api/rooms` — creates a room, returns `{ code, hostUrl, playerUrl }`
- [x] `GET /api/rooms/:code` — returns room status + player list
- [x] Socket.io server setup on same Express server — initialise with `transports: ['polling', 'websocket']` so traffic survives Railway's proxy in production
- [x] Socket event: `join_room` — player sends `{ code, name }`, server creates/updates player record, broadcasts `player:joined` to room
- [x] Socket event: `rejoin_room` — player sends `{ code, playerId }` (from localStorage), server reconnects them
- [x] Socket: player disconnect tracked, player marked offline but not deleted

**Client:**
- [x] `Landing.tsx` — input for display name + room code, "Join" button
- [x] On join: POST to create or GET to validate room, then connect Socket.io, navigate to `/room/:code`
- [x] `lib/storage.ts` — `saveSession(code, playerId, name)` / `getSession(code)` using localStorage
- [x] On page load in `/room/:code`: check localStorage for existing session, auto-rejoin if found
- [x] Room page shows connected player list (live, from socket events)

**Definition of done:** Two browser tabs can join the same room with different names. Refreshing a tab reconnects without re-entering name. Player list updates in real-time.

**COMPLETE** ✓

---

## Sprint 4 — Player Scoring & Predictions UI

**Goal:** Players can score all countries and submit predictions. Data persists on server. Inputs lock when host closes voting.

**Depends on:** Sprint 3

**Deliverables:**

**Server:**
- [x] Socket event: `player:score` — `{ countryId, score | null }` → upsert to `scores` table, emit `score_progress` to host room
- [x] Socket event: `player:prediction` — `{ field, value }` → update player predictions JSON
- [x] Socket event: `host:close_voting` — password check, set room status to `'closed'`, broadcast `voting:closed` to all players
- [x] `GET /api/rooms/:code/my-scores?playerId=` — returns existing scores + predictions for reconnect

**Client:**
- [x] `Room.tsx` — tabbed layout: "Score" tab + "Predictions" tab
- [x] `CountryScoreCard.tsx` — flag, country, artist, song, row of score buttons (1 2 3 4 5 6 7 8 10 12 + clear). Selected score highlighted. Tapping a new score replaces old one.
- [x] Score grid: all 25 countries, scrollable
- [x] On mount: fetch existing scores from server and pre-populate
- [x] `PredictionForm.tsx` — dropdowns for Top 1/2/3, Bottom 1 (all 25 countries), number inputs for Sweden pos and Norway pos (#1–25)
- [x] On `voting:closed` socket event: lock all inputs, show "Voting is closed" banner
- [x] Scores and predictions sent to server on every change (debounced 300ms)

**Definition of done:** Player can score countries and set predictions on mobile. Refreshing restores all scores. When host sends close event (via Postman/curl for now), all inputs lock immediately.

**COMPLETE** ✓

---

## Sprint 5 — Host Panel

**Goal:** Host can monitor the room live, close voting, enter official results, and trigger the leaderboard reveal.

**Depends on:** Sprint 4

**Deliverables:**

**Server:**
- [x] `GET /api/rooms/:code/host-overview` — returns players with score counts + current crowd favourite (country with most total points)
- [x] Socket event: `host:enter_results` — password check, accepts `{ rankings: [{ countryId, officialRank, officialPoints }] }`, stores in DB, emits `results:saved`
- [x] Socket event: `host:reveal_leaderboard` — password check, calls `calculateFinalScores`, stores results, broadcasts `leaderboard:reveal` with full rankings payload
- [x] Validate password server-side for all `host:*` events (compare against `HOST_PASSWORD` env var)

**Client:**
- [x] `Host.tsx` — password prompt modal on first load, stored in sessionStorage
- [x] Live player list: name, scores given count (e.g. "14/25"), online/offline indicator
- [x] Crowd favourite: big display of current leading country (flag + name + total pts)
- [x] "Close Voting" button with confirmation dialog → emits `host:close_voting`
- [x] After voting closed: results entry form appears
- [x] Results entry: list of all 25 countries with rank input (#1–25) and points input. Auto-sort by rank as values entered. Or drag-to-reorder list.
- [x] "Save Results" button → emits `host:enter_results`
- [x] After results saved: "Reveal Leaderboard" button appears → emits `host:reveal_leaderboard`

**Definition of done:** Full host flow works end-to-end: monitor players → close voting → enter results → reveal. Wrong password is rejected silently (prompt re-shown).

**COMPLETE** ✓

---

## Sprint 6 — Leaderboard Reveal

**Goal:** Dramatic animated leaderboard shown on all devices simultaneously when host triggers reveal.

**Depends on:** Sprint 5

**Deliverables:**

**Client:**
- [x] On `leaderboard:reveal` socket event: all connected clients navigate to `/leaderboard/:code`
- [x] `Leaderboard.tsx` receives rankings payload (passed via router state or re-fetched from server)
- [x] `LeaderboardReveal.tsx` — animated reveal component:
  - Players hidden initially
  - Reveal from bottom (last place) to top (winner), one card at a time
  - Each card animates in (slide up + fade, or dramatic zoom)
  - ~2 second delay between each card
  - Final card (winner) gets extra fanfare (larger animation, gold styling)
- [x] Player card shows: rank, name, total score, jury accuracy pts, prediction pts breakdown
- [x] After full reveal: all cards remain visible, static
- [x] "Play again" or "Back to lobby" button for host only

**Server:**
- [x] `GET /api/rooms/:code/results` — returns stored final results for late-joiners or page refresh

**Definition of done:** Triggering reveal on host panel causes all open player tabs to simultaneously show the animated leaderboard. Refreshing the leaderboard page re-fetches and shows the final (non-animated) result.

**COMPLETE** ✓

---

## Sprint 7 — Branding & Polish

**Goal:** App looks like a real party app — Bevervision branded, mobile-optimized, party-ready.

**Depends on:** Sprint 6 (all features complete)

**Deliverables:**

**Branding:** Direction diverged from spec — owner is hand-tuning a black/silver/gold aesthetic with animated gradient + searchlights + bespoke header image. Spec palette (deep purple / electric blue) intentionally not applied.
- [x] Header image (owner-supplied `header.png`) in landing
- [ ] ~~Logo — Eurovision star/heart motif with beaver tail or silhouette. SVG, used in header.~~ Replaced by owner-supplied header art
- [ ] ~~Color palette: deep purple, gold, electric blue, white text~~ Owner using black + silver-* (tailwind) + gold-*
- [x] Bold display font (Protest Riot via Google Fonts) — already wired in Sprint 1
- [x] Favicon with beaver/gold motif (`client/public/favicon.svg`)

**Mobile UX:** (all already in place from earlier sprints — verified)
- [x] All views constrained to `max-w-xl mx-auto`, tested at 390px width
- [x] Score buttons are `h-10` in a 6-col grid (~56 px wide on iPhone 14) — tap-friendly
- [x] Sticky tab bar on Room page (Score / Predictions)
- [x] No horizontal scroll anywhere (no fixed widths, `truncate` on long names/songs)
- [x] Voting-closed banner: gold-on-black, uppercase, full-width — unmissable

**Polish:**
- [x] Loading states (`Ansluter…`, `Laddar värdpanel…`, `Hämtar resultat…`)
- [x] Toast notification when a score or prediction is saved (gold pill, bottom-center, 1.5 s)
- [x] Error state if room code not found (Landing inline error; Room shows error for stale sessions)
- [x] Graceful handling of socket disconnect/reconnect — `joinedOnce` resets on `disconnect`, "Återansluter…" banner shown until reconnect, server's stable `playerId` is reused via `rejoin_room`
- [x] Host panel: prevent accidental double-submit — `pending` state disables close/save/reveal buttons until ack/error

**Definition of done:** App is visually distinct and on-brand. Tested on a real phone. No layout issues at mobile widths.

**COMPLETE** ✓

---

## Sprint 8 — Deploy to Railway

**Goal:** App is live on Railway and accessible from phones at the party.

**Note:** The deploy pipeline was front-loaded alongside Sprint 1 so every subsequent sprint deploys continuously to https://bevervision-production.up.railway.app. The work below is the production-only verification that can't be done until features land. See SPEC.md → Deployment for the full pipeline config.

**Depends on:** Sprint 7

**Deliverables (already done):**
- [x] Railway project created and linked to GitHub repo `zpaceinvader/bevervision-2026` — auto-deploys on push to `main`
- [x] Environment variables set in Railway: `HOST_PASSWORD=bever2026`, `NODE_ENV=production` (PORT is auto-injected — do not set)
- [x] Build command: `npm install && npm run build` (via `railway.json`)
- [x] Start command: `npm start` → `node server/dist/index.js`
- [x] Healthcheck `/api/ping` wired with 10s timeout
- [x] Public domain generated: https://bevervision-production.up.railway.app
- [x] CORS configured: same-origin in prod (Express serves React build from same domain)

**Deliverables (remaining):**
- [ ] Confirm SQLite ephemeral storage is acceptable post-Sprint 7 — if any sprint introduced state that needs to survive a redeploy, mount a Railway Volume and set DB path via env var
- [ ] Final end-to-end test on production URL: create room, join from two phones, score, host closes, enter results, reveal
- [ ] Verify Socket.io transport works over Railway's proxy in real conditions (transport fallback is set in Sprint 3; this is the production check)
- [ ] Share URL with party guests

**Definition of done:** Full flow works on real phones over the internet via https://bevervision-production.up.railway.app. Party is ready.

---

## Sprint 9 — Cat Reaction Effects

**Goal:** When a player saves a score for a country, a cat reaction image flashes briefly over the screen and disappears. Adds delight and makes the act of scoring feel rewarding. The cat shown depends on the score value (low scores = angry cat, high scores = wow cat).

**Depends on:** Sprint 4 (scoring UI exists and emits a save action per country)

**Assets (already in [client/assets/](client/assets/)):**
- `angry.png` — hissing cat, screaming
- `cute.png` — adorable cat with little tongue
- `sexy.png` — half-lidded sultry eyes
- `suprised.png` — wide-eyed amazed (note: filename is missing an `r`, keep it)

**Score → cat mapping:**

| Score          | Cat         | Vibe                  |
| -------------- | ----------- | --------------------- |
| 1, 2           | `angry`     | "How dare you"        |
| 3, 4, 5        | `cute`      | "Aww, sweet"          |
| 6, 7, 8        | `sexy`      | "Oh hello"            |
| 10, 12         | `suprised`  | "WOW"                 |
| clear / null   | (no effect) | —                     |

**Deliverables:**

**Client:**
- [ ] Move assets to `client/src/assets/` (or `client/public/cats/`) so Vite can resolve/optimize them. Pick whichever matches existing asset convention in the project.
- [ ] `lib/scoreReaction.ts` — pure function `scoreToCat(score: number | null): CatKey | null` implementing the mapping above
- [ ] `CatReaction.tsx` — fixed-position overlay component:
  - Renders one of the four cat PNGs centered on screen (or anchored over the scored card — pick whichever reads better on mobile)
  - Animates in (scale 0 → 1 with overshoot, 150ms) and out (fade + scale down, 250ms)
  - Total on-screen time ~700–900ms
  - `pointer-events: none` so it never blocks taps
  - Stacks above all other UI (`z-index: 50`+)
- [ ] Trigger from `CountryScoreCard.tsx` (or wherever the score-button tap handler lives) when a non-null score is committed. Tapping the same score that's already selected, or pressing Clear, does NOT trigger an effect.
- [ ] If a new score is tapped while a previous reaction is still animating, replace it immediately (don't queue)
- [ ] Preload all four images on Room mount so the first reaction isn't blank on slow connections
- [ ] Respect `prefers-reduced-motion`: skip the scale animation, just fade in/out at low opacity

**Polish considerations:**
- Effect must NOT interrupt the debounced server save — it's purely visual
- Effect must work the same on the Score tab regardless of which country is being scored
- Verify on mobile (390px) that the cat doesn't push layout or cause horizontal scroll

**Definition of done:** Tapping a score button shows a cat that matches the score's intensity, briefly, then disappears. Rapid tapping different scores swaps cats smoothly. Clearing a score shows nothing. The visual works on mobile and doesn't block further interaction.

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
Sprint 9 — Cat Reactions  (needs 4; can slot in anytime after)
```

Sprints 1–6 are the critical path for a working app. Sprint 7–8 can be compressed if time is short. Sprint 9 is pure delight and can be done independently of 5–8.
