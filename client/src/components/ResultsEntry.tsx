import { useMemo, useState } from 'react'
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

export default function ResultsEntry({ countries, initial, disabled, onSubmit }: Props) {
  const [rows, setRows] = useState<ResultRow[]>(() => {
    const byId = new Map(initial?.map((r) => [r.countryId, r]))
    return countries.map((c) => byId.get(c.id) ?? { countryId: c.id, officialRank: null, officialPoints: null })
  })
  const [error, setError] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (a.officialRank == null && b.officialRank == null) return a.countryId - b.countryId
      if (a.officialRank == null) return 1
      if (b.officialRank == null) return -1
      return a.officialRank - b.officialRank
    })
  }, [rows])

  function update(countryId: number, patch: Partial<ResultRow>) {
    setRows((prev) => prev.map((r) => (r.countryId === countryId ? { ...r, ...patch } : r)))
  }

  function handleSubmit() {
    setError(null)
    const seenRanks = new Set<number>()
    for (const r of rows) {
      if (r.officialRank == null || r.officialPoints == null) {
        setError('Fyll i plats och poäng för alla länder')
        return
      }
      if (seenRanks.has(r.officialRank)) {
        setError(`Plats ${r.officialRank} används flera gånger`)
        return
      }
      seenRanks.add(r.officialRank)
    }
    onSubmit(
      rows.map((r) => ({
        countryId: r.countryId,
        officialRank: r.officialRank as number,
        officialPoints: r.officialPoints as number,
      }))
    )
  }

  const totalCountries = countries.length || 25
  const countryById = new Map(countries.map((c) => [c.id, c]))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs uppercase text-silver-400 tracking-wider px-2">
        <span className="col-span-2">Plats</span>
        <span className="col-span-7">Land</span>
        <span className="col-span-3">Poäng</span>
      </div>
      {sorted.map((r) => {
        const c = countryById.get(r.countryId)
        if (!c) return null
        return (
          <div
            key={r.countryId}
            className="grid grid-cols-12 gap-2 items-center rounded-lg bg-silver-900/60 border border-silver-700 px-2 py-2"
          >
            <input
              type="number"
              min={1}
              max={totalCountries}
              value={r.officialRank ?? ''}
              disabled={disabled}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') return update(r.countryId, { officialRank: null })
                const n = Math.max(1, Math.min(totalCountries, Math.round(Number(raw))))
                if (Number.isFinite(n)) update(r.countryId, { officialRank: n })
              }}
              placeholder="#"
              className="col-span-2 rounded-md bg-black/60 border border-silver-700 px-2 py-1.5 text-white text-center font-mono focus:outline-none focus:border-gold-500 disabled:opacity-50"
            />
            <div className="col-span-7 flex items-center gap-2 min-w-0">
              <span className="text-xl leading-none">{c.flag}</span>
              <span className="text-black truncate text-sm">
                {c.country}
                <span className="text-black ml-2 text-xs">#{c.id.toString().padStart(2, '0')}</span>
              </span>
            </div>
            <input
              type="number"
              min={0}
              value={r.officialPoints ?? ''}
              disabled={disabled}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') return update(r.countryId, { officialPoints: null })
                const n = Math.max(0, Math.round(Number(raw)))
                if (Number.isFinite(n)) update(r.countryId, { officialPoints: n })
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
        Spara resultat
      </button>
    </div>
  )
}
