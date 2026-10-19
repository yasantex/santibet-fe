import { useQueryClient } from '@tanstack/react-query'
import {
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
  useSantiBetQuery,
} from './utils'
import type {
  BadgeListResponse,
  LeaderboardPeriod,
  LeaderboardProfile,
  LeaderboardProfileInput,
  LeaderboardResponse,
  PointsHistoryResponse,
  PointsSummary,
  ReferralProgress,
  ReferredFriendStatus,
  ReferredFriendsResponse,
} from '../types/points.types'

/**
 * Points, boards, referrals and badges. Every endpoint needs a session and
 * answers zeroes / empty lists while the programme is switched off, so the
 * screens render empty states rather than errors on day one.
 */

export const POINTS_KEY = ['points']
export const LEADERBOARD_KEY = ['points', 'leaderboard']
export const LEADERBOARD_PROFILE_KEY = ['points', 'leaderboard-profile']
export const REFERRALS_KEY = ['referrals', 'me']
export const BADGES_KEY = ['badges', 'me']

// Points land about a minute after a win or deposit, so the screen re-reads on
// open and on focus instead of trusting a cached total.
const FRESH_ON_FOCUS = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: 'always' as const,
}

export const usePointsSummary = (enabled = true) =>
  useSantiBetQuery<PointsSummary>({
    path: '/points/me',
    queryKey: [...POINTS_KEY, 'me'],
    enabled,
    queryOptions: FRESH_ON_FOCUS,
  })

export const usePointsHistory = (limit = 20) =>
  useSantiBetInfiniteQuery<PointsHistoryResponse>({
    path: '/points/me/history',
    queryKey: [...POINTS_KEY, 'history', { limit }],
    params: { limit },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const useLeaderboard = (
  period: LeaderboardPeriod,
  limit: number,
  offset = 0,
  enabled = true,
) =>
  useSantiBetQuery<LeaderboardResponse>({
    path: '/points/leaderboard',
    queryKey: [...LEADERBOARD_KEY, { period, limit, offset }],
    params: { period, limit, offset },
    enabled,
    queryOptions: { placeholderData: (prev) => prev },
  })

export const useLeaderboardProfile = (enabled = true) =>
  useSantiBetQuery<LeaderboardProfile>({
    path: '/points/leaderboard/profile',
    queryKey: LEADERBOARD_PROFILE_KEY,
    enabled,
  })

/** Join (with a handle), change handle, or leave the boards. */
export const useUpdateLeaderboardProfile = () => {
  const qc = useQueryClient()
  return useSantiBetMutation<LeaderboardProfile, LeaderboardProfileInput>({
    path: '/points/leaderboard/profile',
    method: 'PUT',
    mutationOptions: {
      onSuccess: (data) => {
        qc.setQueryData(LEADERBOARD_PROFILE_KEY, data)
        qc.invalidateQueries({ queryKey: LEADERBOARD_KEY })
      },
    },
  })
}

export const useReferrals = (enabled = true) =>
  useSantiBetQuery<ReferralProgress>({
    path: '/referrals/me',
    queryKey: REFERRALS_KEY,
    enabled,
    queryOptions: { refetchOnWindowFocus: 'always' },
  })

/** Main-app referrals only, newest first. */
export const useReferredFriends = (
  status?: ReferredFriendStatus,
  limit = 20,
) =>
  useSantiBetInfiniteQuery<ReferredFriendsResponse>({
    path: '/referrals/me/friends',
    queryKey: [...REFERRALS_KEY, 'friends', { status, limit }],
    params: { status, limit },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const useBadges = (enabled = true) =>
  useSantiBetQuery<BadgeListResponse>({
    path: '/badges/me',
    queryKey: BADGES_KEY,
    enabled,
  })

export const useMarkBadgesSeen = () => {
  const qc = useQueryClient()
  return useSantiBetMutation<{ marked: number }, void>({
    path: '/badges/me/seen',
    mutationOptions: {
      onSuccess: () => qc.invalidateQueries({ queryKey: BADGES_KEY }),
    },
  })
}
