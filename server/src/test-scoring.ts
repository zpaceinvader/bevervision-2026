/**
 * Mock-data test for the scoring algorithms. Run: `npm run test:scoring`
 *
 * Uses an in-memory DB so it doesn't touch the dev database. The assignment
 * must run before db.ts is loaded — `require` keeps it in this execution order
 * (a top-level `import` would be hoisted above the env mutation).
 */
process.env.DB_PATH = ':memory:'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initDb, db } = require('./db') as typeof import('./db')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  calculateFinalScores,
  computeReferenceScores,
  scoreJuryAccuracy,
  scorePredictions,
} = require('./scoring') as typeof import('./scoring')
type OfficialResult = import('./scoring').OfficialResult
type PlayerScores = import('./scoring').PlayerScores
type Predictions = import('./scoring').Predictions
import { SWEDEN_ID, NORWAY_ID } from './data/countries'

let failures = 0
function assertEq(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (pass) {
    console.log(`  ✓ ${label}`)
  } else {
    failures++
    console.log(`  ✗ ${label}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`)
  }
}

function section(title: string) {
  console.log(`\n=== ${title} ===`)
}

// Construct an official ranking: country N gets official_rank N, official points scale so #1 = 380, #25 = 0.
function buildMockOfficial(): OfficialResult[] {
  const results: OfficialResult[] = []
  for (let rank = 1; rank <= 25; rank++) {
    const points = Math.round(380 * (1 - (rank - 1) / 24))
    results.push({ countryId: rank, officialRank: rank, officialPoints: points })
  }
  return results
}

initDb()

section('computeReferenceScores')
{
  const ref = computeReferenceScores([
    { countryId: 1, officialRank: 1, officialPoints: 380 },
    { countryId: 2, officialRank: 2, officialPoints: 190 },
    { countryId: 3, officialRank: 3, officialPoints: 95 },
    { countryId: 4, officialRank: 4, officialPoints: 0 },
  ])
  assertEq('top country normalizes to 12', ref.get(1), 12)
  assertEq('half points → 6', ref.get(2), 6)
  assertEq('quarter points → 3', ref.get(3), 3)
  assertEq('zero points → 0', ref.get(4), 0)
}

section('scoreJuryAccuracy')
{
  const refs = new Map<number, number>([
    [1, 12], // winner
    [2, 8],
    [3, 4],
    [4, 0],
  ])
  const scores: PlayerScores = { 1: 12, 2: 7, 3: 1, 4: 5 } // dist 0, 1, 3, 5
  const breakdown = scoreJuryAccuracy(scores, refs)
  assertEq('jury total = 10 + 7 + 1 + 0', breakdown.total, 18)
  assertEq('skips unscored countries (no penalty)', scoreJuryAccuracy({ 1: 12 }, refs).total, 10)
  assertEq('null scores skipped', scoreJuryAccuracy({ 1: null, 2: 8 }, refs).total, 10)
}

section('scorePredictions — top 3')
{
  const official = buildMockOfficial()
  // Perfect top 3 (countries 1, 2, 3 in those slots)
  const perfect = scorePredictions({ top1: 1, top2: 2, top3: 3 }, official)
  assertEq('top1 exact = 50', perfect.top1, 50)
  assertEq('top2 exact = 50', perfect.top2, 50)
  assertEq('top3 exact = 50', perfect.top3, 50)

  // Right countries, wrong slots (3, 1, 2 — all in real top 3)
  const swapped = scorePredictions({ top1: 3, top2: 1, top3: 2 }, official)
  assertEq('top1 in-top3 wrong pos = 20', swapped.top1, 20)
  assertEq('top2 in-top3 wrong pos = 20', swapped.top2, 20)
  assertEq('top3 in-top3 wrong pos = 20', swapped.top3, 20)

  // Country not in top 3
  const miss = scorePredictions({ top1: 10 }, official)
  assertEq('top1 wrong country = 0', miss.top1, 0)
}

section('scorePredictions — bottom 1')
{
  const official = buildMockOfficial()
  const hit = scorePredictions({ bottom1: 25 }, official)
  assertEq('bottom1 correct = 100', hit.bottom1, 100)
  const miss = scorePredictions({ bottom1: 24 }, official)
  assertEq('bottom1 wrong = 0', miss.bottom1, 0)
}

