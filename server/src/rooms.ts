import crypto from 'crypto'
import { db } from './db'

export interface RoomRow {
  id: string
  status: 'open' | 'closed' | 'revealed'
  created_at: number
}

export interface PlayerRow {
  id: string
  room_id: string
  name: string
  socket_id: string | null
  predictions: string
  online: 0 | 1
  created_at: number
}

export interface PublicPlayer {
  id: string
  name: string
  online: boolean
}

// 6 chars, uppercase, no easily confused glyphs (no 0/O, 1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let out = ''
  const buf = crypto.randomBytes(6)
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length]
  return out
}

export function createRoom(): RoomRow {
  const ins = db.prepare('INSERT INTO rooms (id, status, created_at) VALUES (?, ?, ?)')
  // Loop in case of (extremely unlikely) code collision
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode()
    try {
      const now = Date.now()
      ins.run(code, 'open', now)
      return { id: code, status: 'open', created_at: now }
    } catch (err: any) {
      if (err?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') continue
      throw err
    }
  }
  throw new Error('Failed to allocate a unique room code')
}

export function getRoom(code: string): RoomRow | undefined {
  return db.prepare('SELECT id, status, created_at FROM rooms WHERE id = ?').get(code) as RoomRow | undefined
}

export function listRoomPlayers(roomId: string): PublicPlayer[] {
  const rows = db
    .prepare('SELECT id, name, online FROM players WHERE room_id = ? ORDER BY created_at ASC')
    .all(roomId) as { id: string; name: string; online: 0 | 1 }[]
  return rows.map((r) => ({ id: r.id, name: r.name, online: r.online === 1 }))
}

export function findPlayer(roomId: string, playerId: string): PlayerRow | undefined {
  return db
    .prepare('SELECT * FROM players WHERE room_id = ? AND id = ?')
    .get(roomId, playerId) as PlayerRow | undefined
}

export function findPlayerBySocket(socketId: string): PlayerRow | undefined {
  return db.prepare('SELECT * FROM players WHERE socket_id = ?').get(socketId) as PlayerRow | undefined
}

export function insertPlayer(roomId: string, name: string, socketId: string): PlayerRow {
  const id = 'p_' + crypto.randomBytes(8).toString('hex')
  const now = Date.now()
  db.prepare(
    'INSERT INTO players (id, room_id, name, socket_id, predictions, online, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
  ).run(id, roomId, name, socketId, '{}', now)
  return {
    id,
    room_id: roomId,
    name,
    socket_id: socketId,
    predictions: '{}',
    online: 1,
    created_at: now,
  }
}

export function setPlayerSocket(playerId: string, socketId: string | null, online: boolean) {
  db.prepare('UPDATE players SET socket_id = ?, online = ? WHERE id = ?').run(socketId, online ? 1 : 0, playerId)
}

export function renamePlayer(playerId: string, name: string) {
  db.prepare('UPDATE players SET name = ? WHERE id = ?').run(name, playerId)
}
