import type { ComboTicket } from '../../types/bet.types'
import { OutcomeChip } from './PortfolioBits'
import { refundReason, usePriceOdds } from './betDisplay'

const LEG_STATUS: Record<
  ComboTicket['legs'][number]['status'],
  { label: string; className: string }
> = {
  OPEN: { label: 'Open', className: 'bg-warning/20 text-warning' },
  WON: { label: 'Won', className: 'bg-success-bg text-success' },
  LOST: { label: 'Lost', className: 'bg-error-bg text-error' },
  VOID: { label: 'Refunded', className: 'bg-hover/60 text-neutral-10' },
}

/** Every leg of a combo: the market, the pick and its odds / chance. */
const ComboLegs = ({ combo }: { combo: ComboTicket }) => {
  const priceOdds = usePriceOdds()
  return (
    <ul className='flex flex-col divide-y divide-border/40 rounded-lg border border-border/60'>
      {combo.legs.map((leg) => {
        const status = LEG_STATUS[leg.status] ?? LEG_STATUS.OPEN
        const odds = priceOdds(leg.price)
        return (
          <li
            key={`${leg.marketId}-${leg.outcomeId}`}
            className='flex items-start justify-between gap-3 px-3 py-2.5'
          >
            <div className='flex min-w-0 flex-col gap-1'>
              <span className='truncate text-sm font-semibold text-black'>
                {leg.market?.eventTitle ?? leg.market?.title ?? 'Market'}
              </span>
              <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
                {leg.market?.eventTitle && (
                  <span className='truncate text-xs text-neutral-10'>
                    {leg.market.title}
                  </span>
                )}
                <OutcomeChip label={leg.outcomeLabel ?? 'Pick'} />
              </div>
              {leg.status === 'VOID' && refundReason(leg.voidReason, leg.market) && (
                <span className='text-xs text-neutral-10'>
                  Refunded: {refundReason(leg.voidReason, leg.market)}
                </span>
              )}
            </div>
            <div className='flex shrink-0 flex-col items-end gap-1'>
              <span className='text-sm font-semibold text-black'>
                {odds || '-'}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ComboLegs
