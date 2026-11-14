/**
 * One name and one definition per wallet figure, shared by the header,
 * Wallet and My Bets so the same number never carries two labels (SB-037).
 * Keep these in step with the FAQ (SB-040).
 *
 * - Balance: cash you can bet with now (`wallet.total`: deposits + winnings).
 * - Withdrawable: the part of Balance you can cash out (winnings).
 * - Total Balance: Balance plus the cash staked on live bets. Shown on My
 *   Bets only. Bonus-funded stakes are not in it.
 * - Bonus: bonus credit, always shown apart and never added to cash.
 */
export const WALLET_LABELS = {
  balance: 'Balance',
  balanceHint: 'Available to bet',
  withdrawable: 'withdrawable',
  totalBalance: 'Total Balance',
  totalBalanceHint:
    'Your Balance plus the cash staked on your live bets. Bonus bets are not included.',
  bonus: 'Bonus',
  bonusHint: 'Bonus credit, kept apart from your cash',
} as const
