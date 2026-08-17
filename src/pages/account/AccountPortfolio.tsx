import { useMemo, useState } from 'react'
import PositionCard from '../../components/markets/PositionCard'
import { Button } from '../../components/globals/Button'
import { useBetPositions } from '../../data_layer/bets'
import { formatCurrency } from '../../utils/functions'
import type { BetPosition } from '../../types/bet.types'

type PortfolioTab = 'open' | 'settled'

const AccountPortfolio = () => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('open')

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBetPositions()

  const positions = useMemo<BetPosition[]>(
    () => (data?.pages ?? []).flatMap((p) => p.data),
    [data],
  )

  const currency = positions[0]?.currentValue.currency ?? 'NGN'

  const stats = useMemo(() => {
    let value = 0
    let staked = 0
    let open = 0
    positions.forEach((p) => {
      const v = Number(p.currentValue.amount) || 0
      const s = (Number(p.shares) || 0) * (Number(p.avgPrice) || 0)
      value += v
      staked += s
      if (p.status === 'OPEN') open += 1
    })
    return { value, pnl: value - staked, open }
  }, [positions])

  const filtered = useMemo(
    () =>
      positions.filter((p) =>
        activeTab === 'open' ? p.status === 'OPEN' : p.status !== 'OPEN',
      ),
    [positions, activeTab],
  )

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Portfolio
      </h1>

      {isLoading ? (
        <div className='flex flex-col gap-4 lg:flex-row'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='h-20 min-w-60 flex-1 animate-pulse rounded-lg bg-card'
            />
          ))}
        </div>
      ) : (
        <div className='flex flex-col gap-4 lg:flex-row'>
          <div className='flex min-w-60 max-w-100 flex-col gap-1 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Portfolio Value</span>
            <span className='text-lg font-bold text-black'>
              {formatCurrency(String(stats.value), currency)}
            </span>
          </div>
          <div className='flex min-w-60 max-w-100 flex-col gap-1 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Total P&L</span>
            <span
              className={`text-lg font-bold ${
                stats.pnl >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {stats.pnl >= 0 ? '+' : '-'}
              {formatCurrency(String(Math.abs(stats.pnl)), currency)}
            </span>
          </div>
          <div className='flex min-w-60 max-w-100 flex-col gap-1 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Open Positions</span>
            <span className='text-lg font-bold text-black'>{stats.open}</span>
          </div>
        </div>
      )}

      <div className='inline-flex w-46 items-center gap-1 rounded-full bg-hover p-1'>
        {(['open', 'settled'] as const).map((status) => (
          <button
            key={status}
            type='button'
            onClick={() => setActiveTab(status)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition-colors ${
              activeTab === status
                ? 'bg-text-black text-white'
                : 'text-placeholder'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {isError ? (
        <p className='py-8 text-center text-sm text-placeholder'>
          We couldn’t load your positions right now.
        </p>
      ) : (
        <>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='h-52 animate-pulse rounded-lg bg-card' />
              ))
            ) : filtered.length ? (
              filtered.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))
            ) : (
              <p className='col-span-full py-8 text-center text-sm text-placeholder'>
                No {activeTab} positions yet.
              </p>
            )}
          </div>

          {hasNextPage && (
            <div className='flex justify-center'>
              <Button
                type='button'
                text={isFetchingNextPage ? 'Loading…' : 'Load more'}
                variation='plain'
                size='medium'
                className='w-fit!'
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default AccountPortfolio
