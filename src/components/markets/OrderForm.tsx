import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { isAxiosError } from 'axios'
import { Button } from '../globals/Button'
import { useSantiBetQuery } from '../../data_layer/utils'
import { usePlaceBet } from '../../data_layer/bets'
import { showWarningToast } from '../../utils/toastUtils'
import {
  NAIRA,
  formatSharePrice,
  toMajorUnits,
  toMinorUnits,
} from '../../utils/functions'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import type { WalletBalance } from '../../types/wallet.types'
import type { Bet, BetType } from '../../types/bet.types'
import {
  isMarketOpen,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import SuspendedHint from '../globals/SuspendedHint'
import useAuthNavigate from '../../hooks/useAuthNavigate'
import useMarketOpen from '../../hooks/useMarketOpen'
import useBonusSlip from '../../hooks/useBonusSlip'
import BonusSlipToggle from '../bonus/BonusSlipToggle'
import { BONUS_KYC_CODE } from '../../utils/bonus'
import { KYC_PATH } from '../../utils/authRedirect'
import type { FundedBy } from '../../types/bonus.types'

const QUICK_ADDS = [100, 200, 500, 1000]

/** What the player saw when they submitted, for the success screen. */
export interface PlacedOrder {
  bet: Bet
  outcomeLabel: string
  type: BetType
  /** Naira. */
  stake: number
  /** 0–1. */
  price: number
  /** Naira. For a bonus bet, what a win credits (bonus balance or locked winnings). */
  toWin: number
  /** Cash or bonus credit. */
  fundedBy: FundedBy
  /** Bonus bets only: where a win is credited. */
  bonusCreditsTo?: 'BONUS_BALANCE' | 'LOCKED_WINNINGS'
}

interface OrderFormProps {
  market: UiMarket
  outcome?: UiOutcome
  onSelectOutcome: (outcome: UiOutcome) => void
  /** Offer limit orders. Off on the prediction screen, on when trading. */
  allowLimit?: boolean
  submitText?: string
  onPlaced: (order: PlacedOrder) => void
}

/** Stake on an outcome: outcome picker, amount, summary and submit. */
const OrderForm = ({
  market,
  outcome,
  onSelectOutcome,
  allowLimit = false,
  submitText = 'Place prediction',
  onPlaced,
}: OrderFormProps) => {
  const authNavigate = useAuthNavigate()
  const navigate = useNavigate()
  const location = useLocation()
  const [cookies] = useCookies(['token'])
  const isSignedIn = !!cookies?.token
  const suspended = useAccountSuspended()

  const [chosenType, setType] = useState<BetType>('market')
  const type = allowLimit ? chosenType : 'market'
  const [amount, setAmount] = useState('')
  const [limitCents, setLimitCents] = useState('')
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
  const cash = toMajorUnits(wallet?.total ?? 0)
  // Every market now carries its minimum stake (kobo). Shown as a hint and
  // pre-checked before submit so the user gets instant feedback; the server
  // STAKE_BELOW_MINIMUM / HEDGE_BELOW_VENUE_MINIMUM checks remain the backstop.
  const marketMinNaira =
    market.minStakeMinor != null ? toMajorUnits(market.minStakeMinor) : null

  const isOpen = useMarketOpen(market)

  const price = useMemo(() => {
    if (type === 'limit') {
      const c = Number(limitCents)
      return c > 0 && c < 100 ? c / 100 : (outcome?.price ?? 0)
    }
    return outcome?.price ?? 0
  }, [type, limitCents, outcome])

  const stakeNum = Number(amount) || 0
  const shares = price > 0 ? stakeNum / price : 0
  const potentialReturn = shares // each share settles at 1 unit if it wins
  const toWin = Math.max(potentialReturn, 0)

  // Bonus credit: while "Use bonus" is on, the stake comes out of the bonus
  // balance and bonus rules (price band, live, min/max stake…) apply.
  const bonusSlip = useBonusSlip({
    market,
    outcome,
    type,
    stake: stakeNum,
    price,
    isSignedIn,
  })
  const usingBonus = bonusSlip.active
  const spendable = usingBonus ? bonusSlip.balance : cash
  const selectedBonusReason = bonusSlip.ineligibleReason(outcome?.id)

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
          `The minimum bonus bet is ${symbol}${bonusSlip.minStake.toLocaleString()}`,
        )
        return
      }
      if (bonusSlip.maxStake != null && stakeNum > bonusSlip.maxStake) {
        setBetError(
          `The maximum bonus bet is ${symbol}${bonusSlip.maxStake.toLocaleString()}`,
        )
        return
      }
    } else if (isSignedIn && stakeNum > cash) {
      showWarningToast('Amount exceeds your total balance')
      return
    }
    if (marketMinNaira != null && stakeNum < marketMinNaira) {
      setMinStake(marketMinNaira)
      setBetError(
        `Minimum bet is ${symbol}${marketMinNaira.toLocaleString()} for this market.`,
      )
      return
    }
    if (type === 'limit') {
      const c = Number(limitCents)
      if (!(c > 0 && c < 100)) {
        showWarningToast('Enter a limit price between ₦1 and ₦99')
        return
      }
    }

    try {
      const bet = await placeBet({
        marketId: market.id,
        outcomeId: outcome.id,
        stake: String(toMinorUnits(stakeNum)),
        type,
        ...(type === 'limit' ? { limitPrice: Number(limitCents) / 100 } : {}),
        // Say it explicitly whenever a bonus is live: the new-member bonus
        // otherwise defaults to bonus on the server.
        ...(bonusSlip.offered ? { useBonus: usingBonus } : {}),
      })
      const fundedBy = bet.fundedBy ?? (usingBonus ? 'BONUS' : 'CASH')
      onPlaced({
        bet,
        outcomeLabel: outcome.label,
        type,
        stake: stakeNum,
        price,
        toWin: fundedBy === 'BONUS' ? bonusSlip.creditOnWin : toWin,
        fundedBy,
        ...(fundedBy === 'BONUS'
          ? { bonusCreditsTo: bonusSlip.creditsTo }
          : {}),
      })
      setAmount('')
      setLimitCents('')
    } catch (error) {
      const fallback = 'Could not place your prediction'
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              message?: string
              code?: string
              details?: {
                minimumStakeNgn?: number
                minimumStakeMinor?: number
              }
            }
          | undefined
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

  return (
    <>
      {/* Order type */}
      {allowLimit && (
        <div className='flex items-center gap-1 rounded-full bg-hover p-1'>
          {(['market', 'limit'] as const).map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => setType(t)}
              className={`flex-1 rounded-full py-1 text-xs font-semibold capitalize transition-colors ${
                type === t
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-10 hover:text-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

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
              title={noBonus ?? undefined}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg border py-2 text-sm font-bold transition-colors ${
                active
                  ? TONE_STYLES[tone].active
                  : 'border-border text-neutral-10 hover:text-black'
              } ${noBonus ? 'opacity-45' : ''}`}
            >
              <span className='w-full min-w-0 truncate text-center uppercase'>
                {o.label}
              </span>
              <span>{formatSharePrice(o.cents)}</span>
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

      {/* Limit price */}
      {type === 'limit' && (
        <label className='flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm'>
          <span className='text-neutral-10'>Limit price (₦)</span>
          <input
            type='text'
            inputMode='numeric'
            value={limitCents}
            onChange={(e) =>
              setLimitCents(e.target.value.replace(/[^\d]/g, '').slice(0, 2))
            }
            placeholder={String(outcome?.cents ?? '')}
            className='w-16 bg-transparent text-right font-bold text-black outline-none'
          />
        </label>
      )}

      {/* Amount */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-neutral-10'>Amount</span>
          {isSignedIn && (
            <span className={usingBonus ? 'font-semibold text-success' : 'text-neutral-10'}>
              {usingBonus ? 'Bonus' : 'Cash'}: {symbol}
              {spendable.toLocaleString()}
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
              setAmount(e.target.value.replace(/[^\d.]/g, ''))
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
          {isSignedIn && spendable > 0 && (
            <button
              type='button'
              onClick={() => {
                clearBetError()
                setAmount(String(spendable))
              }}
              className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
            >
              MAX
            </button>
          )}
        </div>

        {!betError &&
          (usingBonus && bonusSlip.minStake != null ? (
            <p className='text-xs text-neutral-10'>
              Minimum bonus bet {symbol}
              {Math.max(bonusSlip.minStake, marketMinNaira ?? 0).toLocaleString()}
            </p>
          ) : marketMinNaira != null ? (
            <p className='text-xs text-neutral-10'>
              Minimum bet {symbol}
              {marketMinNaira.toLocaleString()}
            </p>
          ) : null)}

        {usingBonus && bonusSlip.quoteRefusal && !betError && (
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

      {/* Summary */}
      <div className='flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm'>
        <div className='flex justify-between'>
          <span className='text-neutral-10'>Average price</span>
          <span className='font-semibold text-black'>
            {formatSharePrice(price)}
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-neutral-10'>Odds</span>
          <span className='font-semibold text-black'>
            {Math.round(price * 100)}%
          </span>
        </div>
        {usingBonus ? (
          <div className='flex justify-between gap-3'>
            <span className='text-neutral-10'>
              {bonusSlip.creditsTo === 'LOCKED_WINNINGS'
                ? 'Win (locked winnings)'
                : 'Win (to bonus balance)'}
            </span>
            <span
              className={`font-semibold text-success ${bonusSlip.quoteLoading ? 'opacity-60' : ''}`}
            >
              {symbol}
              {bonusSlip.creditOnWin.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        ) : (
          <div className='flex justify-between'>
            <span className='text-neutral-10'>To win</span>
            <span className='font-semibold text-success'>
              {symbol}
              {toWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>

      <Button
        type='button'
        text={
          !isOpen
            ? 'Market closed'
            : !isSignedIn
              ? 'Sign in to predict'
              : usingBonus
                ? `${submitText} with bonus`
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
