let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    ctx = new AC()
  } catch {
    ctx = null
  }
  return ctx
}

/**
 * Unlock the AudioContext during a user gesture so later programmatic playback
 * (e.g. when a quiz arrives) doesn't get blocked by mobile autoplay policies.
 * Safe to call repeatedly — no-op once the context is running.
 */
export function warmAudio() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    c.resume().catch(() => {})
  }
}

/**
 * Two-note ascending chime (C5 → E5). Short and unobtrusive — meant to grab
 * attention without becoming annoying after the third or fourth quiz.
 */
export function playQuizChime() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})

  const now = c.currentTime
  const notes: { freq: number; startOffset: number; durationMs: number }[] = [
    { freq: 523.25, startOffset: 0, durationMs: 180 },
    { freq: 659.25, startOffset: 0.12, durationMs: 300 },
  ]

  for (const note of notes) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = note.freq

    const gain = c.createGain()
    const start = now + note.startOffset
    const end = start + note.durationMs / 1000
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, end)

    osc.connect(gain).connect(c.destination)
    osc.start(start)
    osc.stop(end)
  }
}
