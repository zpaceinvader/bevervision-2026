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
- [x] Confirm SQLite ephemeral storage is acceptable — no Sprint 2–7 state needs to survive a redeploy (rooms are per-party, results are revealed once). DB defaults to `process.cwd()/bevervision.db` on Railway's writable `/app` mount; a fresh container gets a fresh DB, which is the intended behaviour for a one-night party.
- [x] Final end-to-end test on production URL: room created, two clients joined (one websocket / one polling), scored and predicted, host closed voting, results entered, leaderboard reveal delivered to both clients, `GET /api/rooms/:code/results` returned the persisted standings
- [x] Verify Socket.io transport works over Railway's proxy in real conditions — both `transports: ['polling']` and `['websocket']` succeeded against the public domain
- [x] Pinned `engines.node >= 20` so Nixpacks picks a runtime compatible with `better-sqlite3` 12.x (Node 18 build failed on first push — fixed by `77c0f08`)
- [ ] Share URL with party guests

**Definition of done:** Full flow works on real phones over the internet via https://bevervision-production.up.railway.app. Party is ready.

**COMPLETE** ✓

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
- [x] Assets stay in `client/assets/` (matches existing convention — same dir as `header.png`, imported via `../../assets/...`). Vite bundles them as hashed files in `dist/assets/`.
- [x] `lib/scoreReaction.ts` — pure function `scoreToCat(score: number | null): CatKey | null` implementing the mapping above
- [x] `CatReaction.tsx` — fixed-position overlay component:
  - Renders one of the four cat PNGs centered on screen
  - Animates in (scale 0 → 1.15 → 1 with overshoot) and out (fade + scale down)
  - Total on-screen time ~800ms
  - `pointer-events: none` so it never blocks taps
  - `z-50` — stacks above sticky header and saving-flash toast
- [x] Trigger from `Room.tsx#setScore` (the score-button tap handler ultimately calls this) when the new score is non-null. The current `CountryScoreCard` toggles a re-tap of the selected score to `null`, so a "same selected score" tap and an explicit Clear both produce `null` and skip the effect.
- [x] If a new score is tapped while a previous reaction is still animating, replace it immediately — `<CatReaction>` keys on the reaction id so React unmounts the old `<img>` and remounts a fresh one, restarting the CSS animation
- [x] Preload all four images on Room mount via `new Image(); img.src = url`
- [x] Respect `prefers-reduced-motion`: media query in [index.css](client/src/index.css) swaps the pop animation for a low-opacity fade

**Polish considerations:**
- Effect must NOT interrupt the debounced server save — it's purely visual
- Effect must work the same on the Score tab regardless of which country is being scored
- Verify on mobile (390px) that the cat doesn't push layout or cause horizontal scroll

**Definition of done:** Tapping a score button shows a cat that matches the score's intensity, briefly, then disappears. Rapid tapping different scores swaps cats smoothly. Clearing a score shows nothing. The visual works on mobile and doesn't block further interaction.

**COMPLETE** ✓

---

## Sprint 10 — Host-Triggered Pop Quiz

**Goal:** During the show, the host can tap a button to fire a pop-quiz at every connected player. A multiple-choice question appears on every device, players tap one option, and correct answers earn **5 points** that fold into the final leaderboard total.

**Depends on:** Sprint 5 (host panel exists and authorises host events via password), Sprint 6 (final leaderboard math runs in `calculateFinalScores`)

**Decisions to confirm before implementing:**
- **Time limit**: default **20 s** auto-close per question. After expiry the server reveals the answer; late submissions are rejected.
- **Where 5 pts land**: add a third component `quizScore` to `calculateFinalScores`'s output alongside `juryAccuracyScore` and `predictionScore`. Folds into `totalScore`; surfaced as "Quiz N" in the leaderboard card's breakdown line.
- **When is the button available**: any time `room.status !== 'revealed'` — i.e., during voting AND between voting-closed and leaderboard-reveal. (If the host wants quizzes only during voting, change the gate to `=== 'open'`.)
- **One quiz at a time per room**: if a quiz is in flight, the host button shows "Quiz pågår…" and is disabled.

**Question file:**

`server/src/data/quiz.ts` exports a typed list. Order is the trigger order — the server walks it sequentially per room.

