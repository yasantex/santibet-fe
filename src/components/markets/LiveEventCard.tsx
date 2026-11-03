import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { LiveBadge, ScoreBoard } from './LiveBits'
import {
  categoryIcon,
  groupedChoices,
  marketDisplayTitle,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import { useCountdown } from '../../hooks/useCountdown'
import { useComboSlip, isSportsMarket } from '../../hooks/useComboSlip'
import MarketMetaLine from './MarketMetaLine'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import type { UiEvent, UiMarket, UiOutcome } from '../../types/market.types'

interface LiveEventCardProps {
  event: UiEvent
  onSelectMarket: (market: UiMarket) => void
  onSelectOutcome: (market: UiMarket, outcome: UiOutcome) => void
  /** Outcome highlighted as selected (e.g. added to the combo slip). */
  activeOutcomeId?: string | null
  /** Show the LIVE badge (off when the card lists an upcoming match). */
  live?: boolean
}

const LiveEventCard = ({
  event,
  onSelectMarket,
  onSelectOutcome,
  activeOutcomeId = null,
  live = true,
}: LiveEventCardProps) => {
  const market = event.markets[0]
  const multi = event.markets.length > 1
  // "Will A win?" / "Draw?" / "Will B win?" read as one row: A | Draw | B.
  const grouped = groupedChoices(event.markets)
  const eventHref = `/events/${event.id}`
  const { label, display } = useCountdown(market?.openTime, market?.closeTime)

  // Combo-by-default for sports: tap an outcome to add/remove it from the combo
  // ticket, with the selection highlighted.
  const combo = useComboSlip()
  const { priceLabel } = useOddsFormat()
  const handleOutcome = (m: UiMarket, o: UiOutcome) => {
    if (isSportsMarket(m)) combo.toggle(m, o)
    else onSelectOutcome(m, o)
  }
  const isActive = (m: UiMarket, o: UiOutcome) =>
    (isSportsMarket(m)
      ? combo.selectedOutcomeIdForMarket(m.id)
      : m.id === market?.id
        ? activeOutcomeId
        : null) === o.id

  // One button row: the grouped choices, or the first market's outcomes.
  const buttons = grouped
    ? grouped.map((c, i) => ({
        key: c.market.id,
        market: c.market,
        outcome: c.outcome,
        label: c.label,
        tone: outcomeTone(
          { outcomes: grouped.map((g) => g.outcome) },
          c.outcome.id,
          i,
        ),
      }))
    : (market?.outcomes ?? []).slice(0, 3).map((o, i) => ({
        key: o.id,
        market: market!,
        outcome: o,
        label: o.label,
        tone: outcomeTone(market!, o.id, i),
      }))

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
        {live && <LiveBadge />}
      </div>

      {/* Several markets: the card is the match, so its title is the event's
          and it opens the match page with every market to pick from. */}
      {multi ? (
        <Link
          to={eventHref}
          className='line-clamp-2 min-h-10 text-left text-base font-bold leading-snug text-black hover:underline'
        >
          {event.title}
        </Link>
      ) : (
        <button
          type='button'
          onClick={() => onSelectMarket(market)}
          className='line-clamp-2 min-h-10 text-left text-base font-bold leading-snug text-black hover:underline'
        >
          {/* A rolling crypto round's market title already names the coin and
              window ("Will Bitcoin be higher in 5 minutes?"), so prefixing the
              event title ("Bitcoin 5 minutes — Up or Down") repeats it. */}
          {market.durationSeconds
            ? market.title
            : marketDisplayTitle({ title: market.title, eventTitle: event.title })}
        </button>
      )}

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

      {/* Not grouped: say which market the buttons belong to. */}
      {multi && !grouped && (
        <span className='-mb-1.5 text-xs font-semibold text-neutral-10'>
          {market.title}
        </span>
      )}
      <div className='flex items-stretch gap-1.5'>
        {buttons.map((b) => (
          <button
            key={b.key}
            type='button'
            onClick={() => handleOutcome(b.market, b.outcome)}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg cursor-pointer px-1 py-2 text-xs font-bold ${TONE_STYLES[b.tone].button} ${
              isActive(b.market, b.outcome) ? 'ring-2 ring-black ring-offset-1' : ''
            }`}
          >
            <span className='flex w-full min-w-0 items-center justify-center gap-1'>
              <span className='min-w-0 truncate uppercase'>{b.label}</span>
              <span className='shrink-0'>{priceLabel(b.market, b.outcome)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className='flex items-center justify-between gap-3 pt-0.5 text-xs text-placeholder'>
        <MarketMetaLine market={market} />
        {multi && (
          <Link
            to={eventHref}
            className='flex shrink-0 items-center gap-0.5 font-semibold hover:text-black'
          >
            {event.markets.length} markets
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default LiveEventCard
