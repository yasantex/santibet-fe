import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Button } from '../globals/Button'
import ConfirmationModal from '../globals/ConfirmationModal'
import { useBetPositions, useCashOut } from '../../data_layer/bets'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { formatCurrency } from '../../utils/functions'
import type { UiMarket } from '../../types/market.types'
import type { BetPosition } from '../../types/bet.types'

const SellPositionRow = ({
  position,
  market,
}: {
  position: BetPosition
  market: UiMarket
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutateAsync: cashOut, isPending } = useCashOut(position.id)

  const outcome = market.outcomes.find((o) => o.id === position.outcomeId)
  const isYes = market.yes?.id === position.outcomeId
  const shares = Number(position.shares) || 0
  const avgPrice = Number(position.avgPrice) || 0
  const staked = shares * avgPrice
  const value = Number(position.currentValue.amount) || 0
  const pnl = value - staked
  const currency = position.currentValue.currency

  const handleCashOut = async () => {
    try {
      await cashOut()
      showSuccessToast('Position cashed out')
      setConfirmOpen(false)
    } catch (error) {
      showWarningToast(
        isAxiosError(error)
          ? (error.response?.data?.message ?? 'Cash out failed')
          : 'Cash out failed',
      )
    }
  }

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border p-3'>
      <div className='flex items-center justify-between'>
        <span
          className={`text-xs font-bold uppercase ${
            isYes ? 'text-success' : 'text-error'
          }`}
        >
          {outcome?.label ?? (isYes ? 'YES' : 'NO')}
        </span>
        <span className='text-xs text-neutral-10'>
          {shares.toLocaleString(undefined, { maximumFractionDigits: 2 })} shares
          @ {Math.round(avgPrice * 100)}¢
        </span>
      </div>

      <div className='flex items-end justify-between'>
        <div className='flex flex-col'>
          <span className='text-xs text-neutral-10'>Current value</span>
          <span className='text-lg font-bold text-black'>
            {formatCurrency(position.currentValue.amount, currency)}
          </span>
          <span
            className={`text-xs font-semibold ${
              pnl >= 0 ? 'text-success' : 'text-error'
            }`}
          >
            {pnl >= 0 ? '+' : '-'}
            {formatCurrency(String(Math.abs(pnl)), currency)}
          </span>
        </div>
        <Button
          type='button'
          text='Cash out'
          variation='primary'
          size='medium'
          className='w-fit!'
          onClick={() => setConfirmOpen(true)}
        />
      </div>

      <ConfirmationModal
        open={confirmOpen}
        title='Cash out position'
        description={`Cash out your ${outcome?.label ?? ''} position in "${market.title}" at its current value of ${formatCurrency(position.currentValue.amount, currency)}?`}
        confirmText='Cash out'
        isConfirming={isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCashOut}
      />
    </div>
  )
}

const SellPanel = ({ market }: { market: UiMarket }) => {
  const { data, isLoading } = useBetPositions('OPEN')

  const positions = useMemo<BetPosition[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((p) => p.data)
        .filter((p) => p.marketId === market.id && p.status === 'OPEN'),
    [data, market.id],
  )

  if (isLoading) {
    return <div className='h-24 animate-pulse rounded-lg bg-hover' />
  }

  if (!positions.length) {
    return (
      <p className='rounded-lg bg-hover/40 p-3 text-xs text-neutral-10'>
        You have no open position in this market. Buy an outcome first, then come
        back here to cash out.
      </p>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {positions.map((position) => (
        <SellPositionRow
          key={position.id}
          position={position}
          market={market}
        />
      ))}
    </div>
  )
}

export default SellPanel
