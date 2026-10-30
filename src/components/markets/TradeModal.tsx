import { useState } from 'react'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import OrderForm from './OrderForm'
import SellPanel from './SellPanel'
import TradingNotice from './TradingNotice'
import { showSuccessToast } from '../../utils/toastUtils'
import { formatCurrency } from '../../utils/functions'
import type { UiMarket, UiOutcome } from '../../types/market.types'

export type TradeSide = 'buy' | 'sell'

interface TradeModalProps {
  open: boolean
  onClose: () => void
  market: UiMarket
  initialOutcome?: UiOutcome
  initialSide?: TradeSide
}

/**
 * The buy/sell screen. Kept off the prediction panel so first-time players
 * only see "place a prediction"; reached from the success screen or from an
 * open position on the market.
 */
const TradeModal = ({
  open,
  onClose,
  market,
  initialOutcome,
  initialSide = 'sell',
}: TradeModalProps) => {
  const [side, setSide] = useState<TradeSide>(initialSide)
  const [outcomeId, setOutcomeId] = useState(initialOutcome?.id)
  const outcome =
    market.outcomes.find((o) => o.id === outcomeId) ??
    market.yes ??
    market.outcomes[0]

  return (
    <ModalComponent
      open={open}
      handleClose={onClose}
      title={
        <div className='flex flex-col gap-0.5'>
          <span>Trade</span>
          <span className='text-xs font-normal text-neutral-10'>
            {market.title}
          </span>
        </div>
      }
      className='max-w-md'
    >
      <div className='flex flex-col gap-4 py-2'>
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
          <SellPanel market={market} />
        ) : (
          <OrderForm
            market={market}
            outcome={outcome}
            onSelectOutcome={(o) => setOutcomeId(o.id)}
            submitText='Buy'
            onPlaced={(order) =>
              showSuccessToast(
                `Bought ${order.outcomeLabel} · pays ${formatCurrency(order.payout)} if it wins`,
              )
            }
          />
        )}

        <TradingNotice />

        <Button
          type='button'
          text='Close'
          variation='plain'
          size='large'
          className='w-full'
          onClick={onClose}
        />
      </div>
    </ModalComponent>
  )
}

export default TradeModal
