import type { Server, Socket } from 'socket.io'
import { db } from '../db'
import { COUNTRIES } from '../data/countries'
import {
  findPlayer,
  findPlayerBySocket,
  getRoom,
  insertPlayer,
  listRoomPlayers,
  renamePlayer,
  setPlayerSocket,
  type RoomRow,
} from '../rooms'
import { calculateFinalScores } from '../scoring'
import { recordAnswer, resetRoomQuiz, startQuiz } from '../quiz'

interface JoinRoomPayload {
  code: string
  name: string
}

interface RejoinRoomPayload {
  code: string
  playerId: string
}

interface PlayerScorePayload {
  countryId: number
  score: number | null
}

const PREDICTION_FIELDS = ['top1', 'top2', 'top3', 'bottom1', 'swedenPos', 'norwayPos'] as const
type PredictionField = (typeof PREDICTION_FIELDS)[number]

interface PlayerPredictionPayload {
  field: PredictionField
  value: number | null
}

interface HostBasePayload {
  code: string
  password: string
}

interface HostResultsPayload extends HostBasePayload {
  rankings: { countryId: number; officialRank: number; officialPoints: number }[]
}

const MAX_NAME_LEN = 24
const ALLOWED_SCORES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 12])
const TOTAL_COUNTRIES = COUNTRIES.length

function sanitiseName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().slice(0, MAX_NAME_LEN)
  return trimmed.length > 0 ? trimmed : null
}

function normaliseCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.trim().toUpperCase()
  return /^[A-Z0-9]{4,8}$/.test(code) ? code : null
}

function getSocketContext(socket: Socket): { playerId?: string; roomId?: string } {
  return {
    playerId: socket.data.playerId as string | undefined,
    roomId: socket.data.roomId as string | undefined,
  }
}

function readPredictions(playerId: string): Record<string, number | null> {
  const row = db.prepare('SELECT predictions FROM players WHERE id = ?').get(playerId) as
    | { predictions: string }
    | undefined
  if (!row?.predictions) return {}
  try {
    return JSON.parse(row.predictions)
  } catch {
    return {}
  }
}

function countScored(playerId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) as n FROM scores WHERE player_id = ? AND score IS NOT NULL')
    .get(playerId) as { n: number }
  return row.n
}

