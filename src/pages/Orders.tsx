import { useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { ArrowDown01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
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
  isPoolBet,
  toMajorUnits,
} from '../utils/functions'
import ComboLegs from '../components/portfolio/ComboLegs'
import {
  betResult,
  isRefundedCombo,
  marketLabel,
} from '../components/portfolio/betDisplay'
import { outcomeLabelClass } from '../utils/marketDisplay'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'
import type { Bet } from '../types/bet.types'
import type { ComboStatus, ComboTicket } from '../types/combo.types'
import { formatOdds, oddsFromPrice, priceAndOdds } from '../utils/odds'

/** A single bet, or a combo ticket, merged into one newest-first list. */
type OrderListItem =
  | { kind: 'bet'; at: string; bet: Bet }
  | { kind: 'combo'; at: string; combo: ComboTicket }

/** A combo's state for the badge and the filter: a stake-only payout is a refund. */
const comboState = (combo: ComboTicket): ComboStatus =>
  isRefundedCombo(combo) ? 'VOID' : combo.status

const COMBO_BADGE: Record<ComboStatus, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-warning/20 text-warning' },
  WON: { label: 'Won', className: 'bg-success-bg text-success' },
  LOST: { label: 'Lost', className: 'bg-error-bg text-error' },
  VOID: { label: 'Refunded', className: 'bg-hover/60 text-neutral-10' },
}

type OrderFilters = Record<'status', string[]>

/**
 * What the player means by a bet's state, not the order's fill status:
 * "Open" is every bet still waiting on a result, combos included.
 */
type BetFilter = 'open' | 'won' | 'lost' | 'refunded' | 'cancelled'
/** Every state a bet can be in; `settling` has no filter of its own. */
type BetState = BetFilter | 'settling'

const orderFilterCategories: FilterCategory[] = [
  {
    key: 'status',
    label: 'Status',
    multiple: false,
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Won', value: 'won' },
      { label: 'Lost', value: 'lost' },
      { label: 'Refunded', value: 'refunded' },
      { label: 'Cancelled / rejected', value: 'cancelled' },
    ],
  },
]

const betFilterOf = (bet: Bet): BetState => {
  if (
    bet.status === 'CANCELED' ||
    bet.status === 'EXPIRED' ||
    bet.status === 'REJECTED'
  )
    return 'cancelled'
  const result = betResult(bet.result, bet.market)
  if (result === 'WON') return 'won'
  if (result === 'LOST') return 'lost'
  if (result === 'VOID') return 'refunded'
  // Market settled but this bet's result hasn't come through: not open.
  if (bet.market?.status === 'SETTLED') return 'settling'
  return 'open'
}

const COMBO_FILTER: Record<ComboStatus, BetFilter> = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost',
  VOID: 'refunded',
}

// The API cancels resting bets only: OPEN and PENDING.
const isCancelable = (bet: Bet) =>
  bet.status === 'OPEN' || bet.status === 'PENDING'

/**
 * The badge says where the bet stands, not the order's fill status: a filled
 * bet still waiting on its result is "Open" (as on combos).
 */
const betBadge = (bet: Bet): { label: string; className: string } => {
  const state = betFilterOf(bet)
  if (state === 'won' || state === 'lost' || state === 'refunded')
    return RESULT_BADGE[betResult(bet.result, bet.market) ?? 'VOID']
  if (state === 'settling')
    return { label: 'Settling', className: 'bg-hover/60 text-neutral-10' }
  if (bet.status === 'REJECTED')
    return { label: 'Rejected', className: 'bg-error-bg text-error' }
  if (bet.status === 'EXPIRED')
    return { label: 'Expired', className: 'bg-error-bg text-error' }
  if (bet.status === 'CANCELED')
    return { label: 'Cancelled', className: 'bg-hover/60 text-neutral-10' }
  // A resting limit order nobody has matched yet.
  if (bet.status === 'OPEN' || bet.status === 'PENDING')
    return { label: 'Waiting to match', className: 'bg-warning/20 text-warning' }
  return { label: 'Open', className: 'bg-warning/20 text-warning' }
}

// Once the market settles, the result says more than the fill status.
const RESULT_BADGE: Record<
  NonNullable<Bet['result']>,
  { label: string; className: string }
> = {
  WON: { label: 'Won', className: 'bg-success-bg text-success' },
  LOST: { label: 'Lost', className: 'bg-error-bg text-error' },
  VOID: { label: 'Refunded', className: 'bg-hover/60 text-neutral-10' },
}

