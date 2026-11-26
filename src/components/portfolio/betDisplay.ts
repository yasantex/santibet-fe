import { useOddsFormat } from '../../hooks/useOddsFormat'
import { formatOdds, oddsFromPrice } from '../../utils/odds'
import { formatCurrency, toMajorUnits } from '../../utils/functions'
import type { MarketSummary, Money, RefundReason } from '../../types/bet.types'

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

const REFUND_REASON_TEXT: Record<RefundReason, string> = {
  MARKET_VOIDED: 'The market was voided',
  EVENT_CANCELLED: 'The match was cancelled or postponed',
  ADMIN_VOID: 'The market was voided by SantiBet',
  DUPLICATE_SOURCE: 'The market was withdrawn',
  POOL_NO_OPPOSITION: 'Nobody bet against your pick',
  POOL_NO_WINNER: 'Nobody picked the winning outcome',
  PARTIAL_UNMATCHED: "Part of your bet wasn't matched",
}

/**
 * Why a stake came back (UAT 06-06), in plain words: the row's own refund
 * code, else the market's `voidCode`, else "The market was voided" when the
 * market was. Null when the API gives no reason (or a code we don't know yet);
 * the caller then shows the plain "Refunded" status, never a guessed reason.
 * The market's free-text `voidReason` isn't written for players, so it's not
 * shown.
 */
export const refundReason = (
  code: string | null | undefined,
  market?: MarketSummary | null,
): string | null => {
  const known = (c?: string | null) =>
    c && c in REFUND_REASON_TEXT ? REFUND_REASON_TEXT[c as RefundReason] : null
  return (
    known(code) ??
    known(market?.result?.voidCode) ??
    (market?.result?.status === 'VOIDED' || market?.status === 'VOIDED'
      ? REFUND_REASON_TEXT.MARKET_VOIDED
      : null)
  )
}

/**
 * The refund line under a refunded bet: "Refunded ₦500.00 · Nobody bet
 * against your pick". Either part can be missing; null when both are.
 */
export const refundLine = (
  amount: Money | null | undefined,
  reason: string | null,
): string | null => {
  const naira = amount ? formatCurrency(toMajorUnits(amount.amount)) : null
  if (naira && reason) return `Refunded ${naira} · ${reason}`
  if (naira) return `Refunded ${naira}`
  return reason ? `Refunded: ${reason}` : null
}

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