function authorizeHost(socket: Socket, event: string, payload: HostBasePayload): RoomRow | null {
  const code = normaliseCode(payload?.code)
  if (!code) {
    socket.emit('error_msg', { event, message: 'Invalid room code' })
    return null
  }
  const expected = process.env.HOST_PASSWORD || 'bever2026'
  if (typeof payload?.password !== 'string' || payload.password !== expected) {
    socket.emit('error_msg', { event, message: 'Incorrect password' })
    return null
  }
  const room = getRoom(code)
  if (!room) {
    socket.emit('error_msg', { event, message: 'Room not found' })
    return null
  }
  return room
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join_room', (payload: JoinRoomPayload) => {
      const code = normaliseCode(payload?.code)
      const name = sanitiseName(payload?.name)
      if (!code || !name) {
        socket.emit('error_msg', { event: 'join_room', message: 'Invalid code or name' })
        return
      }
      const room = getRoom(code)
      if (!room) {
        socket.emit('error_msg', { event: 'join_room', message: 'Room not found' })
        return
      }
      const player = insertPlayer(room.id, name, socket.id)
      socket.join(room.id)
      socket.data.playerId = player.id
      socket.data.roomId = room.id

      socket.emit('joined', {
        playerId: player.id,
        name: player.name,
        room: { code: room.id, status: room.status },
        players: listRoomPlayers(room.id),
      })
      socket.to(room.id).emit('player:joined', { player: { id: player.id, name: player.name, online: true } })
    })

    socket.on('rejoin_room', (payload: RejoinRoomPayload) => {
      const code = normaliseCode(payload?.code)
      if (!code || typeof payload?.playerId !== 'string') {
        socket.emit('error_msg', { event: 'rejoin_room', message: 'Invalid payload' })
        return
      }
      const room = getRoom(code)
      if (!room) {
        socket.emit('error_msg', { event: 'rejoin_room', message: 'Room not found' })
        return
      }
      const player = findPlayer(room.id, payload.playerId)
      if (!player) {
        socket.emit('error_msg', { event: 'rejoin_room', message: 'Player not found' })
        return
      }
      setPlayerSocket(player.id, socket.id, true)
      socket.join(room.id)
      socket.data.playerId = player.id
      socket.data.roomId = room.id

      socket.emit('joined', {
        playerId: player.id,
        name: player.name,
        room: { code: room.id, status: room.status },
        players: listRoomPlayers(room.id),
      })
      socket.to(room.id).emit('player:status', { playerId: player.id, online: true })
    })

    socket.on('rename', (payload: { name: string }) => {
      const name = sanitiseName(payload?.name)
      const playerId = socket.data.playerId as string | undefined
      const roomId = socket.data.roomId as string | undefined
      if (!name || !playerId || !roomId) return
      renamePlayer(playerId, name)
      io.to(roomId).emit('player:renamed', { playerId, name })
    })

    socket.on('player:score', (payload: PlayerScorePayload) => {
      const { playerId, roomId } = getSocketContext(socket)
      if (!playerId || !roomId) return
      const room = getRoom(roomId)
      if (!room || room.status !== 'open') {
        socket.emit('error_msg', { event: 'player:score', message: 'Voting is closed' })
        return
      }
      const countryId = Number(payload?.countryId)
      if (!Number.isInteger(countryId) || countryId < 1 || countryId > TOTAL_COUNTRIES) return

      const score = payload?.score
      if (score === null || score === undefined) {
        db.prepare('DELETE FROM scores WHERE player_id = ? AND country_id = ?').run(playerId, countryId)
      } else {
        const n = Number(score)
        if (!Number.isInteger(n) || !ALLOWED_SCORES.has(n)) return
        db.prepare(
          'INSERT INTO scores (player_id, country_id, score) VALUES (?, ?, ?) ON CONFLICT(player_id, country_id) DO UPDATE SET score = excluded.score'
        ).run(playerId, countryId, n)
      }

      const scored = countScored(playerId)
      io.to(roomId).emit('score_progress', { playerId, scored, total: TOTAL_COUNTRIES })
    })

    socket.on('player:prediction', (payload: PlayerPredictionPayload) => {
      const { playerId, roomId } = getSocketContext(socket)
      if (!playerId || !roomId) return
      const room = getRoom(roomId)
      if (!room || room.status !== 'open') {
        socket.emit('error_msg', { event: 'player:prediction', message: 'Voting is closed' })
        return
      }
      const field = payload?.field
      if (!PREDICTION_FIELDS.includes(field)) return

      const current = readPredictions(playerId)
      const rawValue = payload?.value
      if (rawValue === null || rawValue === undefined) {
        delete current[field]
      } else {
        const n = Number(rawValue)
        if (!Number.isInteger(n)) return
        if ((field === 'swedenPos' || field === 'norwayPos') && (n < 1 || n > TOTAL_COUNTRIES)) return
        if ((field === 'top1' || field === 'top2' || field === 'top3' || field === 'bottom1') && (n < 1 || n > TOTAL_COUNTRIES)) return
        current[field] = n
      }
      db.prepare('UPDATE players SET predictions = ? WHERE id = ?').run(JSON.stringify(current), playerId)
      socket.emit('prediction_saved', { field, value: current[field] ?? null })
    })

    socket.on('host:watch', (payload: HostBasePayload) => {
      const room = authorizeHost(socket, 'host:watch', payload)
      if (!room) return
      socket.join(room.id)
      socket.data.hostRoomId = room.id
      socket.emit('host:ack', { event: 'host:watch', code: room.id, status: room.status })
    })

    socket.on('host:close_voting', (payload: HostBasePayload) => {
      const room = authorizeHost(socket, 'host:close_voting', payload)
      if (!room) return
      db.prepare("UPDATE rooms SET status = 'closed' WHERE id = ?").run(room.id)
      io.to(room.id).emit('voting:closed')
      socket.emit('host:ack', { event: 'host:close_voting', code: room.id })
    })

    socket.on('host:enter_results', (payload: HostResultsPayload) => {
      const room = authorizeHost(socket, 'host:enter_results', payload)
      if (!room) return
      const rankings = Array.isArray(payload?.rankings) ? payload.rankings : []
      if (rankings.length !== TOTAL_COUNTRIES) {
        socket.emit('error_msg', { event: 'host:enter_results', message: `Need ${TOTAL_COUNTRIES} entries` })
        return
      }
      const seenCountries = new Set<number>()
      const seenRanks = new Set<number>()
      for (const r of rankings) {
        const cid = Number(r?.countryId)
        const rank = Number(r?.officialRank)
        const pts = Number(r?.officialPoints)
        if (!Number.isInteger(cid) || cid < 1 || cid > TOTAL_COUNTRIES) {
          socket.emit('error_msg', { event: 'host:enter_results', message: 'Invalid country id' })
          return
        }
        if (!Number.isInteger(rank) || rank < 1 || rank > TOTAL_COUNTRIES) {
          socket.emit('error_msg', { event: 'host:enter_results', message: 'Rank must be 1–25' })
          return
        }
        if (!Number.isFinite(pts) || pts < 0) {
          socket.emit('error_msg', { event: 'host:enter_results', message: 'Points must be ≥ 0' })
          return
        }
        if (seenCountries.has(cid) || seenRanks.has(rank)) {
          socket.emit('error_msg', { event: 'host:enter_results', message: 'Duplicate country or rank' })
          return
        }
        seenCountries.add(cid)
        seenRanks.add(rank)
      }

      const replace = db.transaction(() => {
        db.prepare('DELETE FROM official_results WHERE room_id = ?').run(room.id)
        const ins = db.prepare(
          'INSERT INTO official_results (room_id, country_id, official_rank, official_points) VALUES (?, ?, ?, ?)'
        )
        for (const r of rankings) {
          ins.run(room.id, Number(r.countryId), Number(r.officialRank), Math.round(Number(r.officialPoints)))
        }
      })
      replace()
      socket.emit('host:ack', { event: 'host:enter_results', code: room.id })
      io.to(room.id).emit('results:saved')
    })

    socket.on('host:reset_room', (payload: HostBasePayload) => {
      const room = authorizeHost(socket, 'host:reset_room', payload)
      if (!room) return
      const reset = db.transaction(() => {
        db.prepare('DELETE FROM scores WHERE player_id IN (SELECT id FROM players WHERE room_id = ?)').run(room.id)
        db.prepare("UPDATE players SET predictions = '{}' WHERE room_id = ?").run(room.id)
        db.prepare('DELETE FROM official_results WHERE room_id = ?').run(room.id)
        db.prepare('DELETE FROM results WHERE room_id = ?').run(room.id)
        db.prepare("UPDATE rooms SET status = 'open' WHERE id = ?").run(room.id)
      })
      reset()
      resetRoomQuiz(room.id)
      io.to(room.id).emit('room:reset')
      socket.emit('host:ack', { event: 'host:reset_room', code: room.id })
    })

    socket.on('host:trigger_quiz', (payload: HostBasePayload) => {
      const room = authorizeHost(socket, 'host:trigger_quiz', payload)
      if (!room) return
      if (room.status === 'revealed') {
        socket.emit('error_msg', { event: 'host:trigger_quiz', message: 'Topplistan är redan avslöjad' })
        return
      }
      const result = startQuiz(io, room.id)
      if (!result.ok) {
        socket.emit('error_msg', { event: 'host:trigger_quiz', message: result.error })
        return
      }
      socket.emit('host:ack', {
        event: 'host:trigger_quiz',
        code: room.id,
        questionId: result.question.id,
        deadlineMs: result.deadlineMs,
      })
    })

    socket.on('player:quiz_answer', (payload: { questionId: number; answerIndex: number }) => {
      const { playerId, roomId } = getSocketContext(socket)
      if (!playerId || !roomId) return
      const result = recordAnswer(roomId, playerId, Number(payload?.questionId), Number(payload?.answerIndex))
      if (!result.ok) {
        socket.emit('error_msg', { event: 'player:quiz_answer', message: result.reason || 'Kunde inte spara svar' })
        return
      }
      socket.emit('quiz:answer_acked', { questionId: Number(payload.questionId) })
    })

    socket.on('host:reveal_leaderboard', (payload: HostBasePayload) => {
      const room = authorizeHost(socket, 'host:reveal_leaderboard', payload)
      if (!room) return
      const officialCount = db
        .prepare('SELECT COUNT(*) as n FROM official_results WHERE room_id = ?')
        .get(room.id) as { n: number }
      if (officialCount.n !== TOTAL_COUNTRIES) {
        socket.emit('error_msg', { event: 'host:reveal_leaderboard', message: 'Enter results first' })
        return
      }
      const rankings = calculateFinalScores(room.id)
      db.prepare("UPDATE rooms SET status = 'revealed' WHERE id = ?").run(room.id)
      io.to(room.id).emit('leaderboard:reveal', { rankings })
      socket.emit('host:ack', { event: 'host:reveal_leaderboard', code: room.id })
    })

    socket.on('disconnect', () => {
      const player = findPlayerBySocket(socket.id)
      if (!player) return
      setPlayerSocket(player.id, null, false)
      io.to(player.room_id).emit('player:status', { playerId: player.id, online: false })
    })
  })
}