const OrderRow = ({
  bet,
  onCancel,
}: {
  bet: Bet
  onCancel: (bet: Bet) => void
}) => {
  const label = bet.outcomeLabel ?? 'Outcome'
  const badge = betBadge(bet)
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
            {bet.type === 'limit' && (
              <span className='text-black'> · Limit order</span>
            )}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
            {filledPct != null && ` · ${filledPct}% filled`}
          </span>
        </div>
        {/* A settled or voided market is gone — no link to a dead page. */}
        <MarketTitleLink
          marketId={bet.marketId}
          marketStatus={bet.market?.status}
          settled={bet.result != null}
          className='mt-1 block max-w-md truncate text-left text-xs text-neutral-10'
        >
          {marketLabel(bet.market, bet.marketId)}
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
            {isPoolBet(bet)
              ? betPriceLabel(bet)
              : priceAndOdds(betPriceLabel(bet), oddsFromPrice(bet.price))}{' '}
            ·{' '}
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

// Tap to list every pick with its market and odds.
const ComboOrderRow = ({ combo }: { combo: ComboTicket }) => {
  const [expanded, setExpanded] = useState(false)
  const state = comboState(combo)
  const badge = COMBO_BADGE[state]
  const settled = combo.status !== 'OPEN'
  const toggle = () => setExpanded((e) => !e)
  return (
    <article
      role='button'
      tabIndex={0}
      aria-expanded={expanded}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
      className='flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-hover/40'
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold text-black'>
              Combo · {combo.legs.length} picks
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              className={`shrink-0 text-neutral-10 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
          {!expanded && (
            <p className='mt-1 max-w-md truncate text-xs text-neutral-10'>
              {combo.legs
                .map(
                  (leg) =>
                    leg.market?.eventTitle ?? leg.market?.title ?? leg.marketId,
                )
                .join(' · ')}
            </p>
          )}
          <p className='mt-1 text-xs text-placeholder'>
            {formatDate(combo.createdAt)}
          </p>
        </div>
        <div className='text-sm sm:text-right'>
          <p className='font-semibold text-black'>
            {formatCurrency(toMajorUnits(combo.stake.amount), combo.stake.currency)}
          </p>
          <p className='text-xs text-neutral-10'>
            {formatOdds(combo.combinedOdds)} ·{' '}
            {settled
              ? `${formatCurrency(toMajorUnits(combo.payout?.amount ?? 0), combo.stake.currency)} returned`
              : `${formatCurrency(
                  toMajorUnits(combo.potentialReturn.amount),
                  combo.potentialReturn.currency,
                )} to win`}
          </p>
        </div>
      </div>
      {expanded && <ComboLegs combo={combo} />}
    </article>
  )
}

const Orders = () => {
  const [filters, setFilters] = useState<OrderFilters>({ status: [] })
  const [betToCancel, setBetToCancel] = useState<Bet | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const filter = filters.status[0] as BetFilter | undefined

  // Resting orders get their own section on the unfiltered view so they're
  // never buried under history.
  const openQuery = useBets('OPEN', 50)
  // Always the full list (the API's status filter is the order's fill status,
  // and drops combos); the bet filter is applied below. Pages keep loading
  // while the sentinel is on screen, so a sparse filter still fills up.
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBets()

  const { mutateAsync: cancelBet, isPending: isCancelling } = useCancelBet(
    betToCancel?.id ?? '',
  )

  const openOrders = useMemo<Bet[]>(
    () => (openQuery.data?.pages ?? []).flatMap((page) => page.data),
    [openQuery.data],
  )
  const showOpenSection = !filter && openOrders.length > 0
  const openIds = useMemo(() => new Set(openOrders.map((b) => b.id)), [openOrders])
  const bets = useMemo<Bet[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.data)
        // Already listed above.
        .filter((b) => !(showOpenSection && openIds.has(b.id)))
        .filter((b) => !filter || betFilterOf(b) === filter),
    [data, showOpenSection, openIds, filter],
  )
  // Combos come on the first page only (unpaginated) — merged in by date.
  const rows = useMemo<OrderListItem[]>(
    () =>
      [
        ...bets.map((bet): OrderListItem => ({ kind: 'bet', at: bet.createdAt, bet })),
        ...(data?.pages?.[0]?.combos ?? [])
          .filter((c) => !filter || COMBO_FILTER[comboState(c)] === filter)
          .map(
            (combo): OrderListItem => ({ kind: 'combo', at: combo.createdAt, combo }),
          ),
      ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    [bets, data, filter],
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
          Bet History
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
          ) : rows.length === 0 && !hasNextPage ? (
            <p className='py-12 text-center text-sm text-neutral-10'>
              {filter ? 'No bets match this filter yet.' : 'No bets yet.'}
            </p>
          ) : (
            <div className='divide-y divide-border/40'>
              {rows.map((row) =>
                row.kind === 'combo' ? (
                  <ComboOrderRow key={`combo:${row.combo.id}`} combo={row.combo} />
                ) : (
                  <OrderRow
                    key={row.bet.id}
                    bet={row.bet}
                    onCancel={setBetToCancel}
                  />
                ),
              )}
              {hasNextPage && (
                <div ref={sentinelRef} className='flex justify-center py-3'>
                  {(isFetchingNextPage || rows.length === 0) && (
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
