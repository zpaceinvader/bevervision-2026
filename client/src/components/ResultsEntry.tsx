import { useMemo, useState } from 'react'
import { useT } from '../lib/i18n'
import type { Country } from '../lib/types'

export interface ResultRow {
  countryId: number
  officialRank: number | null
  officialPoints: number | null
}

interface Props {
  countries: Country[]
  initial?: ResultRow[]
  disabled?: boolean
  onSubmit: (rows: { countryId: number; officialRank: number; officialPoints: number }[]) => void
}

interface PointsRow {
  countryId: number
  officialPoints: number | null
}

export default function ResultsEntry({ countries, initial, disabled, onSubmit }: Props) {
  const { t } = useT()
  const [rows, setRows] = useState<PointsRow[]>(() => {
    const byId = new Map(initial?.map((r) => [r.countryId, r]))
    return countries.map((c) => {
      const existing = byId.get(c.id)
      return { countryId: c.id, officialPoints: existing?.officialPoints ?? null }
    })
  })
  const [error, setError] = useState<string | null>(null)

  const rankByCountryId = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const ap = a.officialPoints
      const bp = b.officialPoints
      if (ap == null && bp == null) return a.countryId - b.countryId
      if (ap == null) return 1
      if (bp == null) return -1
      if (bp !== ap) return bp - ap
      return a.countryId - b.countryId
    })
    const map = new Map<number, number | null>()
    sorted.forEach((r, i) => {
      map.set(r.countryId, r.officialPoints == null ? null : i + 1)
    })
    return map
  }, [rows])

  function update(countryId: number, points: number | null) {
    setRows((prev) => prev.map((r) => (r.countryId === countryId ? { ...r, officialPoints: points } : r)))
  }

  function handleSubmit() {
    setError(null)
    if (rows.some((r) => r.officialPoints == null)) {
      setError(t('results.fillAll'))
      return
    }
    const sorted = [...rows].sort((a, b) => {
      const ap = a.officialPoints as number
      const bp = b.officialPoints as number
      if (bp !== ap) return bp - ap
      return a.countryId - b.countryId
    })
    onSubmit(
      sorted.map((r, i) => ({
        countryId: r.countryId,
        officialRank: i + 1,
        officialPoints: r.officialPoints as number,
      }))
    )
  }

  const countryById = new Map(countries.map((c) => [c.id, c]))

  return (
    <div className="space-y-3">
      <p className="text-xs text-silver-400 px-1">
        {t('results.instruction')}
      </p>
      <div className="grid grid-cols-12 gap-2 text-xs uppercase text-silver-400 tracking-wider px-2">
        <span className="col-span-2">{t('results.place')}</span>
        <span className="col-span-7">{t('results.country')}</span>
        <span className="col-span-3">{t('results.points')}</span>
      </div>
      {rows.map((r) => {
        const c = countryById.get(r.countryId)
        if (!c) return null
        const derivedRank = rankByCountryId.get(r.countryId) ?? null
        return (
          <div
            key={r.countryId}
            className="grid grid-cols-12 gap-2 items-center rounded-lg bg-silver-900/60 border border-silver-700 px-2 py-2"
          >
            <div className="col-span-2 text-center font-mono text-gold-400 text-lg">
              {derivedRank == null ? '—' : `#${derivedRank}`}
            </div>
            <div className="col-span-7 flex items-center gap-2 min-w-0">
              <span className="text-xl leading-none">{c.flag}</span>
              <span className="text-silver-100 truncate text-sm">
                {c.country}
                <span className="text-silver-400 ml-2 text-xs">#{c.id.toString().padStart(2, '0')}</span>
              </span>
            </div>
            <input
              type="number"
              min={0}
              value={r.officialPoints ?? ''}
              disabled={disabled}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') return update(r.countryId, null)
                const n = Math.max(0, Math.round(Number(raw)))
                if (Number.isFinite(n)) update(r.countryId, n)
              }}
              placeholder="0"
              className="col-span-3 rounded-md bg-black/60 border border-silver-700 px-2 py-1.5 text-white text-right font-mono focus:outline-none focus:border-gold-500 disabled:opacity-50"
            />
          </div>
        )
      })}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold py-3 disabled:opacity-50"
      >
        {t('results.save')}
      </button>
    </div>
  )
}
