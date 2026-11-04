import { HugeiconsIcon } from '@hugeicons/react'
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  MinusSignCircleIcon,
  PlusSignCircleIcon,
} from '@hugeicons/core-free-icons'
import MarketTitleLink from '../markets/MarketTitleLink'
import { MarketThumb, OutcomeChip } from './PortfolioBits'
import { formatCurrency, timeAgo } from '../../utils/functions'
import type { Activity, ActivityKind } from './activity'

const KIND_META: Record<
  ActivityKind,
  { label: string; icon: typeof PlusSignCircleIcon; className: string }
> = {
  buy: { label: 'Buy', icon: PlusSignCircleIcon, className: 'text-neutral-10' },
  order: { label: 'Order', icon: PlusSignCircleIcon, className: 'text-neutral-10' },
  won: { label: 'Won', icon: CheckmarkCircle02Icon, className: 'text-success' },
  lost: { label: 'Loss', icon: CancelCircleIcon, className: 'text-error' },
  cashout: { label: 'Cash out', icon: MinusSignCircleIcon, className: 'text-neutral-10' },
  refund: { label: 'Refund', icon: MinusSignCircleIcon, className: 'text-neutral-10' },
  canceled: { label: 'Cancelled', icon: CancelCircleIcon, className: 'text-neutral-10' },
  rejected: { label: 'Rejected', icon: CancelCircleIcon, className: 'text-error' },
}

// Activity | Market | Value | Time
const GRID = 'grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[8rem_minmax(0,1fr)_8rem_6rem]'

const HistoryTable = ({ items }: { items: Activity[] }) => (
  <div className='flex flex-col gap-2'>
    <div
      className={`hidden gap-x-3 px-3 pb-1 text-xs font-medium text-neutral-10 md:grid ${GRID}`}
    >
      <span>Activity</span>
      <span>Market</span>
      <span>Value</span>
      <span>Time</span>
    </div>
    {items.map((a) => {
      const meta = KIND_META[a.kind]
      return (
        <div
          key={a.id}
          className={`grid items-center gap-x-3 gap-y-2 rounded-xl bg-card p-3 ${GRID}`}
        >
          <span
            className={`flex items-center gap-2 text-sm font-semibold md:order-none ${meta.className}`}
          >
            <HugeiconsIcon icon={meta.icon} size={18} />
            <span className='text-black'>{meta.label}</span>
          </span>
          <span className='text-right text-xs text-neutral-10 md:hidden'>
            {timeAgo(a.iso)}
          </span>
          <div className='flex min-w-0 items-center gap-3'>
            <MarketThumb imageUrl={a.imageUrl} title={a.title} />
            <div className='flex min-w-0 flex-col gap-1'>
              {a.marketId ? (
                <MarketTitleLink
                  marketId={a.marketId}
                  marketStatus={a.marketStatus}
                  settled={a.settled}
                  className='truncate text-left text-sm font-semibold text-black'
                >
                  {a.title}
                </MarketTitleLink>
              ) : (
                <span className='truncate text-sm font-semibold text-black'>
                  {a.title}
                </span>
              )}
              <div>
                <OutcomeChip label={a.outcomeLabel} price={a.price} />
              </div>
            </div>
          </div>
          <span
            className={`text-right text-sm font-semibold md:text-left ${
              a.value == null
                ? 'text-neutral-10'
                : a.value > 0
                  ? 'text-success'
                  : 'text-black'
            }`}
          >
            {a.value == null
              ? '—'
              : `${a.value > 0 ? '+' : '-'}${formatCurrency(Math.abs(a.value))}`}
          </span>
          <span className='hidden text-sm text-neutral-10 md:block'>
            {timeAgo(a.iso)}
          </span>
        </div>
      )
    })}
  </div>
)

export default HistoryTable
