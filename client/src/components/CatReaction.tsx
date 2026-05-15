import { useEffect, useState } from 'react'
import cuteUrl from '../../assets/cute.png'
import perfectUrl from '../../assets/perfect.png'
import sexyUrl from '../../assets/sexy.png'
import suprisedUrl from '../../assets/suprised.png'
import unimpressedUrl from '../../assets/unimpressed.png'
import type { CatKey } from '../lib/scoreReaction'

export const CAT_IMAGE_URLS: Record<CatKey, string> = {
  unimpressed: unimpressedUrl,
  sexy: sexyUrl,
  cute: cuteUrl,
  suprised: suprisedUrl,
  perfect: perfectUrl,
}

export interface Reaction {
  id: number
  cat: CatKey
}

interface Props {
  reaction: Reaction | null
}

const REACTION_DURATION_MS = 1600

const EMOJI_POSITIONS: Array<{ x: number; y: number; delay: number }> = [
  { x: -150, y: -90, delay: 0 },
  { x: 10, y: -160, delay: 60 },
  { x: 150, y: -80, delay: 120 },
  { x: 145, y: 80, delay: 180 },
  { x: -20, y: 155, delay: 240 },
  { x: -155, y: 70, delay: 300 },
]

const CAT_EMOJIS: Record<CatKey, string[]> = {
  unimpressed: ['👎', '🙄', '🥱', '💤', '🤢', '💩'],
  sexy: ['😒', '🙁', '😬', '🤨', '😕', '🫤'],
  cute: ['💕', '🥰', '🌸', '🦋', '🍭', '✨'],
  suprised: ['🤯', '😱', '🤩', '💥', '⚡', '‼️'],
  perfect: ['⭐', '✨', '🌟', '💯', '🎉', '👑'],
}

export default function CatReaction({ reaction }: Props) {
  const [active, setActive] = useState<Reaction | null>(null)

  useEffect(() => {
    if (!reaction) return
    setActive(reaction)
    const timer = setTimeout(() => {
      setActive((current) => (current?.id === reaction.id ? null : current))
    }, REACTION_DURATION_MS)
    return () => clearTimeout(timer)
  }, [reaction])

  if (!active) return null

  const variantClass = active.cat === 'perfect' ? 'cat-reaction-perfect' : 'cat-reaction'
  const emojis = CAT_EMOJIS[active.cat]

  return (
    <div
      key={active.id}
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden ${variantClass}`}
      aria-hidden
    >
      <img
        src={CAT_IMAGE_URLS[active.cat]}
        alt=""
        className="w-64 h-64 max-w-[70vw] max-h-[70vw] object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]"
      />
      {EMOJI_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className="emoji-pop"
          style={{
            top: `calc(50% + ${pos.y}px)`,
            left: `calc(50% + ${pos.x}px)`,
            animationDelay: `${pos.delay}ms`,
          }}
        >
          {emojis[i]}
        </span>
      ))}
    </div>
  )
}
