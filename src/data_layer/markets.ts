import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { apiClient, type QueryParams } from './utils'
import { toCents, toPercent } from '../utils/functions'
import { categoryIcon } from '../utils/marketDisplay'
import type { SearchResult } from '../utils/constants'
import type {
  ApiEvent,
  ApiEventListResponse,
  ApiMarket,
  ApiMarketListResponse,
  ChartInterval,
  ChartMode,
  LobbyCategory,
  LobbyEvent,
  LobbyEventListResponse,
  LobbyHome,
  LobbyMarket,
  LobbyStatus,
  MarketChart,
  MarketHistoryResponse,
  MarketStatus,
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
  // Event-nested markets carry a null eventId and live in a different id space
  // than the flat /market/markets feed. Stamp the parent event id so the detail
  // page can resolve the market back through /market/events/{id}.
  markets: (e.markets ?? []).map((m) =>
    normalizeMarket({ ...m, eventId: m.eventId || e.id }, e.category),
  ),
})

// ── Lobby normalizers ─────────────────────────────────────────────────

const LOBBY_STATUS: Record<LobbyStatus, MarketStatus> = {
  OPEN: 'open',
  CLOSED: 'closed',
  PAUSED: 'paused',
  SETTLED: 'settled',
  VOIDED: 'unknown',
  DISPUTED: 'unknown',
  UNKNOWN: 'unknown',
}

export const normalizeLobbyMarket = (
  m: LobbyMarket,
  category = 'General',
  eventId = '',
  imageUrl: string | null = null,
): UiMarket => {
  const outcomes = (m.outcomes ?? []).map((o) => ({
    id: o.id,
    label: o.label,
    price: o.price,
    cents: toCents(o.price),
    percent: toPercent(o.price),
  }))
  const yes =
    outcomes.find((o) => YES_LABELS.includes(o.label.toLowerCase())) ??
    outcomes[0]
  const no = outcomes.find((o) => o.id !== yes?.id) ?? outcomes[1]

  return {
    id: m.id,
    eventId,
    provider: 'polymarket',
    title: m.title,
    subtitle: m.subtitle ?? '',
    category,
    status: LOBBY_STATUS[m.status] ?? 'unknown',
    openTime: m.openTime,
    closeTime: m.closeTime,
    volume: Number(m.volume) || 0,
    liquidity: Number(m.liquidity) || 0,
    slug: m.slug,
    imageUrl: m.imageUrl ?? imageUrl,
    live: m.live ?? false,
    seriesKey: m.seriesKey ?? null,
    durationSeconds: m.durationSeconds ?? null,
    resolvedOutcomeId: m.resolvedOutcomeId,
    rules: m.rules,
    outcomes,
    yes,
    no,
  }
}

export const normalizeLobbyEvent = (e: LobbyEvent): UiEvent => {
  const category = e.category?.name ?? 'General'
  return {
    id: e.id,
    provider: e.provider === 'KALSHI' ? 'kalshi' : 'polymarket',
    title: e.title,
    category,
    closeTime: e.closeTime,
    slug: e.slug,
    imageUrl: e.imageUrl,
    live: e.live ?? false,
    liveState: e.liveState ?? null,
    markets: (e.markets ?? []).map((m) =>
      normalizeLobbyMarket(m, category, e.id, e.imageUrl),
    ),
  }
}

// ── Feed resolution ───────────────────────────────────────────────────
// Prefer the curated lobby feed; fall back to the raw provider catalogue
// while the lobby has no published markets. Resolved once per session.

type Feed = 'lobby' | 'market'
let feedPromise: Promise<Feed> | undefined

const resolveFeed = (): Promise<Feed> => {
  if (!feedPromise) {
    feedPromise = apiClient
      .get<LobbyCategory[]>(`${LOBBY_BASE}/categories`)
      .then((res) =>
        Array.isArray(res.data) && res.data.length > 0 ? 'lobby' : 'market',
      )
      .catch(() => 'market' as Feed)
  }
  return feedPromise
}

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

