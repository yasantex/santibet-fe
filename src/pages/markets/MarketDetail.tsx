import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Link01Icon,
  Bookmark02Icon,
} from '@hugeicons/core-free-icons'
import {
  useMarket,
  useMarketChart,
  useLobbyStream,
} from '../../data_layer/markets'
import { useFavorites } from '../../hooks/useFavorites'
import TradePanel from '../../components/markets/TradePanel'
import { LiveBadge } from '../../components/markets/LiveBits'
import { useCountdown } from '../../hooks/useCountdown'
import { categoryIcon } from '../../utils/marketDisplay'
import {
  formatCloseTimer,
  formatCompact,
  formatNairaCompact,
  formatSharePrice,
} from '../../utils/functions'
import { showSuccessToast } from '../../utils/toastUtils'
import type { ChartMode, ChartPoint, UiOutcome } from '../../types/market.types'

// How often the Live view extends its tail / pulls a fresh quote.
const LIVE_TICK_MS = 3000

const CHART_PERIODS: { label: string; mode: ChartMode }[] = [
  { label: 'Live', mode: 'live' },
  { label: '1H', mode: '1h' },
  { label: '6H', mode: '6h' },
  { label: '1D', mode: '1d' },
]

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get('outcome') ?? undefined,
  )
  const [chartMode, setChartMode] = useState<ChartMode>('live')
  const [userPickedMode, setUserPickedMode] = useState(false)
  const [infoTab, setInfoTab] = useState<'rules' | 'trades'>('rules')

  const eventId = searchParams.get('event') ?? undefined
  const { data: market, isLoading, isError } = useMarket(id, eventId)
  const { isFavorite, toggle: toggleFavorite } = useFavorites()

  const selectedOutcome: UiOutcome | undefined = useMemo(() => {
    if (!market) return undefined
    return (
      market.outcomes.find((o) => o.id === selectedId) ??
      market.yes ??
      market.outcomes[0]
    )
  }, [market, selectedId])

  // Drive chart/stream off the *resolved* market id only (a recurring round may
  // differ from the ephemeral id in the URL after a rollover) — waiting for it
  // avoids a throwaway 404 against the stale URL id.
  const marketId = market?.id
  const { data: chart, refetch: refetchChart } = useMarketChart(
    marketId,
    selectedOutcome?.id,
    chartMode,
  )
  const basePoints = useMemo(() => chart?.points ?? [], [chart])
  const trades = chart?.trades

  // Live tail: a rolling set of "now" points appended on a timer so the Live
  // chart's timeline advances between candle updates. The timer (a plain
  // interval) also pulls a fresh quote, so the value moves when there's activity
  // — this runs even when react-query's focus-based polling would pause.
  const [liveTail, setLiveTail] = useState<ChartPoint[]>([])
  // Keep refs so the interval (set up once) always sees the latest values —
  // react-query recreates `refetch` each render, so it must not be an effect dep.
  const lastBaseRef = useRef<ChartPoint | undefined>(undefined)
  const refetchRef = useRef(refetchChart)
  useEffect(() => {
    lastBaseRef.current = basePoints[basePoints.length - 1]
    refetchRef.current = refetchChart
  })

  // Reset the tail whenever the series identity changes (render-time reset).
  const seriesKey = `${marketId}:${selectedOutcome?.id}:${chartMode}`
  const [tailKey, setTailKey] = useState(seriesKey)
  if (tailKey !== seriesKey) {
    setTailKey(seriesKey)
    setLiveTail([])
  }

  useEffect(() => {
    if (chartMode !== 'live') return
    const id = window.setInterval(() => {
      void refetchRef.current()
      setLiveTail((prev) => {
        const base = lastBaseRef.current
        if (!base) return prev
        const now = Date.now()
        const kept = prev.filter((p) => p.t > base.t)
        // Unique HH:MM:SS label so each tail sample is its own category and the
        // line visibly extends; the axis formatter trims it back to HH:MM.
        const time = new Date(now).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        const next = [...kept, { t: now, time, value: base.value }]
        return next.length > 80 ? next.slice(-80) : next
      })
    }, LIVE_TICK_MS)
    return () => window.clearInterval(id)
  }, [chartMode])

  const chartData = useMemo(() => {
    if (chartMode !== 'live') return basePoints
    const cutoff = basePoints[basePoints.length - 1]?.t ?? 0
    return [...basePoints, ...liveTail.filter((p) => p.t > cutoff)]
  }, [basePoints, liveTail, chartMode])

  // Live odds via SSE (pushes each outcome's price as it moves); ticking
  // countdown for the close time.
  useLobbyStream({
    marketIds: marketId ? [marketId] : [],
    enabled: !!marketId,
  })
  const countdown = useCountdown(market?.openTime, market?.closeTime)

  // Live shows tick trades; when a market has none yet, fall back to the 1H
  // candle view automatically (unless the user has picked a period themselves).
  // Adjust-state-during-render pattern (react.dev/learn/you-might-not-need-an-effect).
  const [seenChart, setSeenChart] = useState(chart)
  if (chart !== seenChart) {
    setSeenChart(chart)
    if (
      !userPickedMode &&
      chartMode === 'live' &&
      chart &&
      chart.points.length === 0
    ) {
      setChartMode('1h')
    }
  }

  const pickChartMode = (mode: ChartMode) => {
    setUserPickedMode(true)
    setChartMode(mode)
  }

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href)
    showSuccessToast('Link copied to clipboard')
  }

  if (isLoading) {
    return (
      <main className='mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pt-4 pb-20 md:px-8'>
        <div className='h-6 w-40 animate-pulse rounded bg-card' />
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]'>
          <div className='h-96 animate-pulse rounded-2xl bg-card' />
          <div className='h-96 animate-pulse rounded-2xl bg-card' />
        </div>
      </main>
    )
  }

  if (isError || !market) {
    return (
      <main className='mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-3 py-20 text-center'>
        <p className='text-sm text-neutral-10'>We couldn’t load this market.</p>
        <button
          type='button'
          onClick={() => navigate('/')}
          className='rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-black'
        >
          Back to markets
        </button>
      </main>
    )
  }

  return (
    <main className='mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pt-4 pb-20 md:px-8'>
      {/* Breadcrumb + actions */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm text-neutral-10'>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='flex items-center gap-1 hover:text-black'
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
          <Link to='/' className='hover:text-black'>
            Markets
          </Link>
          <span>/</span>
          <span className='font-medium text-black'>{market.category}</span>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            aria-label='Copy link'
            onClick={copyLink}
            className='rounded-full bg-card p-2 text-neutral-10 hover:text-black'
          >
            <HugeiconsIcon icon={Link01Icon} size={18} />
          </button>
          <button
            type='button'
            aria-label={
              isFavorite(market.id) ? 'Remove from favorites' : 'Save market'
            }
            onClick={() => toggleFavorite(market)}
            className={`rounded-full p-2 hover:text-black ${
              isFavorite(market.id)
                ? 'bg-hover text-black'
                : 'bg-card text-neutral-10'
            }`}
          >
            <HugeiconsIcon icon={Bookmark02Icon} size={18} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]'>
        {/* Main column */}
        <div className='flex flex-col gap-4'>
          {/* Header */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-5'>
            <div className='flex items-start gap-3'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-border/30 text-xl'>
                {categoryIcon(market.category)}
              </div>
              <div className='flex flex-col gap-1'>
                <h1 className='text-lg font-bold text-black md:text-2xl'>
                  {market.title}
                </h1>
                {market.subtitle && (
                  <p className='text-sm text-neutral-10'>{market.subtitle}</p>
                )}
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-10'>
              {market.live ? (
                <LiveBadge />
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold capitalize ${
                    market.status === 'open'
                      ? 'bg-success-bg text-success'
                      : 'bg-hover/60 text-neutral-10'
                  }`}
                >
                  {market.status}
                </span>
              )}
              <span>Volume: {formatNairaCompact(market.volume)}</span>
              <span>Liquidity: {formatNairaCompact(market.liquidity)}</span>
              {market.live && countdown.display ? (
                <span className='font-semibold text-error'>
                  {countdown.label} in {countdown.display}
                </span>
              ) : (
                market.closeTime && (
                  <span>{formatCloseTimer(market.closeTime)}</span>
                )
              )}
            </div>
          </div>

          {/* Chart */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold text-black'>
                  {selectedOutcome?.percent ?? 0}%
                </span>
                <span className='text-sm text-neutral-10'>
                  {selectedOutcome?.label}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                {CHART_PERIODS.map((p) => (
                  <button
                    key={p.mode}
                    type='button'
                    onClick={() => pickChartMode(p.mode)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      chartMode === p.mode
                        ? 'bg-brand-green text-black dark:text-text-black!'
                        : 'text-neutral-10 hover:text-black'
                    }`}
                  >
                    {p.mode === 'live' && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          chartMode === 'live'
                            ? 'animate-pulse bg-black'
                            : 'bg-error'
                        }`}
                      />
                    )}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className='h-56 w-full'>
              {chartData.length > 1 ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id='fill' x1='0' y1='0' x2='0' y2='1'>
                        <stop
                          offset='0%'
                          stopColor='var(--color-brand-green)'
                          stopOpacity={0.35}
                        />
                        <stop
                          offset='100%'
                          stopColor='var(--color-brand-green)'
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey='time'
                      tickFormatter={(v) => String(v).slice(0, 5)}
                      tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={44}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      width={44}
                      tickFormatter={(v) => formatCompact(Number(v))}
                      tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [
                        formatCompact(Number(v)),
                        selectedOutcome?.label ?? '',
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-card)',
                        fontSize: 12,
                        color: 'var(--color-black)',
                      }}
                      itemStyle={{ color: 'var(--color-black)' }}
                      labelStyle={{ color: 'var(--color-black)' }}
                    />
                    <Area
                      type='monotone'
                      dataKey='value'
                      stroke='var(--color-brand-green)'
                      strokeWidth={2}
                      fill='url(#fill)'
                      isAnimationActive={false}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex h-full items-center justify-center text-sm text-neutral-10'>
                  Not enough trade history to chart yet.
                </div>
              )}
            </div>

            {/* Outcome quick buttons */}
            <div className='grid grid-cols-2 gap-3'>
              {market.outcomes.map((o) => {
                const active = o.id === selectedOutcome?.id
                const isYes = o.id === market.yes?.id
                const colorClasses = active
                  ? isYes
                    ? 'bg-success text-white'
                    : 'bg-error text-white'
                  : isYes
                    ? 'bg-market-success text-success hover:bg-success hover:text-white'
                    : 'bg-market-error text-error hover:bg-error hover:text-white'
                return (
                  <button
                    key={o.id}
                    type='button'
                    onClick={() => setSelectedId(o.id)}
                    className={`flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-all ${colorClasses}`}
                  >
                    <span className='uppercase'>{o.label}</span>
                    <span>{formatSharePrice(o.cents)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rules / Recent trades */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-5'>
            <div className='flex items-center gap-4 border-b border-border/60'>
              {(['rules', 'trades'] as const).map((t) => (
                <button
                  key={t}
                  type='button'
                  onClick={() => setInfoTab(t)}
                  className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize transition-colors ${
                    infoTab === t
                      ? 'border-brand-green text-black'
                      : 'border-transparent text-neutral-10 hover:text-black'
                  }`}
                >
                  {t === 'trades' ? 'Recent Trades' : 'Rules'}
                </button>
              ))}
            </div>

            {infoTab === 'rules' ? (
              <p className='text-sm leading-relaxed whitespace-pre-line text-neutral-10'>
                {market.rules ||
                  'No resolution rules were provided for this market.'}
              </p>
            ) : (
              <div className='flex flex-col'>
                {trades?.length ? (
                  <>
                    <div className='grid grid-cols-4 gap-2 pb-2 text-xs font-semibold text-neutral-10'>
                      <span>Side</span>
                      <span className='text-right'>Price</span>
                      <span className='text-right'>Size</span>
                      <span className='text-right'>Time</span>
                    </div>
                    {trades.slice(0, 15).map((t) => (
                      <div
                        key={t.id}
                        className='grid grid-cols-4 gap-2 border-t border-border/40 py-2 text-xs'
                      >
                        <span
                          className={`font-semibold capitalize ${
                            t.side === 'buy' ? 'text-success' : 'text-error'
                          }`}
                        >
                          {t.side}
                        </span>
                        <span className='text-right text-black'>
                          {formatSharePrice(t.price)}
                        </span>
                        <span className='text-right text-neutral-10'>
                          {formatCompact(t.size)}
                        </span>
                        <span className='text-right text-neutral-10'>
                          {new Date(t.ts).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className='py-4 text-sm text-neutral-10'>
                    No recent trades.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trade panel */}
        <div className='lg:sticky lg:top-24 lg:self-start'>
          <TradePanel
            market={market}
            selectedOutcome={selectedOutcome}
            onSelectOutcome={(o) => setSelectedId(o.id)}
          />
        </div>
      </div>
    </main>
  )
}

export default MarketDetail
