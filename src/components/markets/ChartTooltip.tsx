import type { TooltipContentProps } from 'recharts'
import { formatCompact } from '../../utils/functions'

interface ChartTooltipProps extends TooltipContentProps {
  /** Outcome/series name shown next to the value (e.g. "Up", "Leeds"). */
  seriesLabel: string
  /** First point's value in the series — shown as a +/- change vs now. */
  baseValue?: number
}

/**
 * Shared hover-tooltip content for market price/percent charts (the
 * FeaturedMarketCard sparkline and the market-detail chart) — keeps the two
 * in sync. Beyond the raw value, it surfaces the point's time and the
 * change vs the start of the loaded series.
 */
const ChartTooltip = ({
  active,
  payload,
  seriesLabel,
  baseValue,
}: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as { time?: string; value?: number } | undefined
  const value = Number(point?.value ?? payload[0]?.value ?? 0)
  const delta = baseValue != null ? value - baseValue : null
  const deltaPct = baseValue ? (delta! / baseValue) * 100 : null
  const up = (delta ?? 0) >= 0

  return (
    <div className='flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm'>
      {point?.time && (
        <p className='font-medium text-neutral-10'>{point.time}</p>
      )}
      <div className='flex items-center justify-between gap-4'>
        <span className='text-neutral-10'>{seriesLabel}</span>
        <span className='font-bold text-black'>{formatCompact(value)}</span>
      </div>
      {delta != null && Number.isFinite(delta) && (
        <p
          className={`text-right font-semibold ${up ? 'text-success' : 'text-error'}`}
        >
          {up ? '+' : ''}
          {formatCompact(delta)}
          {deltaPct != null &&
            Number.isFinite(deltaPct) &&
            ` (${up ? '+' : ''}${deltaPct.toFixed(1)}%)`}
        </p>
      )}
    </div>
  )
}

export default ChartTooltip
