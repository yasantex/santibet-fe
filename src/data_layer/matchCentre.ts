import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { apiClient, useSantiBetQuery } from './utils'
import type { MatchCentre, MyMatchBets } from '../types/matchCentre.types'

/**
 * The live match tracker. The feed moves about once a minute; polling every
 * 15 s while the match is on catches each change within seconds of it landing,
 * and an unchanged match costs a 304 (the browser re-uses its copy via the
 * ETag). Before kick-off it refreshes slowly, for lineups and pre-match data.
 */
const LIVE_POLL_MS = 15_000
const IDLE_POLL_MS = 60_000

export const matchCentreKey = (eventId?: string) => ['match-centre', eventId]

export const useMatchCentre = (eventId?: string, { enabled = true } = {}) =>
  useQuery({
    queryKey: matchCentreKey(eventId),
    enabled: !!eventId && enabled,
    // 404 = no live data behind this event: don't retry, just show nothing.
    retry: (count, error) =>
      !(isAxiosError(error) && error.response?.status === 404) && count < 2,
    refetchInterval: (query) => {
      const data = query.state.data as MatchCentre | undefined
      if (!data) return IDLE_POLL_MS
      if (data.status === 'live') return LIVE_POLL_MS
      if (data.status === 'finished' || data.status === 'cancelled') return false
      return IDLE_POLL_MS
    },
    refetchIntervalInBackground: false,
    queryFn: async () =>
      (await apiClient.get<MatchCentre>(`/match-centre/${eventId}`)).data,
  })

/** The signed-in player's bets on this match, with how each stands now. */
export const useMyMatchBets = (eventId?: string, live = false) =>
  useSantiBetQuery<MyMatchBets>({
    path: `/match-centre/${eventId}/my-bets`,
    queryKey: ['match-centre', eventId, 'my-bets'],
    enabled: !!eventId,
    queryOptions: {
      refetchInterval: live ? 20_000 : false,
      retry: false,
    },
  })
