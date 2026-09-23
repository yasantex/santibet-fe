import type { TooltipContentProps } from 'recharts'
import { chartTooltipLabel } from '../../data_layer/markets'
import { formatChartValue } from '../../utils/chartFormat'
import type { ChartUnit } from '../../types/market.types'

interface ChartTooltipProps extends TooltipContentProps {
  /** Outcome/series name shown next to the value (e.g. "Up", "Leeds"). Used
   *  for single-series charts; multi-line charts use each line's `name`. */
  seriesLabel?: string
  /** First point's value in the series — shown as a +/- change vs now
   *  (single-series charts only). */
  baseValue?: number
  unit?: ChartUnit
  /** Include seconds in the timestamp (Live view). */
  withSeconds?: boolean
}

/**
 * Shared hover-tooltip content for market price/percent charts (the featured
 * carousel and the market-detail chart). Shows the point's full date and time,
 * each series' value, and — for a single series — the change vs the start of
 * the loaded range.
 */
const ChartTooltip = ({
  active,
  payload,
  seriesLabel,
  baseValue,
  unit = 'percent',
  withSeconds = false,
}: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as { t?: number } | undefined
  const rows = payload.filter((p) => p.value != null)
  const single = rows.length === 1
  const value = Number(rows[0]?.value ?? 0)
  const delta = single && baseValue != null ? value - baseValue : null
  const up = (delta ?? 0) >= 0

  return (
    <div className='flex min-w-40 flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm'>
      {point?.t != null && (
        <p className='font-medium text-neutral-10'>
          {chartTooltipLabel(point.t, withSeconds)}
        </p>
      )}
      {rows.map((row) => (
        <div
          key={String(row.dataKey)}
          className='flex items-center justify-between gap-4'
        >
          <span className='flex min-w-0 items-center gap-1.5 text-neutral-10'>
            {!single && (
              <span
                className='h-2 w-2 shrink-0 rounded-full'
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className='truncate'>
              {single ? (seriesLabel ?? row.name) : row.name}
            </span>
          </span>
          <span className='font-bold text-black'>
            {formatChartValue(Number(row.value), unit)}
          </span>
        </div>
      ))}
      {delta != null && Number.isFinite(delta) && (
        <p
          className={`text-right font-semibold ${up ? 'text-success' : 'text-error'}`}
        >
          {up ? '+' : '-'}
          {unit === 'percent'
            ? `${Math.abs(delta).toFixed(1)} pts`
            : formatChartValue(Math.abs(delta), unit)}
        </p>
      )}
    </div>
  )
}

export default ChartTooltip
