import { useMemo, useState } from 'react'

import type { MarketOutcome } from './MarketOutcomesList'
import { Button } from '../globals/Button'
import { FormSwitch } from '../globals/FormSwitch'

interface TradePanelProps {
  marketTitle: string
  activeOutcome: MarketOutcome
  outcomes: MarketOutcome[]
  onOutcomeChange: (outcome: MarketOutcome) => void
  cashBalance: number
  isSubmitting?: boolean
  onSubmit: (payload: {
    action: 'buy' | 'sell'
    type: 'limit' | 'market'
    outcomeId: string
    size: number
    price: number
  }) => Promise<void> | void
}

const quickAmounts = [500, 2_500, 5_000, 10_000]

const TradePanel = ({
  marketTitle,
  activeOutcome,
  outcomes,
  onOutcomeChange,
  cashBalance,
  isSubmitting = false,
  onSubmit,
}: TradePanelProps) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('market')
  const [amount, setAmount] = useState(0)
  const [limitPrice, setLimitPrice] = useState(activeOutcome.price)
  const [fillPolicy, setFillPolicy] = useState(false)

  const odds = activeOutcome.priceCents
  const orderPrice = orderType === 'limit' ? limitPrice : activeOutcome.price

  const toWin = useMemo(() => {
    if (!amount || !orderPrice) return 0
    return (amount / orderPrice) - amount
  }, [amount, orderPrice])

  return (
    <aside className='flex h-fit flex-col gap-4 rounded-lg bg-card p-4 lg:sticky lg:top-20'>
      <div>
        <p className='text-xs text-placeholder'>{marketTitle}</p>
        <p className='text-base font-bold text-black'>{activeOutcome.label}</p>
      </div>

      <div className='flex items-center gap-2'>
        <div className='flex flex-1 rounded-lg bg-border/30 p-1'>
          {(['buy', 'sell'] as const).map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={() => setSide(tab)}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold capitalize transition-colors ${
                side === tab ? 'bg-card text-black shadow-sm' : 'text-neutral-10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <select
          aria-label='Order type'
          value={orderType}
          onChange={(event) => setOrderType(event.target.value as 'limit' | 'market')}
          className='shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-black outline-none'
        >
          <option value='market'>Market</option>
          <option value='limit'>Limit</option>
        </select>
      </div>

      <div className={`grid gap-2 ${outcomes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {outcomes.map((outcome) => {
          const isActive = outcome.id === activeOutcome.id
          const tone =
            outcome.tone === 'success'
              ? isActive
                ? 'bg-success text-black'
                : 'bg-market-success text-success'
              : outcome.tone === 'error'
                ? isActive
                  ? 'bg-error text-white'
                  : 'bg-market-error text-error'
                : isActive
                  ? 'bg-border text-black'
                  : 'bg-border/30 text-neutral-10'

          return (
            <button
              key={outcome.id}
              type='button'
              onClick={() => {
                onOutcomeChange(outcome)
                setLimitPrice(outcome.price)
              }}
              className={`flex gap-2.5 justify-center items-center cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${tone}`}
            >
              <span>{outcome.code}</span>
              <span>₦{outcome.price.toLocaleString('en-NG', { maximumFractionDigits: 4 })}</span>
            </button>
          )
        })}
      </div>

      <div>
        <div className='mb-1.5 flex items-center justify-between text-sm'>
          <span className='text-neutral-10'>Amount</span>
          <span className='text-placeholder'>Cash: ₦{cashBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className='flex items-baseline gap-1 border-b border-border pb-2'>
          <span className='text-2xl font-bold text-neutral-10'>₦</span>
          <input
            type='number'
            min={0}
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder='0.00'
            className='w-full bg-transparent text-3xl font-bold text-black outline-none placeholder:text-neutral-10'
          />
        </div>
        <div className='mt-2.5 flex items-center gap-2'>
          {quickAmounts.map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setAmount((prev) => prev + value)}
              className='rounded-full bg-border cursor-pointer px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
            >
              +₦{value.toLocaleString('en-NG')}
            </button>
          ))}
          <button
            type='button'
            onClick={() => setAmount(cashBalance)}
            className='ml-auto text-xs font-bold text-black underline'
          >
            MAX
          </button>
        </div>
      </div>

      {orderType === 'limit' && (
        <label className='flex flex-col gap-1.5 text-sm text-neutral-10'>
          Limit price (₦)
          <input
            type='number'
            min={0}
            step='any'
            value={limitPrice}
            onChange={(event) => setLimitPrice(Number(event.target.value))}
            className='rounded-lg border border-border bg-transparent px-3 py-2 text-base font-semibold text-black outline-none'
          />
        </label>
      )}

      <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-10'>Fill policy</span>
        <FormSwitch
          checked={fillPolicy}
          onChange={(checked) => setFillPolicy(Boolean(checked))}
        />
      </div>

      <div className='flex flex-col gap-2 text-sm'>
        <div className='flex items-center justify-between'>
          <span className='text-neutral-10'>Average price:</span>
          <span className='font-semibold text-black'>₦{orderPrice.toLocaleString('en-NG', { maximumFractionDigits: 4 })}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-neutral-10'>Odds:</span>
          <span className='font-semibold text-black'>{odds}%</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-neutral-10'>To win:</span>
          <span className='font-bold text-black'>₦{toWin.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <Button
        type='button'
        size='large'
        text={amount > 0 ? `${side === 'buy' ? 'Buy' : 'Sell'} ${activeOutcome.code}` : 'Enter amount'}
        disabled={amount <= 0 || orderPrice <= 0 || isSubmitting}
        onClick={() => {
          const price = orderPrice
          if (!price) return
          void onSubmit({
            action: side,
            type: orderType,
            outcomeId: activeOutcome.id,
            size: amount / price,
            price,
          })
        }}
        className='w-full!'
      />
    </aside>
  )
}

export default TradePanel
