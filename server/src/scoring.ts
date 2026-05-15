import { db } from './db'
import { SWEDEN_ID, NORWAY_ID } from './data/countries'
import { countCorrectAnswers, QUIZ_POINTS_PER_CORRECT } from './quiz'

export interface OfficialResult {
  countryId: number
  officialRank: number
  officialPoints: number
}

export interface PlayerScores {
  [countryId: number]: number | null
}

export interface Predictions {
  top1?: number | null
  top2?: number | null
  top3?: number | null
  bottom1?: number | null
  swedenPos?: number | null
  norwayPos?: number | null
}

export interface JuryBreakdown {
  total: number
  perCountry: { countryId: number; playerScore: number; reference: number; distance: number; points: number }[]
}

export interface PredictionBreakdown {
  total: number
  top1: number
  top2: number
  top3: number
  bottom1: number
  sweden: number
  norway: number
}

const DISTANCE_TO_POINTS: { [d: number]: number } = { 0: 10, 1: 7, 2: 4, 3: 1 }

/**
 * For each country, compute reference = round((points / maxPoints) * 12).
 */
export function computeReferenceScores(results: OfficialResult[]): Map<number, number> {
  const refs = new Map<number, number>()
  if (results.length === 0) return refs
  const maxPoints = Math.max(...results.map((r) => r.officialPoints))
  if (maxPoints <= 0) {
    for (const r of results) refs.set(r.countryId, 0)
    return refs
  }
  for (const r of results) {
    refs.set(r.countryId, Math.round((r.officialPoints / maxPoints) * 12))
  }
  return refs
}

/**
 * Jury accuracy: 10/7/4/1/0 by |player − reference|. Unscored countries skipped (no penalty).
 */
export function scoreJuryAccuracy(scores: PlayerScores, references: Map<number, number>): JuryBreakdown {
  const perCountry: JuryBreakdown['perCountry'] = []
  let total = 0
  for (const [countryIdStr, playerScore] of Object.entries(scores)) {
    if (playerScore === null || playerScore === undefined) continue
    const countryId = Number(countryIdStr)
    const ref = references.get(countryId)
    if (ref === undefined) continue
    const distance = Math.abs(playerScore - ref)
    const points = DISTANCE_TO_POINTS[distance] ?? 0
    total += points
    perCountry.push({ countryId, playerScore, reference: ref, distance, points })
  }
  return { total, perCountry }
}

function scoreTopSlot(
  predictedCountry: number | null | undefined,
  exactPosition: number,
  rankByCountry: Map<number, number>
): number {
  if (!predictedCountry) return 0
  const actualRank = rankByCountry.get(predictedCountry)
  if (actualRank === undefined) return 0
  if (actualRank === exactPosition) return 50
  if (actualRank <= 3) return 20
  return 0
}

function scorePositionPrediction(predicted: number | null | undefined, actual: number | undefined): number {
  if (!predicted || actual === undefined) return 0
  const diff = Math.abs(predicted - actual)
  if (diff === 0) return 60
  if (diff <= 3) return 30
  if (diff <= 6) return 10
  return 0
}

export function scorePredictions(predictions: Predictions, results: OfficialResult[]): PredictionBreakdown {
  const rankByCountry = new Map<number, number>()
  for (const r of results) rankByCountry.set(r.countryId, r.officialRank)
  const totalCountries = results.length || 25
  const bottomRank = Math.max(...results.map((r) => r.officialRank), totalCountries)

  const top1 = scoreTopSlot(predictions.top1, 1, rankByCountry)
  const top2 = scoreTopSlot(predictions.top2, 2, rankByCountry)
  const top3 = scoreTopSlot(predictions.top3, 3, rankByCountry)

  let bottom1 = 0
  if (predictions.bottom1) {
    const r = rankByCountry.get(predictions.bottom1)
    if (r === bottomRank) bottom1 = 100
  }

  const sweden = scorePositionPrediction(predictions.swedenPos, rankByCountry.get(SWEDEN_ID))
  const norway = scorePositionPrediction(predictions.norwayPos, rankByCountry.get(NORWAY_ID))

  return {
    total: top1 + top2 + top3 + bottom1 + sweden + norway,
    top1,
    top2,
    top3,
    bottom1,
    sweden,
    norway,
  }
}

export interface QuizBreakdown {
  total: number
  correctCount: number
}

export interface PlayerFinalScore {
  playerId: string
  name: string
  juryAccuracyScore: number
  predictionScore: number
  quizScore: number
  totalScore: number
  breakdown: { jury: JuryBreakdown; prediction: PredictionBreakdown; quiz: QuizBreakdown }
}

/**
 * Pulls all data for a room from the DB, computes final scores, persists to `results` table,
 * and returns the per-player breakdown sorted by total descending.
 */
export function calculateFinalScores(roomId: string): PlayerFinalScore[] {
  const officialRows = db
    .prepare('SELECT country_id as countryId, official_rank as officialRank, official_points as officialPoints FROM official_results WHERE room_id = ?')
    .all(roomId) as OfficialResult[]

  const players = db
    .prepare('SELECT id, name, predictions FROM players WHERE room_id = ?')
    .all(roomId) as { id: string; name: string; predictions: string }[]

  const references = computeReferenceScores(officialRows)

  const scoreStmt = db.prepare('SELECT country_id as countryId, score FROM scores WHERE player_id = ?')
  const insertResult = db.prepare(
    `INSERT OR REPLACE INTO results (room_id, player_id, jury_accuracy_score, prediction_score, total_score, breakdown)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  const finals: PlayerFinalScore[] = []
  const persist = db.transaction(() => {
    for (const p of players) {
      const rows = scoreStmt.all(p.id) as { countryId: number; score: number | null }[]
      const scores: PlayerScores = {}
      for (const row of rows) scores[row.countryId] = row.score

      const predictions: Predictions = p.predictions ? JSON.parse(p.predictions) : {}
      const jury = scoreJuryAccuracy(scores, references)
      const prediction = scorePredictions(predictions, officialRows)
      const correctCount = countCorrectAnswers(roomId, p.id)
      const quiz: QuizBreakdown = { total: correctCount * QUIZ_POINTS_PER_CORRECT, correctCount }
      const total = jury.total + prediction.total + quiz.total

      insertResult.run(roomId, p.id, jury.total, prediction.total, total, JSON.stringify({ jury, prediction, quiz }))
      finals.push({
        playerId: p.id,
        name: p.name,
        juryAccuracyScore: jury.total,
        predictionScore: prediction.total,
        quizScore: quiz.total,
        totalScore: total,
        breakdown: { jury, prediction, quiz },
      })
    }
  })
  persist()

  finals.sort((a, b) => b.totalScore - a.totalScore)
  return finals
}
