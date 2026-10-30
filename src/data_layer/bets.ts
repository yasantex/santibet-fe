import { useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCookies } from 'react-cookie'
import {
  apiClient,
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
  useSantiBetQuery,
} from './utils'
import { BET_PORTFOLIO_KEY } from './queryKeys'
import type {
  Bet,
  BetListResponse,
  BetPosition,
  BetPositionListResponse,
  BetQuote,
  CashOutQuote,
  PlaceBetPayload,
  PortfolioSummary,
} from '../types/bet.types'
import type {
  ComboBetPayload,
  ComboBetResponse,
  ComboQuote,
} from '../types/combo.types'

/**
 * Trading runs on the simple `/bets` model: place a stake on an outcome and
 * receive odds + potential return; positions track open exposure and can be
 * cashed out. All endpoints require an authenticated session.
 */

const invalidateAfterTrade = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['bets'] })
  qc.invalidateQueries({ queryKey: ['bet-positions'] })
  qc.invalidateQueries({ queryKey: BET_PORTFOLIO_KEY })
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

/**
 * Place a combo (parlay): one stake across several sports selections that must
 * all win. The backend re-prices the legs and returns the accepted combined
 * odds; invalidates the same caches as a single bet on success.
 */
export const useComboBet = () => {
  const qc = useQueryClient()
  return useSantiBetMutation<ComboBetResponse, ComboBetPayload>({
    path: '/bets/combo',
    mutationOptions: {
      onSuccess: () => invalidateAfterTrade(qc),
    },
  })
}

// How often an on-screen quote re-prices while the player decides.
const QUOTE_REFRESH_MS = 5000

/**
 * A read-only quote fetched over POST and kept fresh like a query. Keyed by the
 * request body, so a new stake/outcome re-quotes; the previous quote stays on
 * screen while the next one loads. Signed-in only (the /bets routes need auth).
 */
const useQuoteQuery = <TData, TBody>(
  path: string,
  body: TBody | null,
  name: string,
) => {
  const [cookies] = useCookies(['token'])
  const token = cookies?.token as string | undefined
  return useQuery<TData>({
    queryKey: [name, body],
    enabled: !!token && body != null,
    queryFn: async () => {
      const res = await apiClient.post<TData>(path, body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    placeholderData: keepPreviousData,
    refetchInterval: QUOTE_REFRESH_MS,
    staleTime: 0,
    retry: false,
  })
}

/**
 * Server pricing for a stake: the fill price, decimal odds, fee, net payout and
 * profit. Pass null until there's something to price.
 */
export const useBetQuote = (body: Omit<PlaceBetPayload, 'clientOrderId'> | null) =>
  useQuoteQuery<BetQuote, typeof body>('/bets/quote', body, 'bet-quote')

/** Server pricing for a combo: combined odds, payout and per-leg availability. */
export const useComboQuote = (
  body: Omit<ComboBetPayload, 'expectedCombinedOdds'> | null,
) => useQuoteQuery<ComboQuote, typeof body>('/bets/combo/quote', body, 'combo-quote')

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
 * Headline value and P&L across every position (and the header's portfolio
 * figure). Server-side, so it's right however many positions there are.
 */
export const usePortfolioSummary = () =>
  useSantiBetQuery<PortfolioSummary>({
    path: '/bets/portfolio',
    queryKey: BET_PORTFOLIO_KEY,
    enabled: true,
    queryOptions: { refetchInterval: 30_000 },
  })

/** The player's open positions in one market, from the first page of open positions. */
export const useMarketPositions = (marketId?: string) => {
  const query = useBetPositions('open')
  const positions = useMemo<BetPosition[]>(
    () =>
      (query.data?.pages ?? [])
        .flatMap((p) => p.data)
        .filter((p) => p.marketId === marketId && p.status === 'OPEN'),
    [query.data, marketId],
  )
  return { ...query, positions }
}

/**
 * Read-only cash-out estimate for a position — same formula as the executed
 * cash-out, bar a live price move. Fetch it while the confirm UI is open so
 * the user sees "Cash out ₦X" before committing; re-quoted every few seconds
 * since it moves with the market. No retries: an error usually means the
 * position can't be cashed out, and the dialog should say so straight away.
 */
export const useCashOutQuote = (positionId?: string, enabled = true) =>
  useSantiBetQuery<CashOutQuote>({
    path: `/bets/positions/${positionId}/cash-out-quote`,
    queryKey: ['cash-out-quote', positionId],
    enabled: enabled && !!positionId,
    queryOptions: {
      staleTime: 0,
      gcTime: 0,
      retry: false,
      refetchInterval: 5000,
    },
  })

/** Cash out a whole position. `minValueMinor` (kobo) = the quoted amount the
 *  player agreed to; below it the API answers 409 `CASH_OUT_VALUE_MOVED`. */
export const useCashOut = (positionId: string) => {
  const qc = useQueryClient()
  return useSantiBetMutation<BetPosition, { minValueMinor?: string }>({
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
