import { useModalControl } from '../../hooks/useModalControl'
import { formatCurrency, formatDate, toMajorUnits } from '../../utils/functions'
import { HugeiconsIcon } from '@hugeicons/react'
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import Deposit from '../../components/appModals/Deposit'
import type {
  DepositRecord,
  TransactionResponse,
  TransactionStatus,
  TransactionType,
  WalletBalance,
  WithdrawalRecord,
} from '../../types/wallet.types'
import Withdraw from '../../components/appModals/Withdraw'
import {
  useSantiBetInfiniteQuery,
  useSantiBetQuery,
} from '../../data_layer/utils'
import { TransactionStatusConfig } from '../../utils/status'
import { StatusBadge } from '../../components/globals/ReusedText'
import FilterComponent from '../../components/globals/FilterComponent'
import { filterCategories } from '../../utils/filters'
import WithdrawalAccounts from '../../components/account/WithdrawalAccounts'
import { Button } from '../../components/globals/Button'
import { useQueryClient } from '@tanstack/react-query'

type TransactionFilterValues = Record<'type' | 'status', string[]>

const transactionStatus: Partial<Record<TransactionType, string>> = {
  DEPOSIT: '/wallet/deposits',
  WITHDRAWAL: '/wallet/withdrawals',
}

const CheckTransactionStatus = ({
  id,
  type,
}: {
  id: string
  type: TransactionType
}) => {
  const [checking, setChecking] = useState(false)
  const wasFetching = useRef(false)
  const queryClient = useQueryClient()

  const basePath = transactionStatus[type]

  const { isFetching } = useSantiBetQuery<WithdrawalRecord | DepositRecord>({
    path: `${basePath}/${id}`,
    queryKey: ['transaction-status', type, id],
    enabled: checking && !!basePath,
  })

  useEffect(() => {
    if (wasFetching.current && !isFetching) {
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
      setChecking(false)
    }
    wasFetching.current = isFetching
  }, [isFetching, queryClient])

  if (!basePath) return null

  return (
    <button
      type='button'
      onClick={() => setChecking(true)}
      disabled={checking}
      className='text-xs mt-2.5 cursor-pointer font-semibold text-neutral-10 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    >
      {checking ? 'Checking…' : 'Check status'}
    </button>
  )
}

const AccountWallet = () => {
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const [visible, setVisible] = useState(true)
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

      <div className='flex xl:flex-row flex-col gap-4 w-full'>
        <div className='flex flex-col w-full rounded-lg bg-card max-w-2xl'>
          {isLoading || !wallet ? (
            <div className='h-64 w-full animate-pulse bg-card' />
          ) : (
            <div className='flex flex-col gap-4 p-4 border-b border-border/40'>
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
                  ? formatCurrency(
                      toMajorUnits(wallet?.total ?? 0),
                      wallet?.currency,
                    )
                  : '••••••'}
              </span>


              <div className='flex md:flex-row flex-col items-start md:items-center gap-2.5'>
                <Button
                  type='button'
                  text='Deposit cash'
                  variation='primary'
                  size='medium'
                  className='w-fit!'
                  onClick={() => handleModalOpen('deposit')}
                />
                <Button
                  type='button'
                  text='Withdraw'
                  variation='plain'
                  size='medium'
                  className='w-fit! border border-black!'
                  onClick={() => handleModalOpen('withdraw')}
                />
              </div>
            </div>
          )}

          {/* Withdrawal accounts render naturally below, no height cap */}
          <div className='p-4'>
            <WithdrawalAccounts />
          </div>
        </div>
        <div className='flex flex-col gap-4 w-full max-w-2xl'>
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

          <div className='flex flex-col gap-2 rounded-lg bg-card p-4 '>
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
                <div className='flex flex-col divide-y divide-border max-h-150 overflow-y-auto'>
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
                            {formatCurrency(
                              toMajorUnits(item.amount),
                              item.currency,
                            )}
                          </span>
                          <StatusBadge
                            value={item.status}
                            statusConfig={TransactionStatusConfig}
                          />
                          {(item.type === 'DEPOSIT' ||
                            item.type === 'WITHDRAWAL') &&
                            item.status === 'PENDING' && (
                              <CheckTransactionStatus
                                id={item.id}
                                type={item.type}
                              />
                            )}
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
        wallet={wallet!}
      />
    </main>
  )
}

export default AccountWallet
