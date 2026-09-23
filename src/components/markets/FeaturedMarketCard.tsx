import { useMemo, useState, type ReactNode } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark02Icon } from '@hugeicons/core-free-icons'
import type {
  ChartMode,
  ChartPoint,
  UiEvent,
  UiMarket,
  UiOutcome,
} from '../../types/market.types'
import {
  CHART_RANGES,
  chartTimeLabel,
  useMarketCharts,
} from '../../data_layer/markets'
import { useCountdown } from '../../hooks/useCountdown'
import { formatNairaCompact, formatSharePrice } from '../../utils/functions'
import {
  categoryIcon,
  marketDisplayTitle,
  siblingShortLabels,
} from '../../utils/marketDisplay'
import {
  chartDomain,
  formatChartTick,
  formatChartValue,
} from '../../utils/chartFormat'
import ChartTooltip from './ChartTooltip'
import ChartRangeTabs from './ChartRangeTabs'
import ShareMarketButton from './ShareMarketButton'
import { LiveBadge } from './LiveBits'

/** Line colours, lead outcome first (brand green, then distinct hues). */
const LINE_COLORS = [
  'var(--color-brand-green)',
  '#3b82f6',
  '#f59e0b',
  '#f97316',
]
const MAX_LINES = 4

interface FeaturedMarketCardProps {
  event: UiEvent
  isSaved?: (marketId: string) => boolean
  onSave?: (market: UiMarket) => void
  onSelect?: (market: UiMarket) => void
  onSelectEvent?: (event: UiEvent) => void
  onSelectOutcome?: (market: UiMarket, outcome: UiOutcome) => void
  /** Carousel controls, rendered in the footer. */
  controls?: ReactNode
}

type ChartRow = Record<string, number>

/**
 * Put each outcome's series on one timeline, keyed s0..s3 for the chart lines
 * (a series holds its last value until its next point). With no history yet,
 * falls back to a flat line at each outcome's current chance — true to the
 * market's present state, no fabricated movement.
 */
const mergeSeries = (
  series: ChartPoint[][],
  rows: UiMarket[],
  range: ChartMode,
): ChartRow[] => {
  const times = [...new Set(series.flatMap((s) => s.map((p) => p.t)))].sort(
    (a, b) => a - b,
  )
  const cursor = series.map(() => 0)
  const last: (number | undefined)[] = series.map(() => undefined)
  const merged = times.map((t) => {
    const row: ChartRow = { t }
    series.forEach((s, i) => {
      while (cursor[i] < s.length && s[cursor[i]].t <= t) {
        last[i] = s[cursor[i]].value
        cursor[i]++
      }
      if (last[i] != null) row[`s${i}`] = last[i]
    })
    return row
  })
  if (merged.length > 1) return merged

  const now = Date.now()
  const start = now - (CHART_RANGES[range].windowMs ?? 60 * 60 * 1000)
  return [start, now].map((t) => {
    const row: ChartRow = { t }
    rows.forEach((m, i) => (row[`s${i}`] = m.yes?.percent ?? 0))
    return row
  })
}

