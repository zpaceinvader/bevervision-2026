export interface JuryPerCountry {
  countryId: number
  playerScore: number
  reference: number
  distance: number
  points: number
}

export interface PredictionBreakdown {
  total: number
  top1: number
  top2: number
  top3: number
  bottom1: number
  sweden: number
  norway: number
}

export interface QuizBreakdown {
  total: number
  correctCount: number
}

export interface PlayerFinalScore {
  playerId: string
  name: string
  juryAccuracyScore: number
  predictionScore: number
  quizScore: number
  totalScore: number
  breakdown: {
    jury: { total: number; perCountry: JuryPerCountry[] }
    prediction: PredictionBreakdown
    quiz: QuizBreakdown
  }
}
