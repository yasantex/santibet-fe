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
