import {
  betPriceLabel,
  formatSharePrice,
  isPoolBet,
  isPoolPosition,
  toMajorUnits,
} from '../../utils/functions'
import type { Bet, BetPosition, ComboTicket } from '../../types/bet.types'
import { formatOdds } from '../../utils/odds'
import { isRefundedCombo, isRefundedPosition, marketLabel } from './betDisplay'

export type ActivityKind =
  | 'buy'
  | 'won'
  | 'lost'
  | 'cashout'
  | 'refund'
  | 'order'
  | 'canceled'
  | 'rejected'

export type ActivityFilter = 'all' | 'buy' | 'won' | 'lost' | 'cashout' | 'refund' | 'other'

export const ACTIVITY_FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'buy', label: 'Buys' },
  { value: 'won', label: 'Wins' },
  { value: 'lost', label: 'Losses' },
  { value: 'cashout', label: 'Cash outs' },
  { value: 'refund', label: 'Refunds' },
  { value: 'other', label: 'Cancelled / rejected' },
]

export type HistorySort = 'newest' | 'oldest'
export const HISTORY_SORTS: { value: HistorySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

export type Activity = {
  id: string
  kind: ActivityKind
  at: number
  iso: string
  title: string
  imageUrl?: string | null
  marketId?: string
  marketStatus?: string
  settled: boolean
  outcomeLabel: string
  price?: string
  /** Probability (0–1) the pick was bought at, shown as odds and chance. */
  probability?: number
  /** Set on combo rows, which expand to list every leg. */
  combo?: ComboTicket
  /** Signed naira; null shows a dash (a loss, or an order that never filled). */
  value: number | null
}

const FILTER_KINDS: Record<Exclude<ActivityFilter, 'all'>, ActivityKind[]> = {
  buy: ['buy', 'order'],
  won: ['won'],
  lost: ['lost'],
  cashout: ['cashout'],
  refund: ['refund'],
  other: ['canceled', 'rejected'],
}

const time = (iso?: string | null) => new Date(iso ?? '').getTime() || 0

/** Whether a single bet is finished: it has a result, or its market does. */
const isBetFinished = (bet: Bet) =>
  bet.result != null ||
  bet.market?.status === 'SETTLED' ||
  bet.market?.status === 'VOIDED'

/**
 * A bet's row in the settled feed, or null while it's still live: open bets
 * live on the Open tab and unmatched orders on Pending Orders.
 */
const betActivity = (bet: Bet): Activity | null => {
  const stake = toMajorUnits(bet.stake.amount)
  const kind: ActivityKind =
    bet.status === 'FILLED' || bet.status === 'PARTIALLY_FILLED'
      ? 'buy'
      : bet.status === 'OPEN' || bet.status === 'PENDING'
        ? 'order'
        : bet.status === 'CANCELED' || bet.status === 'EXPIRED'
          ? 'canceled'
          : 'rejected'
  if (kind === 'order') return null
  if (kind === 'buy' && !isBetFinished(bet)) return null
  return {
    id: `bet-${bet.id}`,
    kind,
    at: time(bet.createdAt),
    iso: bet.createdAt,
    title: marketLabel(bet.market),
    imageUrl: bet.market?.imageUrl,
    marketId: bet.marketId,
    marketStatus: bet.market?.status,
    settled: bet.result != null,
    outcomeLabel: bet.outcomeLabel ?? 'Outcome',
    price: betPriceLabel(bet),
    // Pool bets' price label is already their odds.
    probability: isPoolBet(bet) ? undefined : Number(bet.price) || undefined,
    value: kind === 'buy' ? -stake : null,
  }
}

/** A finished position's outcome: won, lost, cashed out or refunded. */
const positionActivity = (p: BetPosition): Activity | null => {
  if (p.status === 'OPEN' || !p.result) return null
  const staked = p.stake ? toMajorUnits(p.stake.amount) : 0
  const pnl = p.realizedPnl ? toMajorUnits(p.realizedPnl.amount) : 0
  const kind: ActivityKind =
    p.result === 'CASHED_OUT'
      ? 'cashout'
      : isRefundedPosition(p)
        ? 'refund'
        : p.result === 'WON'
          ? 'won'
          : p.result === 'LOST'
            ? 'lost'
            : 'refund'
  const iso = p.settledAt ?? p.openedAt
  return {
    id: `pos-${p.id}`,
    kind,
    at: time(iso),
    iso,
    title: marketLabel(p.market),
    imageUrl: p.market?.imageUrl,
    marketId: p.marketId,
    marketStatus: p.market?.status,
    settled: kind !== 'cashout',
    outcomeLabel: p.outcomeLabel ?? 'Outcome',
    price: isPoolPosition(p) ? undefined : formatSharePrice(Number(p.avgPrice) || 0),
    probability: isPoolPosition(p) ? undefined : Number(p.avgPrice) || undefined,
    // Payout = stake back plus the realized profit (or minus the loss).
    value: kind === 'lost' ? null : kind === 'refund' ? staked : staked + pnl,
  }
}

const comboActivity = (c: ComboTicket): Activity[] => {
  // Still waiting on legs: it belongs on the Open tab.
  if (c.status === 'OPEN') return []
  const base = {
    title: `Combo · ${c.legs.length} legs`,
    imageUrl: c.legs[0]?.market?.imageUrl,
    settled: true,
    outcomeLabel: 'Combined',
    price: formatOdds(c.combinedOdds),
    combo: c,
  }
  const stake = toMajorUnits(c.stake.amount)
  const items: Activity[] = [
    {
      ...base,
      id: `combo-${c.id}`,
      kind: 'buy',
      at: time(c.createdAt),
      iso: c.createdAt,
      value: -stake,
    },
  ]
  if (c.settledAt) {
    items.push({
      ...base,
      id: `combo-${c.id}-result`,
      kind: isRefundedCombo(c)
        ? 'refund'
        : c.status === 'WON'
          ? 'won'
          : c.status === 'LOST'
            ? 'lost'
            : 'refund',
      at: time(c.settledAt),
      iso: c.settledAt,
      value:
        c.status === 'LOST'
          ? null
          : c.payout
            ? toMajorUnits(c.payout.amount)
            : stake,
    })
  }
  return items
}

/**
 * One activity feed from the bets list (buys), finished positions (results)
 * and combos. Items older than the oldest loaded page of a source that still
 * has more are held back so they slot in at the right place once it loads.
 */
export const buildActivity = ({
  bets,
  settledPositions,
  combos,
  betsCutoff,
  positionsCutoff,
}: {
  bets: Bet[]
  settledPositions: BetPosition[]
  combos: ComboTicket[]
  betsCutoff: number
  positionsCutoff: number
}): Activity[] => {
  const cutoff = Math.max(betsCutoff, positionsCutoff)
  return [
    ...bets.map(betActivity).filter((a): a is Activity => !!a),
    ...settledPositions.map(positionActivity).filter((a): a is Activity => !!a),
    ...combos.flatMap(comboActivity),
  ].filter((a) => a.at >= cutoff)
}

export const filterActivity = (
  items: Activity[],
  filter: ActivityFilter,
  search: string,
  sort: HistorySort,
) => {
  const q = search.trim().toLowerCase()
  return items
    .filter((a) => filter === 'all' || FILTER_KINDS[filter].includes(a.kind))
    .filter(
      (a) =>
        !q ||
        `${a.title} ${a.outcomeLabel} ${(a.combo?.legs ?? [])
          .map((l) => `${l.market?.eventTitle ?? ''} ${l.market?.title ?? ''} ${l.outcomeLabel ?? ''}`)
          .join(' ')}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) => (sort === 'newest' ? b.at - a.at : a.at - b.at))
}
