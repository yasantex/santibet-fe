import type {
  BonusEventType,
  BonusStatus,
  CurrentBonus,
} from '../types/bonus.types'
import { NAIRA, toMajorUnits } from './functions'

/** ACTIVE or PENDING_KYC — the only states that hold a balance. */
export const isLiveBonus = (status?: BonusStatus | null) =>
  status === 'ACTIVE' || status === 'PENDING_KYC'

/**
 * Kobo string → "₦1,010" (no decimals when whole, as in the bonus copy) or
 * "₦1,010.50".
 */
export const formatKobo = (kobo?: string | number | null) => {
  const naira = toMajorUnits(kobo ?? 0)
  return `${NAIRA}${naira.toLocaleString('en-NG', {
    minimumFractionDigits: Number.isInteger(naira) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export const koboToNumber = (kobo?: string | number | null) =>
  Number(kobo ?? 0) || 0

export const bonusStatusMeta: Record<
  BonusStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Active', className: 'bg-surface-success text-success' },
  PENDING_KYC: {
    label: 'Verify to use',
    className: 'bg-warning/10 text-warning',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-surface-success text-success',
  },
  LOST: { label: 'Used up', className: 'bg-surface-hover text-black' },
  FORFEITED: { label: 'Forfeited', className: 'bg-surface-hover text-black' },
  EXPIRED: { label: 'Expired', className: 'bg-surface-error text-error' },
  VOIDED: { label: 'Voided', className: 'bg-surface-hover text-black' },
  CANCELLED: { label: 'Cancelled', className: 'bg-surface-hover text-black' },
  DECLINED: { label: 'Declined', className: 'bg-surface-hover text-black' },
  INELIGIBLE: {
    label: 'Not eligible',
    className: 'bg-surface-hover text-black',
  },
}

/** One plain sentence per ended bonus — never the internal `endedReason`. */
export const bonusEndedCopy: Partial<Record<BonusStatus, string>> = {
  COMPLETED: 'Terms met. The bonus was paid out to your cash balance.',
  LOST: 'The bonus credit was used up.',
  FORFEITED: 'Ended when you made a deposit.',
  EXPIRED: 'The bonus expired before its terms were met.',
  VOIDED: 'This bonus was voided.',
  CANCELLED: 'This bonus was cancelled.',
  DECLINED: 'You chose not to take this bonus.',
  INELIGIBLE: "This account wasn't eligible for this bonus.",
}

/**
 * History events. `sign` says how the amount reads on the bonus balance:
 * + adds to it, − takes from it, 0 is shown neutrally.
 */
export const bonusEventMeta: Record<
  BonusEventType,
  { label: string; sign: 1 | -1 | 0; hidden?: boolean }
> = {
  GRANTED: { label: 'Bonus added', sign: 1 },
  ACTIVATED: { label: 'Bonus activated', sign: 0 },
  BET_PLACED: { label: 'Bonus bet placed', sign: -1 },
  BET_RELEASED: { label: 'Bonus bet released', sign: 1 },
  BET_WON: { label: 'Bonus bet won', sign: 1 },
  BET_LOST: { label: 'Bonus bet lost', sign: 0 },
  BET_REFUNDED: { label: 'Bonus bet refunded', sign: 1 },
  CASH_RELEASED: { label: 'Moved to cash', sign: 0 },
  CREDIT_REMOVED: { label: 'Bonus credit removed', sign: -1 },
  WINNINGS_REMOVED: { label: 'Locked winnings removed', sign: -1 },
  COMPLETED: { label: 'Bonus completed', sign: 0 },
  LOST: { label: 'Bonus used up', sign: 0 },
  FORFEITED: { label: 'Bonus forfeited', sign: 0 },
  EXPIRED: { label: 'Bonus expired', sign: 0 },
  VOIDED: { label: 'Bonus voided', sign: 0 },
  CANCELLED: { label: 'Bonus cancelled', sign: 0 },
  EXPIRY_REMINDER: { label: 'Expiry reminder', sign: 0 },
  // Internal / review events: hidden from players.
  PAYOUT_FORFEITED: { label: 'Payout not credited', sign: 0, hidden: true },
  FLAGGED: { label: 'Under review', sign: 0, hidden: true },
  REVIEWED: { label: 'Reviewed', sign: 0, hidden: true },
  DECLINED: { label: 'Declined', sign: 0, hidden: true },
  INELIGIBLE: { label: 'Not eligible', sign: 0, hidden: true },
}

// ---------- Approved player copy (Testing Round 1, items 4–6) ----------
// Keep these word-for-word with the bonus T&Cs; the FAQ (admin-managed) must
// carry the same text.

/** New Member Bonus: how a winning bonus bet is paid. */
export const NEW_MEMBER_WINNINGS_COPY =
  'Wins go back to your bonus balance. Reach ₦10,101 and we pay you ₦1,010 in cash.'

/** Deposit and referral bonus: how a winning bonus bet is paid. */
export const PROFIT_BONUS_WINNINGS_COPY =
  'Your bonus stake is not returned. Profit from a winning bonus bet becomes cash once you have bet the full bonus once, within 14 days.'

/** Combo bets never take bonus credit. */
export const COMBO_CASH_ONLY_COPY =
  'Combo bets use cash only. Bonus credit applies to single YES/NO bets only.'

/** Shown when bonus credit would back both sides of a market. */
export const BONUS_ONE_SIDE_COPY =
  'Bonus credit can back only one side of a market. Use cash to bet on the other side.'

/** API code for backing both sides of a market while a bonus is live. */
export const BONUS_OPPOSITE_SIDE_CODE = 'BONUS_OPPOSITE_SIDE'

/** Player text for a bonus refusal: approved wording where we have it,
 *  otherwise the server's reason. */
export const bonusReasonText = (
  code: string | null | undefined,
  reason: string | null | undefined,
) => (code === BONUS_OPPOSITE_SIDE_CODE ? BONUS_ONE_SIDE_COPY : reason)

/** How a win on this bonus is paid, by where the bonus credits wins. */
export const bonusWinningsCopy = (creditsTo: 'BONUS_BALANCE' | 'LOCKED_WINNINGS') =>
  creditsTo === 'LOCKED_WINNINGS'
    ? PROFIT_BONUS_WINNINGS_COPY
    : NEW_MEMBER_WINNINGS_COPY

/** 422 codes from `POST /bets` and the eligibility check. */
export const BONUS_KYC_CODE = 'BONUS_PENDING_KYC'
export const isBonusErrorCode = (code?: string | null) =>
  !!code && code.startsWith('BONUS_')

/** Spec copy for the progress line on a bonus card. */
export const bonusGoalCopy = (bonus: CurrentBonus) => {
  if (bonus.completionMode === 'TARGET_BALANCE') {
    return `Grow it to ${formatKobo(bonus.progress.targetBalanceKobo)} and we'll give you ${formatKobo(bonus.maxCashoutKobo)} in cash.`
  }
  return `Bet your bonus credit ${formatKobo(bonus.progress.playthroughRequiredKobo ?? bonus.bonusAmountKobo)} in total to release your locked winnings (up to ${formatKobo(bonus.maxCashoutKobo)}).`
}

