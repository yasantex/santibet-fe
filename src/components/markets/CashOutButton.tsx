import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { useCashOut, useCashOutQuote } from '../../data_layer/bets'
import { BET_POSITIONS_KEY } from '../../data_layer/queryKeys'
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

const PRESETS = [25, 50, 75, 100]

/** Shares as the API takes them: a decimal string, at most 6 places. */
const toQuantity = (shares: number) =>
  String(Number(shares.toFixed(6)))

interface CashOutButtonProps {
  position: BetPosition
  /** Market title, for the dialog. */
  title: string
  outcomeLabel?: string
  variation?: 'primary' | 'plain'
  size?: 'small' | 'medium' | 'large'
  className?: string
  /** Trigger text; "Sell" in the portfolio table. */
  label?: string
}

/**
 * "Cash out" for an open position: sell all of it, or part of it. The confirm
 * dialog holds a live quote — re-priced every few seconds, and the confirm
 * stays disabled until a quote for the chosen amount is in, so the player
 * always sees what they're agreeing to — and the sale is sent with that amount
 * as its floor. A part sale stays inside the range the quote allows (partner
 * markets have a minimum order size). Renders nothing when the position can't
 * be cashed out (pool or bonus positions, closed or unpriced markets). One
 * implementation for the portfolio and the market's sell panel.
 */
