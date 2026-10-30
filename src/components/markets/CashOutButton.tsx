import { useState } from 'react'
import { isAxiosError } from 'axios'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { useCashOut, useCashOutQuote } from '../../data_layer/bets'
import {
  canCashOut,
  formatCurrency,
  formatSharePrice,
  openPositionMark,
  toMajorUnits,
} from '../../utils/functions'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import type { BetPosition } from '../../types/bet.types'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import { SUSPENDED_CTA_HINT } from '../../utils/constants'

const Row = ({
  label,
  value,
  tone = 'text-black',
}: {
  label: string
  value: string
  tone?: string
}) => (
  <div className='flex justify-between gap-3 text-sm'>
    <span className='text-neutral-10'>{label}</span>
    <span className={`font-semibold ${tone}`}>{value}</span>
  </div>
)

interface CashOutButtonProps {
  position: BetPosition
  /** Market title, for the dialog. */
  title: string
  outcomeLabel?: string
  variation?: 'primary' | 'plain'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

/**
 * "Cash out" for an open position, with a confirm dialog that holds a live
 * quote: re-priced every few seconds, and the confirm stays disabled until a
 * quote is in, so the player always sees the amount they're agreeing to — and
 * the cash-out is sent with that amount as its floor. Renders nothing when the
 * position can't be cashed out (pool positions, closed or unpriced markets).
 * One implementation for the portfolio and the market's sell panel.
 */
const CashOutButton = ({
  position,
  title,
  outcomeLabel,
  variation = 'primary',
  size = 'medium',
  className = 'w-fit!',
}: CashOutButtonProps) => {
  const [open, setOpen] = useState(false)
  const suspended = useAccountSuspended()
  const { mutateAsync: cashOut, isPending } = useCashOut(position.id)
  const {
    data: quote,
    isLoading,
    isError,
    error,
    refetch: refetchQuote,
  } = useCashOutQuote(position.id, open)

  const { staked } = openPositionMark(position)
  const proceeds = quote ? toMajorUnits(quote.valueMinor) : null
  const result = proceeds != null ? proceeds - staked : null
  const quoteError = isError
    ? ((isAxiosError(error) && error.response?.data?.message) ||
      'Cash-out isn’t available for this position right now.')
    : null

  const close = () => {
    if (!isPending) setOpen(false)
  }

  const handleConfirm = async () => {
    try {
      // Never pay out less than the amount on the button.
      // The endpoint takes a JSON body, even an empty one.
      await cashOut(quote ? { minValueMinor: String(quote.valueMinor) } : {})
      showSuccessToast(
        proceeds != null
          ? `Cashed out · ${formatCurrency(proceeds)} added to your winnings`
          : 'Position cashed out',
      )
      setOpen(false)
    } catch (err) {
      const data = isAxiosError(err) ? err.response?.data : undefined
      if (data?.code === 'CASH_OUT_VALUE_MOVED') {
        // Position untouched; re-quote so the button shows the new amount.
        void refetchQuote()
        showWarningToast(
          data.valueMinor
            ? `The cash-out value dropped to ${formatCurrency(toMajorUnits(data.valueMinor))}. Check it and confirm again.`
            : 'The cash-out value dropped. Check it and confirm again.',
        )
        return
      }
      showWarningToast(data?.message ?? 'Cash out failed')
    }
  }

  if (!canCashOut(position)) return null

  return (
    <>
      <span title={suspended ? SUSPENDED_CTA_HINT : undefined}>
        <Button
          type='button'
          text='Cash out'
          variation={variation}
          size={size}
          className={className}
          disabled={suspended}
          onClick={() => setOpen(true)}
        />
      </span>

      <ModalComponent
        open={open}
        handleClose={close}
        title={
          <div className='flex flex-col gap-0.5'>
            <span>Cash out</span>
            <span className='text-xs font-normal text-neutral-10'>
              {outcomeLabel ? `${outcomeLabel} · ` : ''}
              {title}
            </span>
          </div>
        }
        showCloseIcon={!isPending}
        closeOnOverlayClick={!isPending}
        className='max-w-md'
      >
        <div className='flex flex-col gap-4 py-2'>
          {quoteError ? (
            <p className='rounded-lg bg-error-bg px-3 py-2.5 text-sm text-error'>
              {quoteError}
            </p>
          ) : isLoading || proceeds == null ? (
            <div className='h-24 animate-pulse rounded-lg bg-hover' />
          ) : (
            <section className='flex flex-col gap-2 rounded-2xl border border-border p-4'>
              <Row label='You staked' value={formatCurrency(staked)} />
              {Number(quote?.sellPrice) > 0 && (
                <Row
                  label='Sell price'
                  value={formatSharePrice(Number(quote?.sellPrice))}
                />
              )}
              <Row label='You get now' value={formatCurrency(proceeds)} />
              {result != null && (
                <Row
                  label={result >= 0 ? 'Profit' : 'Loss'}
                  value={`${result >= 0 ? '+' : '-'}${formatCurrency(Math.abs(result))}`}
                  tone={result >= 0 ? 'text-success' : 'text-error'}
                />
              )}
            </section>
          )}

          {!quoteError && (
            <p className='text-xs text-neutral-10'>
              The amount updates live with the market and may move slightly
              before your cash-out lands. It’s paid into your winnings.
            </p>
          )}

          <div className='flex gap-3'>
            <Button
              type='button'
              text={quoteError ? 'Close' : 'Keep position'}
              variation='plain'
              size='large'
              className='w-full'
              disabled={isPending}
              onClick={close}
            />
            {!quoteError && (
              <Button
                type='button'
                text={
                  proceeds != null
                    ? `Cash out ${formatCurrency(proceeds)}`
                    : 'Cash out'
                }
                variation='primary'
                size='large'
                className='w-full'
                loading={isPending}
                disabled={proceeds == null || suspended}
                onClick={handleConfirm}
              />
            )}
          </div>
        </div>
      </ModalComponent>
    </>
  )
}

export default CashOutButton
