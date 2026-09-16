import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon } from '@hugeicons/core-free-icons'
import { LiveBadge, ScoreBoard } from './LiveBits'
import {
  categoryIcon,
  marketDisplayTitle,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import { formatNairaCompact, formatSharePrice } from '../../utils/functions'
import { useCountdown } from '../../hooks/useCountdown'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

interface LiveEventCardProps {
  event: UiEvent
  onSelectMarket: (market: UiMarket) => void
  onSelectOutcome: (market: UiMarket, outcome: UiOutcome) => void
}

const LiveEventCard = ({
  event,
  onSelectMarket,
  onSelectOutcome,
}: LiveEventCardProps) => {
  const market = event.markets[0]
  const { label, display } = useCountdown(market?.openTime, market?.closeTime)

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

      <div className='flex items-stretch gap-2'>
        {market.outcomes.slice(0, 3).map((o, i, shown) => {
          // Binary keeps yes/no by identity; 3-way goes green-first/red-last/amber-mid.
          const isBinary = !!market.yes && !!market.no && shown.length <= 2
          const tone = isBinary
            ? o.id === market.yes?.id
              ? 'yes'
              : 'no'
            : i === 0
              ? 'yes'
              : i === shown.length - 1
                ? 'no'
                : 'mid'
          return (
            <button
              key={o.id}
              type='button'
              onClick={() => onSelectOutcome(market, o)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg cursor-pointer px-1 py-2 text-xs font-bold ${TONE_STYLES[tone].button}`}
            >
              <span className='w-full truncate uppercase'>{o.label}</span>
              <span>{formatSharePrice(o.cents)}</span>
            </button>
          )
        })}
      </div>

      <div className='flex items-center justify-between pt-0.5 text-xs text-placeholder'>
        <span>Volume: {formatNairaCompact(market.volume)}</span>
        {event.markets.length > 1 && (
          <span>{event.markets.length} markets</span>
        )}
      </div>
    </div>
  )
}

export default LiveEventCard
