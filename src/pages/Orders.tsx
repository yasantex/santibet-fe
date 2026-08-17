import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import ConfirmationModal from '../components/globals/ConfirmationModal'
import FilterComponent, {
  type FilterCategory,
} from '../components/globals/FilterComponent'
import {
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
} from '../data_layer/utils'
import { formatDate } from '../utils/functions'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'

type OrderStatus =
  | 'open'
  | 'partially_filled'
  | 'filled'
  | 'canceled'
  | 'rejected'
  | 'expired'

interface MarketOrder {
  id: string
  clientOrderId: string
  provider: string
  marketId: string
  outcomeId: string
  action: 'buy' | 'sell'
  type: 'limit' | 'market'
  status: OrderStatus
  price: number
  size: number
  filledSize: number
  remainingSize: number
  createdAt: string
}

interface OrdersResponse {
  data: MarketOrder[]
  cursor?: string
}

type OrderFilters = Record<'status', string[]>

const orderFilterCategories: FilterCategory[] = [
  {
    key: 'status',
    label: 'Status',
    multiple: false,
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Partially filled', value: 'partially_filled' },
      { label: 'Filled', value: 'filled' },
      { label: 'Canceled', value: 'canceled' },
      { label: 'Rejected', value: 'rejected' },
      { label: 'Expired', value: 'expired' },
    ],
  },
]

const formatNaira = (value: number) =>
  `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 4 })}`

const Orders = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<OrderFilters>({ status: [] })
  const [orderToCancel, setOrderToCancel] = useState<MarketOrder | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSantiBetInfiniteQuery<OrdersResponse>({
    path: '/market/orders',
    params: { status: filters.status[0] },
    queryKey: ['market-orders', filters],
    enabled: true,
    getNextPageParam: (page) => page.cursor || undefined,
  })

  const { mutateAsync: cancelOrder, isPending: isCancelling } =
    useSantiBetMutation<unknown, void>({
      path: `/market/orders/${orderToCancel?.id ?? ''}`,
      method: 'DELETE',
      mutationOptions: {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['market-orders'] })
          showSuccessToast('Order cancelled')
          setOrderToCancel(null)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? error.response?.data?.message
            : error.message
          showWarningToast(message || 'Unable to cancel order')
        },
      },
    })

  const orders = data?.pages.flatMap((page) => page.data) ?? []

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

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>Orders</h1>
        <FilterComponent
          categories={orderFilterCategories}
          initialFilters={filters}
          onApply={(nextFilters) => setFilters({ status: nextFilters.status ?? [] })}
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
        ) : orders.length === 0 ? (
          <p className='py-12 text-center text-sm text-neutral-10'>No orders found.</p>
        ) : (
          <div className='divide-y divide-border/40'>
            {orders.map((order) => (
              <article key={order.id} className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold capitalize text-black'>{order.action} · {order.type}</span>
                    <span className='rounded-full bg-border/40 px-2 py-0.5 text-xs font-medium capitalize text-neutral-10'>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className='mt-1 truncate text-xs text-neutral-10'>Market: {order.marketId}</p>
                  <p className='mt-1 text-xs text-placeholder'>{formatDate(order.createdAt)}</p>
                </div>

                <div className='flex items-center justify-between gap-5 sm:justify-end'>
                  <div className='text-right text-sm'>
                    <p className='font-semibold text-black'>{formatNaira(order.price)}</p>
                    <p className='text-xs text-neutral-10'>Filled {order.filledSize} / {order.size}</p>
                  </div>
                  {order.status === 'open' && (
                    <button
                      type='button'
                      onClick={() => setOrderToCancel(order)}
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
                {isFetchingNextPage && <span className='text-xs text-neutral-10'>Loading more…</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        open={Boolean(orderToCancel)}
        title='Cancel order?'
        description='This will cancel the open order. Any unfilled quantity will no longer be available for execution.'
        confirmText='Cancel order'
        isConfirming={isCancelling}
        onClose={() => setOrderToCancel(null)}
        onConfirm={async () => {
          try {
            await cancelOrder()
          } catch {
            // The mutation's onError handler already shows the API error.
          }
        }}
      />
    </main>
  )
}

export default Orders
