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
  /** The live-chat conversation the report opened (null for pre-2026-11 reports). */
  conversationId: string | null
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
 * backoffice (separate from live chat and the reports above).
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