export const useMarket = (id?: string, eventId?: string) =>
  useQuery({
    queryKey: ['market', id, eventId],
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      const feed = await resolveFeed()
      // Lobby detail accepts a stable DB id or slug and never 404s across id
      // spaces; only fall through to the raw catalogue if it genuinely 404s
      // (e.g. an old bookmark pointing at a raw provider id).
      if (feed === 'lobby') {
        try {
          return normalizeLobbyMarket(
            await get<LobbyMarket>(`${LOBBY_BASE}/markets/${id}`),
            'General',
            eventId ?? '',
          )
        } catch (err) {
          if (!(isAxiosError(err) && err.response?.status === 404)) throw err
          // Recurring series (e.g. BTC hourly) roll over: the round id is
          // ephemeral. Resolve the *current* round via the stable event.
          if (eventId) {
            const ev = normalizeLobbyEvent(
              await get<LobbyEvent>(`${LOBBY_BASE}/events/${eventId}`),
            )
            const current =
              ev.markets.find((m) => m.id === id) ??
              ev.markets.find((m) => m.live) ??
              ev.markets[0]
            if (current) return current
          }
          // else fall through to the raw catalogue below
        }
      }

      try {
        const m = await get<ApiMarket>(`${MARKET_BASE}/markets/${id}`)
        return normalizeMarket(m)
      } catch (err) {
        // Ids sourced from the events feed 404 on the single-market endpoint;
        // fall back to locating the market inside its event.
        if (isAxiosError(err) && err.response?.status === 404) {
          // 1. Known event (in-app navigation carries ?event=): resolve directly.
          if (eventId) {
            const ev = await get<ApiEvent>(`${MARKET_BASE}/events/${eventId}`)
            const found = (ev.markets ?? []).find((mm) => mm.id === id)
            if (found) {
              return normalizeMarket({ ...found, eventId: ev.id }, ev.category)
            }
          }
          // 2. Bare deep link: scan the events feed for the market id.
          const list = await get<ApiEventListResponse>(`${MARKET_BASE}/events`, {
            limit: 100,
          })
          for (const ev of list.data ?? []) {
            const found = (ev.markets ?? []).find((mm) => mm.id === id)
            if (found) {
              return normalizeMarket({ ...found, eventId: ev.id }, ev.category)
            }
          }
        }
        throw err
      }
    },
  })

export interface EventQueryParams extends QueryParams {
  provider?: string
  status?: string
  source?: string
  category?: string
  q?: string
  featured?: boolean
  live?: boolean
  sort?: 'trending' | 'closing_soon' | 'newest'
  limit?: number
}

const fetchEvents = async (
  params: EventQueryParams,
  cursor?: string,
): Promise<{ events: UiEvent[]; cursor: string | null }> => {
  const feed = await resolveFeed()
  if (feed === 'lobby') {
    const res = await get<LobbyEventListResponse>(`${LOBBY_BASE}/events`, {
      ...params,
      cursor,
    })
    return { events: (res.data ?? []).map(normalizeLobbyEvent), cursor: res.cursor }
  }
  const res = await get<ApiEventListResponse>(`${MARKET_BASE}/events`, {
    ...params,
    cursor,
  })
  return { events: (res.data ?? []).map(normalizeEvent), cursor: res.cursor }
}

export const useEvents = (params: EventQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['events', params],
    enabled,
    queryFn: () => fetchEvents(params),
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
    queryFn: ({ pageParam }) => fetchEvents(params, pageParam),
    getNextPageParam: (last) => last.cursor ?? undefined,
  })

/**
 * In-play events (GET /api/lobby/live). Lobby feed only — the raw catalogue has
 * no live concept, so it resolves to an empty list there.
 */
export const useLiveEvents = (params: EventQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['lobby-live', params],
    enabled,
    refetchInterval: 15000,
    queryFn: async (): Promise<{ events: UiEvent[]; cursor: string | null }> => {
      const feed = await resolveFeed()
      if (feed !== 'lobby') return { events: [], cursor: null }
      const res = await get<LobbyEventListResponse>(`${LOBBY_BASE}/live`, params)
      return {
        events: (res.data ?? []).map(normalizeLobbyEvent),
        cursor: res.cursor,
      }
    },
  })

/**
 * Live odds via SSE (GET /api/lobby/stream?markets=&event=). The backend pushes
 * on every odds change; we use each message as a throttled "refresh" signal and
 * re-fetch the affected market/chart/event queries so prices stay live.
 * NOTE: confirm the SSE event name/payload with backend to move to targeted
 * cache updates instead of refetch-on-tick.
 */
export const useLobbyStream = (opts: {
  marketIds?: string[]
  eventId?: string
  enabled?: boolean
}) => {
  const qc = useQueryClient()
  const { marketIds, eventId, enabled = true } = opts
  const lastRef = useRef(0)
  const key = (marketIds ?? []).join(',')

  useEffect(() => {
    if (!enabled || (!key && !eventId)) return
    if (typeof window === 'undefined' || !('EventSource' in window)) return

    const base = import.meta.env.VITE_APP_API_BASE_URL || ''
    const params = new URLSearchParams()
    if (key) params.set('markets', key)
    if (eventId) params.set('event', eventId)

    let es: EventSource | null = null
    try {
      es = new EventSource(`${base}/lobby/stream?${params.toString()}`, {
        withCredentials: true,
      })
    } catch {
      return
    }

    const onTick = () => {
      const now = Date.now()
      if (now - lastRef.current < 2500) return // throttle bursts
      lastRef.current = now
      ;(key ? key.split(',') : []).forEach((mid) => {
        qc.invalidateQueries({ queryKey: ['market', mid] })
        qc.invalidateQueries({ queryKey: ['market-chart', mid] })
      })
      if (eventId) qc.invalidateQueries({ queryKey: ['event', eventId] })
      qc.invalidateQueries({ queryKey: ['lobby-live'] })
    }

    es.onmessage = onTick
    // Cover named SSE events too (odds/update/tick) in case the default channel isn't used.
    ;['odds', 'update', 'tick'].forEach((name) =>
      es?.addEventListener(name, onTick),
    )
    es.onerror = () => {
      /* EventSource auto-reconnects; ignore transient errors */
    }

    return () => es?.close()
  }, [qc, enabled, key, eventId])
}

