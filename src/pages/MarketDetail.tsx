import { useMemo, useState } from 'react'
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
import { useMarket, useMarketTrades } from '../data_layer/markets'
import TradePanel from '../components/markets/TradePanel'
import { categoryIcon } from '../utils/marketDisplay'
import { formatCloseTimer, formatCompact } from '../utils/functions'
import { showSuccessToast } from '../utils/toastUtils'
import type { UiOutcome } from '../types/market.types'

const CHART_PERIODS = ['Live', '1h', '1d', '1w', '1m'] as const
type ChartPeriod = (typeof CHART_PERIODS)[number]

const PERIOD_MS: Record<ChartPeriod, number> = {
  Live: Number.POSITIVE_INFINITY,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
}

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get('outcome') ?? undefined,
  )
  const [period, setPeriod] = useState<ChartPeriod>('Live')
  const [infoTab, setInfoTab] = useState<'rules' | 'trades'>('rules')

  const eventId = searchParams.get('event') ?? undefined
  const { data: market, isLoading, isError } = useMarket(id, eventId)
  const { data: trades } = useMarketTrades(id, 50)

  const selectedOutcome: UiOutcome | undefined = useMemo(() => {
    if (!market) return undefined
    return (
      market.outcomes.find((o) => o.id === selectedId) ??
      market.yes ??
      market.outcomes[0]
    )
  }, [market, selectedId])

  const chartData = useMemo(() => {
    if (!trades?.length || !selectedOutcome) return []
    const forOutcome = trades.filter((t) => t.outcomeId === selectedOutcome.id)
    if (!forOutcome.length) return []
    // Window relative to the latest trade so historical markets still chart.
    const latest = Math.max(...forOutcome.map((t) => new Date(t.ts).getTime()))
    const cutoff = latest - PERIOD_MS[period]
    return forOutcome
      .filter((t) => new Date(t.ts).getTime() >= cutoff)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      .map((t) => ({
        time: new Date(t.ts).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: Math.round(t.price * 100),
      }))
  }, [trades, selectedOutcome, period])

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
            aria-label='Save market'
            className='rounded-full bg-card p-2 text-neutral-10 hover:text-black'
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
              <span
                className={`rounded-full px-2 py-0.5 font-semibold capitalize ${
                  market.status === 'open'
                    ? 'bg-success-bg text-success'
                    : 'bg-hover/60 text-neutral-10'
                }`}
              >
                {market.status}
              </span>
              <span>Volume: ${formatCompact(market.volume)}</span>
              <span>Liquidity: ${formatCompact(market.liquidity)}</span>
              {market.closeTime && (
                <span>{formatCloseTimer(market.closeTime)}</span>
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
                    key={p}
                    type='button'
                    onClick={() => setPeriod(p)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      period === p
                        ? 'bg-brand-green text-black dark:text-text-black!'
                        : 'text-neutral-10 hover:text-black'
                    }`}
                  >
                    {p}
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
                      tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={[0, 100]}
                      width={30}
                      tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [`${v}%`, selectedOutcome?.label ?? '']}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-card)',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type='monotone'
                      dataKey='value'
                      stroke='var(--color-brand-green)'
                      strokeWidth={2}
                      fill='url(#fill)'
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
                return (
                  <button
                    key={o.id}
                    type='button'
                    onClick={() => setSelectedId(o.id)}
                    className={`flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                      isYes
                        ? 'bg-market-success text-success hover:bg-market-success/50'
                        : 'bg-market-error text-error hover:bg-market-error/50'
                    } ${active ? 'ring-2 ring-brand-green' : ''}`}
                  >
                    <span className='uppercase'>{o.label}</span>
                    <span>{o.cents}¢</span>
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
                          {Math.round(t.price * 100)}¢
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
