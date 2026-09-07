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
}

export const NotificationStreamContext =
  createContext<NotificationStreamValue>({
    connected: false,
    subscribeToDepositSuccess: () => () => {},
    subscribeToDepositFailed: () => () => {},
  })

export const useNotificationStream = () =>
  useContext(NotificationStreamContext)
