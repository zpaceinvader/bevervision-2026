import { useMemo } from 'react'

interface Sparkle {
  id: number
  top: number
  left: number
  size: number
  delay: number
  duration: number
  gold: boolean
}

const COUNT = 60

export default function Sparkles() {
  const sparkles = useMemo<Sparkle[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 4,
        gold: Math.random() < 0.3,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            backgroundColor: s.gold ? '#fbbf24' : '#E5E5E5',
            boxShadow: s.gold
              ? '0 0 6px 1px rgba(251, 191, 36, 0.6)'
              : '0 0 4px 1px rgba(229, 229, 229, 0.5)',
          }}
        />
      ))}
    </div>
  )
}
