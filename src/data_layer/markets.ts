import { useEffect, useMemo, useState } from 'react'
import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from '@tanstack/react-query'
import { apiClient, type QueryParams } from './utils'
import { toCents, toPercent } from '../utils/functions'
import { categoryIcon } from '../utils/marketDisplay'
import type { SearchResult } from '../utils/constants'
import type {
  ApiEvent,
  ApiEventListResponse,
  ApiMarket,
  ApiMarketListResponse,
  MarketTrade,
  OrderBook,
  Quote,
  UiEvent,
  UiMarket,
  UiOutcome,
} from '../types/market.types'

/**
 * Market data lives behind two possible feeds:
 *  - MARKET_BASE (`/market`): raw provider catalogue — live today.
 *  - LOBBY_BASE (`/lobby`): curated player feed — richer schema, currently
 *    empty until markets are published on the backend.
 * Swapping feeds later is a matter of pointing these consts (and the
 * normalizers) at the lobby responses.
 */
export const MARKET_BASE = '/market'
export const LOBBY_BASE = '/lobby'

const YES_LABELS = ['yes', 'up', 'over', 'win', 'true']

// ── Normalizers ───────────────────────────────────────────────────────

export const normalizeOutcome = (o: ApiMarket['outcomes'][number]): UiOutcome => ({
  id: o.id,
  label: o.label,
  price: o.price,
  cents: toCents(o.price),
  percent: toPercent(o.price),
})

export const normalizeMarket = (
  m: ApiMarket,
  category = 'General',
): UiMarket => {
  const outcomes = (m.outcomes ?? []).map(normalizeOutcome)
  const yes =
    outcomes.find((o) => YES_LABELS.includes(o.label.toLowerCase())) ??
    outcomes[0]
  const no =
    outcomes.find((o) => o.id !== yes?.id) ??
    outcomes[1] ??
    (outcomes.length === 1
      ? {
          id: `${yes?.id}-no`,
          label: 'No',
          price: 1 - (yes?.price ?? 0),
          cents: 100 - (yes?.cents ?? 0),
          percent: 100 - (yes?.percent ?? 0),
        }
      : undefined)

  return {
    id: m.id,
    eventId: m.eventId,
    provider: m.provider,
    title: m.title,
    subtitle: m.subtitle ?? '',
    category,
    status: m.status,
    openTime: m.openTime,
    closeTime: m.closeTime,
    volume: m.volume,
    liquidity: m.liquidity,
    resolvedOutcomeId: m.resolvedOutcomeId,
    rules: m.rules,
    outcomes,
    yes,
    no,
  }
}

export const normalizeEvent = (e: ApiEvent): UiEvent => ({
  id: e.id,
  provider: e.provider,
  title: e.title,
  category: e.category,
  closeTime: e.closeTime,
  markets: (e.markets ?? []).map((m) => normalizeMarket(m, e.category)),
})

// ── Fetchers (public — no auth gating) ────────────────────────────────

const buildQuery = (params?: QueryParams) => {
  const entries = Object.entries(params ?? {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (!entries.length) return ''
  return `?${new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString()}`
}

const get = async <T>(path: string, params?: QueryParams): Promise<T> => {
  const res = await apiClient.get<T>(`${path}${buildQuery(params)}`)
  return res.data
}

// ── Hooks ─────────────────────────────────────────────────────────────

export interface MarketQueryParams extends QueryParams {
  provider?: string
  status?: string
  eventId?: string
  limit?: number
}

export const useMarkets = (params: MarketQueryParams = {}) =>
  useQuery({
    queryKey: ['markets', params],
    queryFn: async () => {
      const res = await get<ApiMarketListResponse>(
        `${MARKET_BASE}/markets`,
        params,
      )
      return {
        markets: (res.data ?? []).map((m) => normalizeMarket(m)),
        cursor: res.cursor,
      }
    },
  })

export const useMarketsInfinite = (params: MarketQueryParams = {}) =>
  useInfiniteQuery<
    { markets: UiMarket[]; cursor: string | null },
    Error,
    InfiniteData<{ markets: UiMarket[]; cursor: string | null }, string | undefined>,
    (string | MarketQueryParams)[],
    string | undefined
  >({
    queryKey: ['markets-infinite', params],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const res = await get<ApiMarketListResponse>(`${MARKET_BASE}/markets`, {
        ...params,
        cursor: pageParam,
      })
      return {
        markets: (res.data ?? []).map((m) => normalizeMarket(m)),
        cursor: res.cursor,
      }
    },
    getNextPageParam: (last) => last.cursor ?? undefined,
  })

export const useMarket = (id?: string) =>
  useQuery({
    queryKey: ['market', id],
    enabled: !!id,
    queryFn: async () => {
      const m = await get<ApiMarket>(`${MARKET_BASE}/markets/${id}`)
      return normalizeMarket(m)
    },
  })

export interface EventQueryParams extends QueryParams {
  provider?: string
  status?: string
  category?: string
  q?: string
  featured?: boolean
  sort?: string
  limit?: number
}

export const useEvents = (params: EventQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['events', params],
    enabled,
    queryFn: async () => {
      const res = await get<ApiEventListResponse>(
        `${MARKET_BASE}/events`,
        params,
      )
      return {
        events: (res.data ?? []).map(normalizeEvent),
        cursor: res.cursor,
      }
    },
  })