```ts
export interface QuizQuestion {
  id: number              // stable, used as key in events + DB
  prompt: string          // Swedish copy
  options: string[]       // 2–4 strings, tappable
  correctIndex: number    // 0-indexed into `options`
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // example
  // { id: 1, prompt: 'Vilket land vann Eurovision 2024?', options: ['Schweiz', 'Italien', 'Sverige', 'Ukraina'], correctIndex: 0 },
]
```

Owner fills the array with the actual party questions before the show.

**Deliverables:**

**Server:**
- [x] `server/src/data/quiz.ts` with the type + an empty (or seed) array — owner edits to add real questions
- [x] Migration: add `rooms.quiz_index INTEGER NOT NULL DEFAULT 0` — tracks how many questions have been served per room (ALTER TABLE if column missing, so existing rooms migrate cleanly)
- [x] Migration: new table `quiz_answers (room_id, player_id, question_id, answer_index, answered_at, PRIMARY KEY (room_id, player_id, question_id))`
- [x] In-memory `activeQuizzes: Map<roomId, { questionId, deadlineMs, timer }>` — one quiz at a time per room (in `server/src/quiz.ts`)
- [x] Socket event `host:trigger_quiz` (password-gated via existing `authorizeHost`):
  - Rejects with `error_msg` if quiz already running, no questions left, or room is revealed
  - Otherwise picks next question, increments `rooms.quiz_index`, stores active state, broadcasts `quiz:question`
  - Schedules a 20 s reveal timer
- [x] Socket event `player:quiz_answer` `{ questionId, answerIndex }`:
  - Only accepted while quiz is active and pre-deadline
  - Upserts into `quiz_answers` (idempotent re-pick allowed within window)
  - Emits `quiz:answer_acked` back to the player
- [x] Reveal flow (on timer expiry): clears active entry, broadcasts `quiz:reveal { questionId, correctIndex, results[] }`
- [x] Extended `calculateFinalScores`: `countCorrectAnswers(roomId, playerId) * 10` → `quizScore`, folded into `totalScore` and `breakdown.quiz`
- [x] `host:reset_room` extended to clear `quiz_answers` and reset `quiz_index` to 0
- [x] `host-overview` now returns `quizRemaining` and `quizActive`

**Client (player):**
- [x] `QuizModal.tsx` — fullscreen overlay above the score grid:
  - Prompt + 2–4 tappable option buttons (A/B/C/D prefix)
  - Live countdown bar
  - On tap: emits `player:quiz_answer`, locks options, shows "Inskickad"
  - On `quiz:reveal`: correct option in gold, your wrong pick in red, "Rätt! +5 poäng" or "Fel svar."
  - Auto-dismisses ~3.5 s after reveal so the player returns to the score grid
- [x] `Room.tsx` listens for `quiz:question` / `quiz:answer_acked` / `quiz:reveal`
- [x] Score grid stays mounted behind the modal — voting state preserved
- [x] Modal sits at `z-40` over the sticky header, with `bg-black/85 backdrop-blur-sm`

**Client (host):**
- [x] `Host.tsx` — new "Pop-quiz" section at the top of the panel:
  - Button with "`N` kvar" badge from `overview.quizRemaining`
  - Disabled when `quizRemaining === 0`, when a quiz is in flight, when `pending !== null`, or when `room.status === 'revealed'`
  - In flight: shows "Quiz pågår… `MM`s" with live countdown
  - When exhausted: shows "Slut på frågor"
- [x] Extended `pending` union with `'quiz'` to block double-fire
- [x] `quiz:reveal` listener clears pending and refreshes overview

**Client (leaderboard):**
- [x] `LeaderboardReveal.tsx` card breakdown line now appends "· Quiz N" when `quizScore > 0`

**Definition of done:** Host presses Pop-quiz → every connected player sees the question; players tap an answer within 20 s; everyone sees the correct option highlighted at reveal; the next press serves question 2; after the last question the button shows "Slut på frågor" and stays disabled; `host:reset_room` resets the pool to 0; quiz points appear in the final leaderboard breakdown and contribute to total score.

**COMPLETE** ✓

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
Sprint 10 — Pop Quiz      (needs 5 + 6; can slot in anytime after)
```

Sprints 1–6 are the critical path for a working app. Sprint 7–8 can be compressed if time is short. Sprint 9 is pure delight and can be done independently of 5–8.
