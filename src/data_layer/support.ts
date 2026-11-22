import { useSantiBetMutation, useSantiBetQuery } from './utils'
import type {
  ChatwootIdentityResponse,
  ContactMessageResponse,
  CreateContactMessageRequest,
  CreateSupportReportRequest,
  SupportReport,
} from '../types/support.types'

/**
 * Signed Chatwoot identity for the signed-in user. Only fetched when live chat
 * is configured; the hash never changes for a user, so it's cached for the
 * session and not retried aggressively (a 404 just means the backend endpoint
 * isn't deployed yet — chat then runs with an unverified identity).
 */
export const useChatwootIdentity = (enabled: boolean) =>
  useSantiBetQuery<ChatwootIdentityResponse>({
    path: '/support/chatwoot/identity',
    queryKey: ['support', 'chatwoot-identity'],
    enabled,
    queryOptions: {
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  })

/** Files a structured report into the support inbox. Requires a session. */
export const useCreateSupportReport = () =>
  useSantiBetMutation<SupportReport, CreateSupportReportRequest>({
    path: '/support/reports',
  })

/**
 * The public "Contact us" form. No session needed: the bearer token is sent
 * when there is one, so the message gets linked to the account.
 */
export const useCreateContactMessage = () =>
  useSantiBetMutation<ContactMessageResponse, CreateContactMessageRequest>({
    path: '/contact',
  })
