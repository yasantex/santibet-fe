import { createContext, useContext } from 'react'
import type { ReportPrefill } from '../types/support.types'

export type ChatStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface SupportContextValue {
  /** False when Chatwoot env vars are missing — hide live-chat entry points. */
  chatAvailable: boolean
  chatStatus: ChatStatus
  /** Unread agent replies since the widget was last opened. */
  unreadCount: number
  /** Opens the live-chat widget, loading it first if needed. */
  openChat: () => void
  /** Opens the "Report an issue" form, optionally pre-filled. */
  openReport: (prefill?: ReportPrefill) => void
}

export const SupportContext = createContext<SupportContextValue>({
  chatAvailable: false,
  chatStatus: 'idle',
  unreadCount: 0,
  openChat: () => {},
  openReport: () => {},
})

export const useSupport = () => useContext(SupportContext)

/**
 * Bottom offset for the other bottom-right floating buttons (bet slip, back
 * to top). When live chat is on, its launcher takes the corner, so they sit
 * one launcher-height (48px) + 16px gap higher.
 */
export const FAB_STACK_CLASS = {
  withChat: 'bottom-36 md:bottom-22',
  withoutChat: 'bottom-20 md:bottom-6',
} as const
