import { useSantiBetMutation, useSantiBetQuery } from './utils'
import type {
  ContactMessageResponse,
  CreateContactMessageRequest,
  CreateSupportReportRequest,
  SupportReport,
} from '../types/support.types'

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
