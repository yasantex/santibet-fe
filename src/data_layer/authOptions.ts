import { useQuery } from '@tanstack/react-query'
import { apiClient } from './utils'

/**
 * `GET /auth/options` — public, so it goes straight through `apiClient`
 * (`useSantiBetQuery` waits for a token).
 *
 * `campaignPlayerLogin: true` means sign-up is hidden and the app is
 * sign-in only for now. `/auth/start` flags campaign players with no account
 * (`campaignPlayer`) so they verify and set a password, and answers
 * `SIGNUP_CLOSED` for anyone else without an account.
 */
interface AuthOptionsResponse {
  campaignPlayerLogin: boolean
}

export const CAMPAIGN_PLAYER_NO_ACCOUNT = 'CAMPAIGN_PLAYER_NO_ACCOUNT'

/** `/auth/start` while `campaignPlayerLogin` is on: no account and never
 *  played a campaign, so no code is sent. Show the API's `message`. */
export const SIGNUP_CLOSED = 'SIGNUP_CLOSED'

/**
 * Whether sign-up is hidden. Any failure (network, older API without the
 * route) reads as `false`, so an error never hides sign-up by mistake.
 */
export const useSignUpHidden = () => {
  const { data } = useQuery({
    queryKey: ['auth', 'options'],
    queryFn: async () =>
      (await apiClient.get<AuthOptionsResponse>('/auth/options')).data,
    staleTime: 60_000,
    retry: false,
  })
  return data?.campaignPlayerLogin === true
}
