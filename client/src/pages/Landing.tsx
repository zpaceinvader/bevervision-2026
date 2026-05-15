import { useEffect, useState } from 'react'

export default function Landing() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error'>('checking')

  useEffect(() => {
    fetch('/api/ping')
      .then((r) => r.json())
      .then((data) => setServerStatus(data.ok ? 'ok' : 'error'))
      .catch(() => setServerStatus('error'))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="font-display text-5xl text-gold-500 mb-2">BEVERVISION</h1>
      <p className="text-purple-300 text-sm mb-12">Eurovision Party Scorer 🦫</p>

      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-gray-400 text-xs">
          Server:{' '}
          <span
            className={
              serverStatus === 'ok'
                ? 'text-green-400'
                : serverStatus === 'error'
                  ? 'text-red-400'
                  : 'text-yellow-400'
            }
          >
            {serverStatus}
          </span>
        </p>
        <p className="text-center text-gray-500 text-sm">(Sprint 1 placeholder — join flow coming in Sprint 3)</p>
      </div>
    </div>
  )
}
