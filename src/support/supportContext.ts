import { createContext, useContext } from 'react'
import type { ReportPrefill } from '../types/support.types'

export interface SupportContextValue {
  /** Live chat is always on (in-house); kept for the FAB stacking callers. */
  chatAvailable: boolean
  /** Whether the chat panel is open. */
  chatOpen: boolean
  /** Unread agent replies across all conversations. */
  unreadCount: number
  /** Opens live chat on the player's open conversation (or a new one). */
  openChat: () => void
  /** Opens live chat on a specific conversation, e.g. a report's. */
  openConversation: (conversationId: string) => void
  closeChat: () => void
  /** Opens the "Report an issue" form, optionally pre-filled. */
  openReport: (prefill?: ReportPrefill) => void
}

export const SupportContext = createContext<SupportContextValue>({
  chatAvailable: false,
  chatOpen: false,
  unreadCount: 0,
  openChat: () => {},
  openConversation: () => {},
  closeChat: () => {},
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
