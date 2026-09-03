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
      { label: 'Account verification', value: 'ACCOUNT_VERIFICATION' },
      { label: 'KYC update', value: 'KYC_UPDATE' },
      { label: 'Deposit successful', value: 'DEPOSIT_SUCCESS' },
      { label: 'Deposit failed', value: 'DEPOSIT_FAILED' },
      { label: 'Withdrawal requested', value: 'WITHDRAWAL_REQUESTED' },
      { label: 'Withdrawal approved', value: 'WITHDRAWAL_APPROVED' },
      { label: 'Withdrawal failed', value: 'WITHDRAWAL_FAILED' },
      { label: 'Withdrawal completed', value: 'WITHDRAWAL_COMPLETED' },
      { label: 'Bet accepted', value: 'BET_ACCEPTED' },
      { label: 'Cash out completed', value: 'CASH_OUT_COMPLETED' },
      { label: 'Market resolved', value: 'MARKET_RESOLVED' },
      { label: 'Winnings credited', value: 'WINNINGS_CREDITED' },
      { label: 'Security alert', value: 'SECURITY_ALERT' },
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