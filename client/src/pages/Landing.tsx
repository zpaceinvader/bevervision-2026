import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import headerImage from '../../assets/header.png'
import { useT } from '../lib/i18n'

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useT()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function join() {
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t('landing.enterDisplayName'))
      return
    }
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      setError(t('landing.enterRoomCode'))
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/rooms/${trimmedCode}`)
      if (res.status === 404) {
        setError(t('landing.roomNotFound'))
        setBusy(false)
        return
      }
      if (!res.ok) throw new Error('lookup_failed')
      const data = await res.json()
      navigate(`/room/${data.code as string}`, { state: { name: trimmedName } })
    } catch {
      setError(t('common.somethingWrong'))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <img src={headerImage} alt="Bevervision" className="mb-10 max-w-sm w-full" />

      <div className="w-full max-w-sm space-y-4">
        <label className="block">
          <span className="text-sm text-silver-300">{t('landing.displayName')}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder={t('landing.displayNamePlaceholder')}
            className="mt-1 w-full rounded-lg bg-silver-900 border border-silver-700 px-3 py-2 text-white focus:outline-none focus:border-gold-500"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-sm text-silver-300">{t('landing.roomCode')}</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder={t('landing.roomCodePlaceholder')}
            className="mt-1 w-full rounded-lg bg-silver-900 border border-silver-700 px-3 py-2 text-white font-mono tracking-widest focus:outline-none focus:border-gold-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') join()
            }}
          />
        </label>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          disabled={busy}
          onClick={join}
          className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold py-3"
        >
          {t('landing.joinRoom')}
        </button>
      </div>
    </div>
  )
}
