import { useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import ConfirmationModal from '../components/globals/ConfirmationModal'
import FilterComponent, {
  type FilterCategory,
} from '../components/globals/FilterComponent'
import { useBets, useCancelBet } from '../data_layer/bets'
import { formatCurrency, formatDate, formatSharePrice, toMajorUnits } from '../utils/functions'
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

// Resting bets that can still be cancelled.
const CANCELABLE = new Set(['OPEN', 'PENDING', 'PARTIALLY_FILLED'])

const statusBadge = (status: Bet['status']) => {
  if (status === 'FILLED') return 'bg-success-bg text-success'
  if (status === 'REJECTED' || status === 'EXPIRED') return 'bg-error-bg text-error'
  if (status === 'CANCELED') return 'bg-hover/60 text-neutral-10'
  return 'bg-warning/20 text-warning'
}

const Orders = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OrderFilters>({ status: [] })
  const [betToCancel, setBetToCancel] = useState<Bet | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBets(filters.status[0])

  const { mutateAsync: cancelBet, isPending: isCancelling } = useCancelBet(
    betToCancel?.id ?? '',
  )

  const bets = useMemo<Bet[]>(
    () => (data?.pages ?? []).flatMap((page) => page.data),
    [data],
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
      showSuccessToast('Bet cancelled')
      setBetToCancel(null)
    } catch (error) {
      showWarningToast(
        isAxiosError(error)
          ? (error.response?.data?.message ?? 'Unable to cancel bet')
          : 'Unable to cancel bet',
      )
    }
  }

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
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
              <article
                key={bet.id}
                className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold capitalize text-black'>
                      {bet.outcomeLabel ?? 'Outcome'} · {bet.type}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(bet.status)}`}
                    >
                      {bet.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={() => navigate(`/markets/${bet.marketId}`)}
                    className='mt-1 block max-w-md truncate text-left text-xs text-neutral-10 hover:text-black hover:underline'
                  >
                    {bet.market?.title ?? bet.marketId}
                  </button>
                  <p className='mt-1 text-xs text-placeholder'>
                    {formatDate(bet.createdAt)}
                  </p>
                </div>

                <div className='flex items-center justify-between gap-5 sm:justify-end'>
                  <div className='text-right text-sm'>
                    <p className='font-semibold text-black'>
                      {formatCurrency(toMajorUnits(bet.stake.amount), bet.stake.currency)}
                    </p>
                    <p className='text-xs text-neutral-10'>
                      {formatSharePrice(Number(bet.price))} ·{' '}
                      {formatCurrency(
                        toMajorUnits(bet.potentialReturn.amount),
                        bet.potentialReturn.currency,
                      )}{' '}
                      to win
                    </p>
                  </div>
                  {CANCELABLE.has(bet.status) && (
                    <button
                      type='button'
                      onClick={() => setBetToCancel(bet)}
                      className='flex items-center gap-1 rounded-full border border-error px-3 py-1.5 text-xs font-semibold text-error hover:bg-market-error'
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      Cancel
                    </button>
                  )}
                </div>
              </article>
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

      <ConfirmationModal
        open={Boolean(betToCancel)}
        title='Cancel bet?'
        description='This cancels the resting bet. Any unfilled amount is returned to your trading balance.'
        confirmText='Cancel bet'
        isConfirming={isCancelling}
        onClose={() => setBetToCancel(null)}
        onConfirm={handleCancel}
      />
    </main>
  )
}

export default Orders
