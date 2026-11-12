import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
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
  findTeam,
  isMarketOpen,
  isPoolMarket,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import TeamLogo from './TeamLogo'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import SuspendedHint from '../globals/SuspendedHint'
import useAuthNavigate from '../../hooks/useAuthNavigate'
import useMarketOpen from '../../hooks/useMarketOpen'
import useBonusSlip from '../../hooks/useBonusSlip'
import BonusSlipToggle from '../bonus/BonusSlipToggle'
import { shortOutcomeLabel, teamsFromTitle } from '../../utils/teamNames'
import { BONUS_KYC_CODE } from '../../utils/bonus'
import { KYC_PATH } from '../../utils/authRedirect'
import type { FundedBy } from '../../types/bonus.types'
import { useOddsFormat } from '../../hooks/useOddsFormat'

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
  /** Naira — payout if it wins, after fees. For a bonus bet, what a win
   *  credits (bonus balance or locked winnings). */
  payout: number
  /** Naira — fee from the quote the player accepted (0 if none). */
  fee: number
  /** Cash or bonus credit. */
  fundedBy: FundedBy
  /** Bonus bets only: where a win is credited. */
  bonusCreditsTo?: 'BONUS_BALANCE' | 'LOCKED_WINNINGS'
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
  const { priceLabel } = useOddsFormat()
  const authNavigate = useAuthNavigate()
  const navigate = useNavigate()
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
  const [betErrorCode, setBetErrorCode] = useState<string | null>(null)
  const [minStake, setMinStake] = useState<number | null>(null)

  const clearBetError = () => {
    if (betError) setBetError(null)
    if (betErrorCode) setBetErrorCode(null)
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

  // Bonus credit: while "Use bonus" is on, the stake comes out of the bonus
  // balance and bonus rules (price band, live, min/max stake…) apply.
  const bonusSlip = useBonusSlip({
    market,
    outcome,
    type: 'market',
    stake: stakeNum,
    price,
    isSignedIn,
  })
  const usingBonus = bonusSlip.active
  const spendable = usingBonus ? bonusSlip.balance : cash
  const selectedBonusReason = bonusSlip.ineligibleReason(outcome?.id)

  // The smallest stake this order can go through at (0 = no minimum).
  const minRequired = Math.max(
    marketMinNaira ?? 0,
    usingBonus ? (bonusSlip.minStake ?? 0) : 0,
  )
  const minLabel = formatCurrency(minRequired)
  const belowMin = stakeNum > 0 && stakeNum < minRequired
  const amountValid = stakeNum > 0 && !belowMin

  // A bonus awaiting KYC stops at the "verify" prompt on submit, so the amount
  // rules below must not block the button and hide it.
  const kycFirst =
    bonusSlip.offered && bonusSlip.useBonus && bonusSlip.pendingKyc
  // An unloaded wallet reads as ₦0, which must not look like a real shortfall.
  const fundsKnown =
    isOpen && isSignedIn && !kycFirst && (usingBonus || wallet != null)
  const canAffordMin = !fundsKnown || spendable >= minRequired
  const shortfall = fundsKnown
    ? Math.max(Math.max(stakeNum, minRequired) - spendable, 0)
    : 0
  const needsFunds = shortfall > 0
  // Bonus credit can't be topped up, so only a cash bet is sent to the wallet.
  const goToFunds = needsFunds && !usingBonus

  // Why the amount can't be placed yet, shown as it's typed.
  const amountNotice = (() => {
    if (!isOpen || kycFirst) return null
    if (needsFunds) {
      if (usingBonus) {
        return canAffordMin
          ? 'Not enough bonus credit for this stake.'
          : `You don't have enough bonus credit for the ${minLabel} minimum. Turn off bonus to bet with cash.`
      }
      return stakeNum > minRequired
        ? `You need ${formatCurrency(shortfall)} more to bet this amount.`
        : `Minimum bet is ${minLabel}. You need ${formatCurrency(shortfall)} more.`
    }
    return belowMin ? `Minimum bet is ${minLabel} for this market.` : null
  })()
  // Stay calm mid-typing ("1" on the way to "1,500"); firm once they've stopped.
  const [amountFocused, setAmountFocused] = useState(false)
  const amountInvalid = !!amountNotice && stakeNum > 0 && !amountFocused

  // Button label when the order can't go through yet (it's disabled then).
  const blockedLabel =
    !isOpen || !isSignedIn || kycFirst
      ? null
      : needsFunds && usingBonus
        ? 'Not enough bonus credit'
        : stakeNum <= 0
          ? 'Enter an amount'
          : belowMin
            ? `Minimum is ${minLabel}`
            : null

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
    if (bonusSlip.offered && bonusSlip.useBonus && bonusSlip.pendingKyc) {
      setBetErrorCode(BONUS_KYC_CODE)
      setBetError('Verify your identity to start using your bonus')
      return
    }
    if (usingBonus) {
      if (selectedBonusReason) {
        setBetError(selectedBonusReason)
        return
      }
      if (stakeNum > bonusSlip.balance) {
        setBetError('Not enough bonus credit for this stake')
        return
      }
      if (bonusSlip.minStake != null && stakeNum < bonusSlip.minStake) {
        setMinStake(Math.min(bonusSlip.minStake, bonusSlip.balance))
        setBetError(
          `The minimum bonus bet is ${formatCurrency(bonusSlip.minStake)}`,
        )
        return
      }
      if (bonusSlip.maxStake != null && stakeNum > bonusSlip.maxStake) {
        setBetError(
          `The maximum bonus bet is ${formatCurrency(bonusSlip.maxStake)}`,
        )
        return
      }
    } else if (isSignedIn && stakeNum > cash) {
      showWarningToast('Amount exceeds your available balance')
      return
    }
    if (marketMinNaira != null && stakeNum < marketMinNaira) {
      setMinStake(marketMinNaira)
      setBetError(
        `Minimum bet is ${formatCurrency(marketMinNaira)} for this market.`,
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
      // Always explicit: left out, the server falls back to the player's bonus
      // default, while this form checked the stake against the balance it's
      // actually spending (cash unless "Use bonus" is on).
      useBonus: usingBonus,
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
      const fundedBy = bet.fundedBy ?? (usingBonus ? 'BONUS' : 'CASH')
      onPlaced({
        bet,
        outcomeLabel: outcome.label,
        stake: stakeNum,
        price,
        payout: fundedBy === 'BONUS' ? bonusSlip.creditOnWin : payout,
        fee,
        fundedBy,
        ...(fundedBy === 'BONUS'
          ? { bonusCreditsTo: bonusSlip.creditsTo }
          : {}),
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
        setBetErrorCode(data?.code ?? null)
        setBetError(message)
      } else {
        setBetError(fallback)
      }
    }
  }

  // Team outcomes read as codes on the buttons ("Manchester City" → "MAN"),
  // like the match cards; full name stays in the tooltip.
  const slipTeams =
    market.teams && market.teams.length >= 2 ? market.teams : null
  const outcomeShort = shortOutcomeLabel(
    slipTeams
      ? slipTeams.map((t) => t.name)
      : teamsFromTitle(market.eventTitle ?? ''),
    slipTeams ? slipTeams.map((t) => t.shortName) : [],
  )

  return (
    <>
      {/* Outcome selector */}
      <div className='flex items-stretch gap-2'>
        {market.outcomes.map((o, i) => {
          const active = o.id === outcome?.id
          const tone = outcomeTone(market, o.id, i)
          // Greyed while betting bonus: still selectable, so the player can
          // see why, or switch the bonus off and bet cash.
          const noBonus = bonusSlip.ineligibleReason(o.id)
          return (
            <button
              key={o.id}
              type='button'
              onClick={() => {
                clearBetError()
                onSelectOutcome(o)
              }}
              title={noBonus ?? o.label}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg border py-2 text-sm font-bold transition-colors ${
                active
                  ? TONE_STYLES[tone].active
                  : 'border-border text-neutral-10 hover:text-black'
              } ${noBonus ? 'opacity-45' : ''}`}
            >
              <span className='flex w-full min-w-0 items-center justify-center gap-1.5'>
                <TeamLogo team={findTeam(market.teams, o.label)} size={16} />
                <span className='min-w-0 truncate text-center uppercase'>
                  {outcomeShort(o.label)}
                </span>
              </span>
              <span>{priceLabel(market, o)}</span>
              {noBonus && (
                <span className='text-[10px] font-semibold normal-case text-neutral-10'>
                  No bonus
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isSignedIn && <BonusSlipToggle slip={bonusSlip} />}

      {usingBonus && selectedBonusReason && !betError && (
        <p className='-mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-black'>
          {selectedBonusReason}
        </p>
      )}

      {/* Amount */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-2 text-xs'>
          <span className='text-neutral-10'>
            Amount
            {minRequired > 0 && (
              <span className='font-semibold text-black'>
                {' '}
                · Min {minLabel}
              </span>
            )}
          </span>
          {isSignedIn && (
            <span
              className={usingBonus ? 'font-semibold text-success' : 'text-neutral-10'}
            >
              {usingBonus ? 'Bonus' : 'Available'}: {formatCurrency(spendable)}
            </span>
          )}
        </div>
        <div
          className={`flex items-center rounded-lg border-2 px-3 py-2.5 ${
            amountInvalid ? 'border-error' : 'border-black'
          }`}
        >
          <span className='text-sm font-bold text-neutral-10'>{symbol}</span>
          <input
            type='text'
            inputMode='decimal'
            value={amount}
            onChange={(e) => {
              clearBetError()
              setAmount(sanitizeAmount(e.target.value))
            }}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            placeholder={
              minRequired > 0
                ? `Min ${minLabel.slice(symbol.length)}`
                : '0.00'
            }
            aria-invalid={amountInvalid}
            className='w-full bg-transparent px-1 text-sm font-bold text-black outline-none'
          />
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {minRequired > 0 && canAffordMin && (
            <button
              type='button'
              onClick={() => {
                clearBetError()
                setAmount(String(minRequired))
              }}
              className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
            >
              Min
            </button>
          )}
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
          {isSignedIn && spendable > 0 && spendable >= minRequired && (
            <button
              type='button'
              onClick={() => {
                clearBetError()
                setAmount(String(Math.floor(spendable * 100) / 100))
              }}
              className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
            >
              MAX
            </button>
          )}
        </div>

        {amountNotice && !betError && (
          <p
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              amountInvalid ? 'bg-error-bg text-error' : 'bg-warning/10 text-black'
            }`}
          >
            {amountNotice}
          </p>
        )}

        {usingBonus && bonusSlip.quoteRefusal && !betError && !amountNotice && (
          <p className='text-xs font-medium text-warning'>
            {bonusSlip.quoteRefusal}
          </p>
        )}

        {betError && (
          <div className='flex flex-col gap-2 rounded-lg bg-error-bg px-3 py-2.5'>
            <p className='text-xs font-medium text-error'>{betError}</p>
            {betErrorCode === BONUS_KYC_CODE && (
              <button
                type='button'
                onClick={() => navigate(KYC_PATH)}
                className='self-start rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error hover:bg-error/25'
              >
                Verify identity
              </button>
            )}
            {minStake != null &&
              (!fundsKnown || minStake <= spendable ? (
                <button
                  type='button'
                  onClick={() => {
                    setAmount(String(minStake))
                    clearBetError()
                  }}
                  className='self-start rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error hover:bg-error/25'
                >
                  Use minimum · {formatCurrency(minStake)}
                </button>
              ) : !usingBonus ? (
                // Filling in a minimum they can't cover would only dead-end.
                <button
                  type='button'
                  onClick={() => navigate('/account-wallet')}
                  className='self-start rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error hover:bg-error/25'
                >
                  Add funds
                </button>
              ) : null)}
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
        {fee > 0 && amountValid && (
          <div className='flex justify-between'>
            <span className='text-neutral-10'>Fee</span>
            <span className='font-semibold text-black'>
              {formatCurrency(fee)}
            </span>
          </div>
        )}
        {usingBonus ? (
          // A bonus win credits the bonus balance (or, for the deposit bonus,
          // only the profit as locked winnings) — not cash.
          <div className='flex justify-between gap-3'>
            <span className='text-neutral-10'>
              {bonusSlip.creditsTo === 'LOCKED_WINNINGS'
                ? 'Win (locked winnings)'
                : 'Win (to bonus balance)'}
            </span>
            <span
              className={`font-semibold ${amountValid ? 'text-success' : 'text-black'} ${bonusSlip.quoteLoading ? 'opacity-60' : ''}`}
            >
              {amountValid ? formatCurrency(bonusSlip.creditOnWin) : '—'}
            </span>
          </div>
        ) : (
          <>
            <div className='flex justify-between'>
              <span className='text-neutral-10'>
                {estimated ? 'Est. payout' : 'Payout'} if{' '}
                {outcome?.label ?? 'it'} wins
              </span>
              <span className='font-semibold text-black'>
                {amountValid ? formatCurrency(Math.max(payout, 0)) : '—'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-neutral-10'>Profit</span>
              {amountValid ? (
                <span
                  className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {profit >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(profit))}
                </span>
              ) : (
                <span className='font-semibold text-black'>—</span>
              )}
            </div>
          </>
        )}
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
              : goToFunds
                ? 'Add funds'
                : (blockedLabel ??
                  (movedFrom != null
                    ? 'Accept new price'
                    : usingBonus
                      ? `${submitText} with bonus`
                      : submitText))
        }
        variation='primary'
        size='large'
        // shrink-0: in the mobile slip's scrolling flex column, overflow
        // would otherwise squash the button's height.
        className='w-full shrink-0'
        loading={isPending}
        disabled={
          !isOpen ||
          (isSignedIn && suspended) ||
          (!goToFunds && blockedLabel != null)
        }
        onClick={goToFunds ? () => navigate('/account-wallet') : handleSubmit}
      />
      {isSignedIn && suspended && (
        <SuspendedHint className='-mt-2 text-center' />
      )}
    </>
  )
}

export default OrderForm
