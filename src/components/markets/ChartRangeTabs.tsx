import type { ChartMode } from '../../types/market.types'

const CHART_PERIODS: { label: string; mode: ChartMode }[] = [
  { label: 'Live', mode: 'live' },
  { label: '1H', mode: '1h' },
  { label: '6H', mode: '6h' },
  { label: '1D', mode: '1d' },
  { label: '1W', mode: '1w' },
]

type ChartRangeTabsProps = {
  value: ChartMode
  onChange: (mode: ChartMode) => void
  /** Hide the Live tab (e.g. on compact cards). */
  showLive?: boolean
}

/** Pill tabs for picking a chart time range (Live / 1H / 6H / 1D / 1W). */
const ChartRangeTabs = ({
  value,
  onChange,
  showLive = true,
}: ChartRangeTabsProps) => (
  <div className='flex items-center gap-1'>
    {CHART_PERIODS.filter((p) => showLive || p.mode !== 'live').map((p) => (
      <button
        key={p.mode}
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onChange(p.mode)
        }}
        className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
          value === p.mode
            ? 'bg-brand-green text-black dark:text-text-black!'
            : 'text-neutral-10 hover:text-black'
        }`}
      >
        {p.mode === 'live' && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              value === 'live' ? 'animate-pulse bg-black' : 'bg-error'
            }`}
          />
        )}
        {p.label}
      </button>
    ))}
  </div>
)

export default ChartRangeTabs
