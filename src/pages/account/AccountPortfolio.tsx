import { useMemo, useState } from 'react'
import PositionCard from '../../components/markets/PositionCard'
import BetHistoryCard from '../../components/markets/BetHistoryCard'
import ComboCard from '../../components/markets/ComboCard'
import TradingNotice from '../../components/markets/TradingNotice'
import { Button } from '../../components/globals/Button'
import {
  useBetPositions,
  useBets,
  usePortfolioSummary,
} from '../../data_layer/bets'
import { useSantiBetQuery } from '../../data_layer/utils'
import {
  formatCurrency,
  spendableBalance,
  toMajorUnits,
} from '../../utils/functions'
import type { Bet, BetPosition, ComboTicket } from '../../types/bet.types'
import type { WalletBalance } from '../../types/wallet.types'

type PortfolioTab = 'OPEN' | 'POSITIONS' | 'HISTORY'
const TABS: { key: PortfolioTab; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'POSITIONS', label: 'Positions' },
  { key: 'HISTORY', label: 'History' },
]

type HistoryItem =
  | { kind: 'bet'; at: number; bet: Bet }
  | { kind: 'combo'; at: number; combo: ComboTicket }

const signed = (n: number) => `${n >= 0 ? '+' : '-'}${formatCurrency(Math.abs(n))}`
const pnlClass = (n: number) => (n >= 0 ? 'text-success' : 'text-error')

const StatCard = ({
  label,
  value,
  valueClass = 'text-black',
  hint,
}: {
  label: string
  value: string
  valueClass?: string
  hint?: string
}) => (
  <div className='flex min-w-0 flex-col gap-1 rounded-lg bg-card p-4'>
    <span className='text-sm text-placeholder'>{label}</span>
    <span className={`text-lg font-bold ${valueClass}`}>{value}</span>
    {hint && <span className='text-xs text-placeholder'>{hint}</span>}
  </div>
)

const AccountPortfolio = () => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('OPEN')
  const isHistory = activeTab === 'HISTORY'

  // Headline numbers come from the server over every position, so they're
  // right however many pages the lists below have loaded.
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    queryKey: ['/wallet', {}],
    enabled: true,
  })

  const positionsQuery = useBetPositions('open')
  // Every position, open and finished (won, lost, cashed out, void).
  const allPositionsQuery = useBetPositions('all')
  const betsQuery = useBets('all', 20)

  const positions = useMemo<BetPosition[]>(
    () => (positionsQuery.data?.pages ?? []).flatMap((p) => p?.data ?? []),
    [positionsQuery.data],
  )
  const allPositions = useMemo<BetPosition[]>(
    () => (allPositionsQuery.data?.pages ?? []).flatMap((p) => p?.data ?? []),
    [allPositionsQuery.data],
  )
  // Combo tickets ride on the first page of each list.
  const openCombos = useMemo(
    () =>
      (positionsQuery.data?.pages[0]?.combos ?? []).filter(
        (c) => c.status === 'OPEN',
      ),
    [positionsQuery.data],
  )

  // History: single bets merged with combos, newest first. Combos all arrive
  // up front, so only show those inside the time range the loaded bet pages
  // cover — older ones slot in as more pages load, keeping the order right.
  const history = useMemo<HistoryItem[]>(() => {
    const pages = betsQuery.data?.pages ?? []
    const bets = pages.flatMap((p) => p?.data ?? [])
    const time = (iso: string) => new Date(iso).getTime() || 0
    const oldestLoaded = betsQuery.hasNextPage
      ? Math.min(...bets.map((b) => time(b.createdAt)))
      : -Infinity
    const items: HistoryItem[] = [
      ...bets.map((bet) => ({ kind: 'bet' as const, at: time(bet.createdAt), bet })),
      ...(pages[0]?.combos ?? [])
        .map((combo) => ({ kind: 'combo' as const, at: time(combo.createdAt), combo }))
        .filter((c) => c.at >= oldestLoaded),
    ]
    return items.sort((a, b) => b.at - a.at)
  }, [betsQuery.data, betsQuery.hasNextPage])

  // The active tab's list query drives loading / error / pagination.
  const listQuery = isHistory
    ? betsQuery
    : activeTab === 'POSITIONS'
      ? allPositionsQuery
      : positionsQuery
  const isEmpty = isHistory
    ? history.length === 0
    : activeTab === 'POSITIONS'
      ? allPositions.length === 0
      : positions.length === 0 && openCombos.length === 0

  const unrealized = summary ? toMajorUnits(summary.unrealizedPnl.amount) : 0
  const realized = summary ? toMajorUnits(summary.realizedPnl.amount) : 0

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Portfolio
      </h1>

      {summaryLoading ? (
        <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-20 animate-pulse rounded-lg bg-card' />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
          <StatCard
            label='Positions value'
            value={formatCurrency(
              summary ? toMajorUnits(summary.currentValue.amount) : 0,
            )}
            hint={
              summary
                ? `${summary.openPositions} open · ${formatCurrency(toMajorUnits(summary.invested.amount))} invested`
                : undefined
            }
          />
          <StatCard
            label='Cash available'
            value={formatCurrency(spendableBalance(wallet))}
          />
          <StatCard
            label='Unrealized P&L'
            value={signed(unrealized)}
            valueClass={pnlClass(unrealized)}
            hint='On open positions, at current prices'
          />
          <StatCard
            label='Realized P&L'
            value={signed(realized)}
            valueClass={pnlClass(realized)}
            hint={
              summary
                ? `${summary.wonCount} won · ${summary.lostCount} lost`
                : undefined
            }
          />
        </div>
      )}

      <div className='hide-scroll-bar inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-hover p-1'>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-text-black text-white dark:text-neutral-10'
                : 'text-placeholder'
            }`}
          >
            {tab.label}
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
                {isHistory
                  ? 'No bet history yet.'
                  : activeTab === 'POSITIONS'
                    ? 'No positions yet.'
                    : 'No open positions yet.'}
              </p>
            ) : isHistory ? (
              history.map((item) =>
                item.kind === 'combo' ? (
                  <ComboCard key={`combo-${item.combo.id}`} combo={item.combo} />
                ) : (
                  <BetHistoryCard key={item.bet.id} bet={item.bet} />
                ),
              )
            ) : activeTab === 'POSITIONS' ? (
              allPositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  shareable={position.status === 'OPEN'}
                />
              ))
            ) : (
              <>
                {openCombos.map((combo) => (
                  <ComboCard key={`combo-${combo.id}`} combo={combo} />
                ))}
                {positions.map((position) => (
                  <PositionCard key={position.id} position={position} shareable />
                ))}
              </>
            )}
          </div>

          {/* Open positions can be cashed out from here, so the licence
              notice applies. */}
          {activeTab === 'OPEN' && !isEmpty && !listQuery.isLoading && (
            <TradingNotice />
          )}

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
