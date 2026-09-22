import { useMemo, useState } from 'react'
import PositionCard from '../../components/markets/PositionCard'
import BetHistoryCard from '../../components/markets/BetHistoryCard'
import { Button } from '../../components/globals/Button'
import { useBetPositions, useBets } from '../../data_layer/bets'
import { formatCurrency, toMajorUnits } from '../../utils/functions'
import type { Bet, BetPosition } from '../../types/bet.types'

type PortfolioTab = 'OPEN' | 'SETTLED' | 'POSITION' | 'HISTORY'
const TABS: PortfolioTab[] = ['OPEN', 'SETTLED', 'POSITION', 'HISTORY']

const AccountPortfolio = () => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('OPEN')
  const isHistory = activeTab === 'HISTORY'

  // Fetch every position/bet (status=all) so the Settled/Position/History tabs
  // populate regardless of the server's default filter; tabs slice client-side.
  const positionsQuery = useBetPositions('all')
  const betsQuery = useBets('all', 20)

  const positions = useMemo<BetPosition[]>(
    () => (positionsQuery.data?.pages ?? []).flatMap((p) => p?.data ?? []),
    [positionsQuery.data],
  )
  const bets = useMemo<Bet[]>(
    () => (betsQuery.data?.pages ?? []).flatMap((p) => p?.data ?? []),
    [betsQuery.data],
  )

  const currency =
    positions[0]?.stake?.currency ??
    positions[0]?.currentValue?.currency ??
    'NGN'

  const stats = useMemo(() => {
    let value = 0
    let pnl = 0
    let open = 0
    positions.forEach((p) => {
      if (p.status === 'OPEN') {
        open += 1
        value += toMajorUnits(p?.currentValue?.amount ?? 0)
        pnl += p.unrealizedPnl
          ? toMajorUnits(p.unrealizedPnl.amount)
          : toMajorUnits(p?.currentValue?.amount ?? 0) -
            (p?.stake
              ? toMajorUnits(p.stake.amount)
              : (Number(p.shares) || 0) * (Number(p.avgPrice) || 0))
      } else {
        pnl += p.realizedPnl ? toMajorUnits(p.realizedPnl.amount) : 0
      }
    })
    return { value, pnl, open }
  }, [positions])

  const filteredPositions = useMemo(() => {
    if (activeTab === 'OPEN') return positions.filter((p) => p.status === 'OPEN')
    if (activeTab === 'SETTLED')
      return positions.filter((p) => p.status !== 'OPEN')
    return positions // POSITION → all
  }, [positions, activeTab])

  // The active tab's list query drives loading / error / pagination.
  const listQuery = isHistory ? betsQuery : positionsQuery
  const isEmpty = isHistory ? bets.length === 0 : filteredPositions.length === 0
  const emptyLabel = isHistory
    ? 'No bet history yet.'
    : `No ${activeTab.toLowerCase()} positions yet.`

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Portfolio
      </h1>

      {positionsQuery.isLoading ? (
        <div className='flex flex-col gap-4 lg:flex-row'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='h-20 min-w-60 flex-1 animate-pulse rounded-lg bg-card'
            />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
          <div className='flex min-w-60 max-w-100 flex-col gap-1 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Portfolio Value</span>
            <span className='text-lg font-bold text-black'>
              {formatCurrency(stats.value, currency)}
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
              {formatCurrency(Math.abs(stats.pnl), currency)}
            </span>
          </div>
          <div className='flex min-w-60 max-w-100 flex-col gap-1 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Open Positions</span>
            <span className='text-lg font-bold text-black'>{stats.open}</span>
          </div>
        </div>
      )}

      <div className='hide-scroll-bar inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-hover p-1'>
        {TABS.map((tab) => (
          <button
            key={tab}
            type='button'
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'bg-text-black text-white dark:text-neutral-10'
                : 'text-placeholder'
            }`}
          >
            {tab.toLowerCase()}
          </button>
        ))}
      </div>

      {listQuery.isError ? (
        <p className='py-8 text-center text-sm text-placeholder'>
          We couldn’t load your {isHistory ? 'history' : 'positions'} right now.
        </p>
      ) : (
        <>
          <div className='grid grid-cols-1 gap-4'>
            {listQuery.isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='h-52 animate-pulse rounded-lg bg-card' />
              ))
            ) : isEmpty ? (
              <p className='col-span-full py-8 text-center text-sm text-placeholder'>
                {emptyLabel}
              </p>
            ) : isHistory ? (
              bets.map((bet) => <BetHistoryCard key={bet.id} bet={bet} />)
            ) : (
              filteredPositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  shareable={activeTab === 'OPEN'}
                />
              ))
            )}
          </div>

          {listQuery.hasNextPage && (
            <div className='flex justify-center'>
              <Button
                type='button'
                text={listQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                variation='plain'
                size='medium'
                className='w-fit!'
                loading={listQuery.isFetchingNextPage}
                onClick={() => listQuery.fetchNextPage()}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default AccountPortfolio
