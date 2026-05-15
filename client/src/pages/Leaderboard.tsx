import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import LeaderboardReveal from '../components/LeaderboardReveal'
import { getSession } from '../lib/storage'
import type { PlayerFinalScore } from '../lib/leaderboard'

interface LocationState {
  rankings?: PlayerFinalScore[]
}

export default function Leaderboard() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const upperCode = (code ?? '').toUpperCase()
  const fromState = (location.state as LocationState | null)?.rankings ?? null

  const [rankings, setRankings] = useState<PlayerFinalScore[] | null>(fromState)
  const [refetching, setRefetching] = useState(!fromState)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // If we navigated here from the live reveal, animate. If we landed here cold (refresh, late join),
  // show the final state immediately.
  const [skipAnimation] = useState(!fromState)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    if (!upperCode) {
      navigate('/', { replace: true })
      return
    }
    try {
      const stored = sessionStorage.getItem(`bevervision:host:${upperCode}`)
      if (stored) setIsHost(true)
    } catch {
      // ignore
    }
  }, [upperCode, navigate])

  useEffect(() => {
    if (rankings || !upperCode) return
    let alive = true
    setRefetching(true)
    fetch(`/api/rooms/${upperCode}/results`)
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 404) throw new Error('Resultat saknas ännu')
          throw new Error('Kunde inte hämta resultat')
        }
        return r.json()
      })
      .then((data) => {
        if (!alive) return
        setRankings(data.rankings ?? [])
        setRefetching(false)
      })
      .catch((err: Error) => {
        if (!alive) return
        setErrorMsg(err.message)
        setRefetching(false)
      })
    return () => {
      alive = false
    }
  }, [upperCode, rankings])

  const session = upperCode ? getSession(upperCode) : null

  return (
    <div className="min-h-screen pb-20 max-w-xl mx-auto">
      <header className="px-6 pt-6 pb-3 text-center">
        <h1 className="font-display text-4xl text-gold-500 leading-none">BEVERVISION</h1>
        <p className="text-silver-300 text-sm mt-1">
          Topplistan · Rum <span className="font-mono tracking-widest text-white">{upperCode}</span>
        </p>
      </header>

      <main className="px-6 mt-4">
        {refetching && <p className="text-silver-300 text-center py-8">Hämtar resultat…</p>}
        {errorMsg && (
          <div className="rounded-lg bg-red-900/40 border border-red-700 p-4 text-red-200 text-center">
            {errorMsg}
          </div>
        )}
        {rankings && rankings.length > 0 && (
          <LeaderboardReveal rankings={rankings} skipAnimation={skipAnimation} />
        )}
      </main>

      {rankings && rankings.length > 0 && (
        <footer className="px-6 mt-10 flex flex-col gap-3 items-center">
          {isHost ? (
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold px-6 py-3"
            >
              Tillbaka till start
            </button>
          ) : session ? (
            <p className="text-silver-500 text-xs">Tack för att du spelade, {session.name}!</p>
          ) : null}
        </footer>
      )}
    </div>
  )
}
