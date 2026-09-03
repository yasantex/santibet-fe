export type NotificationType =
  | 'BET'
  | 'MARKET'
  | 'WALLET'
  | 'REFERRAL'
  | 'SECURITY'
  | 'PROMO'
  | 'SYSTEM'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface NotificationResponse {
  data: AppNotification[]
  nextCursor?: string
}
