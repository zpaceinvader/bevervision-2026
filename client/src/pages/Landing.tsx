import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import headerImage from '../../assets/header.png'

export default function Landing() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go(mode: 'join' | 'create') {
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Ange ett visningsnamn')
      return
    }
    setBusy(true)
    try {
      let roomCode: string
      if (mode === 'create') {
        const res = await fetch('/api/rooms', { method: 'POST' })
        if (!res.ok) throw new Error('create_failed')
        const data = await res.json()
        roomCode = data.code as string
      } else {
        const trimmedCode = code.trim().toUpperCase()
        if (!trimmedCode) {
          setError('Ange en rumskod')
          setBusy(false)
          return
        }
        const res = await fetch(`/api/rooms/${trimmedCode}`)
        if (res.status === 404) {
          setError('Rummet hittades inte')
          setBusy(false)
          return
        }
        if (!res.ok) throw new Error('lookup_failed')
        const data = await res.json()
        roomCode = data.code as string
      }
      navigate(`/room/${roomCode}`, { state: { name: trimmedName } })
    } catch {
      setError('Något gick fel — försök igen')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <img src={headerImage} alt="Bevervision" className="mb-10 max-w-sm w-full" />

      <div className="w-full max-w-sm space-y-4">
        <label className="block">
          <span className="text-sm text-silver-300">Visningsnamn</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Ditt namn"
            className="mt-1 w-full rounded-lg bg-silver-900 border border-silver-700 px-3 py-2 text-black focus:outline-none focus:border-gold-500"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-sm text-silver-300">Rumskod</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="t.ex. ABCD23"
            className="mt-1 w-full rounded-lg bg-silver-900 border border-silver-700 px-3 py-2 text-black font-mono tracking-widest focus:outline-none focus:border-gold-500"
          />
        </label>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          disabled={busy}
          onClick={() => go('join')}
          className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold py-3"
        >
          Gå med i rum
        </button>

        <div className="flex items-center gap-3 text-silver-400 text-xs uppercase">
          <div className="h-px flex-1 bg-silver-700" />
          eller
          <div className="h-px flex-1 bg-silver-700" />
        </div>

        <button
          disabled={busy}
          onClick={() => go('create')}
          className="w-full rounded-lg bg-silver-800 hover:bg-silver-700 disabled:opacity-50 text-black py-3 border border-silver-600"
        >
          Skapa nytt rum
        </button>
      </div>
    </div>
  )
}
