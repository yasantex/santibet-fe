import { useEffect, useMemo, useState } from 'react'
import {
  useInfiniteQuery,
  useQueries,
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
  ChartPoint,
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

/** Coerce a raw min-stake (kobo, possibly a string) to a positive number or null. */
const toMinStakeMinor = (raw: number | string | null | undefined): number | null => {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export const normalizeMarket = (
  m: ApiMarket,
  category = 'General',
  eventTitle?: string,
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
    eventTitle,
    subtitle: m.subtitle ?? '',
    category,
    status: m.status,
    openTime: m.openTime,
    closeTime: m.closeTime,
    volume: m.volume,
    liquidity: m.liquidity,
    resolvedOutcomeId: m.resolvedOutcomeId,
    rules: m.rules,
    minStakeMinor: toMinStakeMinor(m.minStakeMinor),
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
    normalizeMarket({ ...m, eventId: m.eventId || e.id }, e.category, e.title),
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
  eventTitle?: string,
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
    eventTitle,
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
    minStakeMinor: toMinStakeMinor(m.minStakeMinor),
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
      normalizeLobbyMarket(m, category, e.id, e.imageUrl, e.title),
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

export const fetchMarketById = async (
  id: string,
  eventId?: string,
): Promise<UiMarket> => {
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
}

export const useMarket = (id?: string, eventId?: string) =>
  useQuery({
    queryKey: ['market', id, eventId],
    enabled: !!id,
    retry: false,
    queryFn: () => fetchMarketById(id as string, eventId),
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

/**
 * Set of category names (lower-cased) that currently have at least one open,
 * tradeable market. Used to hide the "ahead-of-catalogue" nav entries and
 * empty sub-topic filters so browse only surfaces categories with markets.
 * Falls back to `null` until the feed loads so callers can show their full
 * list rather than flashing an empty nav.
 */
export const useAvailableCategories = (): Set<string> | null => {
  // Authoritative per-category counts (covers small categories that a single
  // event page would miss). Lobby-only; empty on the raw fallback feed.
  const { data: lobbyCats } = useQuery({
    queryKey: ['lobby-categories-nav'],
    queryFn: () =>
      get<LobbyCategory[]>(`${LOBBY_BASE}/categories`).catch(() => []),
    staleTime: 5 * 60_000,
  })
  // Event sample — the feed-agnostic signal, and the only one on the raw feed.
  const { data: events } = useEvents({ limit: 100 })

  return useMemo(() => {
    if (!lobbyCats && !events) return null
    const set = new Set<string>()
    for (const c of lobbyCats ?? []) {
      if (c.eventCount > 0) set.add(c.slug.toLowerCase())
    }
    for (const ev of events?.events ?? []) {
      const hasOpenMarket = ev.markets.some(
        (m) => m.status !== 'closed' && m.yes,
      )
      if (hasOpenMarket && ev.category) set.add(ev.category.toLowerCase())
    }
    return set
  }, [lobbyCats, events])
}

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
interface OddsTick {
  marketId: string
  outcomeId: string
  label?: string
  price: number | null
  impliedPercent?: number | null
  decimalOdds?: number | null
  bid?: number | null
  ask?: number | null
  source?: 'live' | 'stored' | 'none'
  stale?: boolean
  at?: string | null
}

/**
 * Live odds via SSE (`GET /api/lobby/stream?markets=&event=`). The backend
 * pushes an `odds` event per outcome; we write the new price straight into the
 * cached market so outcome prices, the trade panel and the "% chance" header
 * update live with no refetch. Price chart movement is separate (candle poll).
 */
export const useLobbyStream = (opts: {
  marketIds?: string[]
  eventId?: string
  enabled?: boolean
}) => {
  const qc = useQueryClient()
  const { marketIds, eventId, enabled = true } = opts
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

    const applyOutcome = (o: UiOutcome, tick: OddsTick, price: number) =>
      o.id === tick.outcomeId
        ? { ...o, price, cents: toCents(price), percent: toPercent(price) }
        : o

    const applyOdds = (raw: string) => {
      let tick: OddsTick
      try {
        tick = JSON.parse(raw)
      } catch {
        return
      }
      if (!tick?.marketId || !tick?.outcomeId) return
      const price =
        typeof tick.price === 'number'
          ? tick.price
          : typeof tick.impliedPercent === 'number'
            ? tick.impliedPercent / 100
            : null
      if (price == null) return

      // Update any cached market that holds this outcome (covers the
      // ['market', id, eventId] key regardless of which id resolved it).
      qc.setQueriesData<UiMarket>(
        {
          predicate: (q) =>
            q.queryKey[0] === 'market' &&
            (q.state.data as UiMarket | undefined)?.outcomes?.some(
              (o) => o.id === tick.outcomeId,
            ) === true,
        },
        (old) =>
          old
            ? {
                ...old,
                outcomes: old.outcomes.map((o) => applyOutcome(o, tick, price)),
                yes: old.yes ? applyOutcome(old.yes, tick, price) : old.yes,
                no: old.no ? applyOutcome(old.no, tick, price) : old.no,
              }
            : old,
      )
    }

    es.addEventListener('odds', (e) => applyOdds((e as MessageEvent).data))
    es.onmessage = (e) => applyOdds(e.data) // fallback if unnamed channel is used
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

/** How many most-recent points the Live view keeps (tight window = visible movement). */
const LIVE_WINDOW_POINTS = 40

const HOUR_MS = 60 * 60 * 1000

/**
 * Each chart tab is a look-back window, fetched at the finest candle interval
 * whose history covers it (the history endpoint returns ~200 candles per
 * interval, and has no 6h/1d candles at all): 1m ≈ 3h, 5m ≈ 16h, 15m ≈ 2d,
 * 1h ≈ 8d.
 */
export const CHART_RANGES: Record<
  ChartMode,
  { interval: ChartInterval; windowMs: number | null }
> = {
  live: { interval: '1m', windowMs: null },
  '1h': { interval: '1m', windowMs: HOUR_MS },
  '6h': { interval: '5m', windowMs: 6 * HOUR_MS },
  '1d': { interval: '15m', windowMs: 24 * HOUR_MS },
  '1w': { interval: '1h', windowMs: 7 * 24 * HOUR_MS },
}

/** Short x-axis tick label: time of day, or the date on the week view. */
export const chartTimeLabel = (t: number, mode: ChartMode): string => {
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return ''
  return mode === '1w'
    ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Full date + time for chart tooltips, e.g. "Sep 23, 2026, 09:44". */
export const chartTooltipLabel = (t: number, withSeconds = false): string => {
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  })
}

const toPoint = (t: number, value: number, mode: ChartMode): ChartPoint => ({
  t,
  time: chartTimeLabel(t, mode),
  value,
})

/** Probability (0..1) → percent with one decimal, so small moves still show. */
const toPercentValue = (p: number) => Math.round((Number(p) || 0) * 1000) / 10

const tradesToPoints = (
  trades: MarketTrade[],
  outcomeId: string | undefined,
  mode: ChartMode,
): ChartPoint[] =>
  [...(outcomeId ? trades.filter((t) => t.outcomeId === outcomeId) : trades)]
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .map((t) => toPoint(new Date(t.ts).getTime(), toPercentValue(t.price), mode))

/**
 * Keep only the points inside the look-back window. The value carried into the
 * window (last point before it) is re-stamped at the window start, so the line
 * spans the whole range — and a quiet market still shows a flat line at its
 * real price instead of an empty chart.
 */
const clipToWindow = (
  points: ChartPoint[],
  mode: ChartMode,
): ChartPoint[] => {
  const { windowMs } = CHART_RANGES[mode]
  if (!windowMs || !points.length) return points
  const now = Date.now()
  const start = now - windowMs
  const first = points.findIndex((p) => p.t >= start)
  if (first === 0) return points
  const carried = points[first === -1 ? points.length - 1 : first - 1]
  const inside = first === -1 ? [] : points.slice(first)
  const clipped = [toPoint(start, carried.value, mode), ...inside]
  return inside.length
    ? clipped
    : [...clipped, toPoint(now, carried.value, mode)]
}

/**
 * Price/odds history for one outcome. On the lobby feed it uses the real
 * candle history (Polymarket candles for imported markets, internal trades for
 * native ones); on the raw fallback feed it derives points from recent trades.
 * Probability series are returned as percent (0..100); price series (e.g.
 * "Bitcoin Up or Down") as the asset price, with the strike when there is one.
 */
export const fetchMarketChart = async (
  id: string,
  outcomeId: string | undefined,
  mode: ChartMode,
): Promise<MarketChart> => {
  const { interval } = CHART_RANGES[mode]
  const feed = await resolveFeed()
  if (feed === 'lobby') {
    const h = await get<MarketHistoryResponse>(
      `${LOBBY_BASE}/markets/${id}/history`,
      { outcomeId, interval },
    )
    const unit = (h.unit ?? 'PROBABILITY').toUpperCase() === 'PROBABILITY'
      ? 'percent'
      : 'usd'
    const trades: MarketTrade[] = (h.trades ?? []).map((t, i) => ({
      id: `${t.at}-${i}`,
      marketId: h.marketId,
      outcomeId: t.outcomeId,
      price: t.price,
      size: t.size,
      side: 'buy',
      ts: t.at,
    }))
    const candlePoints = (h.candles ?? []).map((c) =>
      toPoint(
        new Date(c.at).getTime(),
        unit === 'percent' ? toPercentValue(c.close) : c.close,
        mode,
      ),
    )
    // Trade ticks are outcome prices (probability) — only comparable with
    // candles on probability series.
    const tradePoints =
      unit === 'percent' ? tradesToPoints(trades, outcomeId, mode) : []
    // Live: tight recent window (auto Y-axis zooms in). The detail page
    // extends a live tail on a ticker so the timeline advances between polls.
    const points =
      mode === 'live'
        ? (tradePoints.length ? tradePoints : candlePoints).slice(
            -LIVE_WINDOW_POINTS,
          )
        : clipToWindow(candlePoints.length ? candlePoints : tradePoints, mode)
    return { points, trades, unit, strike: h.strike ?? null }
  }

  // Raw fallback feed: both live and interval views derive from trades.
  const raw = await get<MarketTrade[]>(`${MARKET_BASE}/markets/${id}/trades`, {
    limit: 60,
  })
  const points = tradesToPoints(raw, outcomeId, mode)
  return {
    points: mode === 'live' ? points : clipToWindow(points, mode),
    trades: raw,
    unit: 'percent',
    strike: null,
  }
}

const chartQuery = (
  id: string | undefined,
  outcomeId: string | undefined,
  mode: ChartMode,
) => ({
  queryKey: ['market-chart', id, outcomeId, mode],
  enabled: !!id,
  retry: false,
  // Live refresh is driven by a component ticker (a plain timer that runs even
  // when the tab is unfocused); look-back ranges refresh on their own timer.
  refetchInterval: mode === 'live' ? (false as const) : 30000,
  queryFn: () => fetchMarketChart(id as string, outcomeId, mode),
})

export const useMarketChart = (
  id?: string,
  outcomeId?: string,
  mode: ChartMode = 'live',
) => useQuery<MarketChart>(chartQuery(id, outcomeId, mode))

/** Several outcome histories at once (multi-line charts). Shares the cache
 *  with `useMarketChart`. */
export const useMarketCharts = (
  targets: { marketId: string; outcomeId?: string }[],
  mode: ChartMode,
) =>
  useQueries({
    queries: targets.map((t) => chartQuery(t.marketId, t.outcomeId, mode)),
  })


// ── Search ────────────────────────────────────────────────────────────
// The events endpoint ignores `q` server-side, so we fetch a batch once and
// filter client-side. Results are mapped into the shared SearchResult shape.

/** Lower-case + strip diacritics so "koln" matches "Köln", "munchen" ↔ "München". */
export const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

/**
 * True when the query hits any searchable part of a market — its title,
 * subtitle (league/context), category, or an outcome label (participants /
 * options like team names, "Over 2.5", "Draw"). `q` must be pre-normalized.
 */
export const marketMatchesQuery = (m: UiMarket, q: string): boolean => {
  if (!q) return true
  return (
    normalizeText(m.title ?? '').includes(q) ||
    normalizeText(m.subtitle ?? '').includes(q) ||
    normalizeText(m.category ?? '').includes(q) ||
    m.outcomes.some((o) => normalizeText(o.label ?? '').includes(q))
  )
}

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
    const q = normalizeText(debounced.trim())
    const pool = q
      ? markets.filter((m) => marketMatchesQuery(m, q))
      : [...markets].sort((a, b) => b.volume - a.volume)
    return pool.slice(0, limit).map(marketToSearchResult)
  }, [data, debounced, limit])

  return { results, isLoading }
}