export interface LobbyHomeNormalized {
  featured: UiEvent[]
  trending: UiEvent[]
  closingSoon: UiEvent[]
  categories: LobbyCategory[]
}

/** The lobby home rails (featured / trending / closing-soon). Lobby feed only. */
export const useLobbyHome = (limit = 12) =>
  useQuery({
    queryKey: ['lobby-home', limit],
    queryFn: async (): Promise<LobbyHomeNormalized> => {
      const feed = await resolveFeed()
      if (feed !== 'lobby') {
        return { featured: [], trending: [], closingSoon: [], categories: [] }
      }
      const h = await get<LobbyHome>(`${LOBBY_BASE}/home`, { limit })
      return {
        featured: (h.featured ?? []).map(normalizeLobbyEvent),
        trending: (h.trending ?? []).map(normalizeLobbyEvent),
        closingSoon: (h.closingSoon ?? []).map(normalizeLobbyEvent),
        categories: h.categories ?? [],
      }
    },
  })

export const useEvent = (id?: string) =>
  useQuery({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: async () => {
      const feed = await resolveFeed()
      if (feed === 'lobby') {
        return normalizeLobbyEvent(
          await get<LobbyEvent>(`${LOBBY_BASE}/events/${id}`),
        )
      }
      return normalizeEvent(await get<ApiEvent>(`${MARKET_BASE}/events/${id}`))
    },
  })

export const useMarketQuote = (
  id?: string,
  outcomeId?: string,
  provider?: string,
) =>
  useQuery({
    queryKey: ['market-quote', id, outcomeId, provider],
    enabled: !!id && !!outcomeId,
    retry: false,
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
    retry: false,
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
    retry: false,
    refetchInterval: 20000,
    queryFn: () =>
      get<MarketTrade[]>(`${MARKET_BASE}/markets/${id}/trades`, {
        limit,
        provider,
      }),
  })

const chartTimeLabel = (iso: string, interval: ChartInterval): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return interval === '1d'
    ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Price chart for the market detail page. On the lobby feed it uses the real
 * candle history (Polymarket candles for imported markets, internal trades for
 * native ones); on the raw fallback feed it derives points from recent trades.
 */
const tradesToPoints = (
  trades: MarketTrade[],
  outcomeId?: string,
): MarketChart['points'] =>
  [...(outcomeId ? trades.filter((t) => t.outcomeId === outcomeId) : trades)]
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .map((t) => ({
      time: new Date(t.ts).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      value: toCents(t.price),
    }))

export const useMarketChart = (
  id?: string,
  outcomeId?: string,
  mode: ChartMode = 'live',
) => {
  const interval: ChartInterval = mode === 'live' ? '1h' : mode
  return useQuery<MarketChart>({
    queryKey: ['market-chart', id, outcomeId, mode],
    enabled: !!id,
    retry: false,
    // Live view polls fast; candle intervals refresh more lazily.
    refetchInterval: mode === 'live' ? 5000 : 30000,
    queryFn: async () => {
      const feed = await resolveFeed()
      if (feed === 'lobby') {
        const h = await get<MarketHistoryResponse>(
          `${LOBBY_BASE}/markets/${id}/history`,
          { outcomeId, interval },
        )
        const trades: MarketTrade[] = (h.trades ?? []).map((t, i) => ({
          id: `${t.at}-${i}`,
          marketId: h.marketId,
          outcomeId: t.outcomeId,
          price: t.price,
          size: t.size,
          side: 'buy',
          ts: t.at,
        }))
        const points =
          mode === 'live'
            ? tradesToPoints(trades, outcomeId)
            : (h.candles ?? []).map((c) => ({
                time: chartTimeLabel(c.at, interval),
                value: toCents(c.close),
              }))
        return { points, trades }
      }

      // Raw fallback feed: both live and interval views derive from trades.
      const raw = await get<MarketTrade[]>(`${MARKET_BASE}/markets/${id}/trades`, {
        limit: 60,
      })
      return { points: tradesToPoints(raw, outcomeId), trades: raw }
    },
  })
}

// ── Search ────────────────────────────────────────────────────────────
// The events endpoint ignores `q` server-side, so we fetch a batch once and
// filter client-side. Results are mapped into the shared SearchResult shape.

const marketToSearchResult = (m: UiMarket): SearchResult => ({
  id: m.id,
  title: m.title,
  subtitle: m.subtitle || m.category,
  href: m.eventId ? `/markets/${m.id}?event=${m.eventId}` : `/markets/${m.id}`,
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