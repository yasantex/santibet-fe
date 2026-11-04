import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import {
  chanceLabel,
  eventMarketLabels,
  isMultiChoiceEvent,
  marketHref,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import type { UiEvent, UiMarket } from '../../types/market.types'

// Rows before "Show all"; the list scrolls inside the side column past that.
const PREVIEW_ROWS = 6

/**
 * The other markets of the event the open market belongs to, under the order
 * panel — so a player on "1 (25 bps)" can jump to "2 (50 bps)" without going
 * back to the event page. Each outcome button opens that market with the
 * outcome picked.
 */
const EventMarketsList = ({
  event,
  currentMarketId,
}: {
  event: UiEvent
  currentMarketId: string
}) => {
  const navigate = useNavigate()
  const { priceLabel } = useOddsFormat()
  const [expanded, setExpanded] = useState(false)

  // Open markets first, each group in the event's own order.
  const markets = useMemo(
    () => [
      ...event.markets.filter((m) => m.status === 'open'),
      ...event.markets.filter((m) => m.status !== 'open'),
    ],
    [event],
  )
  const multiChoice = isMultiChoiceEvent(markets)
  // Multi-choice: short names ("1 (25 bps)"); otherwise the market's title
  // ("Spread: Hawks (-1.5)").
  const labels = useMemo(
    () =>
      multiChoice
        ? eventMarketLabels(markets)
        : new Map(markets.map((m) => [m.id, m.title])),
    [markets, multiChoice],
  )

  if (markets.length < 2) return null

  const shown = expanded ? markets : markets.slice(0, PREVIEW_ROWS)
  const open = (m: UiMarket, outcomeId?: string) =>
    navigate(marketHref(m, outcomeId))

  return (
    <section className='flex flex-col rounded-2xl border border-border bg-card'>
      <div className='flex items-center justify-between gap-2 px-4 pt-4 pb-2'>
        <span className='text-sm font-bold text-black'>More in this event</span>
        <Link
          to={`/events/${event.id}`}
          className='flex shrink-0 items-center gap-0.5 text-xs font-semibold text-neutral-10 hover:text-black'
        >
          {markets.length} markets
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Link>
      </div>

      <ul className='flex max-h-[45vh] flex-col overflow-y-auto px-2 pb-2'>
        {shown.map((m) => {
          const current = m.id === currentMarketId
          const isOpen = m.status === 'open'
          // Yes/No markets: Yes then No. Others: their first three outcomes.
          const outcomes = (
            m.yes && m.no && m.outcomes.length === 2
              ? [m.yes, m.no]
              : m.outcomes.slice(0, 3)
          ).filter(Boolean)
          return (
            <li
              key={m.id}
              className={`flex flex-col gap-2 rounded-lg px-2 py-2.5 ${
                current ? 'bg-hover' : 'hover:bg-hover/50'
              }`}
            >
              <div className='flex items-center justify-between gap-2'>
                <button
                  type='button'
                  onClick={() => open(m)}
                  className='min-w-0 cursor-pointer truncate text-left text-sm font-semibold text-black hover:underline'
                  title={m.title}
                >
                  {labels.get(m.id)}
                </button>
                <span className='shrink-0 text-sm font-bold text-black tabular-nums'>
                  {current ? (
                    <span className='text-xs font-semibold text-neutral-10'>
                      Viewing
                    </span>
                  ) : multiChoice ? (
                    chanceLabel(m.yes)
                  ) : null}
                </span>
              </div>
              {isOpen && !current && outcomes.length > 0 && (
                <div className='flex gap-1.5'>
                  {outcomes.map((o, i) => (
                    <button
                      key={o.id}
                      type='button'
                      onClick={() => open(m, o.id)}
                      className={`min-w-0 flex-1 cursor-pointer truncate rounded-md px-1.5 py-1.5 text-xs font-semibold ${
                        TONE_STYLES[outcomeTone(m, o.id, i)].button
                      }`}
                    >
                      {o.label} {priceLabel(m, o)}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {markets.length > PREVIEW_ROWS && (
        <button
          type='button'
          onClick={() => setExpanded((v) => !v)}
          className='cursor-pointer border-t border-border/60 py-2.5 text-xs font-semibold text-neutral-10 hover:text-black'
        >
          {expanded ? 'Show less' : `Show all ${markets.length}`}
        </button>
      )}
    </section>
  )
}

export default EventMarketsList