export const useEventsInfinite = (params: EventQueryParams = {}) =>
  useInfiniteQuery<
    { events: UiEvent[]; cursor: string | null },
    Error,
    InfiniteData<{ events: UiEvent[]; cursor: string | null }, string | undefined>,
    (string | EventQueryParams)[],
    string | undefined
  >({
    queryKey: ['events-infinite', params],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const res = await get<ApiEventListResponse>(`${MARKET_BASE}/events`, {
        ...params,
        cursor: pageParam,
      })
      return { events: (res.data ?? []).map(normalizeEvent), cursor: res.cursor }
    },
    getNextPageParam: (last) => last.cursor ?? undefined,
  })

export const useEvent = (id?: string) =>
  useQuery({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: async () => normalizeEvent(await get<ApiEvent>(`${MARKET_BASE}/events/${id}`)),
  })

export const useMarketQuote = (
  id?: string,
  outcomeId?: string,
  provider?: string,
) =>
  useQuery({
    queryKey: ['market-quote', id, outcomeId, provider],
    enabled: !!id && !!outcomeId,
    refetchInterval: 15000,
    queryFn: () =>
      get<Quote>(`${MARKET_BASE}/markets/${id}/quote`, { outcomeId, provider }),
  })

export const useMarketOrderBook = (
  id?: string,
  outcomeId?: string,
  provider?: string,
) =>
  useQuery({
    queryKey: ['market-orderbook', id, outcomeId, provider],
    enabled: !!id && !!outcomeId,
    refetchInterval: 15000,
    queryFn: () =>
      get<OrderBook>(`${MARKET_BASE}/markets/${id}/orderbook`, {
        outcomeId,
        provider,
      }),
  })

export const useMarketTrades = (id?: string, limit = 30, provider?: string) =>
  useQuery({
    queryKey: ['market-trades', id, limit, provider],
    enabled: !!id,
    refetchInterval: 20000,
    queryFn: () =>
      get<MarketTrade[]>(`${MARKET_BASE}/markets/${id}/trades`, {
        limit,
        provider,
      }),
  })

// ── Search ────────────────────────────────────────────────────────────
// The events endpoint ignores `q` server-side, so we fetch a batch once and
// filter client-side. Results are mapped into the shared SearchResult shape.

const marketToSearchResult = (m: UiMarket): SearchResult => ({
  id: m.id,
  title: m.title,
  subtitle: m.subtitle || m.category,
  href: `/markets/${m.id}`,
  iconLabel: categoryIcon(m.category),
  iconBg: '#183123',
  iconTextColor: '#c6f135',
  percentage: m.yes?.percent ?? 0,
  change: null,
  direction: 'neutral',
})

export const useMarketSearch = (term: string, limit = 12) => {
  const [debounced, setDebounced] = useState(term)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 200)
    return () => clearTimeout(id)
  }, [term])

  const { data, isLoading } = useEvents({ limit: 100 })

  const results = useMemo<SearchResult[]>(() => {
    const markets = (data?.events ?? [])
      .flatMap((e) => e.markets)
      .filter((m) => m.yes)
    const q = debounced.trim().toLowerCase()
    const pool = q
      ? markets.filter(
          (m) =>
            (m.title ?? '').toLowerCase().includes(q) ||
            (m.subtitle ?? '').toLowerCase().includes(q) ||
            (m.category ?? '').toLowerCase().includes(q),
        )
      : [...markets].sort((a, b) => b.volume - a.volume)
    return pool.slice(0, limit).map(marketToSearchResult)
  }, [data, debounced, limit])

  return { results, isLoading }
}
