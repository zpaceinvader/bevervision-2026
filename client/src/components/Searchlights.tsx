interface Beam {
  id: number
  left: number
  color: string
  duration: number
  delay: number
  rotFrom: number
  rotTo: number
}

const BEAMS: Beam[] = [
  { id: 0, left: 22, color: 'rgba(255, 255, 255, 0.10)', duration: 14, delay: 0, rotFrom: -24, rotTo: 14 },
  { id: 1, left: 36, color: 'rgba(191, 219, 255, 0.09)', duration: 15, delay: 3.2, rotFrom: -20, rotTo: 12 },
  { id: 2, left: 50, color: 'rgba(229, 229, 229, 0.08)', duration: 16, delay: 2.4, rotFrom: -16, rotTo: 18 },
  { id: 3, left: 64, color: 'rgba(255, 215, 191, 0.09)', duration: 12, delay: 4.0, rotFrom: -18, rotTo: 20 },
  { id: 4, left: 78, color: 'rgba(251, 191, 255, 0.10)', duration: 13, delay: 1.6, rotFrom: -14, rotTo: 22 },
]

export default function Searchlights() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BEAMS.map((b) => (
        <span
          key={b.id}
          className="searchlight"
          style={
            {
              left: `${b.left}%`,
              '--beam-color': b.color,
              '--rot-from': `${b.rotFrom}deg`,
              '--rot-to': `${b.rotTo}deg`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
