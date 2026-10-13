import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../utils/hooks'
import {
  addOrReplaceMarketLeg,
  clearSlip,
  removeLeg,
  MAX_COMBO_LEGS,
} from '../redux/comboSlipSlice'
import { marketSport } from '../utils/marketDisplay'
import { toMajorUnits } from '../utils/functions'
import { showWarningToast } from '../utils/toastUtils'
import type { UiMarket, UiOutcome } from '../types/market.types'
import type { ComboLeg } from '../types/combo.types'

/** Shown when a second market from an already-selected event is attempted. */
export const ONE_PER_EVENT_MESSAGE =
  'You can only select one market per event in a combo bet.'

/** Combos are sports-only — any market in the Sports category (incl. the
 *  API-Sports match markets, whose series key resolves to a sport). */
export const isSportsMarket = (market: {
  seriesKey?: string | null
  category?: string
  categorySlug?: string
}): boolean =>
  market.categorySlug === 'sports' ||
  (market.category ?? '').toLowerCase() === 'sports' ||
  marketSport(market) !== null

export const MIN_COMBO_LEGS = 2

const toLeg = (market: UiMarket, outcome: UiOutcome): ComboLeg => ({
  marketId: market.id,
  eventId: market.eventId || market.id,
  outcomeId: outcome.id,
  outcomeLabel: outcome.label,
  marketTitle: market.title,
  eventTitle: market.eventTitle || market.title,
  league: market.subtitle || undefined,
  imageUrl: market.imageUrl ?? null,
  price: outcome.price,
  minStakeMinor: market.minStakeMinor ?? null,
  addedAt: Date.now(),
})

/**
 * Combo (parlay) bet slip: a set of sports selections that all have to win.
 * Combined decimal odds are the product of each leg's (1 / implied-probability),
 * so the payout is `stake × combinedOdds`. Backed by a persisted Redux slice,
 * so the slip survives navigation and refresh.
 */
export const useComboSlip = () => {
  const dispatch = useAppDispatch()
  const legs = useAppSelector((s) => s.comboSlip.legs)

  const derived = useMemo(() => {
    const prices = legs.map((l) => l.price)
    const hasInvalidLeg = prices.some((p) => !(p > 0))
    // Combined implied probability = product of each leg's probability.
    const comboProb = prices.reduce((acc, p) => acc * (p > 0 ? p : 0), 1)
    const combinedOdds =
      legs.length && !hasInvalidLeg && comboProb > 0 ? 1 / comboProb : 0
    const minStakeNaira = legs.reduce<number | null>((max, l) => {
      if (l.minStakeMinor == null) return max
      const naira = toMajorUnits(l.minStakeMinor)
      return max == null ? naira : Math.max(max, naira)
    }, null)
    return { hasInvalidLeg, combinedOdds, minStakeNaira }
  }, [legs])

  const isInSlip = (outcomeId: string) =>
    legs.some((l) => l.outcomeId === outcomeId)

  /** The outcome selected for a given market (for highlighting on cards). */
  const selectedOutcomeIdForMarket = (marketId?: string) =>
    marketId ? (legs.find((l) => l.marketId === marketId)?.outcomeId ?? null) : null

  /**
   * Toggle a selection on the ticket, enforcing one market per event:
   * - tapping the same outcome again removes it,
   * - tapping a different outcome of a market already on the ticket switches
   *   the pick within that market (allowed),
   * - tapping a market from an event that already has a *different* market is
   *   blocked with a clear message,
   * - otherwise it's added (up to the leg cap).
   */
  const toggle = (market: UiMarket, outcome: UiOutcome) => {
    const eventId = market.eventId || market.id
    // Same outcome already selected → deselect.
    if (legs.some((l) => l.outcomeId === outcome.id)) {
      dispatch(removeLeg(outcome.id))
      return
    }
    const sameMarketOnTicket = legs.some((l) => l.marketId === market.id)
    if (!sameMarketOnTicket) {
      // A different market from the same event is not allowed on a combo.
      if (legs.some((l) => l.eventId === eventId)) {
        showWarningToast(ONE_PER_EVENT_MESSAGE)
        return
      }
      if (legs.length >= MAX_COMBO_LEGS) {
        showWarningToast(`A combo can have at most ${MAX_COMBO_LEGS} selections.`)
        return
      }
    }
    dispatch(addOrReplaceMarketLeg(toLeg(market, outcome)))
  }

  const remove = (outcomeId: string) => dispatch(removeLeg(outcomeId))
  const clear = () => dispatch(clearSlip())

  /** Potential payout for a naira stake at the current combined odds. */
  const payout = (stakeNaira: number) =>
    derived.combinedOdds > 0 ? stakeNaira * derived.combinedOdds : 0

  return {
    legs,
    legCount: legs.length,
    maxLegs: MAX_COMBO_LEGS,
    minLegs: MIN_COMBO_LEGS,
    combinedOdds: derived.combinedOdds,
    hasInvalidLeg: derived.hasInvalidLeg,
    minStakeNaira: derived.minStakeNaira,
    isInSlip,
    selectedOutcomeIdForMarket,
    toggle,
    remove,
    clear,
    payout,
  }
}
