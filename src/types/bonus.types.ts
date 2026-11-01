/**
 * Player bonus engine (`/api/bonuses/*`). Money is kobo as a string
 * everywhere ("101000" = ₦1,010). See docs/API_SPECS_player_app_bonuses.md.
 */

export type BonusType = 'NO_DEPOSIT' | 'DEPOSIT_MATCH'

export type BonusStatus =
  | 'ACTIVE'
  | 'PENDING_KYC'
  | 'COMPLETED'
  | 'LOST'
  | 'FORFEITED'
  | 'EXPIRED'
  | 'VOIDED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'INELIGIBLE'

/** Where a winning bonus bet is credited. */
export type BonusPayoutMode = 'BALANCE' | 'PROFIT_LOCKED'

/** How the bonus turns into cash. */
export type BonusCompletionMode = 'TARGET_BALANCE' | 'PLAYTHROUGH'

export type FundedBy = 'CASH' | 'BONUS'

export interface BonusProgress {
  percent: number
  targetBalanceKobo: string | null
  playthroughRequiredKobo: string | null
  remainingToBetKobo: string | null
}

export interface BonusRules {
  minPrice: number
  maxPrice: number
  minMinutesToClose: number
  allowLive: boolean
  oppositeSideScope: 'MARKET' | 'EVENT'
  minStakeKobo: string | null
  maxStakeKobo: string | null
  defaultUseBonus: boolean
  cashOutAllowed: boolean
}

export interface BonusDisplay {
  title?: string | null
  grantedMessage?: string | null
  offerText?: string | null
  forfeitWarning?: string | null
  termsUrl?: string | null
}

/** The live bonus — a user holds at most one (ACTIVE or PENDING_KYC). */
export interface CurrentBonus {
  id: string
  promotionId: string
  code: string
  type: BonusType
  title: string
  status: BonusStatus
  canBet: boolean
  kycRequired: boolean
  bonusAmountKobo: string
  balanceKobo: string
  lockedWinningsKobo: string
  stakedKobo: string
  payoutMode: BonusPayoutMode
  completionMode: BonusCompletionMode
  progress: BonusProgress
  maxCashoutKobo: string
  openBets: { count: number; stakeKobo: string }
  grantedAt: string | null
  activatedAt: string | null
  expiresAt: string | null
  daysLeft: number | null
  rules: BonusRules
  display: BonusDisplay
}

export interface CurrentBonusResponse {
  bonus: CurrentBonus | null
}

export interface BonusSummary {
  id: string
  code: string
  type: BonusType
  title: string
  status: BonusStatus
  bonusAmountKobo: string
  cashReleasedKobo: string
  grantedAt: string | null
  endedAt: string | null
  /** Internal reason code — never shown to players. */
  endedReason: string | null
}

export interface BonusListResponse {
  data: BonusSummary[]
}

export type BonusOfferHiddenReason =
  | 'NOT_FIRST_DEPOSIT'
  | 'ALREADY_DECIDED'
  | 'NO_PROMOTION'
  | 'PAUSED'

/** The deposit-screen tickbox for the first-deposit bonus. */
export interface BonusOffer {
  show: boolean
  hiddenReason: BonusOfferHiddenReason | string | null
  promotionId: string | null
  code: string | null
  label: string | null
  defaultChecked: boolean
  matchPercent: number | null
  minDepositKobo: string | null
  maxBonusKobo: string | null
  expiryDays: number | null
  kycRequired: boolean
  termsUrl: string | null
  /** Shown whenever set — any deposit ends a live new-member bonus. */
  forfeitWarning: string | null
}

export interface BonusEligibilityOutcome {
  outcomeId: string
  label: string
  price: number | null
  eligible: boolean
  code: string | null
  reason: string | null
}

export interface BonusEligibilityResponse {
  marketId: string
  bonus: { id: string; status: BonusStatus; balanceKobo: string } | null
  outcomes: BonusEligibilityOutcome[]
}

export type BonusEventType =
  | 'GRANTED'
  | 'ACTIVATED'
  | 'DECLINED'
  | 'INELIGIBLE'
  | 'BET_PLACED'
  | 'BET_RELEASED'
  | 'BET_WON'
  | 'BET_LOST'
  | 'BET_REFUNDED'
  | 'PAYOUT_FORFEITED'
  | 'CASH_RELEASED'
  | 'CREDIT_REMOVED'
  | 'WINNINGS_REMOVED'
  | 'COMPLETED'
  | 'LOST'
  | 'FORFEITED'
  | 'EXPIRED'
  | 'VOIDED'
  | 'CANCELLED'
  | 'EXPIRY_REMINDER'
  | 'FLAGGED'
  | 'REVIEWED'

export interface BonusHistoryEntry {
  id: string
  userBonusId: string
  code: string
  title: string
  type: BonusEventType
  amountKobo: string
  betId: string | null
  note: string | null
  balanceAfterKobo: string | null
  lockedAfterKobo: string | null
  createdAt: string
}

export interface BonusHistoryResponse {
  data: BonusHistoryEntry[]
  nextCursor: string | null
}

/** `bonus` block on `POST /bets/quote` when `useBonus: true`. */
export interface BonusQuote {
  eligible: boolean
  code: string | null
  reason: string | null
  creditsTo: 'BONUS_BALANCE' | 'LOCKED_WINNINGS'
  creditOnWin: { amount: string; currency: string }
}

/** `data.event` on a `BONUS_UPDATE` notification. */
export type BonusUpdateEvent =
  | 'GRANTED'
  | 'ACTIVATED'
  | 'BET_WON'
  | 'COMPLETED'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'LOST'
  | 'FORFEITED'
  | 'VOIDED'
  | 'CANCELLED'
