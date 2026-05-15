import { useState } from 'react'
import { useT } from '../lib/i18n'

interface Props {
  code: string
  onSubmit: (password: string) => void
  errorMsg?: string | null
}

export default function HostPasswordPrompt({ code, onSubmit, errorMsg }: Props) {
  const { t } = useT()
  const [password, setPassword] = useState('')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="font-display text-3xl text-gold-500 mb-2">BEVERVISION</h1>
      <p className="text-silver-300 text-sm mb-8">
        {t('hostPrompt.subtitle')} <span className="font-mono tracking-widest text-white">{code}</span>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (password.trim()) onSubmit(password.trim())
        }}
        className="w-full max-w-sm space-y-4"
      >
        <label className="block">
          <span className="text-sm text-silver-200">{t('hostCreate.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-lg bg-silver-900/70 border border-silver-700 px-3 py-2 text-black focus:outline-none focus:border-gold-500"
          />
        </label>
        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold py-3"
        >
          {t('hostPrompt.login')}
        </button>
      </form>
    </div>
  )
}
