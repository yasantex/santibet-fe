export type BetType = 'market' | 'limit'

export type BetStatus =
  | 'PENDING'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED'

export type PositionStatusApi = 'OPEN' | 'CLOSED' | 'SETTLED'

export interface Money {
  amount: string
  currency: string
}

export interface PlaceBetPayload {
  marketId: string
  outcomeId: string
  stake: string
  type: BetType
  limitPrice?: number
  clientOrderId?: string
}

export interface Bet {
  id: string
  marketId: string
  outcomeId: string
  status: BetStatus
  type: BetType
  price: string
  odds: string
  shares: string
  stake: Money
  potentialReturn: Money
  filledShares: string
  createdAt: string
}

export interface BetListResponse {
  data: Bet[]
  nextCursor: string | null
}

export interface BetPosition {
  id: string
  marketId: string
  outcomeId: string
  status: PositionStatusApi
  shares: string
  avgPrice: string
  currentValue: Money
  openedAt: string
}

export interface BetPositionListResponse {
  data: BetPosition[]
  nextCursor: string | null
}