const CashOutButton = ({
  position,
  title,
  outcomeLabel,
  variation = 'primary',
  size = 'medium',
  className = 'w-fit!',
  label = 'Cash out',
}: CashOutButtonProps) => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  // Share of the position to sell, 1–100.
  const [percent, setPercent] = useState(100)
  const suspended = useAccountSuspended()
  const { mutateAsync: cashOut, isPending } = useCashOut(position.id)

  // The whole-position quote carries the range a part sale must stay in.
  const {
    data: fullQuote,
    isLoading,
    isError,
    error,
    refetch: refetchFull,
  } = useCashOutQuote(position.id, open)
  const held = Number(fullQuote?.positionQuantity) || 0
  const minQty = Number(fullQuote?.minQuantity) || 0
  const minLeft = Number(fullQuote?.minRemainingQuantity) || 0
  // An API without ranges (or a position too small to split): sell all only.
  const canSplit = held > 0 && fullQuote?.partialAvailable === true
  const minPercent = canSplit ? Math.max(1, Math.ceil((minQty / held) * 100)) : 100
  const maxPartPercent = canSplit
    ? Math.floor(((held - minLeft) / held) * 100)
    : 0

  const sellAll = !canSplit || percent >= 100
  const partValid = sellAll || (percent >= minPercent && percent <= maxPartPercent)
  const shares = sellAll ? held : (held * percent) / 100
  const quantity = sellAll ? undefined : toQuantity(shares)

  // Price the chosen part once the slider settles.
  const [quotedQuantity] = useDebounce(quantity, 250)
  const { data: partQuote, refetch: refetchPart } = useCashOutQuote(
    position.id,
    open && !!quotedQuantity && partValid,
    quotedQuantity,
  )
  const quote = sellAll ? fullQuote : partQuote
  // Only trust a quote for exactly the amount on screen.
  const quoteMatches =
    !!quote &&
    (sellAll
      ? quote === fullQuote
      : Number(quote.quantity) === Number(quantity))

  const { staked } = openPositionMark(position)
  const proceeds = quoteMatches ? toMajorUnits(quote.valueMinor) : null
  // The stake behind the shares being sold.
  const stakedPart = sellAll || held <= 0 ? staked : (staked * shares) / held
  const result = proceeds != null ? proceeds - stakedPart : null
  const quoteError = isError
    ? ((isAxiosError(error) && error.response?.data?.message) ||
      'Cash-out isn’t available for this position right now.')
    : null

  const refetchQuotes = () => {
    void refetchFull()
    if (!sellAll) void refetchPart()
  }

  const close = () => {
    if (isPending) return
    setOpen(false)
    setPercent(100)
  }

  const handleConfirm = async () => {
    if (!quoteMatches || !quote) return
    try {
      // Never pay out less than the amount on the button.
      await cashOut({
        minValueMinor: String(quote.valueMinor),
        ...(quantity ? { quantity } : {}),
      })
      showSuccessToast(
        sellAll
          ? `Cashed out · ${formatCurrency(proceeds ?? 0)} added to your winnings`
          : `Sold ${percent}% · ${formatCurrency(proceeds ?? 0)} added to your winnings`,
      )
      close()
    } catch (err) {
      const data = isAxiosError(err) ? err.response?.data : undefined
      // Nothing was sold on any of these: re-quote and let them try again.
      if (data?.code === 'CASH_OUT_VALUE_MOVED') {
        refetchQuotes()
        showWarningToast(
          data.valueMinor
            ? `The cash-out value dropped to ${formatCurrency(toMajorUnits(data.valueMinor))}. Check it and confirm again.`
            : 'The cash-out value dropped. Check it and confirm again.',
        )
        return
      }
      if (
        data?.code === 'CASH_OUT_BELOW_MINIMUM' ||
        data?.code === 'CASH_OUT_QUANTITY_INVALID'
      ) {
        // The allowed range moves with the live price on partner markets.
        refetchQuotes()
        showWarningToast(
          data.message ?? 'That amount can’t be sold on its own. Pick another.',
        )
        return
      }
      if (data?.code === 'POSITION_CHANGED') {
        qc.invalidateQueries({ queryKey: BET_POSITIONS_KEY })
        refetchQuotes()
        showWarningToast(
          'This position just changed. Check the new amount and confirm again.',
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
          text={label}
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
          ) : isLoading || !fullQuote ? (
            <div className='h-24 animate-pulse rounded-lg bg-hover' />
          ) : (
            <>
              {/* How much to sell */}
              {canSplit ? (
                <section className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-neutral-10'>Amount to sell</span>
                    <span className='font-semibold text-black'>
                      {sellAll ? 'All' : `${percent}%`}
                    </span>
                  </div>
                  <input
                    type='range'
                    min={1}
                    max={100}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    aria-label='Share of the position to sell'
                    className='w-full accent-brand-green'
                  />
                  <div className='flex gap-2'>
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        type='button'
                        onClick={() => setPercent(p)}
                        className={`flex-1 rounded-full py-1 text-xs font-semibold transition-colors ${
                          percent === p
                            ? 'bg-brand-green text-black'
                            : 'bg-hover text-neutral-10 hover:text-black'
                        }`}
                      >
                        {p === 100 ? 'All' : `${p}%`}
                      </button>
                    ))}
                  </div>
                  {!partValid && (
                    <p className='text-xs font-medium text-warning'>
                      {maxPartPercent >= minPercent
                        ? `You can sell between ${minPercent}% and ${maxPartPercent}% of this position, or all of it.`
                        : 'This position can only be sold in full.'}
                    </p>
                  )}
                </section>
              ) : (
                fullQuote.partialAvailable === false && (
                  <p className='text-xs text-neutral-10'>
                    This position is too small to split, so it can only be sold
                    in full.
                  </p>
                )
              )}

              <section
                className={`flex flex-col gap-2 rounded-2xl border border-border p-4 ${
                  partValid && !quoteMatches ? 'opacity-60' : ''
                }`}
              >
                <Row
                  label={sellAll ? 'You staked' : 'Stake on this part'}
                  value={formatCurrency(stakedPart)}
                />
                {Number(quote?.sellPrice) > 0 && (
                  <Row
                    label='Sell price'
                    value={formatSharePrice(Number(quote?.sellPrice))}
                  />
                )}
                <Row
                  label='You get now'
                  value={proceeds != null ? formatCurrency(proceeds) : '—'}
                />
                {result != null && (
                  <Row
                    label={result >= 0 ? 'Profit' : 'Loss'}
                    value={`${result >= 0 ? '+' : '-'}${formatCurrency(Math.abs(result))}`}
                    tone={result >= 0 ? 'text-success' : 'text-error'}
                  />
                )}
              </section>
            </>
          )}

          {!quoteError && (
            <p className='text-xs text-neutral-10'>
              The amount updates live with the market and may move slightly
              before your cash-out lands. It’s paid into your winnings.
              {!sellAll && ' The rest of your position stays open.'}
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
                    ? `${sellAll ? 'Cash out' : `Sell ${percent}%`} · ${formatCurrency(proceeds)}`
                    : 'Cash out'
                }
                variation='primary'
                size='large'
                className='w-full'
                loading={isPending}
                disabled={proceeds == null || !partValid || suspended}
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
