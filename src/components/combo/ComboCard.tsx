import { useNavigate } from 'react-router'
import { formatCurrency, formatDate, toMajorUnits } from '../../utils/functions'
import type { Money } from '../../types/bet.types'
import type { ComboStatus, ComboTicket } from '../../types/combo.types'

const money = (m?: Money | null) =>
  formatCurrency(toMajorUnits(m?.amount ?? 0), m?.currency)

const statusBadge = (status: ComboStatus) => {
  if (status === 'WON') return 'bg-success-bg text-success'
  if (status === 'LOST') return 'bg-error-bg text-error'
  if (status === 'VOID') return 'bg-hover/60 text-neutral-10'
  return 'bg-warning/20 text-warning' // OPEN
}

const legMark = (status: ComboStatus) => {
  if (status === 'WON') return { text: 'Won', className: 'text-success' }
  if (status === 'LOST') return { text: 'Lost', className: 'text-error' }
  if (status === 'VOID') return { text: 'Void', className: 'text-neutral-10' }
  return { text: 'Open', className: 'text-warning' }
}

const legOdds = (price: string) => {
  const p = Number(price)
  return p > 0 ? 1 / p : 0
}

/**
 * A placed combo (parlay) in Portfolio / bet history: one stake across several
 * sports picks that all have to win. Each leg names its fixture, market and
 * pick, with its own result as legs settle.
 */
const ComboCard = ({ combo }: { combo: ComboTicket }) => {
  const navigate = useNavigate()
  const settled = combo.status !== 'OPEN'
  const odds = Number(combo.combinedOdds)

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-bold text-black uppercase'>
          Combo · {combo.legs.length} picks
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(combo.status)}`}
        >
          {combo.status.toLowerCase()}
        </span>
      </div>

      <div className='flex flex-col divide-y divide-border/60 rounded-md bg-surface-hover'>
        {combo.legs.map((leg) => {
          const mark = legMark(leg.status)
          return (
            <button
              key={`${leg.marketId}:${leg.outcomeId}`}
              type='button'
              onClick={() => navigate(`/markets/${leg.marketId}`)}
              className='flex items-start justify-between gap-3 px-3 py-2 text-left hover:bg-hover/50'
            >
              <span className='min-w-0'>
                {leg.market?.eventTitle && (
                  <span className='block truncate text-xs text-neutral-10'>
                    {leg.market.eventTitle}
                  </span>
                )}
                <span className='block truncate text-sm font-semibold text-black'>
                  {leg.market?.title ?? leg.marketId}
                </span>
                <span className='text-xs font-bold text-black uppercase'>
                  {leg.outcomeLabel ?? 'Pick'}
                </span>
                <span className='ml-2 text-xs text-neutral-10'>
                  ×{legOdds(leg.price).toFixed(2)}
                </span>
              </span>
              <span className={`shrink-0 text-xs font-semibold ${mark.className}`}>
                {mark.text}
              </span>
            </button>
          )
        })}
      </div>

      <div className='grid grid-cols-3 gap-2 text-sm'>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Stake</span>
          <span className='font-bold text-black'>{money(combo.stake)}</span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Total odds</span>
          <span className='font-bold text-black'>
            ×{odds > 0 ? odds.toFixed(2) : '—'}
          </span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>
            {settled ? 'Returned' : 'To win'}
          </span>
          <span className='font-bold text-surface-success'>
            {settled ? money(combo.payout) : money(combo.potentialReturn)}
          </span>
        </div>
      </div>

      <span className='text-xs text-placeholder'>
        {formatDate(combo.createdAt)}
      </span>
    </div>
  )
}

export default ComboCard
