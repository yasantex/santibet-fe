import {
  openPositionMark,
  toMajorUnits,
} from '../../utils/functions'
import type { BetPosition, ComboTicket } from '../../types/bet.types'

export type PositionSort = 'value' | 'traded' | 'toWin' | 'pnl' | 'newest'

export const POSITION_SORTS: { value: PositionSort; label: string }[] = [
  { value: 'value', label: 'Cash out value' },
  { value: 'traded', label: 'Stake' },
  { value: 'toWin', label: 'Potential Winnings' },
  { value: 'pnl', label: 'Live P/L' },
  { value: 'newest', label: 'Newest' },
]

// Event / Your Pick | Odds: Bought → Now | Stake | Potential Winnings | Cash Out Value | actions
export const POSITION_GRID =
  'md:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_9rem]'

/** One row's numbers, shared by sorting and rendering. */
export type PositionRow =
  | {
      kind: 'position'
      id: string
      at: number
      title: string
      position: BetPosition
      traded: number
      toWin: number
      /** Null on a pool position: no live value until the market closes. */
      value: number | null
      pnl: number | null
    }
  | {
      kind: 'combo'
      id: string
      at: number
      title: string
      combo: ComboTicket
      traded: number
      toWin: number
      value: null
      pnl: null
    }

const toPositionRows = (positions: BetPosition[], combos: ComboTicket[]): PositionRow[] => [
  ...combos.map<PositionRow>((combo) => ({
    kind: 'combo',
    id: `combo-${combo.id}`,
    at: new Date(combo.createdAt).getTime() || 0,
    title: `Combo · ${combo.legs.length} legs`,
    combo,
    traded: toMajorUnits(combo.stake.amount),
    toWin: toMajorUnits(combo.potentialReturn.amount),
    value: null,
    pnl: null,
  })),
  ...positions.map<PositionRow>((position) => {
    const { staked, value, pnl, estPayout } = openPositionMark(position)
    return {
      kind: 'position',
      id: position.id,
      at: new Date(position.openedAt).getTime() || 0,
      title: position.market?.title ?? 'Market',
      position,
      traded: staked,
      toWin: estPayout ?? 0,
      value,
      pnl,
    }
  }),
]

const SORTERS: Record<PositionSort, (a: PositionRow, b: PositionRow) => number> = {
  // Unvalued (pool) rows rank by what they'd pay, so they don't all sink.
  value: (a, b) => (b.value ?? b.toWin) - (a.value ?? a.toWin),
  traded: (a, b) => b.traded - a.traded,
  toWin: (a, b) => b.toWin - a.toWin,
  pnl: (a, b) => (b.pnl ?? 0) - (a.pnl ?? 0),
  newest: (a, b) => b.at - a.at,
}

const matches = (row: PositionRow, q: string) => {
  if (!q) return true
  const haystack =
    row.kind === 'combo'
      ? row.combo.legs
          .map((l) => `${l.market?.title ?? ''} ${l.outcomeLabel ?? ''}`)
          .join(' ')
      : `${row.title} ${row.position.outcomeLabel ?? ''}`
  return haystack.toLowerCase().includes(q)
}

export const sortPositionRows = (
  positions: BetPosition[],
  combos: ComboTicket[],
  search: string,
  sort: PositionSort,
) => {
  const q = search.trim().toLowerCase()
  return toPositionRows(positions, combos)
    .filter((r) => matches(r, q))
    .sort(SORTERS[sort])
}
