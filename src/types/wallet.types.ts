export interface WalletBalance {
  amount: number
  changeAmount: number
  changePercent: number
}

export type ActivityType = 'deposit' | 'withdrawal' | 'bet' | 'payout'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  subtitle: string
  amount: number
}

export interface WalletData {
  balance: WalletBalance
  activity: ActivityItem[]
}