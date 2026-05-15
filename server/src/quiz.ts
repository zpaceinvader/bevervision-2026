import type { Server, Socket } from 'socket.io'
import { db } from './db'
import { QUIZ_QUESTIONS, type QuizQuestion } from './data/quiz'

export const QUIZ_DURATION_MS = 20_000
export const QUIZ_POINTS_PER_CORRECT = 5

interface ActiveQuiz {
  roomId: string
  question: QuizQuestion
  deadlineMs: number
  timer: ReturnType<typeof setTimeout>
}

const activeQuizzes = new Map<string, ActiveQuiz>()

export function quizRemaining(roomId: string): number {
  const row = db.prepare('SELECT quiz_index FROM rooms WHERE id = ?').get(roomId) as
    | { quiz_index: number }
    | undefined
  if (!row) return 0
  return Math.max(0, QUIZ_QUESTIONS.length - row.quiz_index)
}

export function isQuizActive(roomId: string): boolean {
  return activeQuizzes.has(roomId)
}

export function getActiveQuiz(roomId: string): ActiveQuiz | undefined {
  return activeQuizzes.get(roomId)
}

export function startQuiz(io: Server, roomId: string): { ok: true; question: QuizQuestion; deadlineMs: number } | { ok: false; error: string } {
  if (activeQuizzes.has(roomId)) {
    return { ok: false, error: 'Quiz already running' }
  }
  const row = db.prepare('SELECT quiz_index FROM rooms WHERE id = ?').get(roomId) as
    | { quiz_index: number }
    | undefined
  if (!row) return { ok: false, error: 'Room not found' }
  const nextIndex = row.quiz_index
  if (nextIndex >= QUIZ_QUESTIONS.length) {
    return { ok: false, error: 'No more quiz questions' }
  }
  const question = QUIZ_QUESTIONS[nextIndex]
  const deadlineMs = Date.now() + QUIZ_DURATION_MS

  db.prepare('UPDATE rooms SET quiz_index = quiz_index + 1 WHERE id = ?').run(roomId)

  const timer = setTimeout(() => revealQuiz(io, roomId), QUIZ_DURATION_MS)
  activeQuizzes.set(roomId, { roomId, question, deadlineMs, timer })

  io.to(roomId).emit('quiz:question', {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    deadlineMs,
  })
  return { ok: true, question, deadlineMs }
}

export function recordAnswer(
  roomId: string,
  playerId: string,
  questionId: number,
  answerIndex: number
): { ok: boolean; reason?: string; everyoneAnswered?: boolean } {
  const active = activeQuizzes.get(roomId)
  if (!active) return { ok: false, reason: 'No active quiz' }
  if (active.question.id !== questionId) return { ok: false, reason: 'Wrong question id' }
  if (Date.now() > active.deadlineMs) return { ok: false, reason: 'Deadline passed' }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= active.question.options.length) {
    return { ok: false, reason: 'Invalid answer index' }
  }

  db.prepare(
    `INSERT INTO quiz_answers (room_id, player_id, question_id, answer_index, answered_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(room_id, player_id, question_id)
     DO UPDATE SET answer_index = excluded.answer_index, answered_at = excluded.answered_at`
  ).run(roomId, playerId, questionId, answerIndex, Date.now())

  // If every online player has answered, we could end early — but counting "online"
  // is racy and the host expects roughly 20s of suspense. Leave the timer to fire.
  return { ok: true, everyoneAnswered: false }
}

export function revealQuiz(io: Server, roomId: string) {
  const active = activeQuizzes.get(roomId)
  if (!active) return
  clearTimeout(active.timer)
  activeQuizzes.delete(roomId)

  const rows = db
    .prepare(
      'SELECT player_id as playerId, answer_index as answerIndex FROM quiz_answers WHERE room_id = ? AND question_id = ?'
    )
    .all(roomId, active.question.id) as { playerId: string; answerIndex: number }[]

  const results = rows.map((r) => ({
    playerId: r.playerId,
    answerIndex: r.answerIndex,
    correct: r.answerIndex === active.question.correctIndex,
  }))

  io.to(roomId).emit('quiz:reveal', {
    questionId: active.question.id,
    correctIndex: active.question.correctIndex,
    results,
  })
}

export function resetRoomQuiz(roomId: string) {
  const active = activeQuizzes.get(roomId)
  if (active) {
    clearTimeout(active.timer)
    activeQuizzes.delete(roomId)
  }
  db.prepare('UPDATE rooms SET quiz_index = 0 WHERE id = ?').run(roomId)
  db.prepare('DELETE FROM quiz_answers WHERE room_id = ?').run(roomId)
}

export function countCorrectAnswers(roomId: string, playerId: string): number {
  const rows = db
    .prepare(
      'SELECT question_id as questionId, answer_index as answerIndex FROM quiz_answers WHERE room_id = ? AND player_id = ?'
    )
    .all(roomId, playerId) as { questionId: number; answerIndex: number }[]
  let correct = 0
  for (const row of rows) {
    const q = QUIZ_QUESTIONS.find((qq) => qq.id === row.questionId)
    if (q && row.answerIndex === q.correctIndex) correct++
  }
  return correct
}
