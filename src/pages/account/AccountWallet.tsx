import { useModalControl } from '../../hooks/useModalControl'
import { formatCurrency, formatDate } from '../../utils/functions'
import { HugeiconsIcon } from '@hugeicons/react'
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import Deposit from '../../components/appModals/Deposit'
import type {
  TransactionResponse,
  TransactionStatus,
  TransactionType,
  WalletBalance,
} from '../../types/wallet.types'
import Withdraw from '../../components/appModals/Withdraw'
import {
  useSantiBetInfiniteQuery,
  useSantiBetQuery,
} from '../../data_layer/utils'
import { TransactionStatusConfig } from '../../utils/status'
import { StatusBadge } from '../../components/globals/ReusedText'
import TransferToTrading from '../../components/appModals/TransferToTrading'
import FilterComponent from '../../components/globals/FilterComponent'
import { filterCategories } from '../../utils/filters'
import WithdrawalAccounts from '../../components/account/WithdrawalAccounts'

type TransactionFilterValues = Record<'type' | 'status', string[]>

const AccountWallet = () => {
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const [visible, setVisible] = useState(true)
  const [activeAction, setActiveAction] = useState<
    'deposit' | 'withdraw' | 'transfer'
  >('deposit')
  const [filters, setFilters] = useState<TransactionFilterValues>({
    type: [],
    status: [],
  })
  const { data: wallet, isLoading } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
  })

  const {
    data: walletTransactions,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSantiBetInfiniteQuery<TransactionResponse>({
    path: '/wallet/transactions',
    params: {
      type: filters.type[0] as TransactionType | undefined,
      status: filters.status[0] as TransactionStatus | undefined,
    },
    queryKey: ['wallet-transactions', filters],
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const transactions =
    walletTransactions?.pages.flatMap((page) => page.data ?? []) ?? []

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Wallet
      </h1>

      <div className='flex flex-col gap-4 w-full'>
        <div className='flex flex-col lg:flex-row gap-5 w-full'>
          {isLoading || !wallet ? (
            <div className='h-64 w-full animate-pulse rounded-lg bg-card' />
          ) : (
            <div className='flex w-full h-full md:h-60 flex-col gap-4 rounded-lg bg-card p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-placeholder'>
                  Available Balance
                </span>
                <button
                  type='button'
                  onClick={() => setVisible((v) => !v)}
                  className='flex items-center gap-1.5 text-xs font-semibold text-success'
                >
                  <HugeiconsIcon
                    icon={visible ? ViewIcon : ViewOffIcon}
                    size={16}
                  />
                  {visible ? 'Hide' : 'Show'}
                </button>
              </div>

              <span className='md:text-3xl text-2xl font-bold text-black'>
                {visible
                  ? formatCurrency(wallet?.total, wallet?.currency)
                  : '••••••'}
              </span>

              {visible && (
                <div className='flex flex-col gap-1.5'>
                  <p className='text-sm font-semibold text-neutral-10'>
                    Trading Balance:{' '}
                    <span className=' text-black'>
                      {formatCurrency(wallet?.trading, wallet?.currency)}{' '}
                    </span>
                  </p>

                  <p className='text-sm font-semibold text-neutral-10'>
                    Winning Balance:{' '}
                    <span className=' text-black'>
                      {formatCurrency(wallet?.winnings, wallet?.currency)}{' '}
                    </span>
                  </p>
                </div>
              )}

              <div className='flex md:flex-row flex-col items-center gap-2.5 rounded-full p-1'>
                <button
                  type='button'
                  onClick={() => {
                    setActiveAction('deposit')
                    handleModalOpen('deposit')
                  }}
                  className={`flex-1 rounded-full py-2 w-full text-sm font-semibold transition-colors ${
                    activeAction === 'deposit'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-black'
                  }`}
                >
                  Deposit
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setActiveAction('transfer')
                    handleModalOpen('transfer')
                  }}
                  className={`flex-1 rounded-full py-2 w-full text-sm font-semibold transition-colors ${
                    activeAction === 'transfer'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-black'
                  }`}
                >
                  {/* Move winnings to trading */}
                  Transfer
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setActiveAction('withdraw')
                    handleModalOpen('withdraw')
                  }}
                  className={`flex-1 rounded-full w-full py-2 text-sm font-semibold transition-colors ${
                    activeAction === 'withdraw'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-black'
                  }`}
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}
          <WithdrawalAccounts />
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-semibold text-black'>Transactions</h2>
            <FilterComponent
              categories={filterCategories}
              initialFilters={filters}
              onApply={(nextFilters) =>
                setFilters({
                  type: nextFilters.type ?? [],
                  status: nextFilters.status ?? [],
                })
              }
              onReset={() => setFilters({ type: [], status: [] })}
            />
          </div>

          <div className='flex flex-col gap-2 rounded-lg bg-card p-4'>
            {isLoading ? (
              <div className='flex flex-col gap-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className='h-12 animate-pulse rounded-lg bg-hover'
                  />
                ))}
              </div>
            ) : transactions?.length === 0 ? (
              <p className='py-6 text-center text-sm text-black'>
                No transactions yet.
              </p>
            ) : (
              <>
                <div className='flex flex-col divide-y divide-border/40'>
                  {transactions.map((item) => {
                    const isPositive = item.direction === 'CREDIT'
                    return (
                      <div
                        key={item.id}
                        className='flex items-center justify-between gap-4 py-3'
                      >
                        <div className='flex items-center gap-3'>
                          <span
                            className={`h-8 w-8 shrink-0 rounded-full ${
                              isPositive
                                ? 'bg-success'
                                : 'bg-[#16191a]! dark:bg-[#e4e5e3]! dark:text-[#000000]!'
                            }`}
                          />
                          <div className='flex flex-col'>
                            <span className='text-sm font-semibold text-black capitalize'>
                              {item.type.replaceAll('_', ' ').toLowerCase()}
                            </span>
                            <span className='text-xs text-placeholder'>
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className='flex flex-col items-end gap-0.5'>
                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              isPositive ? 'text-success' : 'text-black'
                            }`}
                          >
                            {isPositive ? '+' : '-'}
                            {formatCurrency(item.amount, item.currency)}
                          </span>
                          <StatusBadge
                            value={item.status}
                            statusConfig={TransactionStatusConfig}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {hasNextPage && (
                  <div ref={sentinelRef} className='flex justify-center py-3'>
                    {isFetchingNextPage && (
                      <span className='text-xs text-neutral-10'>
                        Loading more…
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Deposit
        open={modalOpen && modal === 'deposit'}
        handleClose={() => {
          handleModalClose()
        }}
      />
      <Withdraw
        open={modalOpen && modal === 'withdraw'}
        handleClose={() => {
          handleModalClose()
        }}
      />
      <TransferToTrading
        open={modalOpen && modal === 'transfer'}
        handleClose={handleModalClose}
        winningsBalance={wallet?.winnings}
        currency={wallet?.currency}
      />
    </main>
  )
}

export default AccountWallet
