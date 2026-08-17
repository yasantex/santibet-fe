// ── Raw API shapes (GET /api/market/*) ───────────────────────────────

export type MarketStatus = 'open' | 'closed' | 'settled' | 'paused' | 'unknown'
export type MarketProvider = 'polymarket' | 'kalshi'

export interface ApiOutcome {
  id: string
  label: string
  price: number // probability in [0, 1]
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
  markets: UiMarket[]
}
