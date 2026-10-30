import { useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import ConfirmationModal from '../components/globals/ConfirmationModal'
import MarketTitleLink from '../components/markets/MarketTitleLink'
import FilterComponent, {
  type FilterCategory,
} from '../components/globals/FilterComponent'
import { useBets, useCancelBet } from '../data_layer/bets'
import {
  betPriceLabel,
  formatCurrency,
  formatDate,
  toMajorUnits,
} from '../utils/functions'
import { outcomeLabelClass } from '../utils/marketDisplay'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'
import type { Bet } from '../types/bet.types'

type OrderFilters = Record<'status', string[]>

const orderFilterCategories: FilterCategory[] = [
  {
    key: 'status',
    label: 'Status',
    multiple: false,
    options: [
      { label: 'Open', value: 'OPEN' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'Partially filled', value: 'PARTIALLY_FILLED' },
      { label: 'Filled', value: 'FILLED' },
      { label: 'Canceled', value: 'CANCELED' },
      { label: 'Rejected', value: 'REJECTED' },
      { label: 'Expired', value: 'EXPIRED' },
    ],
  },
]

// The API cancels resting bets only: OPEN and PENDING.
const isCancelable = (bet: Bet) =>
  bet.status === 'OPEN' || bet.status === 'PENDING'

const statusBadge = (status: Bet['status']) => {
  if (status === 'FILLED') return 'bg-success-bg text-success'
  if (status === 'REJECTED' || status === 'EXPIRED') return 'bg-error-bg text-error'
  if (status === 'CANCELED') return 'bg-hover/60 text-neutral-10'
  return 'bg-warning/20 text-warning'
}

// Once the market settles, the result says more than the fill status.
const RESULT_BADGE: Record<
  NonNullable<Bet['result']>,
  { label: string; className: string }
> = {
  WON: { label: 'Won', className: 'bg-success-bg text-success' },
  LOST: { label: 'Lost', className: 'bg-error-bg text-error' },
  VOID: { label: 'Void', className: 'bg-hover/60 text-neutral-10' },
}

const OrderRow = ({
  bet,
  onCancel,
}: {
  bet: Bet
  onCancel: (bet: Bet) => void
}) => {
  const label = bet.outcomeLabel ?? 'Outcome'
  const badge = bet.result
    ? RESULT_BADGE[bet.result]
    : {
        label: bet.status.replace('_', ' ').toLowerCase(),
        className: statusBadge(bet.status),
      }
  const shares = Number(bet.shares) || 0
  const filledPct =
    bet.status === 'PARTIALLY_FILLED' && shares > 0
      ? Math.round(((Number(bet.filledShares) || 0) / shares) * 100)
      : null

  return (
    <article className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold capitalize'>
            <span className={outcomeLabelClass(label)}>{label}</span>
            <span className='text-black'> · {bet.type}</span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badge.className}`}
          >
            {badge.label}
            {filledPct != null && ` · ${filledPct}% filled`}
          </span>
        </div>
        {/* A result means the market has settled — no link to a dead page. */}
        <MarketTitleLink
          marketId={bet.marketId}
          settled={bet.result != null}
          className={`mt-1 block max-w-md truncate text-left text-xs text-neutral-10 ${
            bet.result == null ? 'hover:text-black' : ''
          }`}
        >
          {bet.market?.title ?? bet.marketId}
        </MarketTitleLink>
        {bet.status === 'REJECTED' && bet.rejectReason && (
          <p className='mt-1 text-xs text-error'>{bet.rejectReason}</p>
        )}
        <p className='mt-1 text-xs text-placeholder'>{formatDate(bet.createdAt)}</p>
      </div>

      <div className='flex items-center justify-between gap-5 sm:justify-end'>
        <div className='text-sm sm:text-right'>
          <p className='font-semibold text-black'>
            {formatCurrency(toMajorUnits(bet.stake.amount), bet.stake.currency)}
          </p>
          <p className='text-xs text-neutral-10'>
            {betPriceLabel(bet)} ·{' '}
            {formatCurrency(
              toMajorUnits((bet.netReturn ?? bet.potentialReturn).amount),
              bet.potentialReturn.currency,
            )}{' '}
            {bet.estimated ? 'est. payout' : 'payout'}
          </p>
        </div>
        {isCancelable(bet) && (
          <button
            type='button'
            onClick={() => onCancel(bet)}
            className='flex items-center gap-1 rounded-full border border-error px-3 py-1.5 text-xs font-semibold text-error hover:bg-market-error'
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            Cancel
          </button>
        )}
      </div>
    </article>
  )
}

const Orders = () => {
  const [filters, setFilters] = useState<OrderFilters>({ status: [] })
  const [betToCancel, setBetToCancel] = useState<Bet | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const status = filters.status[0]

  // Resting orders get their own section on the unfiltered view so they're
  // never buried under history.
  const openQuery = useBets('OPEN', 50)
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBets(status)

  const { mutateAsync: cancelBet, isPending: isCancelling } = useCancelBet(
    betToCancel?.id ?? '',
  )

  const openOrders = useMemo<Bet[]>(
    () => (openQuery.data?.pages ?? []).flatMap((page) => page.data),
    [openQuery.data],
  )
  const showOpenSection = !status && openOrders.length > 0
  const openIds = useMemo(() => new Set(openOrders.map((b) => b.id)), [openOrders])
  const bets = useMemo<Bet[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.data)
        // Already listed above.
        .filter((b) => !(showOpenSection && openIds.has(b.id))),
    [data, showOpenSection, openIds],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleCancel = async () => {
    try {
      await cancelBet()
      showSuccessToast('Order cancelled')
      setBetToCancel(null)
    } catch (error) {
      showWarningToast(
        isAxiosError(error)
          ? (error.response?.data?.message ?? 'Unable to cancel order')
          : 'Unable to cancel order',
      )
    }
  }

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Orders
        </h1>
        <FilterComponent
          categories={orderFilterCategories}
          initialFilters={filters}
          onApply={(next) => setFilters({ status: next.status ?? [] })}
          onReset={() => setFilters({ status: [] })}
        />
      </div>

      {showOpenSection && (
        <section className='flex flex-col gap-2'>
          <h2 className='text-xs font-semibold text-neutral-10 uppercase'>
            Open orders · {openOrders.length}
          </h2>
          <div className='divide-y divide-border/40 overflow-hidden rounded-lg bg-card'>
            {openOrders.map((bet) => (
              <OrderRow key={bet.id} bet={bet} onCancel={setBetToCancel} />
            ))}
          </div>
        </section>
      )}

      <section className='flex flex-col gap-2'>
        {showOpenSection && (
          <h2 className='text-xs font-semibold text-neutral-10 uppercase'>
            All orders
          </h2>
        )}
        <div className='overflow-hidden rounded-lg bg-card'>
          {isLoading ? (
            <div className='flex flex-col gap-3 p-4'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className='h-16 animate-pulse rounded-lg bg-hover' />
              ))}
            </div>
          ) : bets.length === 0 ? (
            <p className='py-12 text-center text-sm text-neutral-10'>
              No orders found.
            </p>
          ) : (
            <div className='divide-y divide-border/40'>
              {bets.map((bet) => (
                <OrderRow key={bet.id} bet={bet} onCancel={setBetToCancel} />
              ))}
              {hasNextPage && (
                <div ref={sentinelRef} className='flex justify-center py-3'>
                  {isFetchingNextPage && (
                    <span className='text-xs text-neutral-10'>Loading more…</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ConfirmationModal
        open={Boolean(betToCancel)}
        title='Cancel order?'
        description='This cancels your unmatched order and returns your stake.'
        confirmText='Cancel order'
        isConfirming={isCancelling}
        onClose={() => setBetToCancel(null)}
        onConfirm={handleCancel}
      />
    </main>
  )
}

export default Orders
