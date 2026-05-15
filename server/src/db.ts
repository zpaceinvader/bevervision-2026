import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { COUNTRIES } from './data/countries'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'bevervision.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'open',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      name TEXT NOT NULL,
      socket_id TEXT,
      predictions TEXT NOT NULL DEFAULT '{}',
      online INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY,
      flag TEXT NOT NULL,
      country TEXT NOT NULL,
      artist TEXT NOT NULL,
      song TEXT NOT NULL,
      performance_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS official_results (
      room_id TEXT NOT NULL,
      country_id INTEGER NOT NULL,
      official_rank INTEGER NOT NULL,
      official_points INTEGER NOT NULL,
      PRIMARY KEY (room_id, country_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (country_id) REFERENCES countries(id)
    );

    CREATE TABLE IF NOT EXISTS scores (
      player_id TEXT NOT NULL,
      country_id INTEGER NOT NULL,
      score INTEGER,
      PRIMARY KEY (player_id, country_id),
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      FOREIGN KEY (country_id) REFERENCES countries(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      room_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      jury_accuracy_score INTEGER NOT NULL,
      prediction_score INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      breakdown TEXT NOT NULL,
      PRIMARY KEY (room_id, player_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      room_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      answer_index INTEGER NOT NULL,
      answered_at INTEGER NOT NULL,
      PRIMARY KEY (room_id, player_id, question_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `)

  // Migration: add quiz_index to rooms if missing (older DBs predate Sprint 10).
  const roomCols = db.prepare('PRAGMA table_info(rooms)').all() as { name: string }[]
  if (!roomCols.some((c) => c.name === 'quiz_index')) {
    db.exec('ALTER TABLE rooms ADD COLUMN quiz_index INTEGER NOT NULL DEFAULT 0')
  }
}

function seedCountries() {
  const count = db.prepare('SELECT COUNT(*) as n FROM countries').get() as { n: number }
  if (count.n > 0) return

  const insert = db.prepare(
    'INSERT INTO countries (id, flag, country, artist, song, performance_order) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertAll = db.transaction((countries: typeof COUNTRIES) => {
    for (const c of countries) {
      insert.run(c.id, c.flag, c.country, c.artist, c.song, c.id)
    }
  })
  insertAll(COUNTRIES)
  console.log(`[db] seeded ${COUNTRIES.length} countries`)
}

export function initDb() {
  createTables()
  seedCountries()
  console.log(`[db] ready at ${DB_PATH}`)
}
