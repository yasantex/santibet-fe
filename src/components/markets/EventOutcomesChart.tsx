import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { chartTimeLabel, useMarketCharts } from '../../data_layer/markets'
import { LINE_COLORS, mergeSeries } from '../../utils/eventChart'
import { chartDomain, formatChartTick } from '../../utils/chartFormat'
import { chanceLabel } from '../../utils/marketDisplay'
import ChartTooltip from './ChartTooltip'
import ChartRangeTabs from './ChartRangeTabs'
import type { ChartMode, UiMarket } from '../../types/market.types'

const MAX_LINES = 4

interface EventOutcomesChartProps {
  markets: UiMarket[]
  labels: Map<string, string>
}

/**
 * One Yes-chance line per leading market of a multi-choice event, with a
 * legend of their current chances — Polymarket's event chart.
 */
const EventOutcomesChart = ({ markets, labels }: EventOutcomesChartProps) => {
  const [range, setRange] = useState<ChartMode>('1w')
  // The most likely choices, highest first.
  const rows = useMemo(
    () =>
      [...markets]
        .filter((m) => m.status === 'open' && m.yes)
        .sort((a, b) => (b.yes?.price ?? 0) - (a.yes?.price ?? 0))
        .slice(0, MAX_LINES),
    [markets],
  )
  const charts = useMarketCharts(
    rows.map((m) => ({ marketId: m.id, outcomeId: m.yes?.id })),
    range,
  )
  const data = mergeSeries(
    charts.map((c) => c.data?.points ?? []),
    rows,
    range,
  )

  if (!rows.length) return null

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
        {rows.map((m, i) => (
          <span key={m.id} className='flex items-center gap-1.5 text-neutral-10'>
            <span
              className='h-2 w-2 shrink-0 rounded-full'
              style={{ backgroundColor: LINE_COLORS[i] }}
            />
            <span className='max-w-40 truncate'>{labels.get(m.id)}</span>
            <span className='font-semibold text-black tabular-nums'>
              {chanceLabel(m.yes)}
            </span>
          </span>
        ))}
      </div>
      <div className='h-56 w-full md:h-72'>
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
              domain={chartDomain('percent')}
              width={40}
              tickFormatter={(v) => formatChartTick(Number(v), 'percent')}
              tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  unit='percent'
                  withSeconds={range === 'live'}
                />
              )}
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
            />
            {rows.map((m, i) => (
              <Line
                key={m.id}
                type='monotone'
                dataKey={`s${i}`}
                name={labels.get(m.id)}
                stroke={LINE_COLORS[i]}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className='flex justify-end'>
        <ChartRangeTabs value={range} onChange={setRange} />
      </div>
    </div>
  )
}

export default EventOutcomesChart
