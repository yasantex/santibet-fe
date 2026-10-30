import ShareBetButton from './ShareBetButton'
import MarketTitleLink from './MarketTitleLink'
import {
  betPriceLabel,
  formatCurrency,
  formatDate,
  formatSharePrice,
  isPoolBet,
  toMajorUnits,
} from '../../utils/functions'
import { outcomeLabelClass } from '../../utils/marketDisplay'
import type { Bet, Money } from '../../types/bet.types'

const money = (m?: Money | null) =>
  formatCurrency(toMajorUnits(m?.amount ?? 0), m?.currency)

const statusBadge = (status: Bet['status']) => {
  if (status === 'FILLED') return 'bg-success-bg text-success'
  if (status === 'REJECTED' || status === 'EXPIRED')
    return 'bg-error-bg text-error'
  if (status === 'CANCELED') return 'bg-hover/60 text-neutral-10'
  return 'bg-warning/20 text-warning' // PENDING / OPEN / PARTIALLY_FILLED
}

// Once settled, the result says more than the fill status.
const RESULT_BADGE: Record<
  NonNullable<Bet['result']>,
  { label: string; className: string }
> = {
  WON: { label: 'Won', className: 'bg-success-bg text-success' },
  LOST: { label: 'Lost', className: 'bg-error-bg text-error' },
  VOID: { label: 'Void · refunded', className: 'bg-hover/60 text-neutral-10' },
}

// Bets that never got a position — nothing worth sharing.
const UNSHAREABLE = new Set<Bet['status']>(['CANCELED', 'REJECTED', 'EXPIRED'])

const BetHistoryCard = ({ bet }: { bet: Bet }) => {
  const label = bet.outcomeLabel ?? 'Outcome'
  const badge = bet.result
    ? RESULT_BADGE[bet.result]
    : {
        label: bet.status.replace('_', ' ').toLowerCase(),
        className: statusBadge(bet.status),
      }
  const pool = isPoolBet(bet)
  const shares = Number(bet.shares) || 0
  const filledPct =
    bet.status === 'PARTIALLY_FILLED' && shares > 0
      ? Math.round(((Number(bet.filledShares) || 0) / shares) * 100)
      : null

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <div className='flex items-center justify-between'>
        <span className={`text-xs font-bold uppercase ${outcomeLabelClass(label)}`}>
          {label} · {bet.type}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badge.className}`}
        >
          {badge.label}
          {filledPct != null && ` · ${filledPct}%`}
        </span>
      </div>

      <MarketTitleLink
        marketId={bet.marketId}
        settled={bet.result != null}
        className='line-clamp-2 text-left text-sm font-semibold text-black'
      >
        {bet.market?.title ?? bet.marketId}
      </MarketTitleLink>

      {bet.status === 'REJECTED' && bet.rejectReason && (
        <p className='rounded-lg bg-error-bg px-3 py-2 text-xs text-error'>
          {bet.rejectReason}
        </p>
      )}

      <div className='grid grid-cols-3 gap-2 text-sm'>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Stake</span>
          <span className='font-bold text-black'>{money(bet.stake)}</span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>
            {pool ? 'Est. odds' : 'Price'}
          </span>
          <span className='font-bold text-black'>{betPriceLabel(bet)}</span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>
            {bet.estimated ? 'Est. payout' : 'Payout'}
          </span>
          <span
            className={`font-bold ${bet.result === 'LOST' ? 'text-neutral-10 line-through' : 'text-success'}`}
          >
            {money(bet.netReturn ?? bet.potentialReturn)}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <span className='text-xs text-placeholder'>
          {formatDate(bet.createdAt)}
        </span>
        {!UNSHAREABLE.has(bet.status) && !bet.result && (
          <ShareBetButton
            marketId={bet.marketId}
            outcomeId={bet.outcomeId}
            title={bet.market?.title ?? bet.marketId}
            outcomeLabel={label}
            price={pool ? undefined : formatSharePrice(Number(bet.price))}
            stake={money(bet.stake)}
          />
        )}
      </div>
    </div>
  )
}

export default BetHistoryCard
