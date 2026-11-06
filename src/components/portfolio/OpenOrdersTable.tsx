import { useState } from 'react'
import { isAxiosError } from 'axios'
import ConfirmationModal from '../globals/ConfirmationModal'
import MarketTitleLink from '../markets/MarketTitleLink'
import { MarketThumb, OutcomeChip } from './PortfolioBits'
import { useCancelBet } from '../../data_layer/bets'
import {
  betPriceLabel,
  formatCurrency,
  timeAgo,
  toMajorUnits,
} from '../../utils/functions'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import type { Bet } from '../../types/bet.types'

// Market | Filled | Amount | Placed | Cancel
const GRID =
  'md:grid-cols-[minmax(0,2.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_6rem]'

// The API cancels resting bets only: OPEN and PENDING.
const isCancelable = (bet: Bet) =>
  bet.status === 'OPEN' || bet.status === 'PENDING'

/** Resting (unmatched) orders, Polymarket's "Open" tab. */
const OpenOrdersTable = ({ orders }: { orders: Bet[] }) => {
  const [toCancel, setToCancel] = useState<Bet | null>(null)
  const { mutateAsync: cancelBet, isPending } = useCancelBet(toCancel?.id ?? '')

  const handleCancel = async () => {
    try {
      await cancelBet()
      showSuccessToast('Order cancelled')
      setToCancel(null)
    } catch (error) {
      showWarningToast(
        isAxiosError(error)
          ? (error.response?.data?.message ?? 'Unable to cancel order')
          : 'Unable to cancel order',
      )
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        className={`hidden gap-x-3 px-3 pb-1 text-xs font-medium text-neutral-10 md:grid ${GRID}`}
      >
        <span>Event / Your Pick</span>
        <span>Filled</span>
        <span>Amount</span>
        <span>Placed</span>
        <span />
      </div>
      {orders.map((bet) => {
        const title = bet.market?.title ?? 'Market'
        const shares = Number(bet.shares) || 0
        const filled = Number(bet.filledShares) || 0
        return (
          <div
            key={bet.id}
            className={`grid grid-cols-3 items-center gap-x-3 gap-y-3 rounded-xl bg-card p-3 md:gap-y-0 ${GRID}`}
          >
            <div className='col-span-3 flex min-w-0 items-center gap-3 md:col-span-1'>
              <MarketThumb imageUrl={bet.market?.imageUrl} title={title} />
              <div className='flex min-w-0 flex-col gap-1'>
                <MarketTitleLink
                  marketId={bet.marketId}
                  marketStatus={bet.market?.status}
                  settled={false}
                  className='truncate text-left text-sm font-semibold text-black'
                >
                  {title}
                </MarketTitleLink>
                <div className='flex items-center gap-2'>
                  <OutcomeChip
                    label={bet.outcomeLabel ?? 'Outcome'}
                    price={betPriceLabel(bet)}
                  />
                  <span className='text-xs text-neutral-10 capitalize'>
                    {bet.type}
                  </span>
                </div>
              </div>
            </div>
            <span className='text-sm text-neutral-10'>
              {shares > 0 ? `${Math.round((filled / shares) * 100)}%` : '—'}
            </span>
            <span className='text-sm font-semibold text-black'>
              {formatCurrency(toMajorUnits(bet.stake.amount))}
            </span>
            <span className='text-sm text-neutral-10'>{timeAgo(bet.createdAt)}</span>
            <div className='col-span-3 flex justify-end md:col-span-1'>
              {isCancelable(bet) && (
                <button
                  type='button'
                  onClick={() => setToCancel(bet)}
                  className='rounded-full border border-error px-3 py-1.5 text-xs font-semibold text-error hover:bg-market-error'
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )
      })}

      <ConfirmationModal
        open={Boolean(toCancel)}
        title='Cancel order?'
        description='This cancels your unmatched order and returns your stake.'
        confirmText='Cancel order'
        isConfirming={isPending}
        onClose={() => setToCancel(null)}
        onConfirm={handleCancel}
      />
    </div>
  )
}

export default OpenOrdersTable
