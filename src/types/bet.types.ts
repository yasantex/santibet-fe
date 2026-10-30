import type { ExecutionModel } from './market.types'

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

export type PositionResult = 'WON' | 'LOST' | 'CASHED_OUT' | 'VOID'

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
  /** Most the player will pay per share (0–1); above it the API answers 409
   *  `PRICE_MOVED`. Ignored on pool markets. */
  maxPrice?: number
  clientOrderId?: string
}

/** POST /bets/quote — read-only pricing for a stake. Money is minor units. */
export interface BetQuote {
  marketId: string
  outcomeId: string
  executionModel: 'PARIMUTUEL' | 'EXECUTION_LINKED' | 'INTERNAL'
  type: BetType
  stake: Money
  /** Fill price, 0–1. */
  price: string | null
  decimalOdds: string | null
  impliedPercent: number | null
  shares: string | null
  /** Gross payout if the outcome wins. */
  potentialReturn: Money
  fee: Money
  /** Payout after fees — what actually lands in the wallet on a win. */
  netReturn: Money
  /** netReturn − stake (can be negative). */
  profit: Money
  /** Pool (parimutuel) markets: the payout floats until close. */
  estimated: boolean
  pool: {
    total: Money
    onOutcome: Money
    rakeBps: number
  } | null
  note: string | null
}

export interface Bet {
  id: string
  marketId: string
  outcomeId: string
  status: BetStatus
  type: BetType
  executionModel?: ExecutionModel | null
  /** Null on pool bets (no share price). */
  price: string | null
  /** Pool bets: the live effective odds (payout ÷ stake). */
  odds: string | null
  shares: string | null
  stake: Money
  /** Gross payout on a win (pool bets: already net of the rake). */
  potentialReturn: Money
  fee?: Money
  /** potentialReturn − fee: what lands in the wallet on a win. */
  netReturn?: Money
  /** Set only when status is REJECTED. Branch on the code; show the reason. */
  rejectCode?: string | null
  rejectReason?: string | null
  filledShares: string | null
  /** Set once the market settles. */
  result?: 'WON' | 'LOST' | 'VOID' | null
  /** Pool (parimutuel) bets: potentialReturn floats until close. */
  estimated?: boolean
  market?: MarketSummary | null
  outcomeLabel?: string | null
  createdAt: string
}

export interface BetListResponse {
  data: Bet[]
  nextCursor: string | null
  /** Combo tickets — first page only, to be merged in by `createdAt`. */
  combos?: ComboTicket[]
}

export type ComboTicketStatus = 'OPEN' | 'WON' | 'LOST' | 'VOID'

/** A placed combo (parlay) as listed by GET /bets and /bets/positions. */
export interface ComboTicket {
  id: string
  type: 'COMBO'
  status: ComboTicketStatus
  stake: Money
  combinedOdds: string
  potentialReturn: Money
  /** What was paid out once settled; null while open. */
  payout: Money | null
  legs: {
    marketId: string
    outcomeId: string
    outcomeLabel: string | null
    price: string
    status: ComboTicketStatus
    market: MarketSummary | null
  }[]
  createdAt: string
  settledAt: string | null
}

/** GET /bets/portfolio — totals over every position, ignoring list filters. */
export interface PortfolioSummary {
  openPositions: number
  settledPositions: number
  wonCount: number
  lostCount: number
  invested: Money
  currentValue: Money
  unrealizedPnl: Money
  realizedPnl: Money
  netPnl: Money
}

export interface BetPosition {
  id: string
  marketId: string
  outcomeId: string
  status: PositionStatusApi
  /** Only present once a position is SETTLED or CLOSED. */
  result?: PositionResult | null
  executionModel?: ExecutionModel | null
  /** False on pool positions and closed/unpriced markets. */
  cashOutAvailable?: boolean
  /** ₦1-unit share count (API ledger unit). Use for money math only. Null on
   *  pool positions. */
  shares: string | null
  /** ₦100-settling contract count (= shares ÷ 100). Preferred for display. */
  contracts?: string | number | null
  avgPrice: string | null
  currentPrice?: string | null
  stake?: Money
  potentialReturn?: Money
  fee?: Money
  /** potentialReturn − fee: what lands in the wallet on a win. */
  netReturn?: Money
  /** Live mark-to-market value; null once the position is settled/closed. */
  currentValue: Money | null
  /** Live P&L while OPEN; null once settled/closed. */
  unrealizedPnl?: Money | null
  /** Final P&L once SETTLED or CLOSED; null while still OPEN. */
  realizedPnl?: Money | null
  /** Pool (parimutuel) position: no live value until close; potentialReturn
   *  is an estimate. */
  estimated?: boolean
  market?: MarketSummary | null
  outcomeLabel?: string | null
  openedAt: string
  settledAt?: string | null
}

export interface BetPositionListResponse {
  data: BetPosition[]
  nextCursor: string | null
  /** Combo tickets — first page only, to be merged in by the client. */
  combos?: ComboTicket[]
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
