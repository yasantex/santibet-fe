import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon } from '@hugeicons/core-free-icons'
import { LiveBadge, ScoreBoard } from './LiveBits'
import {
  categoryIcon,
  marketDisplayTitle,
  isPoolMarket,
  outcomePriceLabel,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import { useCountdown } from '../../hooks/useCountdown'
import { useComboSlip, isSportsMarket } from '../../hooks/useComboSlip'
import MarketMetaLine from './MarketMetaLine'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

interface LiveEventCardProps {
  event: UiEvent
  onSelectMarket: (market: UiMarket) => void
  onSelectOutcome: (market: UiMarket, outcome: UiOutcome) => void
  /** Outcome highlighted as selected (e.g. added to the combo slip). */
  activeOutcomeId?: string | null
}

const LiveEventCard = ({
  event,
  onSelectMarket,
  onSelectOutcome,
  activeOutcomeId = null,
}: LiveEventCardProps) => {
  const market = event.markets[0]
  const { label, display } = useCountdown(market?.openTime, market?.closeTime)

  // Combo-by-default for sports: tap an outcome to add/remove it from the combo
  // ticket, with the selection highlighted.
  const combo = useComboSlip()
  const comboEnabled = !!market && isSportsMarket(market)
  const effectiveActiveOutcomeId = comboEnabled
    ? combo.selectedOutcomeIdForMarket(market.id)
    : activeOutcomeId
  const handleOutcome = (m: UiMarket, o: UiOutcome) => {
    if (comboEnabled) combo.toggle(m, o)
    else onSelectOutcome(m, o)
  }

  if (!market) return null

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=''
              className='h-7 w-7 shrink-0 rounded-full object-cover'
            />
          ) : (
            <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-border/30 text-sm'>
              {categoryIcon(event.category)}
            </span>
          )}
          <span className='text-xs font-medium text-neutral-10'>
            {event.category}
          </span>
        </div>
        <LiveBadge />
      </div>

      <button
        type='button'
        onClick={() => onSelectMarket(market)}
        className='line-clamp-2 min-h-10 text-left text-base font-bold leading-snug text-black hover:underline'
      >
        {marketDisplayTitle({ title: market.title, eventTitle: event.title })}
      </button>

      {event.liveState ? (
        <ScoreBoard state={event.liveState} />
      ) : (
        display && (
          <div className='flex items-center gap-1.5 text-xs font-semibold text-placeholder'>
            <HugeiconsIcon icon={Clock01Icon} size={14} />
            {label} in {display}
          </div>
        )
      )}

      <div className='flex items-stretch gap-1.5'>
        {market.outcomes.slice(0, 3).map((o, i) => {
          const tone = outcomeTone(market, o.id, i)
          return (
            <button
              key={o.id}
              type='button'
              onClick={() => handleOutcome(market, o)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg cursor-pointer px-1 py-2 text-xs font-bold ${TONE_STYLES[tone].button} ${
                o.id === effectiveActiveOutcomeId
                  ? 'ring-2 ring-black ring-offset-1'
                  : ''
              }`}
            >
              <span className='flex w-full min-w-0 items-center justify-center gap-1'>
                <span className='min-w-0 truncate uppercase'>{o.label}</span>
                <span className='shrink-0'>{outcomePriceLabel(market, o)}</span>
              </span>
              {/* No room inline: a pool's chance goes on a line of its own. */}
              {isPoolMarket(market) && (
                <span className='text-[10px] font-semibold opacity-75'>
                  {o.percent}%
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className='flex items-center justify-between gap-3 pt-0.5 text-xs text-placeholder'>
        <MarketMetaLine market={market} />
        {event.markets.length > 1 && (
          <span className='shrink-0'>{event.markets.length} markets</span>
        )}
      </div>
    </div>
  )
}

export default LiveEventCard
