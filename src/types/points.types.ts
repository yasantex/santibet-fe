// Points, boards, referrals and badges (`/points`, `/referrals`, `/badges`).
// Money here is a naira decimal string ("500.00"), NOT kobo like the wallet.

export type PointsSource =
  | 'WIN'
  | 'STREAK'
  | 'DEPOSIT'
  | 'REFERRAL'
  | 'REFEREE'
  | 'ADJUSTMENT'

export interface PointsSummary {
  total: number
  /** Monday–Sunday, Lagos time. */
  thisWeek: number
  thisMonth: number
  wins: number
  deposits: number
  streak: { current: number; longest: number }
}

export interface PointsEntry {
  id: string
  /** Negative is an operator correction. */
  points: number
  source: PointsSource
  reason: string | null
  createdAt: string
}

export interface PointsHistoryResponse {
  data: PointsEntry[]
  nextCursor: string | null
}

export type LeaderboardPeriod = 'weekly' | 'monthly'

export interface LeaderboardRow {
  /** Ties share a rank; the next place skips. */
  rank: number
  handle: string
  points: number
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod
  /** Start of the window (inclusive). */
  from: string
  /** End of the window (exclusive) — when the board resets. */
  to: string
  data: LeaderboardRow[]
  /** Everyone on the board, not the page. */
  total: number
  /** Null when the caller isn't on this board. */
  me: LeaderboardRow | null
}

export interface LeaderboardProfile {
  optedIn: boolean
  handle: string | null
}

export type LeaderboardProfileInput =
  | { optIn: true; handle: string }
  | { optIn: false }

export type ReferralTrigger = 'KYC_APPROVED' | 'FIRST_DEPOSIT' | 'FIRST_BET_SETTLED'
export type ReferralRewardKind = 'CASH' | 'AIRTIME'
export type ReferralRewardStatus =
  | 'PENDING'
  | 'SENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'

export interface ReferralMilestone {
  friendCount: number
  bonusPoints: number
  /** Null is points only. */
  reward: { kind: ReferralRewardKind; amount: string } | null
  reached: boolean
}

export interface ReferralReward {
  id: string
  kind: ReferralRewardKind
  amount: string
  currency: string
  status: ReferralRewardStatus
  /** Set for a milestone reward, null for a per-referral one. */
  milestone: number | null
  createdAt: string
}

export interface ReferralProgress {
  code: string
  link: string
  program: { enabled: boolean; trigger: ReferralTrigger }
  counts: { pending: number; qualified: number }
  milestones: ReferralMilestone[]
  rewards: ReferralReward[]
}

export type ReferredFriendStatus = 'PENDING' | 'QUALIFIED' | 'REJECTED'

export interface ReferredFriend {
  id: string
  status: ReferredFriendStatus
  /** Display name, else first name, else "Friend". Never contact details. */
  name: string
  createdAt: string
  qualifiedAt: string | null
}

export interface ReferredFriendsResponse {
  data: ReferredFriend[]
  nextCursor: string | null
}

export type BadgeCriterion =
  | 'WINS'
  | 'WIN_STREAK'
  | 'REFERRALS'
  | 'POINTS'
  | 'DEPOSITS'

export interface PlayerBadge {
  key: string
  name: string
  description: string
  /** A name or URL for the client to resolve — the API hosts no artwork. */
  icon: string | null
  criterion: BadgeCriterion
  threshold: number
  earned: boolean
  awardedAt: string | null
  /** Earned and not yet shown. */
  isNew: boolean
  /** Capped at target. */
  progress: { current: number; target: number }
}

export interface BadgeListResponse {
  data: PlayerBadge[]
  newCount: number
}
