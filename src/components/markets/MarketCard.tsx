import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import { formatNairaCompact, formatSharePrice } from '../../utils/functions'
import {
  categoryIcon,
  marketDisplayTitle,
  outcomeTone,
  TONE_STYLES,
  type OutcomeTone,
} from '../../utils/marketDisplay'
import { MarketCountdown } from '../globals/ReusedText'
import ShareMarketButton from './ShareMarketButton'

/** Binary (Yes/No) markets: one full stat row per side, price button inline. */
const OutcomeRow = ({
  outcome,
  tone,
  onClick,
}: {
  outcome?: UiOutcome
  tone: OutcomeTone
  onClick?: () => void
}) => {
  if (!outcome) return null
  const style = TONE_STYLES[tone]
  return (
    <div className='flex items-center gap-3'>
      <div className='min-w-0 flex-1'>
        <div className='mb-1.5 flex items-baseline justify-between gap-2 text-sm'>
          <span className='truncate font-bold text-black uppercase'>
            {outcome.label}
          </span>
          <span className={`shrink-0 font-bold ${style.percent}`}>
            {outcome.percent}%
          </span>
        </div>
        <div className='h-1 w-full overflow-hidden rounded-full bg-border/40'>
          <div
            className={`h-full rounded-full ${style.bar}`}
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
        className={`shrink-0 rounded-lg px-4 cursor-pointer py-2.5 text-xs font-bold ${style.button}`}
      >
        {formatSharePrice(outcome.cents)}
      </button>
    </div>
  )
}

/** 3+ outcome markets (e.g. a 1X2 match): name + percent only, no button. */
const OutcomeStatRow = ({
  outcome,
  tone,
}: {
  outcome: UiOutcome
  tone: OutcomeTone
}) => {
  const style = TONE_STYLES[tone]
  return (
    <div className='flex items-baseline justify-between gap-2 text-sm'>
      <span className='truncate font-bold text-black uppercase'>
        {outcome.label}
      </span>
      <span className={`shrink-0 font-bold ${style.percent}`}>
        {outcome.percent}%
      </span>
    </div>
  )
}

/** Shared single-line row of pill buttons, one per outcome — used for 3+ way
 *  markets so every side sits on the same line regardless of outcome count. */
const OutcomeButtonRow = ({
  outcomes,
  onClick,
}: {
  outcomes: { outcome: UiOutcome; tone: OutcomeTone }[]
  onClick?: (outcome: UiOutcome) => void
}) => (
  <div className='flex items-stretch gap-1.5'>
    {outcomes.map(({ outcome, tone }) => (
      <button
        key={outcome.id}
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(outcome)
        }}
        className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 cursor-pointer py-2 text-xs font-bold ${TONE_STYLES[tone].button}`}
      >
        <span className='min-w-0 truncate uppercase'>{outcome.label}</span>
        <span className='shrink-0'>{formatSharePrice(outcome.cents)}</span>
      </button>
    ))}
  </div>
)

interface MarketCardProps {
  market: UiMarket
  onSelect?: (market: UiMarket) => void
  onSelectOutcome?: (market: UiMarket, outcome: UiOutcome) => void
  onSave?: (market: UiMarket) => void
  /** Whether this market is currently saved to favorites. */
  isSaved?: boolean
  /** Show a share button next to the save button. */
  shareable?: boolean
  /** Show a LIVE badge + ticking countdown in the header. */
  live?: boolean
}

const MarketCard = ({
  market,
  onSelect,
  onSelectOutcome,
  onSave,
  isSaved = false,
  shareable = false,
  live = false,
}: MarketCardProps) => {
  const outcomes = market.outcomes ?? []
  // Binary yes/no markets keep the familiar green/no red split. Anything with
  // 3+ outcomes (e.g. a 1X2 match) lists each outcome, capped at 3 with a
  // "+N more outcomes" affordance that opens the full market.
  const isBinary = !!market.yes && !!market.no && outcomes.length <= 2
  const capped = outcomes.slice(0, 3)
  const shownOutcomes: { outcome: UiOutcome; tone: OutcomeTone }[] = isBinary
    ? [
        { outcome: market.yes!, tone: 'yes' },
        { outcome: market.no!, tone: 'no' },
      ]
    : capped.map((outcome, i) => ({
        outcome,
        tone: outcomeTone(market, outcome.id, i),
      }))
  const moreCount = isBinary ? 0 : Math.max(0, outcomes.length - 3)
  const handleOutcomeClick = (outcome: UiOutcome) =>
    onSelectOutcome?.(market, outcome)

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect?.(market)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.(market)
      }}
      className='flex h-full cursor-pointer flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand-green/60'
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
        <div className='flex items-center gap-3'>
          {shareable && <ShareMarketButton market={market} />}
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
      </div>

      <h3 className='line-clamp-2 min-h-11 text-base leading-snug font-bold text-black'>
        {marketDisplayTitle(market)}
      </h3>
      <div className='flex flex-1 flex-col justify-end gap-2'>
        {isBinary ? (
          <div className='flex flex-col gap-4'>
            {shownOutcomes.map(({ outcome, tone }) => (
              <OutcomeRow
                key={outcome.id}
                outcome={outcome}
                tone={tone}
                onClick={() => onSelectOutcome?.(market, outcome)}
              />
            ))}
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {shownOutcomes.map(({ outcome, tone }) => (
              <OutcomeStatRow key={outcome.id} outcome={outcome} tone={tone} />
            ))}
            <OutcomeButtonRow
              outcomes={shownOutcomes}
              onClick={handleOutcomeClick}
            />
          </div>
        )}
        {moreCount > 0 && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(market)
            }}
            className='self-start text-xs font-semibold text-neutral-10 hover:text-black'
          >
            +{moreCount} more outcome{moreCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className='mt-auto flex items-center justify-between pt-1'>
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
