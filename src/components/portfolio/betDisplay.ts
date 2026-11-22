import { useOddsFormat } from '../../hooks/useOddsFormat'
import { formatOdds, oddsFromPrice } from '../../utils/odds'
import type { MarketSummary } from '../../types/bet.types'

/** "Arsenal vs Chelsea · Match Winner" for a sports market, else its title. */
export const marketLabel = (
  market: MarketSummary | null | undefined,
  fallback = 'Market',
) =>
  market
    ? market.eventTitle
      ? `${market.eventTitle} · ${market.title}`
      : market.title
    : fallback

/**
 * A probability price (0–1) as odds and chance, in the player's chosen format
 * first: "1.89x · 53%" or "53% · 1.89x".
 */
export const usePriceOdds = () => {
  const { format } = useOddsFormat()
  return (price?: number | string | null) => {
    const p = Number(price)
    if (!(p > 0)) return ''
    const odds = formatOdds(oddsFromPrice(p))
    const pct = p <= 1 ? p * 100 : p
    const chance = pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`
    return format === 'odds' ? `${odds} · ${chance}` : `${chance} · ${odds}`
  }
}

