import { useState } from 'react'
import { useNavigate } from 'react-router'
import { isAxiosError } from 'axios'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { useMarket } from '../../data_layer/markets'
import { useCashOut } from '../../data_layer/bets'
import { formatCurrency, formatSharePrice, toMajorUnits } from '../../utils/functions'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import type { BetPosition } from '../../types/bet.types'

const YES_LABELS = ['yes', 'up', 'over', 'win', 'true']

const PositionCard = ({ position }: { position: BetPosition }) => {
  const navigate = useNavigate()
  // The API now embeds a market summary; only fetch when it's absent.
  const { data: market } = useMarket(
    position.market ? undefined : position.marketId,
  )
  const { mutateAsync: cashOut, isPending } = useCashOut(position.id)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const title = position.market?.title ?? market?.title ?? 'Loading market…'
  const outcome = market?.outcomes.find((o) => o.id === position.outcomeId)
  const outcomeLabel = position.outcomeLabel ?? outcome?.label ?? ''
  const isYes = outcomeLabel
    ? YES_LABELS.includes(outcomeLabel.toLowerCase())
    : market?.yes?.id === position.outcomeId
  const shares = Number(position.shares) || 0 // ₦1-unit count (money math)
  // ₦100-contract count for display; backend `contracts` preferred, else ÷100.
  const contracts =
    position.contracts != null ? Number(position.contracts) : shares / 100
  const avgPrice = Number(position.avgPrice) || 0
  const staked = shares * avgPrice
  const value = toMajorUnits(position.currentValue.amount)
  const pnl = value - staked
  const isProfit = pnl >= 0
  const isOpen = position.status === 'open'

  const handleCashOut = async () => {
    try {
      await cashOut()
      showSuccessToast('Position cashed out')
      setConfirmOpen(false)
    } catch (error) {
      if (isAxiosError(error)) {
        showWarningToast(error.response?.data?.message ?? 'Cash out failed')
      } else {
        showWarningToast('Cash out failed')
      }
    }
  }

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-card p-4'>
      <div className='flex items-center justify-between'>
        <span className='w-fit rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-semibold capitalize text-black'>
          {position.status.toLowerCase()}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
            isYes ? 'text-success' : 'text-error'
          }`}
        >
          {outcomeLabel || (isYes ? 'YES' : 'NO')}
        </span>
      </div>

      <button
        type='button'
        onClick={() => navigate(`/markets/${position.marketId}`)}
        className='h-12 text-left text-sm font-semibold text-black hover:underline'
      >
        {title}
      </button>

      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Avg price</span>
          <span className='font-bold text-black'>
            {formatSharePrice(avgPrice)}
          </span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Shares</span>
          <span className='font-bold text-black'>
            {contracts.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between text-xs text-placeholder'>
        <span>
          Staked{' '}
          {formatCurrency(String(staked), position.currentValue.currency)}
        </span>
        <span>
          Value{' '}
          {formatCurrency(
            value,
            position.currentValue.currency,
          )}
        </span>
      </div>

      <div className='flex items-center justify-between'>
        <span
          className={`text-sm font-bold ${isProfit ? 'text-success' : 'text-error'}`}
        >
          {isProfit ? '+' : '-'}
          {formatCurrency(
            String(Math.abs(pnl)),
            position.currentValue.currency,
          )}
        </span>
        {isOpen && (
          <Button
            type='button'
            text='Cash out'
            variation='plain'
            size='small'
            className='w-fit!'
            onClick={() => setConfirmOpen(true)}
          />
        )}
      </div>

      <ModalComponent
        open={confirmOpen}
        handleClose={() => setConfirmOpen(false)}
        title='Cash out position'
        className='max-w-100! w-[90%]!'
      >
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-neutral-10'>
            Cash out your position in{' '}
            <span className='font-semibold text-black'>{title}</span> at its
            current value of{' '}
            <span className='font-semibold text-black'>
              {formatCurrency(value, position.currentValue.currency)}
            </span>
            ?
          </p>
          <div className='flex gap-3'>
            <Button
              type='button'
              text='Cancel'
              variation='plain'
              size='large'
              className='w-full'
              onClick={() => setConfirmOpen(false)}
            />
            <Button
              type='button'
              text='Cash out'
              variation='primary'
              size='large'
              className='w-full'
              loading={isPending}
              onClick={handleCashOut}
            />
          </div>
        </div>
      </ModalComponent>
    </div>
  )
}

export default PositionCard
