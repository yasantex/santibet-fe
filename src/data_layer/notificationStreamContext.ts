import { createContext, useContext } from 'react'

export interface DepositSuccessEvent {
  depositId?: string
  amount?: number
}

export type DepositListener = (event: DepositSuccessEvent) => void

export interface DepositFailedEvent {
  depositId?: string
  reason?: string | null
}

export type DepositFailedListener = (event: DepositFailedEvent) => void

/**
 * Live crypto deposit progress (`deposit_status` on the stream). Ephemeral and
 * for display only — the balance is credited off DEPOSIT_SUCCESS, never this.
 */
export interface DepositStatusEvent {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  /** Provider's own label, e.g. `submitted`, `accepted`. */
  rawStatus: string | null
  depositRef: string
  currency: string | null
  /** Major-unit crypto amount, as a string. */
  amount: string | null
  txHash: string | null
}

export type DepositStatusListener = (event: DepositStatusEvent) => void

export interface NotificationStreamValue {
  /**
   * False whenever the push connection is down. Callers that need guaranteed
   * freshness (the badge poll, the deposit screen) fall back to polling while
   * this is false.
   */
  connected: boolean
  /** Subscribe to DEPOSIT_SUCCESS pushes. Returns an unsubscribe function. */
  subscribeToDepositSuccess: (listener: DepositListener) => () => void
  /** Subscribe to DEPOSIT_FAILED pushes. Returns an unsubscribe function. */
  subscribeToDepositFailed: (listener: DepositFailedListener) => () => void
  /** Subscribe to live crypto deposit progress. Returns an unsubscribe function. */
  subscribeToDepositStatus: (listener: DepositStatusListener) => () => void
}

export const NotificationStreamContext =
  createContext<NotificationStreamValue>({
    connected: false,
    subscribeToDepositSuccess: () => () => {},
    subscribeToDepositFailed: () => () => {},
    subscribeToDepositStatus: () => () => {},
  })

export const useNotificationStream = () =>
  useContext(NotificationStreamContext)
