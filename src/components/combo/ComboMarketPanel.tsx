import { HugeiconsIcon } from '@hugeicons/react'
import {
  TicketStarIcon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons'
import { useComboSlip } from '../../hooks/useComboSlip'
import useMarketOpen from '../../hooks/useMarketOpen'
import { outcomeTone, TONE_STYLES } from '../../utils/marketDisplay'
import { formatSharePrice } from '../../utils/functions'
import type { UiMarket } from '../../types/market.types'

/**
 * Right-rail panel on a SPORTS market detail page. Combos are the default
 * sports flow, so instead of the single-bet TradePanel this lets the user add
 * one of this market's outcomes to the combo ticket (tap again to remove). The
 * slip itself (auto-opened on the first pick) handles stake and placement, and
 * enforces one market per event.
 */
const ComboMarketPanel = ({ market }: { market: UiMarket }) => {
  const combo = useComboSlip()
  const selectedOutcomeId = combo.selectedOutcomeIdForMarket(market.id)
  const isOpen = useMarketOpen(market)

  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-border bg-card p-4'>
      <div className='flex items-center gap-2'>
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-black'>
          <HugeiconsIcon icon={TicketStarIcon} size={18} />
        </span>
        <div className='min-w-0'>
          <p className='text-sm font-bold text-black'>Add to combo</p>
          <p className='text-xs text-neutral-10'>
            Pick an outcome, then combine across other games.
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        {market.outcomes.map((o, i) => {
          const tone = outcomeTone(market, o.id, i)
          const active = o.id === selectedOutcomeId
          return (
            <button
              key={o.id}
              type='button'
              // A pick already on the ticket stays tappable so it can be removed.
              disabled={!isOpen && !active}
              onClick={() => combo.toggle(market, o)}
              className={`flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-bold cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? TONE_STYLES[tone].solid : TONE_STYLES[tone].button
              }`}
            >
              <span className='flex min-w-0 items-center gap-1.5'>
                {active && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    className='shrink-0'
                  />
                )}
                <span className='min-w-0 truncate uppercase'>{o.label}</span>
              </span>
              <span className='shrink-0'>{formatSharePrice(o.cents)}</span>
            </button>
          )
        })}
      </div>

      {!isOpen ? (
        <p className='text-center text-xs font-semibold text-error'>
          Market closed
        </p>
      ) : combo.legCount > 0 ? (
        <p className='text-center text-xs font-semibold text-neutral-10'>
          {combo.legCount} selection{combo.legCount > 1 ? 's' : ''} in your bet
          slip
          {combo.combinedOdds > 0
            ? ` · ×${combo.combinedOdds.toFixed(2)}`
            : ''}
        </p>
      ) : (
        <p className='text-center text-xs text-neutral-10'>
          Tap an outcome to start your combo.
        </p>
      )}

      <p className='text-center text-[11px] text-neutral-10'>
        Only one market per event. Every pick must win.
      </p>
    </div>
  )
}

export default ComboMarketPanel
