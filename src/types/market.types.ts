// ── Raw API shapes (GET /api/market/*) ───────────────────────────────

export type MarketStatus = 'open' | 'closed' | 'settled' | 'paused' | 'unknown'
export type MarketProvider = 'polymarket' | 'kalshi'

export interface ApiOutcome {
  id: string
  label: string
  price: number // probability in [0, 1]
}
//
export interface MarketCardVM {
  id: string
  question: string
  outcomes: OutcomeVM[]
  yesPercent: number
  noPercent: number
  volume: string
  openTime?: string
  closeTime?: string
}

export interface OutcomeVM {
  id: string
  label: string
  percent: number
}

export interface MarketOutcome {
  id: string
  label: string
  price: number
}
export interface RawMarket {
  id: string
  provider: string
  eventId: string
  title: string
  subtitle: string
  status: 'open' | 'closed' | string
  outcomes: MarketOutcome[]
  volume: number
  liquidity?: number
  openTime: string
  closeTime: string
  resolvedOutcomeId?: string | null
}

export interface ApiMarket {
  id: string
  provider: MarketProvider
  eventId: string
  title: string
  subtitle: string
  status: MarketStatus
  outcomes: ApiOutcome[]
  volume: number
  liquidity: number
  openTime: string
  closeTime: string
  resolvedOutcomeId?: string | null
  rules?: string | null
}

export interface MarketResponse {
  data: RawMarket[]
}

export interface ApiMarketListResponse {
  data: ApiMarket[]
  cursor: string | null
}

export interface ApiEvent {
  id: string
  provider: MarketProvider
  title: string
  category: string
  closeTime: string
  markets: ApiMarket[]
}

export interface ApiEventListResponse {
  data: ApiEvent[]
  cursor: string | null
}

export interface Quote {
  marketId: string
  outcomeId: string
  bid: number
  ask: number
  mid: number
  last: number
  ts: string
}

export interface OrderBookLevel {
  price: number
  size: number
}

export interface OrderBook {
  marketId: string
  outcomeId: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  ts: string
}

export interface MarketTrade {
  id: string
  marketId: string
  outcomeId: string
  price: number
  size: number
  side: 'buy' | 'sell'
  ts: string
}

// GET /api/lobby/markets/{idOrSlug}/history — OHLC candles + recent trades.
export interface MarketCandle {
  at: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketHistoryTick {
  outcomeId: string
  price: number
  size: number
  at: string
}

export interface MarketHistoryResponse {
  marketId: string
  source: string
  candles: MarketCandle[]
  trades: MarketHistoryTick[]
}

export type ChartInterval = '1h' | '6h' | '1d'
/** Chart selection: "live" plots tick trades, the rest plot OHLC candles. */
export type ChartMode = 'live' | ChartInterval

export interface ChartPoint {
  time: string
  value: number // 0..100 (probability / ₦-out-of-100)
}

export interface MarketChart {
  points: ChartPoint[]
  trades: MarketTrade[]
}

// ── Normalized UI shapes (what components render) ─────────────────────

export interface UiOutcome {
  id: string
  label: string
  price: number
  cents: number
  percent: number
}

export interface UiMarket {
  id: string
  eventId: string
  provider: MarketProvider
  title: string
  subtitle: string
  category: string
  status: MarketStatus
  openTime: string
  closeTime: string
  volume: number
  liquidity: number
  slug?: string
  imageUrl?: string | null
  resolvedOutcomeId?: string | null
  rules?: string | null
  outcomes: UiOutcome[]
  /** Binary-market convenience accessors (derived from outcomes). */
  yes?: UiOutcome
  no?: UiOutcome
}

export interface UiEvent {
  id: string
  provider: MarketProvider
  title: string
  category: string
  closeTime: string
  slug?: string
  imageUrl?: string | null
  markets: UiMarket[]
}

// ── Lobby feed shapes (GET /api/lobby/*) — curated player feed ─────────

export type LobbyStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'PAUSED'
  | 'SETTLED'
  | 'VOIDED'
  | 'DISPUTED'
  | 'UNKNOWN'

export interface LobbyOutcome {
  id: string
  label: string
  sortOrder: number
  price: number
  decimalOdds: number
  impliedPercent: number
  bid: number
  ask: number
  source: 'live' | 'stored' | 'none'
  stale: boolean
  at: string
}

export interface LobbyCategoryRef {
  slug: string
  name: string
  iconUrl: string | null
}

export interface LobbyCategory extends LobbyCategoryRef {
  eventCount: number
}

export interface LobbyMarket {
  id: string
  slug: string
  title: string
  subtitle: string
  rules: string | null
  status: LobbyStatus
  imageUrl: string | null
  feeBps: number
  volume: string
  liquidity: string
  openTime: string
  closeTime: string
  resolvedOutcomeId: string | null
  outcomes: LobbyOutcome[]
}

export interface LobbyEvent {
  id: string
  slug: string
  title: string
  subtitle: string
  imageUrl: string | null
  source: string
  provider: 'KALSHI' | 'POLYMARKET'
  category: LobbyCategoryRef | null
  closeTime: string
  featured: boolean
  marketCount: number
  markets: LobbyMarket[]
}

export interface LobbyEventListResponse {
  data: LobbyEvent[]
  cursor: string | null
}

export interface LobbyHome {
  featured: LobbyEvent[]
  trending: LobbyEvent[]
  closingSoon: LobbyEvent[]
  categories: LobbyCategory[]
}