section('scorePredictions — Sweden/Norway position')
{
  // Sweden = country 20 → official_rank = 20. Norway = country 23 → official_rank = 23.
  const official = buildMockOfficial()
  assertEq('Sweden exact (60)', scorePredictions({ swedenPos: 20 }, official).sweden, 60)
  assertEq('Sweden ±3 (30)', scorePredictions({ swedenPos: 17 }, official).sweden, 30)
  assertEq('Sweden ±6 (10)', scorePredictions({ swedenPos: 14 }, official).sweden, 10)
  assertEq('Sweden far miss (0)', scorePredictions({ swedenPos: 1 }, official).sweden, 0)
  assertEq('Norway exact (60)', scorePredictions({ norwayPos: 23 }, official).norway, 60)
  assertEq('Norway ±3 (30)', scorePredictions({ norwayPos: 26 }, official).norway, 30)
}

section('scorePredictions — perfect predictions max out')
{
  const official = buildMockOfficial()
  const perfect: Predictions = {
    top1: 1,
    top2: 2,
    top3: 3,
    bottom1: 25,
    swedenPos: 20,
    norwayPos: 23,
  }
  const b = scorePredictions(perfect, official)
  assertEq('perfect prediction total = 370', b.total, 50 * 3 + 100 + 60 + 60)
}

section('calculateFinalScores — end-to-end with DB')
{
  const roomId = 'TEST01'
  const now = Date.now()
  db.prepare('INSERT INTO rooms (id, status, created_at) VALUES (?, ?, ?)').run(roomId, 'closed', now)

  // Two players: Alex (perfect predictions, strong jury), Bo (random/wrong)
  db.prepare('INSERT INTO players (id, room_id, name, predictions, online, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(
    'p_alex',
    roomId,
    'Alex',
    JSON.stringify({ top1: 1, top2: 2, top3: 3, bottom1: 25, swedenPos: 20, norwayPos: 23 }),
    now
  )
  db.prepare('INSERT INTO players (id, room_id, name, predictions, online, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(
    'p_bo',
    roomId,
    'Bo',
    JSON.stringify({ top1: 25, top2: 24, top3: 23, bottom1: 1, swedenPos: 1, norwayPos: 1 }),
    now
  )

  const official = buildMockOfficial()
  const insOfficial = db.prepare(
    'INSERT INTO official_results (room_id, country_id, official_rank, official_points) VALUES (?, ?, ?, ?)'
  )
  for (const r of official) insOfficial.run(roomId, r.countryId, r.officialRank, r.officialPoints)

  // Alex scores all 25 perfectly (matches reference). Bo scores all 25 as "12" (wild over-pick).
  const refs = computeReferenceScores(official)
  const insScore = db.prepare('INSERT INTO scores (player_id, country_id, score) VALUES (?, ?, ?)')
  for (let cid = 1; cid <= 25; cid++) {
    insScore.run('p_alex', cid, refs.get(cid) ?? 0)
    insScore.run('p_bo', cid, 12)
  }

  const finals = calculateFinalScores(roomId)
  console.log('  Final standings:')
  for (const f of finals) {
    console.log(`    #${finals.indexOf(f) + 1} ${f.name}: total ${f.totalScore} (jury ${f.juryAccuracyScore} + pred ${f.predictionScore})`)
  }
  const alex = finals.find((f) => f.playerId === 'p_alex')!
  const bo = finals.find((f) => f.playerId === 'p_bo')!
  assertEq('Alex jury = 250 (perfect 25×10)', alex.juryAccuracyScore, 250)
  assertEq('Alex prediction = 370 (perfect)', alex.predictionScore, 370)
  assertEq('Alex total = 620', alex.totalScore, 620)
  assertEq('Alex ranked first', finals[0].playerId, 'p_alex')
  assertEq('Bo ranked second', finals[1].playerId, 'p_bo')
  // Bo predictions: top1=25 (rank 25, not top3) = 0; top2=24 = 0; top3=23 = 0; bottom1=1 (rank 1) = 0
  // sweden=1, actual 20, diff 19 = 0; norway=1, actual 23, diff 22 = 0
  assertEq('Bo prediction = 0', bo.predictionScore, 0)

  // Verify persisted
  const stored = db.prepare('SELECT player_id, total_score FROM results WHERE room_id = ?').all(roomId) as {
    player_id: string
    total_score: number
  }[]
  assertEq('2 results persisted', stored.length, 2)
}

// Constants sanity
section('country constants')
assertEq('SWEDEN_ID = 20', SWEDEN_ID, 20)
assertEq('NORWAY_ID = 23', NORWAY_ID, 23)

console.log(`\n${failures === 0 ? '✓ all checks passed' : `✗ ${failures} failure(s)`}`)
process.exit(failures === 0 ? 0 : 1)
