import { useParams } from 'react-router-dom'

export default function Host() {
  const { code } = useParams()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="font-display text-3xl text-gold-500 mb-2">BEVERVISION</h1>
      <p className="text-purple-300 text-sm mb-8">Host Panel — Room: {code}</p>
      <p className="text-gray-500 text-sm">(Sprint 5 placeholder — host controls coming soon)</p>
    </div>
  )
}
