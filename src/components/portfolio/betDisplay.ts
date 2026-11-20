import { useOddsFormat } from '../../hooks/useOddsFormat'
import { formatOdds, oddsFromPrice } from '../../utils/odds'
import type {
  BetPosition,
  ComboTicket,
  MarketSummary,
} from '../../types/bet.types'

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

/** A voided market hands stakes back: never a win, whatever `result` says. */
const isVoidedMarket = (market?: MarketSummary | null) =>
  market?.status === 'VOIDED'

/**
 * A settled position that only gave the stake back. The API can mark these
 * WON (e.g. a voided market, or a pool nobody bet against), so a "win" whose
 * realized profit is reported as zero reads as a refund. A missing
 * `realizedPnl` says nothing either way: the WON stands.
 */
export const isRefundedPosition = (p: BetPosition) =>
  p.result === 'VOID' ||
  isVoidedMarket(p.market) ||
  (p.result === 'WON' &&
    p.realizedPnl != null &&
    Number(p.realizedPnl.amount) <= 0)

/** A combo that only gave the stake back (every leg voided, say). */
export const isRefundedCombo = (c: ComboTicket) =>
  c.status === 'VOID' ||
  (c.status === 'WON' &&
    c.payout != null &&
    Number(c.payout.amount) <= Number(c.stake.amount))

/** A settled single bet: refunded when its market was voided. */
export const betResult = (
  result: 'WON' | 'LOST' | 'VOID' | null | undefined,
  market?: MarketSummary | null,
) => (result && isVoidedMarket(market) ? 'VOID' : result)

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

