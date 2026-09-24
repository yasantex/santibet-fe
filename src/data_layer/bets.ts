import { useQueryClient } from '@tanstack/react-query'
import {
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
  useSantiBetQuery,
} from './utils'
import type {
  Bet,
  BetListResponse,
  BetPosition,
  BetPositionListResponse,
  CashOutQuote,
  PlaceBetPayload,
} from '../types/bet.types'

/**
 * Trading runs on the simple `/bets` model: place a stake on an outcome and
 * receive odds + potential return; positions track open exposure and can be
 * cashed out. All endpoints require an authenticated session.
 */

const invalidateAfterTrade = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['bets'] })
  qc.invalidateQueries({ queryKey: ['bet-positions'] })
  qc.invalidateQueries({ queryKey: ['/wallet', {}] })
  qc.invalidateQueries({ queryKey: ['wallet-transactions'] })
}

export const usePlaceBet = () => {
  const qc = useQueryClient()
  return useSantiBetMutation<Bet, PlaceBetPayload>({
    path: '/bets',
    mutationOptions: {
      onSuccess: () => invalidateAfterTrade(qc),
    },
  })
}

export const useBets = (status?: string, limit = 20) =>
  useSantiBetInfiniteQuery<BetListResponse>({
    path: '/bets',
    queryKey: ['bets', { status, limit }],
    params: { status, limit },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const useBetPositions = (status?: string, limit = 20) =>
  useSantiBetInfiniteQuery<BetPositionListResponse>({
    path: '/bets/positions',
    queryKey: ['bet-positions', { status, limit }],
    params: { status, limit },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

/**
 * Read-only cash-out estimate for a position — same formula as the executed
 * cash-out, bar a live price move. Fetch it when the confirm UI opens so the
 * user sees "Cash out ₦X" before committing. Kept fresh (no stale cache) since
 * it moves with the market.
 */
export const useCashOutQuote = (positionId?: string, enabled = true) =>
  useSantiBetQuery<CashOutQuote>({
    path: `/bets/positions/${positionId}/cash-out-quote`,
    queryKey: ['cash-out-quote', positionId],
    enabled: enabled && !!positionId,
    queryOptions: {
      staleTime: 0,
      gcTime: 0,
    },
  })

export const useCashOut = (positionId: string) => {
  const qc = useQueryClient()
  return useSantiBetMutation<BetPosition, void>({
    path: `/bets/positions/${positionId}/cash-out`,
    mutationOptions: {
      onSuccess: () => invalidateAfterTrade(qc),
    },
  })
}

export const useCancelBet = (betId: string) => {
  const qc = useQueryClient()
  return useSantiBetMutation<{ message: string }, void>({
    path: `/bets/${betId}`,
    method: 'DELETE',
    mutationOptions: {
      onSuccess: () => invalidateAfterTrade(qc),
    },
  })
}