/** Bonus rules as short player-facing lines. */
export const bonusRuleLines = (bonus: CurrentBonus) => {
  const { rules } = bonus
  const lines = [
    `Bets need a chance between ${Math.round(rules.minPrice * 100)}% and ${Math.round(rules.maxPrice * 100)}%.`,
    `The market must close at least ${
      rules.minMinutesToClose >= 60 && rules.minMinutesToClose % 60 === 0
        ? `${rules.minMinutesToClose / 60} hour${rules.minMinutesToClose === 60 ? '' : 's'}`
        : `${rules.minMinutesToClose} minutes`
    } from now.`,
    rules.allowLive
      ? 'Live markets are allowed.'
      : "Live (in-play) markets can't use bonus.",
    BONUS_ONE_SIDE_COPY,
    'Bonus bets are placed at the current price and can’t be cashed out.',
    bonusWinningsCopy(
      bonus.payoutMode === 'PROFIT_LOCKED' ? 'LOCKED_WINNINGS' : 'BONUS_BALANCE',
    ),
    COMBO_CASH_ONLY_COPY,
  ]
  if (rules.minStakeKobo) {
    lines.push(`The smallest bonus bet is ${formatKobo(rules.minStakeKobo)}.`)
  }
  if (rules.maxStakeKobo) {
    lines.push(`The largest bonus bet is ${formatKobo(rules.maxStakeKobo)}.`)
  }
  lines.push(
    `You can cash out at most ${formatKobo(bonus.maxCashoutKobo)} from this bonus.`,
  )
  return lines
}

// ---------- "Bonus added" banner: remember which bonus ids were shown ----------

const SEEN_KEY = 'santibet_seen_bonus_ids'

const readSeen = (): string[] => {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

export const hasSeenBonus = (id: string) => readSeen().includes(id)

export const markBonusSeen = (id: string) => {
  try {
    const next = [id, ...readSeen().filter((v) => v !== id)].slice(0, 20)
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable — the banner may show again next visit
  }
}
