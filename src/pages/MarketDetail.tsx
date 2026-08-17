import { useState } from 'react'
import { useParams } from 'react-router'
import { Bookmark02Icon, Share08Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { isAxiosError } from 'axios'
import TradePanel from '../components/markets/TradePanel'
import MarketOutcomesList, {
  type MarketOutcome,
} from '../components/markets/MarketOutcomesList'
import { useSantiBetMutation, useSantiBetQuery } from '../data_layer/utils'
import type { RawMarket } from '../types/market.types'
import { formatDate } from '../utils/functions'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'

type DisplayOutcome = MarketOutcome

interface PlaceOrderRequest {
  marketId: string
  outcomeId: string
  action: 'buy' | 'sell'
  type: 'limit' | 'market'
  size: number
  price: number
  timeInForce: 'gtc'
  expiresAt: number
  clientOrderId: string
}

const outcomeTones: MarketOutcome['tone'][] = ['success', 'error', 'neutral']

const formatVolume = (volume: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(volume)

const createClientOrderId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [selectedOutcome, setSelectedOutcome] = useState<DisplayOutcome | null>(
    null,
  )

  const { data: market, isLoading } = useSantiBetQuery<RawMarket>({
    path: `/market/markets/${id}`,
    enabled: Boolean(id),
  })

  const { data: userProfile } = useSantiBetQuery<RawMarket>({
    path: `/market/portfolio/positions`,
  })

  const { mutateAsync: placeOrder, isPending: isPlacingOrder } =
    useSantiBetMutation<unknown, PlaceOrderRequest>({
      path: '/market/orders',
      mutationOptions: {
        onSuccess: () => showSuccessToast('Order placed successfully'),
        onError: (error) => {
          const message = isAxiosError(error)
            ? error.response?.data?.message
            : error.message
          showWarningToast(message || 'Unable to place order')
        },
      },
    })

  if (isLoading || !market) {
    return (
      <main className='mx-auto grid w-full grid-cols-1 gap-4 px-3 pt-4 pb-20 md:px-8 lg:grid-cols-[1fr_360px]'>
        <div className='h-96 animate-pulse rounded-lg bg-card' />
        <div className='h-96 animate-pulse rounded-lg bg-card' />
      </main>
    )
  }

  const outcomes: DisplayOutcome[] = market.outcomes.map((outcome, index) => ({
    id: outcome.id,
    code: outcome.label.toUpperCase(),
    label: outcome.label,
    price: outcome.price,
    priceCents: Math.round(outcome.price * 100),
    tone: outcomeTones[index % outcomeTones.length],
  }))
  const activeOutcome = selectedOutcome ?? outcomes[0]
  const leadingOutcome = [...outcomes].sort((a, b) => b.price - a.price)[0]

  const submitOrder = async (payload: {
    action: 'buy' | 'sell'
    type: 'limit' | 'market'
    outcomeId: string
    size: number
    price: number
  }) => {
    await placeOrder({
      marketId: market.id,
      outcomeId: payload.outcomeId,
      action: payload.action,
      type: payload.type,
      size: payload.size,
      price: payload.price,
      timeInForce: 'gtc',
      expiresAt: Number.MAX_SAFE_INTEGER,
      clientOrderId: createClientOrderId(),
    })
  }

  return (
    <main className='mx-auto flex max-w-2xl w-full  flex-col gap-4  py-20 md:px-8'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-black md:text-3xl'>
            {market.title}
          </h1>
          {market.subtitle && (
            <p className='mt-1 text-sm text-neutral-10'>{market.subtitle}</p>
          )}
          <p className='mt-2 text-sm text-neutral-10'>
            Closes · {formatDate(market.closeTime)}
          </p>
        </div>
        <div className='flex items-center gap-3 text-neutral-10'>
          <button
            type='button'
            aria-label='Share market'
            className='hover:text-black'
          >
            <HugeiconsIcon icon={Share08Icon} size={20} />
          </button>
          <button
            type='button'
            aria-label='Save market'
            className='hover:text-black'
          >
            <HugeiconsIcon icon={Bookmark02Icon} size={20} />
          </button>
        </div>
      </div>

      <div className='flex flex-col gap-5'>
        <section className='flex flex-col gap-4'>
          <div className='flex items-center justify-between text-sm text-neutral-10'>
            <span>
              Volume:{' '}
              <span className='font-semibold text-black'>
                ₦{formatVolume(market.volume)}
              </span>
            </span>
            <span>
              Liquidity:{' '}
              <span className='font-semibold text-black'>
                ₦{formatVolume(market.liquidity)}
              </span>
            </span>
          </div>

          <MarketOutcomesList
            title={market.title}
            status={market.status === 'open' ? 'Open' : 'Closed'}
            volumeLabel={`₦${formatVolume(market.volume)} volume`}
            leadingPercent={leadingOutcome.priceCents}
            outcomes={outcomes}
            selectedOutcomeId={activeOutcome.id}
            onSelectOutcome={setSelectedOutcome}
          />
        </section>

        <TradePanel
          marketTitle={market.title}
          activeOutcome={activeOutcome}
          outcomes={outcomes}
          cashBalance={0}
          isSubmitting={isPlacingOrder}
          onOutcomeChange={setSelectedOutcome}
          onSubmit={submitOrder}
        />
      </div>
    </main>
  )
}

export default MarketDetail
