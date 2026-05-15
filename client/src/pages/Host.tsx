import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import HostPasswordPrompt from '../components/HostPasswordPrompt'
import ResultsEntry from '../components/ResultsEntry'
import { useT } from '../lib/i18n'
import { connectSocket } from '../lib/socket'
import type { Country, RoomStatus } from '../lib/types'

interface HostPlayer {
  id: string
  name: string
  online: boolean
  scored: number
  total: number
}

interface CrowdFavourite {
  country: Country
  totalPoints: number
  votes: number
}

interface HostOverview {
  code: string
  status: RoomStatus
  players: HostPlayer[]
  crowdFavourite: CrowdFavourite | null
  quizRemaining: number
  quizActive: boolean
}

const PASSWORD_KEY = (code: string) => `bevervision:host:${code.toUpperCase()}`

export default function Host() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useT()
  const upperCode = (code ?? '').toUpperCase()

  const [password, setPassword] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [overview, setOverview] = useState<HostOverview | null>(null)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [confirmingReveal, setConfirmingReveal] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resultsSaved, setResultsSaved] = useState(false)
  const [statusBanner, setStatusBanner] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [pending, setPending] = useState<null | 'close' | 'save' | 'reveal' | 'reset' | 'quiz'>(null)
  const [quizDeadlineMs, setQuizDeadlineMs] = useState<number | null>(null)
  const [quizCountdown, setQuizCountdown] = useState<number>(0)

  const socket = useMemo(() => connectSocket(), [])
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true })
      return
    }
    try {
      const stored = sessionStorage.getItem(PASSWORD_KEY(upperCode))
      if (stored) setPassword(stored)
    } catch {
      // ignore
    }
  }, [code, navigate, upperCode])

  useEffect(() => {
    let alive = true
    fetch('/api/countries')
      .then((r) => r.json())
      .then((d) => {
        if (alive) setCountries(d.countries ?? [])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const fetchOverview = useCallback(async () => {
    if (!upperCode) return
    try {
      const res = await fetch(`/api/rooms/${upperCode}/host-overview`)
      if (!res.ok) return
      const data: HostOverview = await res.json()
      setOverview(data)
    } catch {
      // ignore
    }
  }, [upperCode])

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => {
      fetchOverview()
    }, 400)
  }, [fetchOverview])

  // Socket: authorise + observe live events
  useEffect(() => {
    if (!password || !upperCode) return

    function onConnect() {
      socket.emit('host:watch', { code: upperCode, password })
    }
    function onHostAck(payload: { event: string; status?: RoomStatus; deadlineMs?: number }) {
      if (payload.event === 'host:watch') {
        setAuthError(null)
        try {
          sessionStorage.setItem(PASSWORD_KEY(upperCode), password!)
        } catch {
          // ignore
        }
        fetchOverview()
      }
      if (payload.event === 'host:close_voting') {
        setStatusBanner({ kind: 'ok', text: t('room.votingClosed') })
        setConfirmingClose(false)
        setPending(null)
        fetchOverview()
      }
      if (payload.event === 'host:enter_results') {
        setResultsSaved(true)
        setStatusBanner({ kind: 'ok', text: t('host.resultsSaved') })
        setPending(null)
      }
      if (payload.event === 'host:reveal_leaderboard') {
        setStatusBanner({ kind: 'ok', text: t('host.revealingLeaderboard') })
        // Leave `pending` set — host should not be able to click again before navigation
      }
      if (payload.event === 'host:reset_room') {
        setStatusBanner({ kind: 'ok', text: t('room.roomReset') })
        setConfirmingReset(false)
        setResultsSaved(false)
        setPending(null)
        setQuizDeadlineMs(null)
        fetchOverview()
      }
      if (payload.event === 'host:trigger_quiz' && typeof payload.deadlineMs === 'number') {
        setStatusBanner({ kind: 'ok', text: t('host.quizSent') })
        setQuizDeadlineMs(payload.deadlineMs)
        fetchOverview()
      }
    }
    function onError(payload: { event: string; message: string }) {
      if (payload.event === 'host:watch') {
        setPassword(null)
        try {
          sessionStorage.removeItem(PASSWORD_KEY(upperCode))
        } catch {
          // ignore
        }
        setAuthError(t('common.wrongPassword'))
        return
      }
      setStatusBanner({ kind: 'error', text: payload.message })
      setPending(null)
    }
    function onProgress() {
      scheduleRefresh()
    }
    function onPlayerEvent() {
      scheduleRefresh()
    }
    function onVotingClosed() {
      setStatusBanner({ kind: 'ok', text: t('room.votingClosed') })
      fetchOverview()
    }
    function onResultsSaved() {
      setResultsSaved(true)
      fetchOverview()
    }
    function onLeaderboardReveal() {
      navigate(`/leaderboard/${upperCode}`, { replace: true })
    }
    function onQuizReveal() {
      setQuizDeadlineMs(null)
      setPending(null)
      fetchOverview()
    }

    socket.on('connect', onConnect)
    socket.on('host:ack', onHostAck)
    socket.on('error_msg', onError)
    socket.on('score_progress', onProgress)
    socket.on('player:joined', onPlayerEvent)
    socket.on('player:status', onPlayerEvent)
    socket.on('player:renamed', onPlayerEvent)
    socket.on('voting:closed', onVotingClosed)
    socket.on('results:saved', onResultsSaved)
    socket.on('leaderboard:reveal', onLeaderboardReveal)
    socket.on('quiz:reveal', onQuizReveal)

    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('host:ack', onHostAck)
      socket.off('error_msg', onError)
      socket.off('score_progress', onProgress)
      socket.off('player:joined', onPlayerEvent)
      socket.off('player:status', onPlayerEvent)
      socket.off('player:renamed', onPlayerEvent)
      socket.off('voting:closed', onVotingClosed)
      socket.off('results:saved', onResultsSaved)
      socket.off('leaderboard:reveal', onLeaderboardReveal)
      socket.off('quiz:reveal', onQuizReveal)
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [password, upperCode, socket, fetchOverview, navigate, scheduleRefresh, t])

  // Countdown ticker for the active quiz badge
  useEffect(() => {
    if (quizDeadlineMs == null) {
      setQuizCountdown(0)
      return
    }
    function tick() {
      setQuizCountdown(Math.max(0, Math.ceil(((quizDeadlineMs as number) - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [quizDeadlineMs])

  if (!code) return null
  if (!password) {
    return (
      <HostPasswordPrompt
        code={upperCode}
        errorMsg={authError}
        onSubmit={(pw) => {
          setAuthError(null)
          setPassword(pw)
        }}
      />
    )
  }

  if (!overview) {
    return (
      <div className="min-h-screen p-6 max-w-xl mx-auto text-silver-300">{t('host.loadingPanel')}</div>
    )
  }

  const onlineCount = overview.players.filter((p) => p.online).length

  function closeVoting() {
    if (pending) return
    setPending('close')
    socket.emit('host:close_voting', { code: upperCode, password })
  }
  function revealLeaderboard() {
    if (pending) return
    setPending('reveal')
    socket.emit('host:reveal_leaderboard', { code: upperCode, password })
  }
  function saveResults(rankings: { countryId: number; officialRank: number; officialPoints: number }[]) {
    if (pending) return
    setPending('save')
    socket.emit('host:enter_results', { code: upperCode, password, rankings })
  }
  function resetRoom() {
    if (pending) return
    setPending('reset')
    socket.emit('host:reset_room', { code: upperCode, password })
  }
  function triggerQuiz() {
    if (pending) return
    setPending('quiz')
    socket.emit('host:trigger_quiz', { code: upperCode, password })
  }

  const quizInFlight = quizDeadlineMs != null && quizDeadlineMs > Date.now()
  const quizDisabled =
    pending !== null ||
    quizInFlight ||
    overview.quizActive ||
    overview.quizRemaining === 0 ||
    overview.status === 'revealed'

  return (
    <div className="min-h-screen pb-24 max-w-xl mx-auto">
      <header className="px-6 pt-6 pb-3 sticky top-0 backdrop-blur-md bg-black/60 z-10 border-b border-silver-800">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl text-gold-500">BEVERVISION</h1>
            <p className="text-silver-300 text-xs">
              {t('host.hostPanel')} · {t('room.roomLabel')} <span className="font-mono tracking-widest text-white">{upperCode}</span>
            </p>
          </div>
          <div className="text-xs text-silver-300 text-right">
            <div>{onlineCount} {t('common.online')}</div>
            <div className="text-silver-500">
              {overview.players.length} {t('host.players')}
            </div>
          </div>
        </div>
      </header>

      {statusBanner && (
        <div
          className={[
            'mx-6 mt-4 rounded-lg px-4 py-2 text-center text-sm font-semibold',
            statusBanner.kind === 'ok' ? 'bg-gold-500 text-black' : 'bg-red-900/60 text-red-200 border border-red-700',
          ].join(' ')}
        >
          {statusBanner.text}
        </div>
      )}

      <section className="px-6 mt-5">
        <h2 className="text-sm uppercase text-silver-300 tracking-wider mb-2">{t('host.popQuiz')}</h2>
        <button
          onClick={triggerQuiz}
          disabled={quizDisabled}
          className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-black font-semibold py-3 flex items-center justify-center gap-3"
        >
          {quizInFlight ? (
            <>
              <span>{t('host.quizInProgress')}</span>
              <span className="font-mono">{quizCountdown}s</span>
            </>
          ) : overview.quizRemaining === 0 ? (
            <span>{t('host.quizOutOfQuestions')}</span>
          ) : (
            <>
              <span>{t('host.sendQuiz')}</span>
              <span className="text-xs font-mono bg-black/30 rounded-full px-2 py-0.5">
                {overview.quizRemaining} {t('host.remaining')}
              </span>
            </>
          )}
        </button>
      </section>

      <section className="px-6 mt-5">
        <h2 className="text-sm uppercase text-silver-300 tracking-wider mb-2">{t('host.crowdFavourite')}</h2>
        {overview.crowdFavourite ? (
          <div className="rounded-xl bg-silver-900/60 border border-silver-700 px-4 py-4 flex items-center gap-4">
            <span className="text-5xl leading-none">{overview.crowdFavourite.country.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-silver-100 text-lg font-semibold truncate">{overview.crowdFavourite.country.country}</div>
              <div className="text-silver-300 text-xs truncate">
                {overview.crowdFavourite.country.artist} — <span className="italic">{overview.crowdFavourite.country.song}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gold-400 text-2xl font-bold">{overview.crowdFavourite.totalPoints}</div>
              <div className="text-silver-500 text-xs">{overview.crowdFavourite.votes} {t('host.votes')}</div>
            </div>
          </div>
        ) : (
          <p className="text-silver-400 text-sm">{t('host.noScoresYet')}</p>
        )}
      </section>

      <section className="px-6 mt-6">
        <h2 className="text-sm uppercase text-silver-300 tracking-wider mb-2">{t('host.playersN', { n: overview.players.length })}</h2>
        {overview.players.length === 0 && <p className="text-silver-400 text-sm">{t('host.noPlayersYet')}</p>}
        <ul className="space-y-2">
          {overview.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-silver-900/60 border border-silver-700 px-4 py-3"
            >
              <span className="text-silver-100 truncate">{p.name}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-silver-200">
                  {p.scored}/{p.total}
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    p.online ? 'bg-green-900/60 text-green-300' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {p.online ? t('common.online') : t('common.offline')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {overview.status === 'open' && (
        <section className="px-6 mt-8">
          {!confirmingClose ? (
            <button
              onClick={() => setConfirmingClose(true)}
              className="w-full rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold py-3"
            >
              {t('host.closeVoting')}
            </button>
          ) : (
            <div className="rounded-lg border border-red-700 bg-red-900/40 p-4 space-y-3">
              <p className="text-red-100 text-sm text-center">
                {t('host.closeVotingConfirm')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirmingClose(false)}
                  className="rounded-lg bg-silver-800/60 text-silver-100 py-2"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={closeVoting}
                  disabled={pending === 'close'}
                  className="rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2"
                >
                  {pending === 'close' ? t('host.closing') : t('host.closeVoting')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {overview.status !== 'open' && (
        <section className="px-6 mt-8 space-y-4">
          <h2 className="text-sm uppercase text-silver-300 tracking-wider">{t('host.officialResults')}</h2>
          {!resultsSaved && (
            <ResultsEntry
              countries={countries}
              onSubmit={saveResults}
              disabled={overview.status === 'revealed' || pending === 'save'}
            />
          )}
          {resultsSaved && overview.status !== 'revealed' && (
            <>
              <p className="text-silver-300 text-sm text-center">{t('host.readyToReveal')}</p>
              {!confirmingReveal ? (
                <button
                  onClick={() => setConfirmingReveal(true)}
                  className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold py-3"
                >
                  {t('host.revealLeaderboard')}
                </button>
              ) : (
                <div className="rounded-lg border border-gold-500 bg-black/40 p-4 space-y-3">
                  <p className="text-silver-100 text-sm text-center">
                    {t('host.revealConfirm')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfirmingReveal(false)}
                      className="rounded-lg bg-silver-800/60 text-silver-100 py-2"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={revealLeaderboard}
                      disabled={pending === 'reveal'}
                      className="rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold py-2"
                    >
                      {pending === 'reveal' ? t('host.going') : t('host.go')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="px-6 mt-12 pt-6 border-t border-silver-800 space-y-3">
        <h2 className="text-xs uppercase text-silver-500 tracking-wider">{t('host.emergencyExit')}</h2>
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            disabled={!!pending}
            className="w-full rounded-lg bg-silver-800/60 hover:bg-silver-700 disabled:opacity-50 text-silver-100 py-2 text-sm border border-silver-700"
          >
            {t('host.resetRoom')}
          </button>
        ) : (
          <div className="rounded-lg border border-silver-700 bg-silver-900/60 p-4 space-y-3">
            <p className="text-silver-200 text-sm text-center">
              {t('host.resetConfirm')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmingReset(false)}
                className="rounded-lg bg-silver-800/60 text-silver-100 py-2"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={resetRoom}
                disabled={pending === 'reset'}
                className="rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2"
              >
                {pending === 'reset' ? t('host.resetting') : t('host.reset')}
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/host')}
          className="w-full rounded-lg bg-silver-800/40 hover:bg-silver-700 text-silver-300 hover:text-silver-100 py-2 text-sm border border-silver-800"
        >
          {t('host.createNewInstead')}
        </button>
      </section>
    </div>
  )
}
