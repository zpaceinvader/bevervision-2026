export interface Session {
  code: string
  playerId: string
  name: string
}

const KEY_PREFIX = 'bevervision:session:'

function key(code: string) {
  return KEY_PREFIX + code.toUpperCase()
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(key(session.code), JSON.stringify(session))
  } catch {
    // localStorage disabled (private mode etc.) — silently fall back to ephemeral session
  }
}

export function getSession(code: string): Session | null {
  try {
    const raw = localStorage.getItem(key(code))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.code === 'string' && typeof parsed?.playerId === 'string' && typeof parsed?.name === 'string') {
      return parsed as Session
    }
    return null
  } catch {
    return null
  }
}

export function clearSession(code: string): void {
  try {
    localStorage.removeItem(key(code))
  } catch {
    // ignore
  }
}
