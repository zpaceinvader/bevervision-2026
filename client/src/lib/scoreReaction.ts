export type CatKey = 'unimpressed' | 'sexy' | 'cute' | 'suprised' | 'perfect'

export function scoreToCat(score: number | null): CatKey | null {
  if (score == null) return null
  if (score <= 2) return 'unimpressed'
  if (score <= 4) return 'sexy'
  if (score <= 7) return 'cute'
  if (score <= 10) return 'suprised'
  return 'perfect'
}
