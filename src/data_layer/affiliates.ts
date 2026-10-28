import { apiClient, useSantiBetMutation } from './utils'
import type { AuthResponse } from '../types/types'
import type {
  AgentSignupConfirmPayload,
  TrackClickPayload,
  TrackClickResponse,
} from '../types/affiliate.types'
import { deviceFingerprintHeaders } from '../utils/deviceFingerprint'

/**
 * Records a referral-link click. No auth; rate-limited by the backend. Called
 * fire-and-forget from the link capture, so it never blocks navigation.
 */
export const trackReferralClick = async (payload: TrackClickPayload) => {
  const { data } = await apiClient.post<TrackClickResponse>(
    '/affiliate/track/click',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...deviceFingerprintHeaders(),
      },
      timeout: 15000,
    },
  )
  return data
}

/**
 * Finishes an agent-assisted signup. Answers with exactly the body of
 * `POST /auth/complete` (user + tokens). On web the refresh token comes back
 * as a cookie, so `X-Client-Type` is left off.
 */
export const useConfirmAgentSignup = () =>
  useSantiBetMutation<AuthResponse, AgentSignupConfirmPayload>({
    path: '/affiliate/agent/customers/confirm',
    headers: deviceFingerprintHeaders(),
  })
