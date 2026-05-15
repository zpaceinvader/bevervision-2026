import { Router } from 'express'
import { db } from '../db'
import { COUNTRIES } from '../data/countries'
import { createRoom, findPlayer, getRoom, listRoomPlayers } from '../rooms'

const router = Router()

router.get('/countries', (_req, res) => {
  res.json({ countries: COUNTRIES })
})

router.post('/rooms', (_req, res) => {
  const room = createRoom()
  res.json({
    code: room.id,
    status: room.status,
    hostUrl: `/host/${room.id}`,
    playerUrl: `/room/${room.id}`,
  })
})

router.get('/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase()
  const room = getRoom(code)
  if (!room) return res.status(404).json({ error: 'room_not_found' })
  res.json({
    code: room.id,
    status: room.status,
    players: listRoomPlayers(room.id),
  })
})

router.get('/rooms/:code/host-overview', (req, res) => {
  const code = req.params.code.toUpperCase()
  const room = getRoom(code)
  if (!room) return res.status(404).json({ error: 'room_not_found' })

  const players = db
    .prepare(
      `SELECT p.id, p.name, p.online,
              (SELECT COUNT(*) FROM scores s WHERE s.player_id = p.id AND s.score IS NOT NULL) AS scored
       FROM players p WHERE p.room_id = ? ORDER BY p.created_at ASC`
    )
    .all(room.id) as { id: string; name: string; online: 0 | 1; scored: number }[]

  const favouriteRow = db
    .prepare(
      `SELECT s.country_id AS countryId, SUM(s.score) AS totalPoints, COUNT(*) AS votes
       FROM scores s
       JOIN players p ON p.id = s.player_id
       WHERE p.room_id = ? AND s.score IS NOT NULL
       GROUP BY s.country_id
       ORDER BY totalPoints DESC, votes DESC, countryId ASC
       LIMIT 1`
    )
    .get(room.id) as { countryId: number; totalPoints: number; votes: number } | undefined

  let crowdFavourite = null
  if (favouriteRow) {
    const country = COUNTRIES.find((c) => c.id === favouriteRow.countryId)
    if (country) {
      crowdFavourite = {
        country,
        totalPoints: favouriteRow.totalPoints,
        votes: favouriteRow.votes,
      }
    }
  }

  res.json({
    code: room.id,
    status: room.status,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      online: p.online === 1,
      scored: p.scored,
      total: COUNTRIES.length,
    })),
    crowdFavourite,
  })
})

router.get('/rooms/:code/results', (req, res) => {
  const code = req.params.code.toUpperCase()
  const room = getRoom(code)
  if (!room) return res.status(404).json({ error: 'room_not_found' })

  const rows = db
    .prepare(
      `SELECT r.player_id AS playerId,
              p.name AS name,
              r.jury_accuracy_score AS juryAccuracyScore,
              r.prediction_score AS predictionScore,
              r.total_score AS totalScore,
              r.breakdown AS breakdown
       FROM results r
       JOIN players p ON p.id = r.player_id
       WHERE r.room_id = ?
       ORDER BY r.total_score DESC`
    )
    .all(room.id) as {
    playerId: string
    name: string
    juryAccuracyScore: number
    predictionScore: number
    totalScore: number
    breakdown: string
  }[]

  if (rows.length === 0) {
    return res.status(404).json({ error: 'no_results_yet', roomStatus: room.status })
  }

  const rankings = rows.map((r) => ({
    playerId: r.playerId,
    name: r.name,
    juryAccuracyScore: r.juryAccuracyScore,
    predictionScore: r.predictionScore,
    totalScore: r.totalScore,
    breakdown: (() => {
      try {
        return JSON.parse(r.breakdown)
      } catch {
        return null
      }
    })(),
  }))
  res.json({ code: room.id, status: room.status, rankings })
})

router.get('/rooms/:code/my-scores', (req, res) => {
  const code = req.params.code.toUpperCase()
  const playerId = String(req.query.playerId || '')
  const room = getRoom(code)
  if (!room) return res.status(404).json({ error: 'room_not_found' })
  const player = findPlayer(room.id, playerId)
  if (!player) return res.status(404).json({ error: 'player_not_found' })

  const rows = db
    .prepare('SELECT country_id as countryId, score FROM scores WHERE player_id = ?')
    .all(player.id) as { countryId: number; score: number | null }[]
  const scores: Record<number, number | null> = {}
  for (const r of rows) scores[r.countryId] = r.score

  let predictions: Record<string, unknown> = {}
  try {
    predictions = player.predictions ? JSON.parse(player.predictions) : {}
  } catch {
    predictions = {}
  }

  res.json({ scores, predictions, roomStatus: room.status })
})

export default router
