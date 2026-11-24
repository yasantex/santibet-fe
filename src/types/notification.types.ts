export type NotificationType =
  | 'ACCOUNT_VERIFICATION'
  | 'KYC_UPDATE'
  | 'DEPOSIT_SUCCESS'
  | 'DEPOSIT_FAILED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_FAILED'
  | 'WITHDRAWAL_COMPLETED'
  | 'BET_ACCEPTED'
  | 'CASH_OUT_COMPLETED'
  | 'MARKET_RESOLVED'
  | 'WINNINGS_CREDITED'
  | 'SECURITY_ALERT'
  /** A live-chat reply the player had not seen after a couple of minutes. `data.conversationId` opens it. */
  | 'SUPPORT_REPLY'
  /** Bonus granted / activated / won / completed / ended — see `data.event`. */
  | 'BONUS_UPDATE'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  /** Written when the event happened; not rebuilt from `type` at read time. */
  body: string | null
  data: Record<string, unknown> | null
  /** null while unread. */
  readAt: string | null
  createdAt: string
}

export interface NotificationResponse {
  data: AppNotification[]
  nextCursor: string | null
}
