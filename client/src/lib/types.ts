export interface Country {
  id: number
  flag: string
  country: string
  artist: string
  song: string
}

export type PredictionField = 'top1' | 'top2' | 'top3' | 'bottom1' | 'swedenPos' | 'norwayPos'

export type Predictions = Partial<Record<PredictionField, number | null>>

export type RoomStatus = 'open' | 'closed' | 'revealed'

export const ALLOWED_SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12] as const

export const SWEDEN_ID = 20
export const NORWAY_ID = 23
