import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '../utils/hooks'
import { useChatSummary } from '../data_layer/supportChat'
import type { ReportPrefill } from '../types/support.types'
import ReportIssueModal from '../components/support/ReportIssueModal'
import ChatPanel from '../components/support/ChatPanel'
import { SupportContext, type SupportContextValue } from './supportContext'

/** `?support=chat` (or `?support=<conversationId>`) opens the chat — used by the reply email. */
const DEEP_LINK_PARAM = 'support'

interface ChatState {
  open: boolean
  /** null = whatever is active; undefined = a new conversation. */
  conversationId: string | null | undefined
  /** Who opened it: a chat opened by one account never shows for the next. */
  ownerId: string | null
}

/**
 * App-wide customer support: owns the live-chat panel (our own, backed by
 * `/support/chat`, live over the notification stream), the unread badge and
 * the "Report an issue" form. Pages reach both through `useSupport()`.
 */
const SupportProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAppSelector((state) => state.user)
  const userId = user?.id ?? null
  const [searchParams, setSearchParams] = useSearchParams()

  const summary = useChatSummary(!!user)
  const unreadCount = user ? (summary.data?.unread ?? 0) : 0

  const [chat, setChat] = useState<ChatState>({
    open: false,
    conversationId: null,
    ownerId: null,
  })
  const [report, setReport] = useState<{ open: boolean; prefill?: ReportPrefill }>({
    open: false,
  })

  // A deep link holds the panel open on its conversation until the player
  // moves on, at which point it is dropped from the URL.
  const deepLink = searchParams.get(DEEP_LINK_PARAM)
  const clearDeepLink = useCallback(() => {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params)
        next.delete(DEEP_LINK_PARAM)
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const open = !!deepLink || (chat.open && chat.ownerId === userId)
  const conversationId = deepLink
    ? deepLink === 'chat'
      ? null
      : deepLink
    : chat.conversationId

  const show = useCallback(
    (id: string | null | undefined) => {
      if (deepLink) clearDeepLink()
      setChat({ open: true, conversationId: id, ownerId: userId })
    },
    [deepLink, clearDeepLink, userId],
  )
  const openChat = useCallback(() => show(null), [show])
  const openConversation = useCallback((id: string) => show(id), [show])
  const closeChat = useCallback(() => {
    if (deepLink) clearDeepLink()
    setChat((c) => ({ ...c, open: false }))
  }, [deepLink, clearDeepLink])
  const openReport = useCallback((prefill?: ReportPrefill) => {
    setReport({ open: true, prefill })
  }, [])

  // Wait for the summary so a first send never opens a duplicate conversation.
  const summaryReady = !user || summary.isSuccess || summary.isError
  const resolvedConversationId =
    conversationId === null ? summary.data?.active?.id : conversationId

  const value = useMemo<SupportContextValue>(
    () => ({
      chatAvailable: true,
      chatOpen: open,
      unreadCount,
      openChat,
      openConversation,
      closeChat,
      openReport,
    }),
    [open, unreadCount, openChat, openConversation, closeChat, openReport],
  )

  return (
    <SupportContext.Provider value={value}>
      {children}
      {open && summaryReady && (
        <ChatPanel
          conversationId={resolvedConversationId}
          onConversationChange={show}
          onClose={closeChat}
        />
      )}
      {report.open && (
        <ReportIssueModal
          prefill={report.prefill}
          onClose={() => setReport({ open: false })}
        />
      )}
    </SupportContext.Provider>
  )
}

export default SupportProvider
