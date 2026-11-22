import type { ChatwootAttributes } from '../utils/chatwoot'

/**
 * GET /support/chatwoot/identity
 *
 * Signed identity for the live-chat widget. The backend owns the Chatwoot
 * inbox HMAC token and computes `identifierHash = HMAC-SHA256(identifier)`,
 * so a user can't impersonate someone else's chat history.
 */
export interface ChatwootIdentityResponse {
  /** Stable, opaque contact id — the SantiBet user id. */
  identifier: string
  identifierHash: string
  /**
   * Optional server-sourced contact attributes (KYC status, VIP tier, …)
   * merged into the contact so agents see them in the sidebar.
   */
  customAttributes?: ChatwootAttributes
}

export type SupportReportCategory =
  | 'ACCOUNT'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BET'
  | 'MARKET'
  | 'TECHNICAL'
  | 'RESPONSIBLE_GAMBLING'
  | 'OTHER'

/** Context captured automatically with a report, never typed by the user. */
export interface SupportReportContext {
  pageUrl: string
  userAgent: string
  /** Market the report was raised from, if any. */
  marketId?: string
  marketTitle?: string
}

/** POST /support/reports */
export interface CreateSupportReportRequest {
  category: SupportReportCategory
  message: string
  /** Transaction / deposit / bet reference the user is reporting about. */
  reference?: string
  context: SupportReportContext
}

export type SupportReportStatus = 'OPEN' | 'PENDING' | 'RESOLVED'

export interface SupportReport {
  id: string
  /** Human-friendly ticket number shown to the user (e.g. "SB-10423"). */
  ticketNumber: string
  category: SupportReportCategory
  status: SupportReportStatus
  /** Chatwoot conversation the report was filed into. */
  conversationId: number | null
  createdAt: string
}

/** Pre-fill for the report modal when it's opened from a specific surface. */
export interface ReportPrefill {
  category?: SupportReportCategory
  reference?: string
  marketId?: string
  marketTitle?: string
}

export type ContactTopic =
  | 'GENERAL'
  | 'ACCOUNT'
  | 'PAYMENTS'
  | 'BETTING'
  | 'PARTNERSHIP'
  | 'PRESS'
  | 'FEEDBACK'
  | 'OTHER'

/**
 * POST /contact — the public "Contact us" form. Works signed in or out; with a
 * session the message is linked to the account. Answered by email from the
 * backoffice (separate from the Chatwoot reports above).
 */
export interface CreateContactMessageRequest {
  name: string
  email: string
  /** Required when `whatsappOptIn` is true. */
  phone?: string
  whatsappOptIn: boolean
  topic: ContactTopic
  message: string
  pageUrl?: string
  /** Spam trap: a field people never see. Bots fill it; real people don't. */
  website?: string
}

export interface ContactMessageResponse {
  /** e.g. "CT-10042". Also emailed to the player as a receipt. */
  reference: string
  createdAt: string
}
