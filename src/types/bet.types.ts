import type { ComboTicket } from './combo.types'
import type { ExecutionModel, LiveState } from './market.types'
import type { BonusQuote, FundedBy } from './bonus.types'

// The combo ticket shape is owned by combo.types; re-exported here so callers
// can import it alongside the other bet/position types.
export type {
  ComboTicket,
  ComboStatus as ComboTicketStatus,
} from './combo.types'

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

/**
 * Why a stake came back (`refundReason` on bets, positions and combos,
 * `voidReason` on combo legs, `voidCode` on a market's result).
 * PARTIAL_UNMATCHED isn't produced today.
 */
export type RefundReason =
  | 'MARKET_VOIDED'
  | 'EVENT_CANCELLED'
  | 'ADMIN_VOID'
  | 'DUPLICATE_SOURCE'
  | 'POOL_NO_OPPOSITION'
  | 'POOL_NO_WINNER'
  | 'PARTIAL_UNMATCHED'

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
  /** The event/fixture, e.g. "Arsenal vs Chelsea" — a sports market's title is only its type. */
  eventTitle?: string | null
  /** The match/event the market belongs to. */
  eventId?: string | null
  /** Football: a live match tracker exists for the event. */
  matchCentre?: boolean
  /** Sports: live score / clock while playing, final score once finished. */
  liveState?: LiveState | null
  /** The market's lobby status (OPEN, CLOSED, PAUSED, SETTLED, VOIDED,
   *  DISPUTED, UNKNOWN). */
  status?: string
  /** How the market ended; null while it's open. */
  result?: {
    status?: 'SETTLED' | 'VOIDED' | 'DISPUTED'
    /** Why the market was voided. Prefer this to `voidReason`. */
    voidCode?: RefundReason | null
    /** Free-text note (operator, feed or resolver); not written for players. */
    voidReason?: string | null
  } | null
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
  /** Stake bonus credit instead of cash. Market bets only. */
  useBonus?: boolean
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
  /** Present only when the quote was asked with `useBonus: true`. */
  bonus?: BonusQuote | null
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
  /**
   * Where the bet ended; null while open. VOID: only the stake came back
   * (a voided market, or a pool nobody bet against).
   */
  result?: 'WON' | 'LOST' | 'VOID' | 'CASHED_OUT' | null
  /** What the bet actually returned (a refund = the stake); null while open. */
  payout?: Money | null
  /** Set when the stake came back. */
  refundReason?: RefundReason | null
  refundAmount?: Money | null
  /** payout − stake: positive won, 0 refunded, negative lost; null while open. */
  realizedPnl?: Money | null
  /** Pool (parimutuel) bets: potentialReturn floats until close. */
  estimated?: boolean
  market?: MarketSummary | null
  outcomeLabel?: string | null
  /** Whether the stake came from cash or bonus credit. */
  fundedBy?: FundedBy
  createdAt: string
}

export interface BetListResponse {
  data: Bet[]
  nextCursor: string | null
  /** Combo tickets, paged on their own: `limit` per page. */
  combos?: ComboTicket[]
  /** Pass back as `combosCursor` for the next page of combos. */
  combosNextCursor?: string | null
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
  /** Stake tied up in open bets and combos, split by what funded it. When
   *  present it's authoritative; older APIs omit it and the client sums the
   *  open positions it has loaded instead. */
  openStake?: { cash: Money; bonus: Money } | null
  /** The same five figures for bonus-funded bets. The top-level ones are cash
   *  bets only (singles and combos). An open bonus bet is held at its stake,
   *  since it can't be cashed out. Counts above still include bonus bets. */
  bonus?: {
    invested: Money
    currentValue: Money
    unrealizedPnl: Money
    realizedPnl: Money
    netPnl: Money
  } | null
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
  /** Pool positions: the effective odds (payout ÷ stake). */
  odds?: string | null
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
  /** What the position actually returned; null while open. */
  payout?: Money | null
  /** Set when the stake came back. */
  refundReason?: RefundReason | null
  refundAmount?: Money | null
  /** Pool (parimutuel) position: no live value until close; potentialReturn
   *  is an estimate. */
  estimated?: boolean
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
  /** Combo tickets, paged on their own: `limit` per page. */
  combos?: ComboTicket[]
  /** Pass back as `combosCursor` for the next page of combos. */
  combosNextCursor?: string | null
}

/** Read-only estimate of what a position would return if cashed out now. */
export interface CashOutQuote {
  /** Shares this quote is for (same units as the position's `shares`): what
   *  was asked, else the whole position. */
  quantity: string | number
  /** Price the position would sell at. */
  sellPrice: string | number
  /** Estimated proceeds for `quantity`, in kobo (minor units). */
  valueMinor: string | number
  currency: string
  /** Every share held: the most a sale can take. */
  positionQuantity?: string
  /** The fewest shares a part sale can sell. */
  minQuantity?: string
  /** The fewest shares a part sale must leave behind. */
  minRemainingQuantity?: string
  /** False when the position is too small to split: only selling it all works. */
  partialAvailable?: boolean
}

