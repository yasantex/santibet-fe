/**
 * Decimal odds: one rule for every surface (SB-055).
 *
 *   decimal odds = payout per share / price per share = ₦100 / price
 *                = 1 / probability
 *
 * Shown to two decimal places, rounded half up, with an "x" suffix:
 * a ₦53 share pays ₦100, so 100 / 53 = 1.8868 → "1.89x".
 *
 * When the API sends its own `decimalOdds` (net of fees, or a pool's
 * effective odds) that number wins, since it is what the player is paid.
 */

/** Round half up to two decimal places, safe for values like 1.005. */
export const roundOdds = (odds: number): number =>
  Math.round((odds + Number.EPSILON) * 100) / 100

/**
 * Decimal odds from a share price, or 0 when there is no price. Takes a
 * probability in (0, 1] or a naira price out of ₦100 (as `formatSharePrice`
 * does): 0.53 and 53 both give 1.8868.
 */
export const oddsFromPrice = (price?: number | string | null): number => {
  const p = Number(price)
  if (!(p > 0)) return 0
  return p <= 1 ? 1 / p : p < 100 ? 100 / p : 1
}

/** The odds to show for an outcome: the API's own figure, else 1 / price. */
export const outcomeOdds = (outcome?: {
  price?: number | string | null
  decimalOdds?: number | string | null
} | null): number => {
  const api = Number(outcome?.decimalOdds)
  return api > 0 ? api : oddsFromPrice(outcome?.price)
}

/** "1.89x", or an empty-value dash when there are no odds. */
export const formatOdds = (odds?: number | string | null): string => {
  const n = Number(odds)
  return n > 0 ? `${roundOdds(n).toFixed(2)}x` : '-'
}

/** Share price and its odds together, e.g. "₦53 / 1.89x" (SB-042). */
export const priceAndOdds = (priceText: string, odds: number): string =>
  odds > 0 ? `${priceText} / ${formatOdds(odds)}` : priceText
