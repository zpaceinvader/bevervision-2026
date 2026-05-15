import { useEffect, useRef, useState } from 'react'
import type { PlayerFinalScore } from '../lib/leaderboard'

interface Props {
  rankings: PlayerFinalScore[]
  initialDelayMs?: number
  stepMs?: number
  skipAnimation?: boolean
}

/**
 * Reveals player cards bottom (last place) → top (winner) one at a time.
 * Each card mounts after a delay; the winner reveal lingers slightly longer
 * and uses gold styling + scale fanfare.
 */
export default function LeaderboardReveal({
  rankings,
  initialDelayMs = 800,
  stepMs = 1800,
  skipAnimation,
}: Props) {
  const totalPlaces = rankings.length
  const [revealedRanks, setRevealedRanks] = useState<number>(skipAnimation ? totalPlaces : 0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (skipAnimation) {
      setRevealedRanks(totalPlaces)
      return
    }
    setRevealedRanks(0)
    timers.current.forEach(clearTimeout)
    timers.current = []
    for (let i = 0; i < totalPlaces; i++) {
      const delay = initialDelayMs + i * stepMs
      const t = setTimeout(() => setRevealedRanks((n) => Math.max(n, i + 1)), delay)
      timers.current.push(t)
    }
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [totalPlaces, initialDelayMs, stepMs, skipAnimation])

  if (totalPlaces === 0) {
    return <p className="text-silver-300 text-center py-8">Inga resultat ännu.</p>
  }

  return (
    <ol className="space-y-3">
      {rankings.map((player, idx) => {
        const rank = idx + 1
        // We reveal from the bottom upward: last place is rank=totalPlaces, revealed first.
        const revealOrder = totalPlaces - rank // 0 = bottom, totalPlaces-1 = winner
        const isVisible = revealOrder < revealedRanks
        const isWinner = rank === 1
        return (
          <li
            key={player.playerId}
            aria-hidden={!isVisible}
            className={[
              'transition-all duration-700 ease-out will-change-transform',
              isVisible
                ? isWinner
                  ? 'opacity-100 translate-y-0 scale-105'
                  : 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95',
            ].join(' ')}
          >
            <PlayerCard rank={rank} player={player} isWinner={isWinner} />
          </li>
        )
      })}
    </ol>
  )
}

function PlayerCard({ rank, player, isWinner }: { rank: number; player: PlayerFinalScore; isWinner: boolean }) {
  return (
    <div
      className={[
        'rounded-2xl px-5 py-4 border',
        isWinner
          ? 'bg-gradient-to-br from-gold-400 to-gold-600 border-gold-500 shadow-[0_0_40px_rgba(245,158,11,0.55)]'
          : 'bg-silver-900/70 border-silver-700',
      ].join(' ')}
    >
      <div className="flex items-center gap-4">
        <div
          className={[
            'shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display text-2xl',
            isWinner ? 'bg-black text-gold-400' : 'bg-silver-800 text-gold-400',
          ].join(' ')}
        >
          #{rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className={['text-lg font-bold truncate', isWinner ? 'text-black' : 'text-black'].join(' ')}>
            {player.name}
          </div>
          <div className={['text-xs', isWinner ? 'text-black/80' : 'text-black'].join(' ')}>
            Jury {player.juryAccuracyScore} · Gissning {player.predictionScore}
          </div>
        </div>
        <div className="text-right">
          <div
            className={[
              'font-display leading-none',
              isWinner ? 'text-black text-4xl' : 'text-gold-400 text-3xl',
            ].join(' ')}
          >
            {player.totalScore}
          </div>
          <div className={['text-[10px] uppercase tracking-wider', isWinner ? 'text-black/70' : 'text-black'].join(' ')}>
            poäng
          </div>
        </div>
      </div>
    </div>
  )
}
