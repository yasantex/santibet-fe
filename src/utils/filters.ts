import type { FilterCategory } from "../components/globals/FilterComponent";
export const filterCategories: FilterCategory[] = [
  {
    key: 'type',
    label: 'Type',
    multiple: false,
    options: [
      { label: 'Deposit', value: 'DEPOSIT' },
      { label: 'Withdrawal', value: 'WITHDRAWAL' },
      { label: 'Conversion', value: 'CONVERSION' },
      { label: 'Bet Placed', value: 'BET_PLACED' },
      { label: 'Bet Refund', value: 'BET_REFUND' },
      { label: 'Winnings Payout', value: 'WINNINGS_PAYOUT' },
      { label: 'Cash Out', value: 'CASH_OUT' },
      { label: 'Transfer', value: 'TRANSFER' },
      { label: 'Fee', value: 'FEE' },
      { label: 'Bonus', value: 'BONUS' },
      { label: 'Adjustment', value: 'ADJUSTMENT' },
      { label: 'Reversal', value: 'REVERSAL' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    multiple: false,
    options: [
      { label: 'Pending', value: 'PENDING' },
      { label: 'Processing', value: 'PROCESSING' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Failed', value: 'FAILED' },
      { label: 'Canceled', value: 'CANCELED' },
    ],
  },
]

export const notificationFilterCategories: FilterCategory[] = [
  {
    key: 'type',
    label: 'Type',
    multiple: true,
    options: [
      { label: 'Bets', value: 'BET' },
      { label: 'Markets', value: 'MARKET' },
      { label: 'Wallet', value: 'WALLET' },
      { label: 'Referrals', value: 'REFERRAL' },
      { label: 'Security', value: 'SECURITY' },
      { label: 'Promotions', value: 'PROMO' },
      { label: 'System', value: 'SYSTEM' },
    ],
  },
  {
    key: 'read',
    label: 'Status',
    multiple: false,
    options: [
      { label: 'Unread', value: 'UNREAD' },
      { label: 'Read', value: 'READ' },
    ],
  },
]