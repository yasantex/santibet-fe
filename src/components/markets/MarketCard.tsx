import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import { formatCompact } from '../../utils/functions'
import { categoryIcon } from '../../utils/marketDisplay'

const OutcomeRow = ({
  outcome,
  tone,
  onClick,
}: {
  outcome?: UiOutcome
  tone: 'yes' | 'no'
  onClick?: () => void
}) => {
  if (!outcome) return null
  const isYes = tone === 'yes'
  return (
    <div className='flex items-center gap-3'>
      <div className='min-w-0 flex-1'>
        <div className='mb-1.5 flex items-baseline justify-between text-sm'>
          <span className='font-bold text-black uppercase'>{outcome.label}</span>
          <span className={`font-bold ${isYes ? 'text-success' : 'text-error'}`}>
            {outcome.percent}%
          </span>
        </div>
        <div className='h-1 w-full overflow-hidden rounded-full bg-border/40'>
          <div
            className={`h-full rounded-full ${isYes ? 'bg-success' : 'bg-error'}`}
            style={{ width: `${outcome.percent}%` }}
          />
        </div>
      </div>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-bold ${
          isYes
            ? 'bg-market-success text-success'
            : 'bg-market-error text-error'
        }`}
      >
        {outcome.cents}¢
      </button>
    </div>
  )
}

interface MarketCardProps {
  market: UiMarket
  onSelect?: (market: UiMarket) => void
  onSelectOutcome?: (market: UiMarket, outcome: UiOutcome) => void
  onSave?: (market: UiMarket) => void
}

const MarketCard = ({
  market,
  onSelect,
  onSelectOutcome,
  onSave,
}: MarketCardProps) => {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect?.(market)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.(market)
      }}
      className='flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-green/60'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border/30 text-base'>
            {categoryIcon(market.category)}
          </div>
          <span className='text-xs font-medium text-neutral-10'>
            {market.category}
          </span>
        </div>
        <button
          type='button'
          aria-label='Save market'
          onClick={(e) => {
            e.stopPropagation()
            onSave?.(market)
          }}
          className='text-neutral-10 hover:text-black'
        >
          <HugeiconsIcon icon={Bookmark02Icon} size={18} />
        </button>
      </div>

      <h3 className='line-clamp-2 min-h-11 text-base leading-snug font-bold text-black'>
        {market.title}
      </h3>

      <div className='flex flex-col gap-4'>
        <OutcomeRow
          outcome={market.yes}
          tone='yes'
          onClick={() =>
            market.yes && onSelectOutcome?.(market, market.yes)
          }
        />
        <OutcomeRow
          outcome={market.no}
          tone='no'
          onClick={() => market.no && onSelectOutcome?.(market, market.no)}
        />
      </div>

      <div className='flex items-center justify-between pt-1'>
        <span className='text-xs text-placeholder'>
          Volume: ${formatCompact(market.volume)}
        </span>
        <span className='flex items-center gap-0.5 text-xs font-semibold text-neutral-10'>
          Explore
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </span>
      </div>
    </div>
  )
}

export default MarketCard
