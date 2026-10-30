import CashOutButton from './CashOutButton'
import { useMarketPositions } from '../../data_layer/bets'
import {
  formatCurrency,
  formatSharePrice,
  isPoolPosition,
  openPositionMark,
} from '../../utils/functions'
import { outcomeTone, TONE_STYLES } from '../../utils/marketDisplay'
import type { UiMarket } from '../../types/market.types'
import type { BetPosition } from '../../types/bet.types'

/**
 * One open position in a market: what's held, what it's worth now, and a
 * cash-out. Used in the Trade modal's sell tab and inline on the market page.
 */
export const MarketPositionRow = ({
  position,
  market,
}: {
  position: BetPosition
  market: UiMarket
}) => {
  const index = market.outcomes.findIndex((o) => o.id === position.outcomeId)
  const outcome = market.outcomes[index]
  const label = outcome?.label ?? position.outcomeLabel ?? ''
  const tone = outcomeTone(market, position.outcomeId, Math.max(index, 0))
  const shares = Number(position.shares) || 0 // ₦1-unit count (money math)
  const contracts =
    position.contracts != null ? Number(position.contracts) : shares / 100
  const avgPrice = Number(position.avgPrice) || 0
  const currentPrice = Number(position.currentPrice) || 0
  // value/pnl are null on a pool position — it isn't valued until close.
  const { value, pnl, estPayout } = openPositionMark(position)
  const currency = position.currentValue?.currency

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border p-3'>
      <div className='flex items-center justify-between gap-2'>
        <span
          className={`truncate text-xs font-bold uppercase ${TONE_STYLES[tone].percent}`}
        >
          {label}
        </span>
        {!isPoolPosition(position) && (
          <span className='shrink-0 text-xs text-neutral-10'>
            {contracts.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
            @ {formatSharePrice(avgPrice)}
            {currentPrice > 0 && ` · now ${formatSharePrice(currentPrice)}`}
          </span>
        )}
      </div>

      <div className='flex items-end justify-between gap-2'>
        {value == null || pnl == null ? (
          <div className='flex flex-col'>
            <span className='text-xs text-neutral-10'>
              Est. payout if it wins
            </span>
            <span className='text-lg font-bold text-black'>
              {formatCurrency(estPayout ?? 0, currency)}
            </span>
            <span className='text-xs text-neutral-10'>
              Pool bet · paid when the market closes
            </span>
          </div>
        ) : (
          <div className='flex flex-col'>
            <span className='text-xs text-neutral-10'>Current value</span>
            <span className='text-lg font-bold text-black'>
              {formatCurrency(value, currency)}
            </span>
            <span
              className={`text-xs font-semibold ${
                pnl >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {pnl >= 0 ? '+' : '-'}
              {formatCurrency(String(Math.abs(pnl)), currency)}
            </span>
          </div>
        )}
        <CashOutButton
          position={position}
          title={market.title}
          outcomeLabel={label}
        />
      </div>
    </div>
  )
}

const SellPanel = ({ market }: { market: UiMarket }) => {
  const { positions, isLoading } = useMarketPositions(market.id)

  if (isLoading) {
    return <div className='h-24 animate-pulse rounded-lg bg-hover' />
  }

  if (!positions.length) {
    return (
      <p className='rounded-lg bg-hover/40 p-3 text-xs text-neutral-10'>
        You have no open position in this market. Buy an outcome first, then come
        back here to cash out.
      </p>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {positions.map((position) => (
        <MarketPositionRow
          key={position.id}
          position={position}
          market={market}
        />
      ))}
    </div>
  )
}

export default SellPanel
