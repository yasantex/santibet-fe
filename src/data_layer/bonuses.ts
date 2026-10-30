import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useCookies } from 'react-cookie'
import {
  apiClient,
  useSantiBetInfiniteQuery,
  useSantiBetQuery,
} from './utils'
import {
  BONUS_KEY,
  BONUS_OFFER_KEY,
  CURRENT_BONUS_KEY,
  WALLET_BALANCE_KEY,
} from './queryKeys'
import type {
  BonusEligibilityResponse,
  BonusHistoryResponse,
  BonusListResponse,
  BonusOffer,
  CurrentBonus,
  CurrentBonusResponse,
} from '../types/bonus.types'
import type { BetQuote, BetQuotePayload } from '../types/bet.types'
import { isLiveBonus } from '../utils/bonus'

/**
 * Bonus engine — `/api/bonuses/*`. A player holds at most one live bonus
 * (ACTIVE or PENDING_KYC); its balance is shown apart from cash, never added
 * to it. Every key starts with `bonuses`, so `invalidateBonuses` refreshes
 * the lot.
 */

export const invalidateBonuses = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: BONUS_KEY })
  qc.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
}

/** The player's live bonus, or null. */
export const useCurrentBonus = (enabled = true) => {
  const query = useSantiBetQuery<CurrentBonusResponse>({
    path: '/bonuses/current',
    queryKey: CURRENT_BONUS_KEY,
    enabled,
    queryOptions: { staleTime: 30 * 1000 },
  })
  const raw = query.data?.bonus ?? null
  const bonus: CurrentBonus | null = raw && isLiveBonus(raw.status) ? raw : null
  return { ...query, bonus }
}

/** Every bonus the player has had, newest first. */
export const useBonuses = (enabled = true) =>
  useSantiBetQuery<BonusListResponse>({
    path: '/bonuses',
    queryKey: [...BONUS_KEY, 'list'],
    enabled,
  })

/** The deposit-screen tickbox. Always fresh: one deposit can change it. */
export const useBonusOffer = (enabled = true) =>
  useSantiBetQuery<BonusOffer>({
    path: '/bonuses/offer',
    queryKey: BONUS_OFFER_KEY,
    enabled,
    queryOptions: { staleTime: 0, retry: false },
  })

// Bonus endpoints validate ids as UUIDs; raw provider ids would only 400.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Which outcomes of a market a bonus bet could go on (same checks as `POST /bets`). */
export const useBonusEligibility = (marketId?: string, enabled = true) =>
  useSantiBetQuery<BonusEligibilityResponse>({
    path: '/bonuses/eligibility',
    params: { marketId },
    queryKey: [...BONUS_KEY, 'eligibility', marketId],
    enabled: enabled && !!marketId && UUID.test(marketId),
    queryOptions: { staleTime: 15 * 1000, retry: false },
  })

/** Bonus activity — grants, bonus bets, wins, releases and end states. */
export const useBonusHistory = (userBonusId?: string, limit = 30) =>
  useSantiBetInfiniteQuery<BonusHistoryResponse>({
    path: '/bonuses/history',
    queryKey: [...BONUS_KEY, 'history', { userBonusId, limit }],
    params: { userBonusId, limit },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

/**
 * `POST /bets/quote`. It's a read, so it lives in a query keyed by the
 * payload; pass null to switch it off (no stake yet, signed out, …).
 */
export const useBetQuote = (payload: BetQuotePayload | null) => {
  const [cookies] = useCookies(['token'])
  const token = cookies?.token as string | undefined
  return useQuery<BetQuote>({
    queryKey: ['bet-quote', payload],
    queryFn: async () => {
      const response = await apiClient.post<BetQuote>('/bets/quote', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return response.data
    },
    enabled: !!token && !!payload,
    staleTime: 5 * 1000,
    retry: false,
  })
}
