import { ALLOWED_SCORES, type Country } from '../lib/types'

interface Props {
  country: Country
  score: number | null
  disabled?: boolean
  onChange: (next: number | null) => void
}

export default function CountryScoreCard({ country, score, disabled, onChange }: Props) {
  return (
    <div className="rounded-xl bg-silver-900/60 border border-silver-700 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl leading-none">{country.flag}</span>
        <div className="min-w-0 flex-1">
          <div className="text-black font-semibold truncate">
            <span className="text-black font-mono mr-2">#{country.id.toString().padStart(2, '0')}</span>
            {country.country}
          </div>
          <div className="text-black text-xs truncate">
            {country.artist} — <span className="italic">{country.song}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {ALLOWED_SCORES.map((value) => {
          const selected = score === value
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(selected ? null : value)}
              className={[
                'h-10 rounded-md font-bold text-sm transition-colors',
                selected
                  ? 'bg-gold-500 text-black'
                  : 'bg-silver-800/80 text-black hover:bg-silver-700 active:bg-silver-600',
                disabled ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {value}
            </button>
          )
        })}
        <button
          type="button"
          disabled={disabled || score === null}
          onClick={() => onChange(null)}
          className={[
            'h-10 rounded-md text-xs col-span-2 transition-colors',
            'bg-silver-800/40 text-black hover:bg-silver-700 active:bg-silver-600',
            disabled || score === null ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          Rensa
        </button>
      </div>
    </div>
  )
}
