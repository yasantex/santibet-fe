export type BetType = 'market' | 'limit'

export type BetStatus =
  | 'PENDING'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED'

export type PositionStatusApi = 'open' | 'closed' | 'settled'

export interface Money {
  amount: string
  currency: string
}

/** Compact market summary embedded on bet/position payloads (removes N+1 lookups). */
export interface MarketSummary {
  id: string
  title: string
  slug: string
  imageUrl: string | null
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
  market?: MarketSummary | null
  outcomeLabel?: string | null
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
  /** ₦1-unit share count (API ledger unit). Use for money math only. */
  shares: string
  /** ₦100-settling contract count (= shares ÷ 100). Preferred for display. */
  contracts?: string | number | null
  avgPrice: string
  currentValue: Money
  market?: MarketSummary | null
  outcomeLabel?: string | null
  openedAt: string
}

export interface BetPositionListResponse {
  data: BetPosition[]
  nextCursor: string | null
}
