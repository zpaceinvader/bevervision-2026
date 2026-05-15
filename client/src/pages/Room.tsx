import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CountryScoreCard from '../components/CountryScoreCard'
import PredictionForm from '../components/PredictionForm'
import { connectSocket } from '../lib/socket'
import { clearSession, getSession, saveSession } from '../lib/storage'
import type { Country, PredictionField, Predictions, RoomStatus } from '../lib/types'
import { useDebouncedEmit } from '../lib/useDebouncedEmit'

interface Player {
  id: string
  name: string
  online: boolean
}

interface JoinedPayload {
  playerId: string
  name: string
  room: { code: string; status: RoomStatus }
  players: Player[]
}

type Tab = 'score' | 'predictions'

export default function Room() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const initialName = (location.state as { name?: string } | null)?.name

  const [status, setStatus] = useState<'connecting' | 'joined' | 'error'>('connecting')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [me, setMe] = useState<{ playerId: string; name: string } | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('open')
  const [savingFlash, setSavingFlash] = useState<string | null>(null)

  const [countries, setCountries] = useState<Country[]>([])
  const [scores, setScores] = useState<Record<number, number | null>>({})
  const [predictions, setPredictions] = useState<Predictions>({})
  const [tab, setTab] = useState<Tab>('score')

  const joinedOnce = useRef(false)
  const socket = useMemo(() => connectSocket(), [])
  const debouncedEmit = useDebouncedEmit(socket, 300)
  const votingLocked = roomStatus !== 'open'
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function flashSaved(text: string) {
    setSavingFlash(text)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setSavingFlash(null), 1500)
  }

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
  }, [])

  useEffect(() => {
    let alive = true
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data) => {
        if (alive) setCountries(data.countries ?? [])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!code) return
    const upperCode = code.toUpperCase()

    function emitJoin() {
      if (joinedOnce.current) return
      joinedOnce.current = true
      const session = getSession(upperCode)
      if (session) {
        socket.emit('rejoin_room', { code: upperCode, playerId: session.playerId })
      } else if (initialName) {
        socket.emit('join_room', { code: upperCode, name: initialName })
      } else {
        navigate('/', { replace: true })
      }
    }

    function onConnect() {
      setReconnecting(false)
      emitJoin()
    }
    function onDisconnect() {
      // Allow re-emit of join/rejoin on the next 'connect' event.
      joinedOnce.current = false
      setReconnecting(true)
    }
    function onJoined(payload: JoinedPayload) {
      setMe({ playerId: payload.playerId, name: payload.name })
      setPlayers(payload.players)
      setRoomStatus(payload.room.status)
      setStatus('joined')
      saveSession({ code: upperCode, playerId: payload.playerId, name: payload.name })

      fetch(`/api/rooms/${upperCode}/my-scores?playerId=${encodeURIComponent(payload.playerId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return
          setScores(data.scores ?? {})
          setPredictions(data.predictions ?? {})
          if (data.roomStatus) setRoomStatus(data.roomStatus)
        })
        .catch(() => {})
    }
    function onPlayerJoined({ player }: { player: Player }) {
      setPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]))
    }
    function onPlayerStatus({ playerId, online }: { playerId: string; online: boolean }) {
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, online } : p)))
    }
    function onPlayerRenamed({ playerId, name }: { playerId: string; name: string }) {
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, name } : p)))
    }
    function onVotingClosed() {
      setRoomStatus('closed')
    }
    function onLeaderboardReveal(payload: { rankings: unknown[] }) {
      navigate(`/leaderboard/${upperCode}`, { state: { rankings: payload.rankings } })
    }
    function onError(payload: { event: string; message: string }) {
      if (payload.event === 'rejoin_room') {
        clearSession(upperCode)
        setStatus('error')
        setErrorMsg(payload.message)
      }
      // Other rejections (e.g. score after close) are silent — the banner already explains why.
    }
    function onScoreProgress({ playerId }: { playerId: string }) {
      // Flash a toast only when it's our own score that was saved
      setMe((current) => {
        if (current && playerId === current.playerId) flashSaved('Poäng sparad')
        return current
      })
    }
    function onPredictionSaved() {
      flashSaved('Gissning sparad')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('joined', onJoined)
    socket.on('player:joined', onPlayerJoined)
    socket.on('player:status', onPlayerStatus)
    socket.on('player:renamed', onPlayerRenamed)
    socket.on('voting:closed', onVotingClosed)
    socket.on('leaderboard:reveal', onLeaderboardReveal)
    socket.on('score_progress', onScoreProgress)
    socket.on('prediction_saved', onPredictionSaved)
    socket.on('error_msg', onError)

    if (socket.connected) emitJoin()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('joined', onJoined)
      socket.off('player:joined', onPlayerJoined)
      socket.off('player:status', onPlayerStatus)
      socket.off('player:renamed', onPlayerRenamed)
      socket.off('voting:closed', onVotingClosed)
      socket.off('leaderboard:reveal', onLeaderboardReveal)
      socket.off('score_progress', onScoreProgress)
      socket.off('prediction_saved', onPredictionSaved)
      socket.off('error_msg', onError)
    }
  }, [code, initialName, navigate, socket])

  function setScore(countryId: number, next: number | null) {
    if (votingLocked) return
    setScores((prev) => ({ ...prev, [countryId]: next }))
    debouncedEmit(`score:${countryId}`, 'player:score', { countryId, score: next })
  }

  function setPrediction(field: PredictionField, value: number | null) {
    if (votingLocked) return
    setPredictions((prev) => ({ ...prev, [field]: value }))
    debouncedEmit(`prediction:${field}`, 'player:prediction', { field, value })
  }

  const scoredCount = Object.values(scores).filter((v) => v != null).length

  if (!code) return null

  return (
    <div className="min-h-screen pb-24 max-w-xl mx-auto">
      <header className="px-6 pt-6 pb-3 sticky top-0 backdrop-blur-md bg-black/60 z-10 border-b border-silver-800">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl text-gold-500">BEVERVISION</h1>
            <p className="text-silver-300 text-xs">
              Rum <span className="font-mono tracking-widest text-white">{code.toUpperCase()}</span>
              {me && <span className="ml-3 text-silver-400">{me.name}</span>}
            </p>
          </div>
          <div className="text-xs text-silver-300 text-right">
            <div>{players.filter((p) => p.online).length} online</div>
            <div className="text-silver-500">
              {scoredCount}/{countries.length || 25} bedömda
            </div>
          </div>
        </div>
      </header>

      {reconnecting && status === 'joined' && (
        <div className="mx-6 mt-4 rounded-lg bg-silver-800/80 border border-silver-700 px-4 py-2 text-center text-sm text-black">
          Återansluter…
        </div>
      )}

      {savingFlash && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-full bg-gold-500 text-black text-sm font-semibold px-4 py-2 shadow-lg pointer-events-none">
          {savingFlash}
        </div>
      )}

      {status === 'connecting' && <p className="text-silver-300 px-6 py-6">Ansluter…</p>}
      {status === 'error' && (
        <div className="m-6 rounded-lg bg-red-900/40 border border-red-700 p-4 text-red-200">
          <p className="font-semibold">Kunde inte ansluta: {errorMsg}</p>
          <button onClick={() => navigate('/')} className="mt-3 text-sm underline text-red-100">
            Tillbaka till start
          </button>
        </div>
      )}

      {status === 'joined' && (
        <>
          {votingLocked && (
            <div className="mx-6 mt-4 rounded-lg bg-gold-500 text-black px-4 py-3 font-bold uppercase text-center tracking-wider">
              Röstningen är stängd
            </div>
          )}

          <nav className="flex gap-2 px-6 mt-4 mb-3 sticky top-[72px] bg-black/60 backdrop-blur-md py-2 z-10">
            <button
              onClick={() => setTab('score')}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
                tab === 'score' ? 'bg-gold-500 text-black' : 'bg-silver-800/60 text-black',
              ].join(' ')}
            >
              Poäng
            </button>
            <button
              onClick={() => setTab('predictions')}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
                tab === 'predictions' ? 'bg-gold-500 text-black' : 'bg-silver-800/60 text-black',
              ].join(' ')}
            >
              Gissningar
            </button>
          </nav>

          {tab === 'score' && (
            <section className="px-6 space-y-3">
              {countries.length === 0 && <p className="text-silver-400 text-sm">Laddar länder…</p>}
              {countries.map((c) => (
                <CountryScoreCard
                  key={c.id}
                  country={c}
                  score={scores[c.id] ?? null}
                  disabled={votingLocked}
                  onChange={(next) => setScore(c.id, next)}
                />
              ))}
            </section>
          )}

          {tab === 'predictions' && (
            <section className="px-6">
              <PredictionForm
                countries={countries}
                predictions={predictions}
                disabled={votingLocked}
                onChange={setPrediction}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}
