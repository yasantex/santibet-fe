import { HugeiconsIcon } from '@hugeicons/react'
import { TicketStarIcon } from '@hugeicons/core-free-icons'
import MarketTitleLink from './MarketTitleLink'
import {
  formatCurrency,
  formatDate,
  toMajorUnits,
} from '../../utils/functions'
import type { ComboTicket, ComboTicketStatus } from '../../types/bet.types'

const STATUS_META: Record<ComboTicketStatus, { label: string; className: string }> = {
  OPEN: { label: 'In progress', className: 'bg-warning/10 text-warning' },
  WON: { label: 'Won', className: 'bg-surface-success text-success' },
  LOST: { label: 'Lost', className: 'bg-surface-error text-error' },
  VOID: { label: 'Void · refunded', className: 'bg-surface-hover text-black' },
}

const LEG_MARK: Record<ComboTicketStatus, { icon: string; className: string }> = {
  OPEN: { icon: '•', className: 'text-neutral-10' },
  WON: { icon: '✓', className: 'text-success' },
  LOST: { icon: '✕', className: 'text-error' },
  VOID: { icon: '–', className: 'text-neutral-10' },
}

/** A combo ticket in the portfolio: its legs (each marked as it settles),
 *  stake, combined odds and payout. */
const ComboCard = ({ combo }: { combo: ComboTicket }) => {
  const status = STATUS_META[combo.status] ?? STATUS_META.OPEN
  const stake = toMajorUnits(combo.stake.amount)
  const odds = Number(combo.combinedOdds) || 0
  const settled = combo.status !== 'OPEN'
  const paid = combo.payout ? toMajorUnits(combo.payout.amount) : 0
  const won = combo.legs.filter((l) => l.status === 'WON').length

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
          <span className='flex items-center gap-1 text-xs font-bold text-black uppercase'>
            <HugeiconsIcon icon={TicketStarIcon} size={14} />
            Combo · {combo.legs.length} legs
          </span>
        </div>
        {combo.status === 'OPEN' && (
          <span className='text-xs text-neutral-10'>
            {won}/{combo.legs.length} won so far
          </span>
        )}
      </div>

      <ul className='flex flex-col gap-1.5'>
        {combo.legs.map((leg) => {
          const mark = LEG_MARK[leg.status] ?? LEG_MARK.OPEN
          return (
            <li key={leg.outcomeId} className='flex items-start gap-2 text-sm'>
              <span className={`w-3 shrink-0 font-bold ${mark.className}`}>
                {mark.icon}
              </span>
              <MarketTitleLink
                marketId={leg.marketId}
                settled={leg.status !== 'OPEN'}
                className='min-w-0 flex-1 text-left'
              >
                <span className='font-semibold text-black'>
                  {leg.outcomeLabel ?? 'Selection'}
                </span>
                <span className='text-neutral-10'>
                  {' '}
                  · {leg.market?.title ?? leg.marketId}
                </span>
              </MarketTitleLink>
              {Number(leg.price) > 0 && (
                <span className='shrink-0 text-xs font-semibold text-neutral-10'>
                  ×{(1 / Number(leg.price)).toFixed(2)}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className='grid grid-cols-3 gap-2 text-sm'>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Stake</span>
          <span className='font-bold text-black'>{formatCurrency(stake)}</span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Odds</span>
          <span className='font-bold text-black'>×{odds.toFixed(2)}</span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>
            {settled ? 'Paid' : 'Pays if all win'}
          </span>
          <span
            className={`font-bold ${settled && paid <= 0 ? 'text-neutral-10' : 'text-success'}`}
          >
            {formatCurrency(
              settled ? paid : toMajorUnits(combo.potentialReturn.amount),
            )}
          </span>
        </div>
      </div>

      <span className='text-xs text-placeholder'>
        {settled && combo.settledAt
          ? `Settled ${formatDate(combo.settledAt)}`
          : `Placed ${formatDate(combo.createdAt)}`}
      </span>
    </div>
  )
}

export default ComboCard
