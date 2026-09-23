import type { ChartUnit } from '../types/market.types'

const usd = (v: number, digits: number) =>
  `$${v.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`

/** Tooltip/headline value: "4.0%" / "<1%" for chances, "$86,081.25" for prices. */
export const formatChartValue = (value: number, unit: ChartUnit): string => {
  if (unit === 'usd') return usd(value, 2)
  if (value > 0 && value < 1) return '<1%'
  return `${value.toFixed(1)}%`
}

/** Compact y-axis tick: "40%" or "$86,090". */
export const formatChartTick = (value: number, unit: ChartUnit): string =>
  unit === 'usd' ? usd(value, 0) : `${Math.round(value)}%`

/**
 * Y-axis domain. Chances get a padded 0–100 window (so a 3.95%→4.05% wobble
 * doesn't fill the whole chart); prices auto-scale tightly around the data.
 */
export const chartDomain = (
  unit: ChartUnit,
): [(min: number) => number, (max: number) => number] | ['auto', 'auto'] =>
  unit === 'usd'
    ? ['auto', 'auto']
    : [
        (min) => Math.max(0, Math.floor((min - 5) / 5) * 5),
        (max) => Math.min(100, Math.ceil((max + 5) / 5) * 5),
      ]
