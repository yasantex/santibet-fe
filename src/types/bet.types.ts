import type { BonusQuote, FundedBy } from './bonus.types'

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

export type PositionResult = 'WON' | 'LOST' | 'CASHED_OUT'

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
  /** Stake bonus credit instead of cash. Market bets only. */
  useBonus?: boolean
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
  /** Whether the stake came from cash or bonus credit. */
  fundedBy?: FundedBy
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
  /** Only present once a position is SETTLED or CLOSED. */
  result?: PositionResult | null
  /** ₦1-unit share count (API ledger unit). Use for money math only. */
  shares: string
  /** ₦100-settling contract count (= shares ÷ 100). Preferred for display. */
  contracts?: string | number | null
  avgPrice: string
  currentPrice?: string
  stake?: Money
  potentialReturn?: Money
  /** Live mark-to-market value; null once the position is settled/closed. */
  currentValue: Money | null
  /** Live P&L while OPEN; null once settled/closed. */
  unrealizedPnl?: Money | null
  /** Final P&L once SETTLED or CLOSED; null while still OPEN. */
  realizedPnl?: Money | null
  market?: MarketSummary | null
  outcomeLabel?: string | null
  /** Bonus-funded positions cannot be cashed out. */
  fundedBy?: FundedBy
  openedAt: string
  settledAt?: string | null
}

export interface BetPositionListResponse {
  data: BetPosition[]
  nextCursor: string | null
}

/** Read-only estimate of what a position would return if cashed out now. */
export interface CashOutQuote {
  /** Contracts/quantity being sold. */
  quantity: string | number
  /** Price the position would sell at. */
  sellPrice: string | number
  /** Estimated proceeds, in kobo (minor units). */
  valueMinor: string | number
  currency: string
}

export type BetQuotePayload = PlaceBetPayload

/** `POST /bets/quote` — only the fields the UI reads. */
export interface BetQuote {
  marketId: string
  outcomeId: string
  price: string | null
  shares: string | null
  potentialReturn: Money
  profit?: Money
  /** Present only when the quote was asked with `useBonus: true`. */
  bonus?: BonusQuote | null
}
