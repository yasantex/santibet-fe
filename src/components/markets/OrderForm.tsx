import { useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useCookies } from 'react-cookie'
import { isAxiosError } from 'axios'
import { useDebounce } from 'use-debounce'
import { Button } from '../globals/Button'
import { useSantiBetQuery } from '../../data_layer/utils'
import { useBetQuote, usePlaceBet } from '../../data_layer/bets'
import { showWarningToast } from '../../utils/toastUtils'
import {
  NAIRA,
  formatCurrency,
  formatSharePrice,
  sanitizeAmount,
  spendableBalance,
  toMajorUnits,
  toMinorUnits,
} from '../../utils/functions'
import { randomId } from '../../utils/deviceFingerprint'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import type { WalletBalance } from '../../types/wallet.types'
import type { Bet, PlaceBetPayload } from '../../types/bet.types'
import {
  isMarketOpen,
  isPoolMarket,
  outcomePriceLabel,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import SuspendedHint from '../globals/SuspendedHint'
import useAuthNavigate from '../../hooks/useAuthNavigate'
import useMarketOpen from '../../hooks/useMarketOpen'

const QUICK_ADDS = [100, 200, 500, 1000]

// A re-quoted price at least this far (₦0.50 a share) from the one the player
// last saw counts as a move they have to accept before placing.
const PRICE_MOVE_THRESHOLD = 0.005
// Slippage allowed between the price on screen and the fill (₦1 a share):
// sent as `maxPrice`, above which the API refuses with 409 PRICE_MOVED.
const MAX_PRICE_SLIPPAGE = 0.01

/** What the player saw when they submitted, for the success screen. */
export interface PlacedOrder {
  bet: Bet
  outcomeLabel: string
  /** Naira. */
  stake: number
  /** 0–1. */
  price: number
  /** Naira — payout if it wins, after fees. */
  payout: number
  /** Naira — fee from the quote the player accepted (0 if none). */
  fee: number
}

interface OrderFormProps {
  market: UiMarket
  outcome?: UiOutcome
  onSelectOutcome: (outcome: UiOutcome) => void
  submitText?: string
  onPlaced: (order: PlacedOrder) => void
}

/** Stake on an outcome: outcome picker, amount, summary and submit. */
const OrderForm = ({
  market,
  outcome,
  onSelectOutcome,
  submitText = 'Place prediction',
  onPlaced,
}: OrderFormProps) => {
  const authNavigate = useAuthNavigate()
  const location = useLocation()
  const [cookies] = useCookies(['token'])
  const isSignedIn = !!cookies?.token
  const suspended = useAccountSuspended()

  const [amount, setAmount] = useState('')
  // Idempotency key for the order being placed. Kept across a retry of the
  // same order after a network failure so it can never fill twice.
  const pendingOrderRef = useRef<{ key: string; id: string } | null>(null)
  // A server-side rejection to show inline under the amount (e.g. the venue
  // minimum-bet error). `minStake` is the structured minimum from the API's
  // error `details`, offered as a one-tap fill.
  const [betError, setBetError] = useState<string | null>(null)
  const [minStake, setMinStake] = useState<number | null>(null)

  const clearBetError = () => {
    if (betError) setBetError(null)
    if (minStake != null) setMinStake(null)
  }

  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    queryKey: ['/wallet', {}],
    enabled: isSignedIn,
  })

  const { mutateAsync: placeBet, isPending } = usePlaceBet()

  const symbol = NAIRA
  const cash = spendableBalance(wallet)
  // Every market now carries its minimum stake (kobo). Shown as a hint and
  // pre-checked before submit so the user gets instant feedback; the server
  // STAKE_BELOW_MINIMUM / HEDGE_BELOW_VENUE_MINIMUM checks remain the backstop.
  const marketMinNaira =
    market.minStakeMinor != null ? toMajorUnits(market.minStakeMinor) : null

  const isOpen = useMarketOpen(market)

  const stakeNum = Number(amount) || 0

  // Server quote: the real fill price, fee and net payout. Debounced so typing
  // doesn't fire a request per keystroke; refreshed while the form is open.
  const [quotedStake] = useDebounce(stakeNum, 300)
  const quoteBody = useMemo<Omit<PlaceBetPayload, 'clientOrderId'> | null>(
    () =>
      outcome && isOpen && quotedStake > 0
        ? {
            marketId: market.id,
            outcomeId: outcome.id,
            stake: String(toMinorUnits(quotedStake)),
            type: 'market',
          }
        : null,
    [market.id, outcome, isOpen, quotedStake],
  )
  const { data: quoteData, refetch: refetchQuote } = useBetQuote(
    isSignedIn ? quoteBody : null,
  )
  // The previous quote stays cached while the next loads; only use it if it's
  // for what's on screen now.
  const quote =
    quoteBody && quoteData?.outcomeId === outcome?.id ? quoteData : undefined
  const quotedPrice = quote?.price != null ? Number(quote.price) : null

  // Pool (parimutuel) markets have no share price: a win pays a slice of the
  // pool, so odds float until close. The lobby says so via `executionModel`;
  // on a feed without it, remember it once a quote reveals it.
  const [poolMarketId, setPoolMarketId] = useState<string | null>(null)
  if (quote?.executionModel === 'PARIMUTUEL' && poolMarketId !== market.id) {
    setPoolMarketId(market.id)
  }
  const isPool = market.executionModel
    ? isPoolMarket(market)
    : poolMarketId === market.id

  // Without a quote (guests, or before it lands) estimate locally — at the ask,
  // since that's what a buy pays, not the mid.
  const price = quotedPrice ?? outcome?.ask ?? outcome?.price ?? 0

  // A quote for a slightly older stake (mid-debounce) still gives the right
  // ratios; scale its money to the stake on screen.
  const quoteStake = quote ? toMajorUnits(quote.stake.amount) : 0
  const scale = quote && quoteStake > 0 ? stakeNum / quoteStake : 0
  const fee = quote ? toMajorUnits(quote.fee.amount) * scale : 0
  // Odds before a quote lands: at the ask if there is one, else the feed's
  // server odds (net of fees, and the only right number on a pool market),
  // else 1 / price.
  const localOdds = outcome?.ask
    ? price > 0
      ? 1 / price
      : 0
    : (outcome?.decimalOdds ?? (price > 0 ? 1 / price : 0))
  const payout = quote
    ? toMajorUnits(quote.netReturn.amount) * scale
    : stakeNum * localOdds
  const profit = payout - stakeNum
  // On a pool the effective odds are what this stake would actually be paid.
  const decimalOdds = quote
    ? isPool
      ? stakeNum > 0
        ? payout / stakeNum
        : 0
      : Number(quote.decimalOdds) || localOdds
    : localOdds
  const chance =
    quote?.impliedPercent != null
      ? Math.round(quote.impliedPercent)
      : Math.round(price * 100)
  const estimated = (quote?.estimated ?? false) || isPool

  // Price-move guard: remember the price the player first saw for this
  // outcome + stake; if a re-quote moves it, they accept before placing.
  // Adjust-state-during-render, keyed so it resets on their own edits.
  const anchorKey = `${outcome?.id}:${quote?.stake.amount}`
  const [anchor, setAnchor] = useState<{ key: string; price: number } | null>(
    null,
  )
  if (quotedPrice != null && anchor?.key !== anchorKey) {
    setAnchor({ key: anchorKey, price: quotedPrice })
  }
  const movedFrom =
    quotedPrice != null &&
    anchor?.key === anchorKey &&
    Math.abs(quotedPrice - anchor.price) >= PRICE_MOVE_THRESHOLD
      ? anchor.price
      : null
  const acceptPrice = () => {
    if (quotedPrice != null) setAnchor({ key: anchorKey, price: quotedPrice })
  }

  // Send guests to sign in, then back to this market with their pick kept.
  const goToSignIn = () => {
    const params = new URLSearchParams(location.search)
    if (outcome) params.set('outcome', outcome.id)
    const query = params.toString()
    authNavigate('/signin', `${location.pathname}${query ? `?${query}` : ''}`)
  }

  const addAmount = (delta: number) => {
    clearBetError()
    setAmount(String((Number(amount) || 0) + delta))
  }

  /** Same order as the last attempt → same id; anything else gets a new one. */
  const clientOrderIdFor = (payload: Omit<PlaceBetPayload, 'clientOrderId'>) => {
    const key = JSON.stringify(payload)
    if (pendingOrderRef.current?.key !== key) {
      pendingOrderRef.current = { key, id: randomId() }
    }
    return pendingOrderRef.current.id
  }

  const handleSubmit = async () => {
    if (!isMarketOpen(market)) {
      showWarningToast('This market is closed')
      return
    }
    if (!isSignedIn) {
      goToSignIn()
      return
    }
    if (!outcome) return
    clearBetError()
    if (stakeNum <= 0) {
      showWarningToast('Enter an amount to predict')
      return
    }
    if (isSignedIn && stakeNum > cash) {
      showWarningToast('Amount exceeds your available balance')
      return
    }
    if (marketMinNaira != null && stakeNum < marketMinNaira) {
      setMinStake(marketMinNaira)
      setBetError(
        `Minimum bet is ${symbol}${marketMinNaira.toLocaleString()} for this market.`,
      )
      return
    }
    // The price moved since they looked — this click accepts the new one.
    if (movedFrom != null) {
      acceptPrice()
      return
    }

    const payload: Omit<PlaceBetPayload, 'clientOrderId'> = {
      marketId: market.id,
      outcomeId: outcome.id,
      stake: String(toMinorUnits(stakeNum)),
      type: 'market',
      // Don't fill above the price on screen (plus a little slippage). A pool
      // has no fill price, so the API ignores it there.
      ...(!isPool && price > 0
        ? {
            maxPrice: Number(
              Math.min(price + MAX_PRICE_SLIPPAGE, 0.999).toFixed(4),
            ),
          }
        : {}),
    }
    try {
      const bet = await placeBet({
        ...payload,
        clientOrderId: clientOrderIdFor(payload),
      })
      pendingOrderRef.current = null
      // A hedged bet the trading partner refuses still comes back 201, as
      // REJECTED with the stake already returned — not a placed prediction.
      if (bet.status === 'REJECTED') {
        if (
          bet.rejectCode === 'HEDGE_BELOW_VENUE_MINIMUM' &&
          marketMinNaira != null
        ) {
          setMinStake(marketMinNaira)
        }
        setBetError(
          bet.rejectReason ??
            'Your prediction was rejected. Your stake is back in your wallet.',
        )
        return
      }
      onPlaced({
        bet,
        outcomeLabel: outcome.label,
        stake: stakeNum,
        price,
        payout,
        fee,
      })
      setAmount('')
    } catch (error) {
      // The server answered, so nothing is in flight: a fixed-up retry is a
      // new order. With no response (timeout, network) the bet may have gone
      // through, so a retry keeps the id and can't place it twice.
      if (isAxiosError(error) && error.response) pendingOrderRef.current = null
      const fallback = 'Could not place your prediction'
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              message?: string
              code?: string
              price?: string
              details?: {
                minimumStakeNgn?: number
                minimumStakeMinor?: number
              }
            }
          | undefined
        if (data?.code === 'PRICE_MOVED') {
          // Re-quote so the form shows the new price and asks to accept it.
          void refetchQuote()
          setBetError(
            `The price moved${
              data.price ? ` to ${formatSharePrice(Number(data.price))}` : ''
            } before your prediction went through. Check the new payout and try again.`,
          )
          return
        }
        const message = data?.message ?? fallback
        // Surface the minimum-bet rejection inline with a one-tap fill, reading
        // the structured minimum from the API error `details`. Two shapes:
        // STAKE_BELOW_MINIMUM → minimumStakeMinor (kobo); the venue floor
        // HEDGE_BELOW_VENUE_MINIMUM → minimumStakeNgn (naira).
        const min =
          data?.details?.minimumStakeNgn ??
          (data?.details?.minimumStakeMinor != null
            ? toMajorUnits(data.details.minimumStakeMinor)
            : undefined)
        if (typeof min === 'number' && Number.isFinite(min)) setMinStake(min)
        setBetError(message)
      } else {
        setBetError(fallback)
      }
    }
  }

  return (
    <>
      {/* Outcome selector */}
      <div className='flex items-stretch gap-2'>
        {market.outcomes.map((o, i) => {
          const active = o.id === outcome?.id
          const tone = outcomeTone(market, o.id, i)
          return (
            <button
              key={o.id}
              type='button'
              onClick={() => onSelectOutcome(o)}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg border py-2 text-sm font-bold transition-colors ${
                active
                  ? TONE_STYLES[tone].active
                  : 'border-border text-neutral-10 hover:text-black'
              }`}
            >
              <span className='w-full min-w-0 truncate text-center uppercase'>
                {o.label}
              </span>
              <span>{outcomePriceLabel(market, o, { withPercent: true })}</span>
            </button>
          )
        })}
      </div>

      {/* Amount */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-neutral-10'>Amount</span>
          {isSignedIn && (
            <span className='text-neutral-10'>
              Available: {formatCurrency(cash)}
            </span>
          )}
        </div>
        <div className='flex items-center rounded-lg border-2 border-black px-3 py-2.5'>
          <span className='text-sm font-bold text-neutral-10'>{symbol}</span>
          <input
            type='text'
            inputMode='decimal'
            value={amount}
            onChange={(e) => {
              clearBetError()
              setAmount(sanitizeAmount(e.target.value))
            }}
            placeholder='0.00'
            className='w-full bg-transparent px-1 text-sm font-bold text-black outline-none'
          />
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {QUICK_ADDS.map((v) => (
            <button
              key={v}
              type='button'
              onClick={() => addAmount(v)}
              className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
            >
              +{symbol}
              {v.toLocaleString()}
            </button>
          ))}
          {isSignedIn && cash > 0 && (
            <button
              type='button'
              onClick={() => {
                clearBetError()
                setAmount(String(Math.floor(cash * 100) / 100))
              }}
              className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
            >
              MAX
            </button>
          )}
        </div>

        {marketMinNaira != null && !betError && (
          <p className='text-xs text-neutral-10'>
            Minimum bet {symbol}
            {marketMinNaira.toLocaleString()}
          </p>
        )}

        {betError && (
          <div className='flex flex-col gap-2 rounded-lg bg-error-bg px-3 py-2.5'>
            <p className='text-xs font-medium text-error'>{betError}</p>
            {minStake != null && (
              <button
                type='button'
                onClick={() => {
                  setAmount(String(minStake))
                  clearBetError()
                }}
                className='self-start rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error hover:bg-error/25'
              >
                Use minimum · {symbol}
                {minStake.toLocaleString()}
              </button>
            )}
          </div>
        )}
      </div>

      {outcome?.stale && isOpen && (
        <p className='rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning'>
          This price may be out of date. It's re-checked when you place, so
          your fill can differ.
        </p>
      )}

      {movedFrom != null && quotedPrice != null && (
        <p className='rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning'>
          Price moved from {formatSharePrice(movedFrom)} to{' '}
          {formatSharePrice(quotedPrice)}. Your payout below is updated.
        </p>
      )}

      {/* Summary */}
      <div className='flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm'>
        {!isPool && (
          <div className='flex justify-between'>
            <span className='text-neutral-10'>Price per share</span>
            <span className='font-semibold text-black'>
              {formatSharePrice(price)}
            </span>
          </div>
        )}
        <div className='flex justify-between'>
          <span className='text-neutral-10'>
            {isPool ? 'Est. odds' : 'Odds'}
          </span>
          <span className='font-semibold text-black'>
            {decimalOdds > 0 ? decimalOdds.toFixed(2) : '—'}
            {!isPool && (
              <span className='font-normal text-neutral-10'>
                {' '}
                · {chance}% chance
              </span>
            )}
          </span>
        </div>
        {fee > 0 && (
          <div className='flex justify-between'>
            <span className='text-neutral-10'>Fee</span>
            <span className='font-semibold text-black'>
              {formatCurrency(fee)}
            </span>
          </div>
        )}
        <div className='flex justify-between'>
          <span className='text-neutral-10'>
            {estimated ? 'Est. payout' : 'Payout'} if {outcome?.label ?? 'it'}{' '}
            wins
          </span>
          <span className='font-semibold text-black'>
            {formatCurrency(Math.max(payout, 0))}
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-neutral-10'>Profit</span>
          <span
            className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-error'}`}
          >
            {profit >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(stakeNum > 0 ? profit : 0))}
          </span>
        </div>
        {estimated && (
          <p className='text-xs text-neutral-10'>
            {quote?.note ??
              'Pool market: the payout moves with the pool until it closes.'}
          </p>
        )}
      </div>

      <Button
        type='button'
        text={
          !isOpen
            ? 'Market closed'
            : !isSignedIn
              ? 'Sign in to predict'
              : movedFrom != null
                ? 'Accept new price'
                : submitText
        }
        variation='primary'
        size='large'
        className='w-full'
        loading={isPending}
        disabled={!isOpen || (isSignedIn && suspended)}
        onClick={handleSubmit}
      />
      {isSignedIn && suspended && (
        <SuspendedHint className='-mt-2 text-center' />
      )}
    </>
  )
}

export default OrderForm
