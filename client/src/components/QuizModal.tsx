import { useEffect, useMemo, useState } from 'react'
import avatarImage from '../../assets/avatar.png'
import { useT } from '../lib/i18n'

export interface QuizQuestion {
  id: number
  prompt: string
  options: string[]
  deadlineMs: number
}

export interface QuizReveal {
  questionId: number
  correctIndex: number
  myAnswer: number | null
}

interface Props {
  question: QuizQuestion
  reveal: QuizReveal | null
  submitting: boolean
  onAnswer: (answerIndex: number) => void
}

export default function QuizModal({ question, reveal, submitting, onAnswer }: Props) {
  const { t } = useT()
  const [picked, setPicked] = useState<number | null>(null)
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, question.deadlineMs - Date.now()))

  useEffect(() => {
    setPicked(null)
  }, [question.id])

  useEffect(() => {
    if (reveal) return
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, question.deadlineMs - Date.now()))
    }, 100)
    return () => clearInterval(id)
  }, [question.deadlineMs, reveal])

  const totalMs = useMemo(() => Math.max(1, question.deadlineMs - (question.deadlineMs - 20_000)), [question.deadlineMs])
  const remainingFrac = reveal ? 0 : Math.min(1, remainingMs / totalMs)

  function pick(idx: number) {
    if (picked != null || reveal) return
    setPicked(idx)
    onAnswer(idx)
  }

  const locked = picked != null || reveal != null || submitting

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-sm">
      <div className="min-h-full flex items-start justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-md rounded-2xl border border-gold-500/60 bg-silver-900/95 shadow-[0_0_60px_rgba(245,158,11,0.35)] p-5 space-y-4">
        <img
          src={avatarImage}
          alt=""
          className="mx-auto -mt-20 w-36 h-36 object-contain"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold">{t('quiz.label')}</span>
          <span className="text-xs font-mono text-silver-300">
            {reveal ? t('quiz.done') : `${Math.ceil(remainingMs / 1000)}s`}
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-silver-800 overflow-hidden">
          <div
            className={[
              'h-full transition-[width] duration-100 ease-linear',
              reveal ? 'bg-silver-600' : 'bg-gold-500',
            ].join(' ')}
            style={{ width: `${remainingFrac * 100}%` }}
          />
        </div>

        <h2 className="text-white text-lg font-semibold leading-snug">{question.prompt}</h2>

        <ul className="space-y-2">
          {question.options.map((option, idx) => {
            const isCorrect = reveal?.correctIndex === idx
            const isMyAnswer = (reveal?.myAnswer ?? picked) === idx
            const isWrongPick = reveal && isMyAnswer && !isCorrect

            const cls = [
              'w-full rounded-xl px-4 py-3 text-left text-sm font-medium border transition-colors',
              reveal
                ? isCorrect
                  ? 'bg-gold-500 border-gold-500 text-black'
                  : isWrongPick
                    ? 'bg-red-900/60 border-red-700 text-red-200'
                    : 'bg-silver-800/60 border-silver-700 text-silver-300'
                : isMyAnswer
                  ? 'bg-gold-500/30 border-gold-500 text-white'
                  : 'bg-silver-800/80 border-silver-700 text-silver-100 hover:bg-silver-700',
              locked && !reveal ? 'opacity-80' : '',
            ].join(' ')

            return (
              <li key={idx}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => pick(idx)}
                  className={cls}
                >
                  <span className="font-mono text-xs mr-3 text-silver-400">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="text-center text-sm">
          {reveal ? (
            (() => {
              const correct = reveal.myAnswer === reveal.correctIndex
              if (reveal.myAnswer == null) return <span className="text-silver-400">{t('quiz.noAnswer')}</span>
              return correct ? (
                <span className="text-gold-400 font-semibold">{t('quiz.correct')}</span>
              ) : (
                <span className="text-red-300">{t('quiz.wrong')}</span>
              )
            })()
          ) : picked != null ? (
            <span className="text-silver-300">{t('quiz.waiting')}</span>
          ) : (
            <span className="text-silver-500">{t('quiz.tapAnswer')}</span>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
