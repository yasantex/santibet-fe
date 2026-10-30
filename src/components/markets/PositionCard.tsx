import ShareBetButton from './ShareBetButton'
import CashOutButton from './CashOutButton'
import MarketTitleLink from './MarketTitleLink'
import { useMarket } from '../../data_layer/markets'
import {
  formatCurrency,
  formatDate,
  formatSharePrice,
  isPoolPosition,
  openPositionMark,
  toMajorUnits,
} from '../../utils/functions'
import { outcomeLabelClass } from '../../utils/marketDisplay'
import type { BetPosition } from '../../types/bet.types'

type PositionCardProps = {
  position: BetPosition
  /** Show the Share button (only on the Open tab). */
  shareable?: boolean
}

const Chip = ({ label, value }: { label: string; value: string }) => (
  <div className='flex items-center gap-1.5 rounded-md bg-surface-hover px-3 py-1.5'>
    <span className='shrink-0 text-xs text-black/60'>{label}</span>
    <span className='font-bold text-black'>{value}</span>
  </div>
)

const PositionCard = ({ position, shareable = false }: PositionCardProps) => {
  // The API now embeds a market summary; only fetch when it's absent.
  const { data: market } = useMarket(
    position?.market ? undefined : position?.marketId,
  )

  const title = position?.market?.title ?? market?.title ?? 'Loading market…'
  const outcome = market?.outcomes.find((o) => o.id === position?.outcomeId)
  const outcomeLabel = position?.outcomeLabel ?? outcome?.label ?? ''
  const shares = Number(position.shares) || 0 // ₦1-unit count (money math)
  // ₦100-contract count for display; backend `contracts` preferred, else ÷100.
  const contracts =
    position?.contracts != null ? Number(position?.contracts) : shares / 100
  const avgPrice = Number(position.avgPrice) || 0
  const currentPrice = Number(position.currentPrice) || 0
  const currency = position?.stake?.currency ?? position?.currentValue?.currency
  const isOpen = position.status === 'OPEN'
  const result = position.result ?? null
  // Pool (parimutuel) positions have no share price and no live value.
  const pool = isPoolPosition(position)

  // OPEN positions mark-to-market against currentValue/unrealizedPnl (null on
  // an unvalued pool position); once SETTLED/CLOSED, currentValue goes null
  // and realizedPnl is the source of truth.
  const { staked, value, pnl: openPnl, estPayout } = openPositionMark(position)
  const unvalued = isOpen && value == null
  const pnl = isOpen
    ? (openPnl ?? 0)
    : position.realizedPnl
      ? toMajorUnits(position.realizedPnl.amount)
      : 0
  const isProfit = pnl >= 0
  // Amount actually returned to the user for a settled/closed position.
  const payout = staked + pnl

  const statusMeta = isOpen
    ? { label: 'In progress', className: 'bg-warning/10 text-warning' }
    : result === 'WON'
      ? { label: 'Won', className: 'bg-surface-success text-success' }
      : result === 'LOST'
        ? { label: 'Lost', className: 'bg-surface-error text-error' }
        : result === 'CASHED_OUT'
          ? { label: 'Cashed out', className: 'bg-surface-hover text-black' }
          : result === 'VOID'
            ? { label: 'Void · refunded', className: 'bg-surface-hover text-black' }
            : {
                label: position.status.toLowerCase(),
                className: 'bg-surface-hover text-black',
              }

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <section className='flex flex-col items-start justify-between gap-2.5 md:flex-row md:items-center'>
        <main className='flex flex-col gap-2.5'>
          <div className='flex items-center'>
            <span
              className={`w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
            {outcomeLabel && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${outcomeLabelClass(outcomeLabel)}`}
              >
                {outcomeLabel}
              </span>
            )}
          </div>

          {/* Won, lost or void = the market settled. A cashed-out position's
              market is usually still open, so it keeps its link. */}
          <MarketTitleLink
            marketId={position.marketId}
            settled={result === 'WON' || result === 'LOST' || result === 'VOID'}
            className='line-clamp-2 text-left text-sm font-semibold text-black'
          >
            {title}
          </MarketTitleLink>
        </main>
        {!pool && (
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <Chip label='Avg' value={formatSharePrice(avgPrice)} />
            {isOpen && currentPrice > 0 && (
              <Chip label='Now' value={formatSharePrice(currentPrice)} />
            )}
            <Chip
              label='Shares'
              value={contracts.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            />
          </div>
        )}
      </section>

      <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-placeholder'>
        <span>Staked {formatCurrency(String(staked), currency)}</span>
        {unvalued ? (
          <span>
            Est. payout if it wins{' '}
            <span className='text-sm font-bold text-black'>
              {formatCurrency(String(estPayout ?? 0), currency)}
            </span>
          </span>
        ) : (
          <div className='flex items-center gap-2.5'>
            <span>
              {isOpen ? 'Value' : 'Payout'}{' '}
              {formatCurrency(String(isOpen ? (value ?? 0) : payout), currency)}
            </span>
            <span
              className={`text-sm font-bold ${isProfit ? 'text-success' : 'text-error'}`}
            >
              {isOpen && 'Unrealized '}
              {isProfit ? '+' : '-'}
              {formatCurrency(String(Math.abs(pnl)), currency)}
            </span>
          </div>
        )}
      </div>

      {isOpen && !pool && estPayout != null && (
        <p className='text-xs text-neutral-10'>
          Pays{' '}
          <span className='font-semibold text-black'>
            {formatCurrency(estPayout, currency)}
          </span>{' '}
          if {outcomeLabel || 'it'} wins
        </p>
      )}
      {!isOpen && position.settledAt && (
        <p className='text-xs text-placeholder'>
          {result === 'CASHED_OUT' ? 'Cashed out' : 'Settled'}{' '}
          {formatDate(position.settledAt)}
        </p>
      )}

      {(isOpen || shareable) && (
        <div className='flex items-center justify-between'>
          {isOpen ? (
            <CashOutButton
              position={position}
              title={title}
              outcomeLabel={outcomeLabel}
              variation='plain'
              size='small'
            />
          ) : (
            <span />
          )}
          {shareable && (
            <ShareBetButton
              marketId={position.marketId}
              outcomeId={position.outcomeId}
              title={title}
              outcomeLabel={outcomeLabel}
              price={pool ? undefined : formatSharePrice(avgPrice)}
              stake={formatCurrency(String(staked), currency)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default PositionCard
