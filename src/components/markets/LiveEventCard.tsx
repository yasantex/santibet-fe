import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { LiveBadge, ScoreBoard } from './LiveBits'
import {
  categoryIcon,
  eventMarketLabels,
  findTeam,
  groupedChoices,
  isMultiChoiceEvent,
  marketDisplayTitle,
  outcomeTone,
  TONE_STYLES,
  CARD_HOVER,
} from '../../utils/marketDisplay'
import TeamLogo from './TeamLogo'
import { useCountdown } from '../../hooks/useCountdown'
import { useComboSlip, isSportsMarket } from '../../hooks/useComboSlip'
import MarketMetaLine from './MarketMetaLine'
import { shortOutcomeLabel, teamsFromTitle } from '../../utils/teamNames'
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

/** Choices shown on a multi-choice event's card; the rest are on its page. */
const CARD_CHOICES = 2

/**
 * Polymarket-style card for an event made of many Yes/No markets ("How many
 * Fed rate cuts in 2026?"): the likeliest choices, each with its chance and
 * Yes / No buttons.
 */
const MultiChoiceCard = ({
  event,
  marketCount,
  onSelectOutcome,
}: {
  event: UiEvent
  marketCount: number
  onSelectOutcome: (market: UiMarket, outcome: UiOutcome) => void
}) => {
  const { chanceLabel } = useOddsFormat()
  const eventHref = `/events/${event.id}`
  const labels = eventMarketLabels(event.markets)
  const open = event.markets.filter((m) => m.status === 'open')
  const choices = [...(open.length ? open : event.markets)]
    .sort((a, b) => (b.yes?.price ?? 0) - (a.yes?.price ?? 0))
    .slice(0, CARD_CHOICES)
  const lead = event.markets[0]

  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-border bg-card p-4 ${CARD_HOVER}`}>
      <Link to={eventHref} className='group flex items-center gap-3'>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=''
            className='h-10 w-10 shrink-0 rounded-lg object-cover'
          />
        ) : (
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border/30 text-lg'>
            {categoryIcon(event.category)}
          </span>
        )}
        <span className='line-clamp-2 text-base leading-snug font-bold text-black group-hover:underline'>
          {event.title}
        </span>
      </Link>

      <div className='flex flex-col gap-2'>
        {choices.map((m) => (
          <div key={m.id} className='flex items-center gap-2'>
            <span className='min-w-0 flex-1 truncate text-sm text-black'>
              {labels.get(m.id)}
            </span>
            <span className='shrink-0 text-sm font-bold text-black tabular-nums'>
              {chanceLabel(m.yes)}
            </span>
            {[
              { outcome: m.yes, tone: TONE_STYLES.yes },
              { outcome: m.no, tone: TONE_STYLES.no },
            ].map(({ outcome, tone }) =>
              outcome ? (
                <button
                  key={outcome.id}
                  type='button'
                  onClick={() => onSelectOutcome(m, outcome)}
                  className={`w-12 shrink-0 cursor-pointer rounded-md py-1.5 text-xs font-semibold ${tone.button}`}
                >
                  {outcome.label}
                </button>
              ) : null,
            )}
          </div>
        ))}
      </div>

      <div className='mt-auto flex items-center justify-between gap-3 pt-0.5 text-xs text-placeholder'>
        {lead && <MarketMetaLine market={lead} />}
        <Link
          to={eventHref}
          className='flex shrink-0 items-center gap-0.5 font-semibold hover:text-black'
        >
          {marketCount} markets
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Link>
      </div>
    </div>
  )
}

const LiveEventCard = ({
  event,
  onSelectMarket,
  onSelectOutcome,
  activeOutcomeId = null,
  live = true,
}: LiveEventCardProps) => {
  const market = event.markets[0]
  // List feeds embed only a few of an event's markets; count them all.
  const marketCount = Math.max(event.marketCount ?? 0, event.markets.length)
  const multi = marketCount > 1
  // "Will A win?" / "Draw?" / "Will B win?" read as one row: A | Draw | B.
  const grouped = groupedChoices(event.markets)
  const eventHref = `/events/${event.id}`
  const teams = event.teams ?? market?.teams ?? null
  // Sports buttons name teams by code ("GAL", not "GALATASARAY …"): the API's
  // short name when it has one, else one made from the name.
  const shorten =
    market && isSportsMarket(market)
      ? shortOutcomeLabel(
          teams && teams.length >= 2
            ? teams.map((t) => t.name)
            : teamsFromTitle(event.title),
          teams && teams.length >= 2 ? teams.map((t) => t.shortName) : [],
        )
      : (l: string) => l
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

  if (isMultiChoiceEvent(event.markets)) {
    return (
      <MultiChoiceCard
        event={event}
        marketCount={marketCount}
        onSelectOutcome={onSelectOutcome}
      />
    )
  }

  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-border bg-card p-4 ${CARD_HOVER}`}>
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
        <ScoreBoard state={event.liveState} teams={teams} />
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
            title={b.label}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg cursor-pointer px-1 py-2 text-xs font-bold ${TONE_STYLES[b.tone].button} ${
              isActive(b.market, b.outcome) ? 'ring-2 ring-black ring-offset-1' : ''
            }`}
          >
            <span className='flex w-full min-w-0 items-center justify-center gap-1'>
              <TeamLogo team={findTeam(teams, b.label)} size={14} />
              <span className='min-w-0 truncate uppercase'>{shorten(b.label)}</span>
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
            {marketCount} markets
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default LiveEventCard
