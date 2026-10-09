import type { Money } from './bet.types'

/**
 * One selection in a combo (parlay) bet slip. Self-contained so the slip can
 * render — and survive a refresh — without re-fetching the market. Combos are
 * sports-only: every leg comes from a different sporting event, and the combo
 * wins only if every leg wins.
 */
export interface ComboLeg {
  /** Market the selection belongs to (e.g. "Match Winner"). */
  marketId: string
  /** Parent event — one leg max per event (no correlated same-game legs). */
  eventId: string
  /** The selected outcome. */
  outcomeId: string
  outcomeLabel: string
  /** Market title, e.g. "Match Winner". */
  marketTitle: string
  /** Event/game title, e.g. "Arsenal vs Chelsea". */
  eventTitle: string
  /** League/competition (market subtitle), e.g. "Premier League". */
  league?: string
  imageUrl?: string | null
  /** Implied probability (0–1) captured when the leg was added. */
  price: number
  /** Per-market minimum stake (kobo), if known. */
  minStakeMinor?: number | null
  addedAt: number
}

export interface ComboBetPayload {
  /** Stake for the whole combo, in kobo (minor units). */
  stake: string
  legs: { marketId: string; outcomeId: string }[]
}

export interface ComboBetResponse {
  id: string
  status: string
  stake: Money
  /** Combined decimal odds the combo was accepted at. */
  combinedOdds: string | number
  potentialReturn: Money
  legs: {
    marketId: string
    outcomeId: string
    status: string
    price: string | number
  }[]
  createdAt: string
}
