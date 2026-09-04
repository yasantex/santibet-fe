/**
 * Query keys shared between the data-layer hooks and the notification stream.
 *
 * The stream pushes events that invalidate caches owned by other modules, so
 * the keys live here rather than in one of them — importing across data-layer
 * modules would otherwise make `notifications` and `notificationStream`
 * circular.
 */
export const NOTIFICATIONS_KEY = ['notifications']
export const UNREAD_COUNT_KEY = ['/notifications/unread-count', {}]

export const WALLET_BALANCE_KEY = ['/wallet', {}]
export const WALLET_TRANSACTIONS_KEY = ['wallet-transactions']
export const DEPOSITS_KEY = ['/wallet/deposits']

export const BETS_KEY = ['bets']
export const BET_POSITIONS_KEY = ['bet-positions']
