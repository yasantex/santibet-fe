import { createContext, useContext } from 'react'

export interface DepositSuccessEvent {
  depositId?: string
  amount?: number
}

export type DepositListener = (event: DepositSuccessEvent) => void

export interface NotificationStreamValue {
  /**
   * False whenever the push connection is down. Callers that need guaranteed
   * freshness (the badge poll, the deposit screen) fall back to polling while
   * this is false.
   */
  connected: boolean
  /** Subscribe to DEPOSIT_SUCCESS pushes. Returns an unsubscribe function. */
  subscribeToDepositSuccess: (listener: DepositListener) => () => void
}

export const NotificationStreamContext =
  createContext<NotificationStreamValue>({
    connected: false,
    subscribeToDepositSuccess: () => () => {},
  })

export const useNotificationStream = () =>
  useContext(NotificationStreamContext)
