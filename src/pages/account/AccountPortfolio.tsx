import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FilterHorizontalIcon,
  SortingDownIcon,
} from '@hugeicons/core-free-icons'
import TradingNotice from '../../components/markets/TradingNotice'
import { Button } from '../../components/globals/Button'
import SearchInput from '../../components/globals/SearchInput'
import Deposit from '../../components/appModals/Deposit'
import Withdraw from '../../components/appModals/Withdraw'
import PortfolioSummaryCards from '../../components/portfolio/PortfolioSummaryCards'
import PositionsTable from '../../components/portfolio/PositionsTable'
import {
  POSITION_SORTS,
  sortPositionRows,
  type PositionSort,
} from '../../components/portfolio/positionRows'
import OpenOrdersTable from '../../components/portfolio/OpenOrdersTable'
import HistoryTable from '../../components/portfolio/HistoryTable'
import {
  ACTIVITY_FILTERS,
  buildActivity,
  filterActivity,
  HISTORY_SORTS,
  type ActivityFilter,
  type HistorySort,
} from '../../components/portfolio/activity'
import {
  TableState,
  ToolbarMenu,
} from '../../components/portfolio/PortfolioBits'
import {
  allCombos,
  uniqueById,
  useBetPositions,
  useBets,
  usePortfolioSummary,
} from '../../data_layer/bets'
import { useSantiBetQuery } from '../../data_layer/utils'
import { useModalControl } from '../../hooks/useModalControl'
import {
  openStakeSplit,
  spendableBalance,
  toMajorUnits,
  withdrawableBalance,
} from '../../utils/functions'
import type { Bet, BetPosition } from '../../types/bet.types'
import type { WalletBalance } from '../../types/wallet.types'

type PortfolioTab = 'POSITIONS' | 'OPEN' | 'HISTORY'
const TABS: { key: PortfolioTab; label: string; param: string }[] = [
  { key: 'POSITIONS', label: 'Open', param: 'open' },
  { key: 'OPEN', label: 'Pending Orders', param: 'pending' },
  { key: 'HISTORY', label: 'Settled', param: 'settled' },
]

// A combos-only page can repeat page one's bets, so each id counts once.
const flatten = <T extends { id: string }>(
  pages?: ({ data?: T[] } | undefined)[],
) => uniqueById(pages)

/** Oldest time on the loaded pages, or -∞ once a list is fully loaded. */
const cutoffOf = (times: number[], hasNextPage?: boolean) =>
  hasNextPage && times.length ? Math.min(...times) : -Infinity

