// src/components/markets/FeaturedMarketCard.tsx
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
import type { FeaturedMarket } from '../../types/market.types'

const FeaturedMarketCard = ({ market }: { market: FeaturedMarket }) => {
  const isPositive = market.changePercent >= 0

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-card p-6'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2 text-sm text-placeholder'>
          <span>🏴</span>
          <span>{market.question}</span>
        </div>
        <div className='flex items-baseline gap-2'>
          <span className='text-3xl font-bold text-black'>
            {market.yesPercent}% chance
          </span>
          <span
            className={`text-sm font-semibold ${
              isPositive ? 'text-success' : 'text-error'
            }`}
          >
            {isPositive ? '+' : ''}
            {market.changePercent}%
          </span>
        </div>
      </div>

      <div className='h-32 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={market.chartData}>
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Line
              type='monotone'
              dataKey='value'
              stroke='var(--color-brand-green)'
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <button
          type='button'
          className='rounded-lg bg-market-success py-3 text-sm font-bold text-success'
        >
          YES {market.yesPercent}%
        </button>
        <button
          type='button'
          className='rounded-lg bg-market-error py-3 text-sm font-bold text-error'
        >
          NO {market.noPercent}%
        </button>
      </div>
    </div>
  )
}

export default FeaturedMarketCard