import { useT } from '../lib/i18n'
import { NORWAY_ID, SWEDEN_ID, type Country, type PredictionField, type Predictions } from '../lib/types'

interface Props {
  countries: Country[]
  predictions: Predictions
  disabled?: boolean
  onChange: (field: PredictionField, value: number | null) => void
}

function CountryDropdown({
  value,
  countries,
  disabled,
  onChange,
}: {
  value: number | null | undefined
  countries: Country[]
  disabled?: boolean
  onChange: (next: number | null) => void
}) {
  const { t } = useT()
  return (
    <select
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-full rounded-lg bg-silver-900/70 border border-silver-700 px-3 py-2 text-black focus:outline-none focus:border-gold-500 disabled:opacity-50"
    >
      <option value="">{t('pred.select')}</option>
      {countries.map((c) => (
        <option key={c.id} value={c.id}>
          {c.flag} {c.country}
        </option>
      ))}
    </select>
  )
}

function PositionInput({
  value,
  total,
  disabled,
  onChange,
}: {
  value: number | null | undefined
  total: number
  disabled?: boolean
  onChange: (next: number | null) => void
}) {
  return (
    <input
      type="number"
      min={1}
      max={total}
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') return onChange(null)
        const n = Math.max(1, Math.min(total, Math.round(Number(raw))))
        if (Number.isFinite(n)) onChange(n)
      }}
      placeholder={`1 – ${total}`}
      className="w-full rounded-lg bg-silver-900/70 border border-silver-700 px-3 py-2 text-black focus:outline-none focus:border-gold-500 disabled:opacity-50"
    />
  )
}

export default function PredictionForm({ countries, predictions, disabled, onChange }: Props) {
  const { t } = useT()
  const sweden = countries.find((c) => c.id === SWEDEN_ID)
  const norway = countries.find((c) => c.id === NORWAY_ID)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm uppercase text-silver-300 tracking-wider mb-3">{t('pred.top3')}</h3>
        <div className="space-y-3">
          {(['top1', 'top2', 'top3'] as const).map((field, i) => (
            <label key={field} className="block">
              <span className="text-xs text-silver-400">#{i + 1}</span>
              <CountryDropdown
                value={predictions[field]}
                countries={countries}
                disabled={disabled}
                onChange={(v) => onChange(field, v)}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase text-silver-300 tracking-wider mb-3">{t('pred.lastPlace')}</h3>
        <CountryDropdown
          value={predictions.bottom1}
          countries={countries}
          disabled={disabled}
          onChange={(v) => onChange('bottom1', v)}
        />
      </div>

      <div>
        <h3 className="text-sm uppercase text-silver-300 tracking-wider mb-3">{t('pred.bonusGuesses')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-silver-400">
              {sweden?.flag ?? '🇸🇪'} {t('pred.swedenFinish')}
            </span>
            <PositionInput
              value={predictions.swedenPos}
              total={countries.length || 25}
              disabled={disabled}
              onChange={(v) => onChange('swedenPos', v)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-silver-400">
              {norway?.flag ?? '🇳🇴'} {t('pred.norwayFinish')}
            </span>
            <PositionInput
              value={predictions.norwayPos}
              total={countries.length || 25}
              disabled={disabled}
              onChange={(v) => onChange('norwayPos', v)}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
