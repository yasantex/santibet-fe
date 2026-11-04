import { CHART_RANGES } from '../data_layer/markets'
import type { ChartMode, ChartPoint, UiMarket } from '../types/market.types'

/** Line colours for multi-outcome charts, lead outcome first. */
export const LINE_COLORS = [
  'var(--color-brand-green)',
  '#3b82f6',
  '#f59e0b',
  '#f97316',
]

export type ChartRow = Record<string, number>

/**
 * Put each outcome's series on one timeline, keyed s0..sN for the chart lines
 * (a series holds its last value until its next point). With no history yet,
 * falls back to a flat line at each outcome's current chance — true to the
 * market's present state, no fabricated movement.
 */
export const mergeSeries = (
  series: ChartPoint[][],
  rows: UiMarket[],
  range: ChartMode,
): ChartRow[] => {
  const times = [...new Set(series.flatMap((s) => s.map((p) => p.t)))].sort(
    (a, b) => a - b,
  )
  const cursor = series.map(() => 0)
  const last: (number | undefined)[] = series.map(() => undefined)
  const merged = times.map((t) => {
    const row: ChartRow = { t }
    series.forEach((s, i) => {
      while (cursor[i] < s.length && s[cursor[i]].t <= t) {
        last[i] = s[cursor[i]].value
        cursor[i]++
      }
      if (last[i] != null) row[`s${i}`] = last[i]
    })
    return row
  })
  if (merged.length > 1) return merged

  const now = Date.now()
  const start = now - (CHART_RANGES[range].windowMs ?? 60 * 60 * 1000)
  return [start, now].map((t) => {
    const row: ChartRow = { t }
    rows.forEach((m, i) => (row[`s${i}`] = m.yes?.percent ?? 0))
    return row
  })
}
