import { useNavigate } from 'react-router'
import ShareBetButton from './ShareBetButton'
import {
  formatCurrency,
  formatDate,
  formatSharePrice,
  toMajorUnits,
} from '../../utils/functions'
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

const YES_LABELS = ['yes', 'up', 'over', 'win', 'true']

const BetHistoryCard = ({ bet }: { bet: Bet }) => {
  const navigate = useNavigate()
  const label = bet.outcomeLabel ?? 'Outcome'
  const isYes = YES_LABELS.includes(label.toLowerCase())

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <div className='flex items-center justify-between'>
        <span
          className={`text-xs font-bold uppercase ${
            isYes ? 'text-success' : 'text-error'
          }`}
        >
          {label} · {bet.type}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(bet.status)}`}
        >
          {bet.status.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      <button
        type='button'
        onClick={() => navigate(`/markets/${bet.marketId}`)}
        className='line-clamp-2 text-left text-sm font-semibold text-black hover:underline'
      >
        {bet.market?.title ?? bet.marketId}
      </button>

      <div className='grid grid-cols-3 gap-2 text-sm'>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Stake</span>
          <span className='font-bold text-black'>{money(bet.stake)}</span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>Price</span>
          <span className='font-bold text-black'>
            {formatSharePrice(Number(bet.price))}
          </span>
        </div>
        <div className='flex flex-col rounded-md bg-surface-hover px-3 py-2'>
          <span className='text-xs text-black/60'>To win</span>
          <span className='font-bold text-surface-success'>
            {money(bet.potentialReturn)}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <span className='text-xs text-placeholder'>
          {formatDate(bet.createdAt)}
        </span>
        <ShareBetButton
          marketId={bet.marketId}
          outcomeId={bet.outcomeId}
          title={bet.market?.title ?? bet.marketId}
          outcomeLabel={label}
          price={formatSharePrice(Number(bet.price))}
          stake={money(bet.stake)}
        />
      </div>
    </div>
  )
}

export default BetHistoryCard
