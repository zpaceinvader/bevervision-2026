import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'

const PASSWORD_KEY = (code: string) => `bevervision:host:${code.toUpperCase()}`

export default function HostCreate() {
  const navigate = useNavigate()
  const { t } = useT()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const pw = password.trim()
    if (!pw) {
      setError(t('hostCreate.enterPassword'))
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.status === 401) {
        setError(t('common.wrongPassword'))
        setBusy(false)
        return
      }
      if (!res.ok) throw new Error('create_failed')
      const data = await res.json()
      const code = data.code as string
      try {
        sessionStorage.setItem(PASSWORD_KEY(code), pw)
      } catch {
        // ignore
      }
      navigate(`/host/${code}`, { replace: true })
    } catch {
      setError(t('common.somethingWrong'))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="font-display text-3xl text-gold-500 mb-2">BEVERVISION</h1>
      <p className="text-silver-300 text-sm mb-8">{t('hostCreate.subtitle')}</p>

      <form onSubmit={create} className="w-full max-w-sm space-y-4">
        <label className="block">
          <span className="text-sm text-silver-300">{t('hostCreate.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-lg bg-silver-900 border border-silver-700 px-3 py-2 text-white focus:outline-none focus:border-gold-500"
          />
        </label>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold py-3"
        >
          {busy ? t('hostCreate.creating') : t('hostCreate.create')}
        </button>
      </form>
    </div>
  )
}
