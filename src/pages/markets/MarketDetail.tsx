import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  AreaChart,
  Area,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Bookmark02Icon,
  Flag01Icon,
} from '@hugeicons/core-free-icons'
import { useFavorites } from '../../hooks/useFavorites'
import { isSportsMarket } from '../../hooks/useComboSlip'
import TradePanel from '../../components/markets/TradePanel'
import ComboMarketPanel from '../../components/combo/ComboMarketPanel'
import { LiveBadge, ScoreBoard } from '../../components/markets/LiveBits'
import ChartTooltip from '../../components/markets/ChartTooltip'
import ChartRangeTabs from '../../components/markets/ChartRangeTabs'
import { chartDomain, formatChartTick } from '../../utils/chartFormat'
import { useCountdown } from '../../hooks/useCountdown'
import {
  categoryIcon,
  findTeam,
  MARKET_STATUS_LABELS,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import TeamLogo from '../../components/markets/TeamLogo'
import {
  chartTimeLabel,
  useMarket,
  useMarketChart,
  useLobbyStream,
  useEvent,
} from '../../data_layer/markets'
import {
  formatCloseTimer,
  formatNairaCompact,
  formatSharePrice,
} from '../../utils/functions'
import ShareMarketButton from '../../components/markets/ShareMarketButton'
import { useSupport } from '../../support/supportContext'
import type { ChartMode, ChartPoint, UiOutcome } from '../../types/market.types'
import { getOriginPage } from '../../hooks/useOriginPage'
import { useOddsFormat } from '../../hooks/useOddsFormat'

// How often the Live view extends its tail / pulls a fresh quote.
const LIVE_TICK_MS = 3000
// Price refresh for a market the live stream reports as polling-only.
const MARKET_POLL_MS = 10_000
// Partner rules can run to several paragraphs; longer ones start collapsed.
const RULES_PREVIEW_CHARS = 360

/** "14:05" today, "Oct 24, 14:05" before. */
const tradeTimeLabel = (iso: string) => {
  const d = new Date(iso)
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

const MarketDetail = () => {
  const { openReport } = useSupport()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get('outcome') ?? undefined,
  )
  const [chartMode, setChartMode] = useState<ChartMode>('live')
  const [userPickedMode, setUserPickedMode] = useState(false)
  const [infoTab, setInfoTab] = useState<'rules' | 'trades'>('rules')
  const [rulesExpanded, setRulesExpanded] = useState(false)
  // Sports markets take a single bet or a combo leg; null = not picked yet.
  const [sportsMode, setSportsMode] = useState<'single' | 'combo' | null>(null)
  const { priceLabel } = useOddsFormat()

  const eventId = searchParams.get('event') ?? undefined
  // Markets the stream can't push live prices for; poll those instead.
  const [pollingOnly, setPollingOnly] = useState<string[]>([])
  const { data: market, isLoading, isError } = useMarket(
    id,
    eventId,
    pollingOnly.length > 0 ? MARKET_POLL_MS : false,
  )
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  // The event carries the real category (the single-market endpoint has none,
  // so the market falls back to "General"), the teams with their crests, and,
  // when live, the score/period/clock.
  const { data: event } = useEvent(eventId)
  const teams = event?.teams ?? market?.teams ?? null
  // The single-market endpoint omits teams; borrow the event's so the panels
  // can show crests beside team-named outcomes.
  const marketWithTeams = useMemo(
    () => (market && teams && !market.teams ? { ...market, teams } : market),
    [market, teams],
  )
  const origin = getOriginPage()
  const category = event?.category ?? market?.category ?? ''

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
  const chartUnit = chart?.unit ?? 'percent'

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
    onSubscribed: (sub) => setPollingOnly(sub.pollingOnly),
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

  // A single bet unless the player chooses to add this pick to a combo.
  const activeSportsMode = sportsMode ?? 'single'

  // Partner markets carry their rules; pool rounds and some admin markets
  // don't, so the tab only shows when there's something to read.
  const rules = market?.rules?.trim() || null
  const activeInfoTab = rules ? infoTab : 'trades'
  const rulesLong = !!rules && rules.length > RULES_PREVIEW_CHARS
  // The history endpoint lists trades oldest first; show the newest.
  const recentTrades = [...(trades ?? [])].reverse().slice(0, 15)

  const winner = market?.resolvedOutcomeId
    ? market.outcomes.find((o) => o.id === market.resolvedOutcomeId)
    : undefined

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
          <Link to={origin.href} className='hover:text-black'>
            {origin.label}
          </Link>
          {/* Opened from that category's page: don't repeat its name. */}
          {category.toLowerCase() !== origin.label.toLowerCase() && (
            <>
              <span>/</span>
              <span className='font-medium text-black'>{category}</span>
            </>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <ShareMarketButton
            market={market}
            className='rounded-full bg-card p-2 text-neutral-10 hover:text-black'
          />
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
          <button
            type='button'
            aria-label='Report a problem with this market'
            title='Report a problem with this market'
            onClick={() =>
              openReport({
                category: 'MARKET',
                marketId: market.id,
                marketTitle: market.title,
              })
            }
            className='rounded-full bg-card p-2 text-neutral-10 hover:text-black'
          >
            <HugeiconsIcon icon={Flag01Icon} size={18} />
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
                {categoryIcon(category)}
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
            {event?.liveState && (
              <ScoreBoard state={event.liveState} teams={teams} />
            )}
            {winner ? (
              <p className='rounded-lg bg-success-bg px-3 py-2 text-sm font-semibold text-success'>
                Resolved · {winner.label} won
              </p>
            ) : market.status === 'voided' ? (
              <p className='rounded-lg bg-hover/60 px-3 py-2 text-sm font-semibold text-black'>
                This market was voided.
              </p>
            ) : market.status === 'disputed' ? (
              <p className='rounded-lg bg-warning/10 px-3 py-2 text-sm font-semibold text-warning'>
                This market’s result is under dispute.
              </p>
            ) : null}
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
                  {MARKET_STATUS_LABELS[market.status] ?? market.status}
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
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold text-black'>
                  {selectedOutcome?.percent ?? 0}%
                </span>
                <span className='text-sm text-neutral-10'>
                  {selectedOutcome?.label}
                </span>
              </div>
              <ChartRangeTabs value={chartMode} onChange={pickChartMode} />
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
                      dataKey='t'
                      type='number'
                      scale='time'
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(t) => chartTimeLabel(Number(t), chartMode)}
                      tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={44}
                    />
                    <YAxis
                      domain={chartDomain(chartUnit)}
                      width={chartUnit === 'usd' ? 64 : 44}
                      tickFormatter={(v) => formatChartTick(Number(v), chartUnit)}
                      tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={(props) => (
                        <ChartTooltip
                          {...props}
                          seriesLabel={selectedOutcome?.label ?? ''}
                          baseValue={chartData[0]?.value}
                          unit={chartUnit}
                          withSeconds={chartMode === 'live'}
                        />
                      )}
                    />
                    {chart?.strike != null && (
                      <ReferenceLine
                        y={chart.strike}
                        stroke='var(--color-neutral-10)'
                        strokeDasharray='4 4'
                        label={{
                          value: 'Target',
                          position: 'insideTopRight',
                          fontSize: 11,
                          fill: 'var(--color-neutral-10)',
                        }}
                      />
                    )}
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
            <div className='flex items-stretch gap-3'>
              {market.outcomes.map((o, i) => {
                const tone = outcomeTone(market, o.id, i)
                // Once resolved, the winner is the highlighted outcome.
                const active = winner
                  ? o.id === winner.id
                  : o.id === selectedOutcome?.id
                const colorClasses = active
                  ? TONE_STYLES[tone].solid
                  : TONE_STYLES[tone].button
                return (
                  <button
                    key={o.id}
                    type='button'
                    onClick={() => setSelectedId(o.id)}
                    className={`flex min-w-0 flex-1 items-center justify-between gap-1.5 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-all ${colorClasses} ${
                      winner && !active ? 'opacity-50' : ''
                    }`}
                  >
                    <span className='flex min-w-0 items-center gap-2'>
                      <TeamLogo team={findTeam(teams, o.label)} size={18} />
                      <span className='min-w-0 truncate uppercase'>{o.label}</span>
                    </span>
                    <span className='shrink-0'>
                      {winner ? (active ? 'Won' : 'Lost') : priceLabel(market, o)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rules / Recent trades */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-5'>
            <div className='flex items-center gap-4 border-b border-border/60'>
              {(rules ? (['rules', 'trades'] as const) : (['trades'] as const)).map((t) => (
                <button
                  key={t}
                  type='button'
                  onClick={() => setInfoTab(t)}
                  className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize transition-colors ${
                    activeInfoTab === t
                      ? 'border-brand-green text-black'
                      : 'border-transparent text-neutral-10 hover:text-black'
                  }`}
                >
                  {t === 'trades' ? 'Recent Trades' : 'Rules'}
                </button>
              ))}
            </div>

            {activeInfoTab === 'rules' && rules ? (
              <div className='flex flex-col items-start gap-2'>
                {/* Plain text: paragraphs are blank-line separated, so keep the
                    line breaks rather than parsing it as Markdown. */}
                <p
                  className={`text-sm leading-relaxed whitespace-pre-line text-neutral-10 ${
                    rulesLong && !rulesExpanded ? 'line-clamp-6' : ''
                  }`}
                >
                  {rules}
                </p>
                {rulesLong && (
                  <button
                    type='button'
                    onClick={() => setRulesExpanded((v) => !v)}
                    className='text-sm font-semibold text-black hover:underline'
                  >
                    {rulesExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            ) : (
              <div className='flex flex-col'>
                {recentTrades.length ? (
                  <>
                    <div className='grid grid-cols-4 gap-2 pb-2 text-xs font-semibold text-neutral-10'>
                      <span>Side</span>
                      <span className='text-right'>Price</span>
                      <span className='text-right'>Amount</span>
                      <span className='text-right'>Time</span>
                    </div>
                    {recentTrades.map((t) => (
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
                          {t.price != null ? formatSharePrice(t.price) : 'Pool'}
                        </span>
                        {/* A combo leg has no stake of its own. */}
                        <span className='text-right text-neutral-10'>
                          {t.combo
                            ? 'Combo'
                            : t.amount != null
                              ? formatNairaCompact(t.amount)
                              : '—'}
                        </span>
                        <span className='text-right text-neutral-10'>
                          {tradeTimeLabel(t.ts)}
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

        {/* Trade panel — sports offer a single bet or a combo leg; everything
            else gets the single-bet panel. */}
        <div className='flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start'>
          {isSportsMarket(market) && (
            <div className='flex items-center gap-1 rounded-full bg-hover p-1'>
              {(['single', 'combo'] as const).map((mode) => (
                <button
                  key={mode}
                  type='button'
                  onClick={() => setSportsMode(mode)}
                  className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors ${
                    activeSportsMode === mode
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-10 hover:text-black'
                  }`}
                >
                  {mode === 'single' ? 'Single bet' : 'Add to combo'}
                </button>
              ))}
            </div>
          )}
          {isSportsMarket(market) && activeSportsMode === 'combo' ? (
            <ComboMarketPanel market={marketWithTeams ?? market} />
          ) : (
            <TradePanel
              market={marketWithTeams ?? market}
              selectedOutcome={selectedOutcome}
              onSelectOutcome={(o) => setSelectedId(o.id)}
            />
          )}
        </div>
      </div>
    </main>
  )
}

export default MarketDetail
