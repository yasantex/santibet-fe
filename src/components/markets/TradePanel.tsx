import { useState } from 'react'
import OrderForm, { type PlacedOrder } from './OrderForm'
import PredictionSuccessModal from './PredictionSuccessModal'
import TradeModal, { type TradeSide } from './TradeModal'
import { MarketPositionRow } from './SellPanel'
import { useMarketPositions } from '../../data_layer/bets'
import type { UiMarket, UiOutcome } from '../../types/market.types'

interface TradePanelProps {
  market: UiMarket
  selectedOutcome?: UiOutcome
  onSelectOutcome: (outcome: UiOutcome) => void
}

/**
 * The prediction panel on a market. Positions already held here sit at the
 * top with their live value and a cash-out; the buy/sell screen (TradeModal)
 * is offered after a prediction is placed.
 */
const TradePanel = ({
  market,
  selectedOutcome,
  onSelectOutcome,
}: TradePanelProps) => {
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)
  const [trade, setTrade] = useState<{
    side: TradeSide
    outcome?: UiOutcome
  } | null>(null)
  const { positions } = useMarketPositions(market.id)

  const outcome = selectedOutcome ?? market.yes ?? market.outcomes[0]

  const openTradeFromSuccess = () => {
    const tradedOutcome = market.outcomes.find(
      (o) => o.id === placed?.bet.outcomeId,
    )
    setPlaced(null)
    setTrade({ side: 'sell', outcome: tradedOutcome })
  }

  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-border bg-card p-4'>
      <div>
        <p className='text-xs text-neutral-10'>{market.title}</p>
        <p className='text-sm font-semibold text-black'>
          {outcome?.label ?? '—'}
        </p>
      </div>

      {positions.length > 0 && (
        <section className='flex flex-col gap-2'>
          <span className='text-xs font-semibold text-neutral-10 uppercase'>
            Your {positions.length === 1 ? 'position' : 'positions'}
          </span>
          {positions.map((position) => (
            <MarketPositionRow
              key={position.id}
              position={position}
              market={market}
            />
          ))}
        </section>
      )}

      <OrderForm
        market={market}
        outcome={outcome}
        onSelectOutcome={onSelectOutcome}
        onPlaced={setPlaced}
      />

      <PredictionSuccessModal
        order={placed}
        market={market}
        onClose={() => setPlaced(null)}
        onTrade={openTradeFromSuccess}
      />
      {trade && (
        <TradeModal
          open
          onClose={() => setTrade(null)}
          market={market}
          initialOutcome={trade.outcome}
          initialSide={trade.side}
        />
      )}
    </div>
  )
}

export default TradePanel
