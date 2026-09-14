import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import { formatNairaCompact, formatSharePrice } from '../../utils/functions'
import { categoryIcon } from '../../utils/marketDisplay'
import ChartTooltip from './ChartTooltip'

interface FeaturedMarketCardProps {
  market: UiMarket
  chartData?: { value: number }[]
  onSelect?: (market: UiMarket) => void
  onSelectOutcome?: (market: UiMarket, outcome: UiOutcome) => void
}

const FeaturedMarketCard = ({
  market,
  chartData,
  onSelect,
  onSelectOutcome,
}: FeaturedMarketCardProps) => {
  const yes = market.yes
  const no = market.no
  // Real history when we have it; otherwise a flat line at the current chance
  // (accurate to the market's present state — no fabricated movement). Memoised
  // so the chart doesn't re-animate to empty on every render.
  const series = useMemo(
    () =>
      chartData && chartData.length > 1
        ? chartData
        : Array.from({ length: 8 }).map(() => ({ value: yes?.percent ?? 50 })),
    [chartData, yes?.percent],
  )

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect?.(market)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.(market)
      }}
      className='flex cursor-pointer flex-col gap-6 rounded-lg bg-card p-6 transition-colors hover:bg-card/80'
    >
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2 text-sm text-placeholder'>
          <span>{categoryIcon(market.category)}</span>
          <span className='line-clamp-1'>{market.title}</span>
        </div>
        <div className='flex items-baseline gap-2'>
          <span className='text-3xl font-bold text-black'>
            {yes?.percent ?? 0}% chance
          </span>
          <span className='text-sm font-semibold text-placeholder'>
            {market.category}
          </span>
        </div>
      </div>

      <div className='h-32 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={series}>
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  seriesLabel={yes?.label ?? 'Chance'}
                  baseValue={series[0]?.value}
                />
              )}
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
            />
            <Line
              type='monotone'
              dataKey='value'
              stroke='var(--color-brand-green)'
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            if (yes) onSelectOutcome?.(market, yes)
          }}
          className='rounded-lg cursor-pointer bg-market-success hover:bg-success hover:text-white py-3 text-sm font-bold text-success'
        >
          {yes?.label ?? 'YES'} {formatSharePrice(yes?.cents ?? 0)}
        </button>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            if (no) onSelectOutcome?.(market, no)
          }}
          className='rounded-lg cursor-pointer bg-market-error  hover:bg-error hover:text-white py-3 text-sm font-bold text-error'
        >
          {no?.label ?? 'NO'} {formatSharePrice(no?.cents ?? 0)}
        </button>
      </div>

      <div className='flex items-center justify-between text-xs text-placeholder'>
        <span>Volume: {formatNairaCompact(market.volume)}</span>
        <span>Liquidity: {formatNairaCompact(market.liquidity)}</span>
      </div>
    </div>
  )
}

export default FeaturedMarketCard