const AccountPortfolio = () => {
  // `?tab=open|pending|settled` picks the tab, so nav links and shares can
  // land on one directly.
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: PortfolioTab =
    TABS.find((t) => t.param === searchParams.get('tab'))?.key ?? 'POSITIONS'
  const setActiveTab = (key: PortfolioTab) => {
    const param = TABS.find((t) => t.key === key)?.param ?? 'open'
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', param)
        return next
      },
      { replace: true },
    )
  }
  const [search, setSearch] = useState('')
  const [positionSort, setPositionSort] = useState<PositionSort>('value')
  const [historySort, setHistorySort] = useState<HistorySort>('newest')
  const [historyFilter, setHistoryFilter] = useState<ActivityFilter>('all')
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()

  // Headline numbers come from the server over every position, so they're
  // right however many pages the lists below have loaded.
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    queryKey: ['/wallet', {}],
    enabled: true,
  })

  const positionsQuery = useBetPositions('open')
  const ordersQuery = useBets('OPEN', 50)
  const betsQuery = useBets('all', 20)
  // Every position, not just `settled`: a cashed-out one is CLOSED, and the
  // open ones are skipped when building the feed.
  const settledQuery = useBetPositions('all')

  const positions = useMemo(
    () => flatten<BetPosition>(positionsQuery.data?.pages),
    [positionsQuery.data],
  )
  // Combos page alongside each list.
  const openCombos = useMemo(
    () =>
      allCombos(positionsQuery.data?.pages).filter((c) => c.status === 'OPEN'),
    [positionsQuery.data],
  )
  const positionRows = useMemo(
    () => sortPositionRows(positions, openCombos, search, positionSort),
    [positions, openCombos, search, positionSort],
  )

  // Stake on live bets, split into cash and bonus for the summary card. The
  // server's `openStake` is authoritative; only an older API that omits it
  // falls back to summing every open position (plus open combos) here.
  const needStakeFallback = !!summary && !summary.openStake
  const stakeQuery = useBetPositions('open', 100, needStakeFallback)
  const openStake = useMemo(() => {
    if (summary?.openStake) {
      return {
        cash: toMajorUnits(summary.openStake.cash.amount),
        bonus: toMajorUnits(summary.openStake.bonus.amount),
      }
    }
    if (!stakeQuery.data) return undefined
    return openStakeSplit(
      flatten<BetPosition>(stakeQuery.data.pages),
      allCombos(stakeQuery.data.pages),
    )
  }, [summary, stakeQuery.data])

  const orders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return flatten<Bet>(ordersQuery.data?.pages).filter(
      (b) =>
        !q ||
        `${b.market?.title ?? ''} ${b.outcomeLabel ?? ''}`
          .toLowerCase()
          .includes(q),
    )
  }, [ordersQuery.data, search])

  // History, one row per finished bet: results from finished positions and
  // combos, plus bets that never went in (cancelled / rejected) from the bets
  // list — merged into one newest-first feed.
  const activity = useMemo(() => {
    const bets = flatten<Bet>(betsQuery.data?.pages)
    const settledPositions = flatten<BetPosition>(settledQuery.data?.pages)
    const t = (iso?: string | null) => new Date(iso ?? '').getTime() || 0
    return buildActivity({
      bets,
      settledPositions,
      combos: allCombos(betsQuery.data?.pages),
      betsCutoff: cutoffOf(
        bets.map((b) => t(b.createdAt)),
        betsQuery.hasNextPage,
      ),
      positionsCutoff: cutoffOf(
        settledPositions.map((p) => t(p.settledAt ?? p.openedAt)),
        settledQuery.hasNextPage,
      ),
    })
  }, [
    betsQuery.data,
    betsQuery.hasNextPage,
    settledQuery.data,
    settledQuery.hasNextPage,
  ])
  const historyItems = useMemo(
    () => filterActivity(activity, historyFilter, search, historySort),
    [activity, historyFilter, search, historySort],
  )

  // The active tab's queries drive loading / error / pagination.
  const tabQueries =
    activeTab === 'HISTORY'
      ? [betsQuery, settledQuery]
      : activeTab === 'OPEN'
        ? [ordersQuery]
        : [positionsQuery]
  const isLoading = tabQueries.some((q) => q.isLoading)
  const isError = tabQueries.some((q) => q.isError)
  const hasNextPage = tabQueries.some((q) => q.hasNextPage)
  const isFetchingNextPage = tabQueries.some((q) => q.isFetchingNextPage)
  const loadMore = () =>
    tabQueries.forEach((q) => q.hasNextPage && q.fetchNextPage())

  const searching = search.trim().length > 0
  const rowCount =
    activeTab === 'HISTORY'
      ? historyItems.length
      : activeTab === 'OPEN'
        ? orders.length
        : positionRows.length
  // Search and filters only cover loaded pages, so an empty result may just
  // mean the match is further back.
  const narrowed =
    searching || (activeTab === 'HISTORY' && historyFilter !== 'all')
  const emptyText = narrowed && hasNextPage
    ? 'Nothing in your recent activity. Load more to look further back.'
    : searching
    ? `Nothing matches “${search.trim()}”.`
    : activeTab === 'HISTORY'
      ? historyFilter === 'all'
        ? 'No activity yet.'
        : 'No activity of this type yet.'
      : activeTab === 'OPEN'
        ? 'No pending orders.'
        : 'No open bets yet.'

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <PortfolioSummaryCards
        summary={summary}
        cash={spendableBalance(wallet)}
        withdrawable={wallet ? withdrawableBalance(wallet) : undefined}
        bonus={wallet ? toMajorUnits(wallet.bonus ?? 0) : undefined}
        openStake={openStake}
        loading={summaryLoading}
        onDeposit={() => handleModalOpen('deposit')}
        onWithdraw={() => handleModalOpen('withdraw')}
      />

      <div className='flex xl:flex-row flex-col items-start gap-2'>
        <div className='flex h-11 w-fit max-w-full shrink-0 items-center gap-1 overflow-x-auto rounded-[10px] border border-border p-1'>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className={`h-full shrink-0 rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4 ${
                activeTab === tab.key
                  ? 'bg-hover text-black'
                  : 'text-neutral-10 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2.5'>
          {/* Never squeezed: the menus wrap to the next line instead. */}
          <div className='min-w-54 flex-1'>
            <SearchInput
              searchTerm={search}
              handleChange={(e) => setSearch(e.target.value)}
              placeholder='Search'
            />
          </div>
          {activeTab === 'POSITIONS' && (
            <ToolbarMenu
              icon={<HugeiconsIcon icon={SortingDownIcon} size={16} />}
              value={positionSort}
              options={POSITION_SORTS}
              onChange={setPositionSort}
            />
          )}
          {activeTab === 'HISTORY' && (
            <>
              <ToolbarMenu
                icon={<HugeiconsIcon icon={FilterHorizontalIcon} size={16} />}
                value={historyFilter}
                options={ACTIVITY_FILTERS}
                onChange={setHistoryFilter}
              />
              <ToolbarMenu
                icon={<HugeiconsIcon icon={SortingDownIcon} size={16} />}
                value={historySort}
                options={HISTORY_SORTS}
                onChange={setHistorySort}
              />
            </>
          )}
        </div>
      </div>

      {isError || isLoading || rowCount === 0 ? (
        <TableState
          loading={isLoading}
          error={
            isError
              ? `We couldn’t load your ${activeTab === 'HISTORY' ? 'history' : activeTab === 'OPEN' ? 'pending orders' : 'open bets'} right now.`
              : null
          }
          empty={emptyText}
        />
      ) : activeTab === 'HISTORY' ? (
        <HistoryTable items={historyItems} />
      ) : activeTab === 'OPEN' ? (
        <OpenOrdersTable orders={orders} />
      ) : (
        <PositionsTable rows={positionRows} />
      )}

      {/* Open positions can be cashed out from here, so the licence notice
          applies. */}
      {activeTab === 'POSITIONS' && rowCount > 0 && !isLoading && (
        <TradingNotice />
      )}

      {/* Search, sort and filters only cover what's loaded so far. */}
      {hasNextPage && !isLoading && !isError && (
        <div className='flex justify-center'>
          <Button
            type='button'
            text={isFetchingNextPage ? 'Loading…' : 'Load more'}
            variation='plain'
            size='medium'
            className='w-fit!'
            loading={isFetchingNextPage}
            onClick={loadMore}
          />
        </div>
      )}

      <Deposit
        open={modalOpen && modal === 'deposit'}
        handleClose={handleModalClose}
      />
      {wallet && (
        <Withdraw
          open={modalOpen && modal === 'withdraw'}
          handleClose={handleModalClose}
          wallet={wallet}
        />
      )}
    </main>
  )
}

export default AccountPortfolio
