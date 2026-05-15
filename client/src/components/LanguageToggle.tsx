import SE from 'country-flag-icons/react/3x2/SE'
import NO from 'country-flag-icons/react/3x2/NO'
import GB from 'country-flag-icons/react/3x2/GB'
import { useT, type Lang } from '../lib/i18n'

const OPTIONS: { code: Lang; Flag: typeof SE; label: string }[] = [
  { code: 'sv', Flag: SE, label: 'Svenska' },
  { code: 'no', Flag: NO, label: 'Norsk' },
  { code: 'en', Flag: GB, label: 'English' },
]

export default function LanguageToggle() {
  const { lang, setLang } = useT()
  return (
    <div className="inline-flex gap-1 rounded-full bg-black/70 backdrop-blur-md ">
      {OPTIONS.map(({ code, Flag, label }) => {
        const active = lang === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-label={label}
            aria-pressed={active}
            className={[
              'h-7 w-7 rounded-full overflow-hidden transition-opacity flex items-center justify-center',
              active ? 'ring-2 ring-gold-500 opacity-100' : 'opacity-50 hover:opacity-100',
            ].join(' ')}
          >
            <Flag className="scale-150 w-full h-full object-cover" title={label} />
          </button>
        )
      })}
    </div>
  )
}