/** "<1%" rather than a misleading "0%" for long shots (percent is rounded). */
const chanceLabel = (outcome?: UiOutcome) => {
  const pct = (outcome?.price ?? 0) * 100
  return pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`
}

/** Countdown in its own component so its 1s tick doesn't re-render the chart. */
const EndsIn = ({ market }: { market: UiMarket }) => {
  const { label, display } = useCountdown(market.openTime, market.closeTime)
  if (label === 'Closed') return <span>Closed</span>
  return (
    <span className='flex flex-col items-end leading-tight'>
      <span className='text-xs text-neutral-10'>
        {label === 'Starts' ? 'Starts in' : 'Ends in'}
      </span>
      <span className='text-xl font-bold text-error tabular-nums'>{display}</span>
    </span>
  )
}

/**
 * Lobby hero card for one event, in the style of Polymarket's featured
 * carousel. Three layouts, picked from the data:
 *  - multi-outcome events: top outcomes with their chance + one line each;
 *  - price markets ("Bitcoin Up or Down"): price to beat vs current price;
 *  - plain yes/no markets: headline chance + Yes/No buttons.
 */
const FeaturedMarketCard = ({
  event,
  isSaved,
  onSave,
  onSelect,
  onSelectEvent,
  onSelectOutcome,
  controls,
}: FeaturedMarketCardProps) => {
  const markets = useMemo(() => {
    const tradeable = event.markets.filter((m) => m.yes)
    const open = tradeable.filter((m) => m.status === 'open')
    return open.length ? open : tradeable
  }, [event])

  const multi = markets.length > 1
  // Multi: the most likely outcomes, highest first. Single: the one market.
  const rows = useMemo(
    () =>
      [...markets]
        .sort((a, b) => (b.yes?.percent ?? 0) - (a.yes?.percent ?? 0))
        .slice(0, MAX_LINES),
    [markets],
  )
  const labels = useMemo(() => {
    const short = siblingShortLabels(markets.map((m) => m.title))
    return new Map(markets.map((m, i) => [m.id, short[i]]))
  }, [markets])
  const lead = rows[0]

  // Rolling price markets are best watched live; everything else over a day.
  const [range, setRange] = useState<ChartMode>(
    lead?.durationSeconds ? 'live' : '1d',
  )

  const charts = useMarketCharts(
    rows.map((m) => ({ marketId: m.id, outcomeId: m.yes?.id })),
    range,
  )
  const leadChart = charts[0]?.data
  const unit = leadChart?.unit ?? 'percent'
  const strike = leadChart?.strike ?? null

  const data = mergeSeries(
    charts.map((c) => c.data?.points ?? []),
    rows,
    range,
  )

  if (!lead) return null

  const currentPrice =
    unit === 'usd' ? data[data.length - 1]?.s0 : undefined
  const priceDelta =
    currentPrice != null && strike != null ? currentPrice - strike : null
  const volume = event.markets.reduce((sum, m) => sum + (m.volume || 0), 0)
  const title = multi ? event.title : marketDisplayTitle(lead)
  const imageUrl = event.imageUrl ?? lead.imageUrl
  const open = () => (multi ? onSelectEvent?.(event) : onSelect?.(lead))
  const saved = isSaved?.(lead.id) ?? false

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open()
      }}
      className='featured-slide flex h-full cursor-pointer flex-col gap-5 rounded-lg bg-card p-5 md:p-6'
    >
      {/* Header */}
      <div className='flex items-start gap-3'>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=''
            className='h-12 w-12 shrink-0 rounded-lg object-cover'
          />
        ) : (
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-border/30 text-2xl'>
            {categoryIcon(event.category)}
          </div>
        )}
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='line-clamp-1 text-sm text-placeholder'>
            {event.category}
            {!multi && lead.subtitle && ` · ${lead.subtitle}`}
          </span>
          <h2 className='line-clamp-2 text-lg leading-snug font-bold text-black md:text-2xl'>
            {title}
          </h2>
        </div>
        <div className='flex shrink-0 items-center gap-3 pt-1'>
          <ShareMarketButton market={lead} iconSize={20} />
          <button
            type='button'
            aria-label={saved ? 'Remove from favorites' : 'Save market'}
            aria-pressed={saved}
            onClick={(e) => {
              e.stopPropagation()
              onSave?.(lead)
            }}
            className={`cursor-pointer ${saved ? 'text-black' : 'text-neutral-10 hover:text-black'}`}
          >
            <HugeiconsIcon icon={Bookmark02Icon} size={20} />
          </button>
        </div>
      </div>

      <div className='grid flex-1 grid-cols-1 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
        {/* Left: outcomes / price / chance */}
        <div className='flex flex-col justify-between gap-4'>
          {multi ? (
            <div className='flex flex-col divide-y divide-border/40'>
              {rows.map((m, i) => (
                <button
                  key={m.id}
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect?.(m)
                  }}
                  className='flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-2.5 text-left hover:bg-hover'
                >
                  <span className='flex min-w-0 items-center gap-2'>
                    <span
                      className='h-2 w-2 shrink-0 rounded-full'
                      style={{ backgroundColor: LINE_COLORS[i] }}
                    />
                    <span className='truncate text-sm text-black'>
                      {labels.get(m.id)}
                    </span>
                  </span>
                  <span className='shrink-0 text-lg font-bold text-black tabular-nums'>
                    {chanceLabel(m.yes)}
                  </span>
                </button>
              ))}
              {markets.length > rows.length && (
                <span className='px-1 pt-2.5 text-xs font-semibold text-neutral-10'>
                  +{markets.length - rows.length} more outcomes
                </span>
              )}
            </div>
          ) : unit === 'usd' ? (
            <div className='flex items-start justify-between gap-4'>
              <div className='flex gap-4'>
                {strike != null && (
                  <div className='flex flex-col'>
                    <span className='text-xs text-neutral-10'>Price to beat</span>
                    <span className='text-xl font-bold text-black tabular-nums'>
                      {formatChartValue(strike, 'usd')}
                    </span>
                  </div>
                )}
                {currentPrice != null && (
                  <div className='flex flex-col'>
                    <span className='flex items-center gap-1.5 text-xs text-warning'>
                      Current price
                      {priceDelta != null && (
                        <span
                          className={`font-semibold ${priceDelta >= 0 ? 'text-success' : 'text-error'}`}
                        >
                          {priceDelta >= 0 ? '▲' : '▼'}{' '}
                          {formatChartValue(Math.abs(priceDelta), 'usd')}
                        </span>
                      )}
                    </span>
                    <span className='text-xl font-bold text-warning tabular-nums'>
                      {formatChartValue(currentPrice, 'usd')}
                    </span>
                  </div>
                )}
              </div>
              <EndsIn market={lead} />
            </div>
          ) : (
            <div className='flex items-baseline gap-2'>
              <span className='text-4xl font-bold text-black'>
                {chanceLabel(lead.yes)}
              </span>
              <span className='text-sm font-semibold text-placeholder'>
                chance
              </span>
            </div>
          )}

          {!multi && (
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  if (lead.yes) onSelectOutcome?.(lead, lead.yes)
                }}
                className='cursor-pointer rounded-lg bg-market-success py-3 text-sm font-bold text-success hover:bg-success hover:text-white'
              >
                {lead.yes?.label ?? 'Yes'} {formatSharePrice(lead.yes?.cents ?? 0)}
              </button>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  if (lead.no) onSelectOutcome?.(lead, lead.no)
                }}
                className='cursor-pointer rounded-lg bg-market-error py-3 text-sm font-bold text-error hover:bg-error hover:text-white'
              >
                {lead.no?.label ?? 'No'} {formatSharePrice(lead.no?.cents ?? 0)}
              </button>
            </div>
          )}
        </div>

        {/* Right: chart */}
        <div className='flex min-w-0 flex-col gap-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            {multi ? (
              <div className='flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs'>
                {rows.map((m, i) => (
                  <span key={m.id} className='flex items-center gap-1 text-neutral-10'>
                    <span
                      className='h-2 w-2 rounded-full'
                      style={{ backgroundColor: LINE_COLORS[i] }}
                    />
                    <span className='max-w-28 truncate'>{labels.get(m.id)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span />
            )}
            <ChartRangeTabs value={range} onChange={setRange} />
          </div>
          <div className='h-44 w-full md:h-52'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray='2 4'
                  stroke='var(--color-border)'
                />
                <XAxis
                  dataKey='t'
                  type='number'
                  scale='time'
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(t) => chartTimeLabel(Number(t), range)}
                  tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis
                  orientation='right'
                  domain={chartDomain(unit)}
                  width={unit === 'usd' ? 64 : 40}
                  tickFormatter={(v) => formatChartTick(Number(v), unit)}
                  tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      seriesLabel={multi ? undefined : (lead.yes?.label ?? 'Chance')}
                      baseValue={multi ? undefined : data[0]?.s0}
                      unit={unit}
                      withSeconds={range === 'live'}
                    />
                  )}
                  cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                />
                {strike != null && (
                  <ReferenceLine
                    y={strike}
                    stroke='var(--color-neutral-10)'
                    strokeDasharray='4 4'
                    label={{
                      value: 'Target',
                      position: 'insideTopLeft',
                      fontSize: 11,
                      fill: 'var(--color-neutral-10)',
                    }}
                  />
                )}
                {rows.map((m, i) => (
                  <Line
                    key={m.id}
                    type='monotone'
                    dataKey={`s${i}`}
                    name={multi ? labels.get(m.id) : (m.yes?.label ?? 'Chance')}
                    stroke={unit === 'usd' ? 'var(--color-warning)' : LINE_COLORS[i]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between gap-3 text-xs text-placeholder'>
        <span className='flex items-center gap-2'>
          {formatNairaCompact(volume)} Vol
          {(event.live || lead.live) && <LiveBadge />}
        </span>
        {controls}
        <span>
          {lead.closeTime &&
            `Closes ${new Date(lead.closeTime).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`}
        </span>
      </div>
    </div>
  )
}

export default FeaturedMarketCard
