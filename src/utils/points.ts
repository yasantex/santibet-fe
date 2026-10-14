import {
  Award01Icon,
  ChampionIcon,
  Coins01Icon,
  Crown02Icon,
  Fire02Icon,
  FlashIcon,
  Medal01Icon,
  StarIcon,
  Target02Icon,
  UserGroupIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import type { StatusConfig } from '../types/types'
import type {
  BadgeCriterion,
  PointsSource,
  ReferralRewardKind,
  ReferralRewardStatus,
  ReferralTrigger,
} from '../types/points.types'
import { formatCurrency } from './functions'

export const pointsSourceLabels: Record<PointsSource, string> = {
  WIN: 'Market win',
  STREAK: 'Winning streak',
  DEPOSIT: 'Deposit',
  REFERRAL: 'Friend referred',
  REFEREE: 'Joined with a referral',
  ADJUSTMENT: 'Adjustment',
}

export const formatPoints = (points: number) =>
  new Intl.NumberFormat('en-US').format(points)

/** "14 Oct 2026" — date only. */
export const formatShortDate = (iso: string) => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** "+15" / "-10" for a ledger entry. */
export const formatPointsDelta = (points: number) =>
  `${points > 0 ? '+' : points < 0 ? '−' : ''}${formatPoints(Math.abs(points))}`

/** What a referred friend has to do before they count, as a clause. */
export const referralTriggerCopy: Record<ReferralTrigger, string> = {
  KYC_APPROVED: 'when they verify their identity',
  FIRST_DEPOSIT: 'when they make their first deposit',
  FIRST_BET_SETTLED: 'when their first bet is settled',
}

export const referralTriggerStep: Record<ReferralTrigger, string> = {
  KYC_APPROVED: 'They verify their identity',
  FIRST_DEPOSIT: 'They make a first deposit',
  FIRST_BET_SETTLED: 'Their first bet settles',
}

export const referralRewardStatusConfig: StatusConfig[] = [
  { label: 'Pending', value: 'PENDING', color: 'orange' },
  { label: 'Sending', value: 'SENDING', color: 'orange' },
  { label: 'Paid', value: 'PAID', color: 'green' },
  { label: 'Failed', value: 'FAILED', color: 'red' },
  { label: 'Cancelled', value: 'CANCELLED', color: 'plain' },
]

export const referralRewardStatusHint: Record<ReferralRewardStatus, string> = {
  PENDING: 'Owed to you — not sent yet.',
  SENDING: 'Airtime sent — waiting for the network to confirm.',
  PAID: 'Done.',
  FAILED: 'We couldn’t send this. Please contact support.',
  CANCELLED: 'The referral was rejected.',
}

/** "₦500.00 cash" / "₦1,000.00 airtime". Amounts are naira, not kobo. */
export const formatReferralReward = (kind: ReferralRewardKind, amount: string) =>
  `${formatCurrency(amount)} ${kind === 'CASH' ? 'cash' : 'airtime'}`

const BADGE_ICONS: Record<string, IconSvgElement> = {
  flame: Fire02Icon,
  fire: Fire02Icon,
  streak: Fire02Icon,
  trophy: ChampionIcon,
  champion: ChampionIcon,
  medal: Medal01Icon,
  crown: Crown02Icon,
  star: StarIcon,
  target: Target02Icon,
  bolt: FlashIcon,
  flash: FlashIcon,
  zap: FlashIcon,
  users: UserGroupIcon,
  friends: UserGroupIcon,
  coins: Coins01Icon,
  wallet: Wallet01Icon,
  award: Award01Icon,
}

const CRITERION_ICONS: Record<BadgeCriterion, IconSvgElement> = {
  WINS: ChampionIcon,
  WIN_STREAK: Fire02Icon,
  REFERRALS: UserGroupIcon,
  POINTS: StarIcon,
  DEPOSITS: Wallet01Icon,
}

/**
 * The API sends a badge icon as a name or a URL. A URL renders as an image;
 * a known name maps to a Hugeicon; anything else falls back by criterion.
 */
export const resolveBadgeIcon = (
  icon: string | null,
  criterion: BadgeCriterion,
): { url: string } | { icon: IconSvgElement } => {
  if (icon && /^https?:\/\//i.test(icon)) return { url: icon }
  const named = icon ? BADGE_ICONS[icon.toLowerCase()] : undefined
  return { icon: named ?? CRITERION_ICONS[criterion] ?? Award01Icon }
}

/** A board handle: 3–20 letters, digits or underscores (server rule). */
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{3,20}$/

export const handleErrorMessage = (code?: string) => {
  if (code === 'HANDLE_TAKEN') return 'That handle is already taken — try another.'
  if (code === 'HANDLE_RESERVED') return 'That handle isn’t available — try another.'
  return undefined
}

/** "Resets Monday" / "Resets 1 Nov" from the board's exclusive end instant. */
export const boardResetLabel = (to: string, period: 'weekly' | 'monthly') => {
  const end = new Date(to)
  if (isNaN(end.getTime())) return period === 'weekly' ? 'Resets Monday' : ''
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    ...(period === 'weekly'
      ? { weekday: 'long' }
      : { day: 'numeric', month: 'short' }),
  })
  return `Resets ${fmt.format(end)}`
}
