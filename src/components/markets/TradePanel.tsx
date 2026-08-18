import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { isAxiosError } from 'axios'
import { Button } from '../globals/Button'
import { useSantiBetQuery } from '../../data_layer/utils'
import { usePlaceBet } from '../../data_layer/bets'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { currencySymbols } from '../../utils/constants'
import type { UiMarket, UiOutcome } from '../../types/market.types'
import type { WalletBalance } from '../../types/wallet.types'
import type { BetType } from '../../types/bet.types'

const QUICK_ADDS = [1000, 5000, 10000, 50000]

interface TradePanelProps {
  market: UiMarket
  selectedOutcome?: UiOutcome
  onSelectOutcome: (outcome: UiOutcome) => void
}

const TradePanel = ({
  market,
  selectedOutcome,
  onSelectOutcome,
}: TradePanelProps) => {
  const navigate = useNavigate()
  const [cookies] = useCookies(['token'])
  const isSignedIn = !!cookies?.token

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<BetType>('market')
  const [amount, setAmount] = useState('')
  const [limitCents, setLimitCents] = useState('')

  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    queryKey: ['/wallet', {}],
    enabled: isSignedIn,
  })

  const { mutateAsync: placeBet, isPending } = usePlaceBet()

  const currency = wallet?.currency ?? 'NGN'
  const symbol = currencySymbols[currency] ?? '₦'
  const cash = Number(wallet?.trading ?? 0)

  const outcome = selectedOutcome ?? market.yes ?? market.outcomes[0]
  const isOpen = market.status === 'open'

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
  const toWin = Math.max(potentialReturn - stakeNum, 0)

  const addAmount = (delta: number) =>
    setAmount(String((Number(amount) || 0) + delta))

  const handleSubmit = async () => {
    if (!isSignedIn) {
      navigate('/signin')
      return
    }
    if (!outcome) return
    if (stakeNum <= 0) {
      showWarningToast('Enter an amount to predict')
      return
    }
    if (isSignedIn && stakeNum > cash) {
      showWarningToast('Amount exceeds your trading balance')
      return
    }
    if (type === 'limit') {
      const c = Number(limitCents)
      if (!(c > 0 && c < 100)) {
        showWarningToast('Enter a limit price between 1¢ and 99¢')
        return
      }
    }

    try {
      const bet = await placeBet({
        marketId: market.id,
        outcomeId: outcome.id,
        stake: String(stakeNum),
        type,
        ...(type === 'limit' ? { limitPrice: Number(limitCents) / 100 } : {}),
      })
      showSuccessToast(
        `Prediction placed · ${symbol}${bet.potentialReturn?.amount ?? potentialReturn.toFixed(0)} to win`,
      )
      setAmount('')
    } catch (error) {
      if (isAxiosError(error)) {
        showWarningToast(
          error.response?.data?.message ?? 'Could not place your prediction',
        )
      } else {
        showWarningToast('Could not place your prediction')
      }
    }
  }

  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-border bg-card p-4'>
      <div>
        <p className='text-xs text-neutral-10'>{market.title}</p>
        <p className='text-sm font-semibold text-black'>
          {outcome?.label ?? '—'}
        </p>
      </div>

      {/* Buy / Sell */}
      <div className='flex items-center gap-1 rounded-full bg-hover p-1'>
        {(['buy', 'sell'] as const).map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => setSide(s)}
            className={`flex-1 rounded-full py-1.5 text-sm font-semibold capitalize transition-colors ${
              side === s
                ? 'bg-brand-green text-black dark:text-text-black!'
                : 'text-neutral-10 hover:text-black'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {side === 'sell' ? (
        <p className='rounded-lg bg-hover/40 p-3 text-xs text-neutral-10'>
          To sell out of a prediction, cash out the position from your{' '}
          <button
            type='button'
            className='font-semibold text-black underline'
            onClick={() => navigate('/account-portfolio')}
          >
            Portfolio
          </button>
          .
        </p>
      ) : (
        <>
          {/* Order type */}
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

          {/* Outcome selector */}
          <div className='grid grid-cols-2 gap-2'>
            {market.outcomes.map((o) => {
              const active = o.id === outcome?.id
              return (
                <button
                  key={o.id}
                  type='button'
                  onClick={() => onSelectOutcome(o)}
                  className={`flex flex-col items-center rounded-lg border py-2 text-sm font-bold transition-colors ${
                    active
                      ? 'border-brand-green bg-brand-green/10 text-black'
                      : 'border-border text-neutral-10 hover:text-black'
                  }`}
                >
                  <span className='uppercase'>{o.label}</span>
                  <span>{o.cents}¢</span>
                </button>
              )
            })}
          </div>

          {/* Limit price */}
          {type === 'limit' && (
            <label className='flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm'>
              <span className='text-neutral-10'>Limit price (¢)</span>
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
                <span className='text-neutral-10'>
                  Cash: {symbol}
                  {cash.toLocaleString()}
                </span>
              )}
            </div>
            <div className='flex items-center rounded-lg border border-border px-3 py-2.5'>
              <span className='text-sm font-bold text-neutral-10'>{symbol}</span>
              <input
                type='text'
                inputMode='decimal'
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d.]/g, ''))
                }
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
                  onClick={() => setAmount(String(cash))}
                  className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className='flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-neutral-10'>Average price</span>
              <span className='font-semibold text-black'>
                {Math.round(price * 100)}¢
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-neutral-10'>Odds</span>
              <span className='font-semibold text-black'>
                {Math.round(price * 100)}%
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-neutral-10'>To win</span>
              <span className='font-semibold text-success'>
                {symbol}
                {toWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <Button
            type='button'
            text={
              !isSignedIn
                ? 'Sign in to predict'
                : !isOpen
                  ? 'Market closed'
                  : 'Place prediction'
            }
            variation='primary'
            size='large'
            className='w-full'
            loading={isPending}
            disabled={isSignedIn && !isOpen}
            onClick={handleSubmit}
          />
        </>
      )}
    </div>
  )
}

export default TradePanel