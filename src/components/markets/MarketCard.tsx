import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import { formatNairaCompact, formatSharePrice } from '../../utils/functions'
import { categoryIcon } from '../../utils/marketDisplay'
import { MarketCountdown } from '../globals/ReusedText'

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
          <span className='font-bold text-black uppercase'>
            {outcome.label}
          </span>
          <span
            className={`font-bold ${isYes ? 'text-success' : 'text-error'}`}
          >
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
        className={`shrink-0 rounded-lg px-4 cursor-pointer py-2.5 text-xs font-bold ${
          isYes
            ? 'bg-market-success text-success hover:bg-success hover:text-white'
            : 'bg-market-error text-error hover:bg-error hover:text-white'
        }`}
      >
        {formatSharePrice(outcome.cents)}
      </button>
    </div>
  )
}

interface MarketCardProps {
  market: UiMarket
  onSelect?: (market: UiMarket) => void
  onSelectOutcome?: (market: UiMarket, outcome: UiOutcome) => void
  onSave?: (market: UiMarket) => void
  /** Whether this market is currently saved to favorites. */
  isSaved?: boolean
  /** Show a LIVE badge + ticking countdown in the header. */
  live?: boolean
}

const MarketCard = ({
  market,
  onSelect,
  onSelectOutcome,
  onSave,
  isSaved = false,
  live = false,
}: MarketCardProps) => {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect?.(market)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.(market)
      }}
      className='flex cursor-pointer flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand-green/60'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {market.imageUrl ? (
            <img
              src={market.imageUrl}
              alt=''
              className='h-8 w-8 shrink-0 rounded-full object-cover'
            />
          ) : (
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border/30 text-base'>
              {categoryIcon(market.category)}
            </div>
          )}
          <span className='text-xs font-medium text-neutral-10'>
            {market.category}
          </span>
          {live && (
            <span className='flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500'>
              <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500' />
              LIVE
            </span>
          )}
        </div>
        <button
          type='button'
          aria-label={isSaved ? 'Remove from favorites' : 'Save market'}
          onClick={(e) => {
            e.stopPropagation()
            onSave?.(market)
          }}
          className={isSaved ? 'text-black' : 'text-neutral-10 hover:text-black'}
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
          onClick={() => market.yes && onSelectOutcome?.(market, market.yes)}
        />
        <OutcomeRow
          outcome={market.no}
          tone='no'
          onClick={() => market.no && onSelectOutcome?.(market, market.no)}
        />
      </div>

      <div className='flex items-center justify-between pt-1'>
        {live ? (
          <MarketCountdown
            openTime={market.openTime}
            closeTime={market.closeTime}
          />
        ) : (
          <span className='text-xs text-placeholder'>
            Volume: {formatNairaCompact(market.volume)}
          </span>
        )}
        <span className='flex items-center gap-0.5 text-xs font-semibold text-neutral-10'>
          Explore
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </span>
      </div>
    </div>
  )
}

export default MarketCard
