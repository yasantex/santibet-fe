import { useState } from 'react'
import { useNavigate } from 'react-router'
import { isAxiosError } from 'axios'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import ShareBetButton from './ShareBetButton'
import { useMarket } from '../../data_layer/markets'
import { useCashOut, useCashOutQuote } from '../../data_layer/bets'
import {
  formatCurrency,
  formatSharePrice,
  toMajorUnits,
} from '../../utils/functions'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import type { BetPosition } from '../../types/bet.types'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import { SUSPENDED_CTA_HINT } from '../../utils/constants'

const YES_LABELS = ['yes', 'up', 'over', 'win', 'true']

type PositionCardProps = {
  position: BetPosition
  /** Show the Share button (only on the Open tab). */
  shareable?: boolean
}

const PositionCard = ({ position, shareable = false }: PositionCardProps) => {
  const navigate = useNavigate()
  // The API now embeds a market summary; only fetch when it's absent.
  const { data: market } = useMarket(
    position?.market ? undefined : position?.marketId,
  )
  const { mutateAsync: cashOut, isPending } = useCashOut(position?.id)
  const suspended = useAccountSuspended()
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Live cash-out quote, fetched only while the confirm dialog is open.
  const { data: cashOutQuote, isLoading: quoteLoading } = useCashOutQuote(
    position?.id,
    confirmOpen,
  )

  const title = position?.market?.title ?? market?.title ?? 'Loading market…'
  const outcome = market?.outcomes.find((o) => o.id === position?.outcomeId)
  const outcomeLabel = position?.outcomeLabel ?? outcome?.label ?? ''
  const isYes = outcomeLabel
    ? YES_LABELS.includes(outcomeLabel.toLowerCase())
    : market?.yes?.id === position.outcomeId
  const shares = Number(position.shares) || 0 // ₦1-unit count (money math)
  // ₦100-contract count for display; backend `contracts` preferred, else ÷100.
  const contracts =
    position?.contracts != null ? Number(position?.contracts) : shares / 100
  const avgPrice = Number(position.avgPrice) || 0
  const currency = position?.stake?.currency ?? position?.currentValue?.currency
  const staked = position?.stake
    ? toMajorUnits(position.stake.amount)
    : shares * avgPrice
  const isOpen = position.status === 'OPEN'
  const result = position.result ?? null

  // OPEN positions mark-to-market against currentValue/unrealizedPnl; once
  // SETTLED/CLOSED, currentValue goes null and realizedPnl is the source of truth.
  const value = isOpen
    ? toMajorUnits(position?.currentValue?.amount ?? 0)
    : null
  const pnl = isOpen
    ? position.unrealizedPnl
      ? toMajorUnits(position.unrealizedPnl.amount)
      : (value ?? 0) - staked
    : position.realizedPnl
      ? toMajorUnits(position.realizedPnl.amount)
      : 0
  const isProfit = pnl >= 0
  // Amount actually returned to the user for a settled/closed position.
  const payout = staked + pnl
  // Quoted cash-out proceeds (kobo → naira), falling back to live value.
  const quotedValue = cashOutQuote
    ? toMajorUnits(cashOutQuote.valueMinor)
    : (value ?? 0)
  const quotedCurrency = cashOutQuote?.currency ?? currency

  const statusMeta = isOpen
    ? { label: 'In progress', className: 'bg-warning/10 text-warning' }
    : result === 'WON'
      ? { label: 'Won', className: 'bg-surface-success text-success' }
      : result === 'LOST'
        ? { label: 'Lost', className: 'bg-surface-error text-error' }
        : result === 'CASHED_OUT'
          ? { label: 'Cashed out', className: 'bg-surface-hover text-black' }
          : {
              label: position.status.toLowerCase(),
              className: 'bg-surface-hover text-black',
            }

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
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <section className='flex items-center justify-between gap-2.5'>
        <main className='flex flex-col gap-2.5'>
          <div className='flex items-center'>
            <span
              className={`w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusMeta.className}`}
            >
              {statusMeta.label}
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
            className='line-clamp-2 text-left text-sm font-semibold text-black hover:underline'
          >
            {title}
          </button>
        </main>
        <div className='flex items-center gap-2 text-sm'>
          <div className='flex gap-1.5 items-center rounded-md bg-surface-hover px-3 py-1.5'>
            <span className='text-xs shrink-0 text-black/60'>Avg price</span>
            <span className='font-bold text-black'>
              {formatSharePrice(avgPrice)}
            </span>
          </div>
          <div className='flex gap-1.5 items-center rounded-md bg-surface-hover px-3 py-1.5'>
            <span className='text-xs shrink-0 text-black/60'>Shares</span>
            <span className='font-bold text-black'>
              {contracts.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </section>

      <div className='flex items-center justify-between text-xs text-placeholder'>
        <span>Staked {formatCurrency(String(staked), currency)}</span>
        <div className='flex items-center gap-2.5'>
          <span>
            {isOpen ? 'Value' : 'Payout'}{' '}
            {formatCurrency(String(isOpen ? (value ?? 0) : payout), currency)}
          </span>
          <span
            className={`text-sm font-bold ${isProfit ? 'text-success' : 'text-error'}`}
          >
            {isOpen && 'Unrealized '}
            {isProfit ? '+' : '-'}
            {formatCurrency(String(Math.abs(pnl)), currency)}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        {isOpen && (
          <span title={suspended ? SUSPENDED_CTA_HINT : undefined}>
            <Button
              type='button'
              text='Cash out'
              variation='plain'
              size='small'
              className='w-fit!'
              disabled={suspended}
              onClick={() => setConfirmOpen(true)}
            />
          </span>
        )}
        {shareable && (
          <ShareBetButton
            marketId={position.marketId}
            outcomeId={position.outcomeId}
            title={title}
            outcomeLabel={outcomeLabel}
            price={formatSharePrice(avgPrice)}
            stake={formatCurrency(String(staked), currency)}
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
            {quoteLoading ? (
              <>
                Fetching the latest cash-out value for your position in{' '}
                <span className='font-semibold text-black'>{title}</span>…
              </>
            ) : (
              <>
                Cash out your position in{' '}
                <span className='font-semibold text-black'>{title}</span> for{' '}
                <span className='font-semibold text-black'>
                  {formatCurrency(quotedValue, quotedCurrency)}
                </span>
                ? The final amount may vary slightly with the market.
              </>
            )}
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
              text={
                quoteLoading
                  ? 'Cash out'
                  : `Cash out ${formatCurrency(quotedValue, quotedCurrency)}`
              }
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
