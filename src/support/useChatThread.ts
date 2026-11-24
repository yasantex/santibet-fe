import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNotificationStream } from '../data_layer/notificationStreamContext'
import {
  CHAT_CONVERSATIONS_KEY,
  CHAT_SUMMARY_KEY,
  fetchConversation,
  fetchMessages,
  markConversationRead,
  newClientMessageId,
  sendChatMessage,
  sendTyping,
} from '../data_layer/supportChat'
import type {
  ChatContext,
  ChatConversation,
  ChatMessage,
  ChatSummary,
  DisplayMessage,
} from '../types/supportChat.types'

/** How long "Ada is typing…" stays up after the last typing ping. */
const TYPING_VISIBLE_MS = 5000
/** Minimum gap between our own typing pings. */
const TYPING_THROTTLE_MS = 3000
/** Polling fallback while the live stream is down and the panel is open. */
const POLL_MS = 15000

const byTime = (a: DisplayMessage, b: DisplayMessage) =>
  a.createdAt === b.createdAt
    ? a.id.localeCompare(b.id)
    : a.createdAt.localeCompare(b.createdAt)

/** Merges server messages into what is on screen, by id, oldest first. */
const merge = (current: DisplayMessage[], incoming: ChatMessage[]) => {
  const map = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) map.set(m.id, { ...map.get(m.id), ...m })
  return [...map.values()].sort(byTime)
}

const errorMessage = (error: unknown) =>
  isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Message not sent. Tap to retry.'

/**
 * One conversation on screen: loads it, merges live pushes, sends with
 * optimistic bubbles (retry-safe via clientMessageId), marks replies read while
 * visible, and throttles typing pings. `conversationId` undefined = a new chat
 * that the first send creates.
 */
export function useChatThread({
  conversationId,
  visible,
  onConversation,
}: {
  conversationId: string | undefined
  /** True while the thread is actually on screen (panel open, thread view). */
  visible: boolean
  /** Called with the conversation a send created or continued. */
  onConversation: (conversation: ChatConversation) => void
}) {
  const queryClient = useQueryClient()
  const { connected, subscribeToSupport } = useNotificationStream()

  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  )
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(!!conversationId)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [typingAgent, setTypingAgent] = useState<string | null>(null)

  const idRef = useRef(conversationId)
  /** A conversation our own first send created: already on screen, so not reloaded. */
  const adoptedRef = useRef<string | null>(null)
  const [adopted, setAdopted] = useState<string | null>(null)

  // Switching conversation resets what is on screen (during render, not in an
  // effect, so the old thread never flashes) — unless it is the one our own
  // first send just created.
  const [shownId, setShownId] = useState(conversationId)
  if (shownId !== conversationId) {
    setShownId(conversationId)
    if (!conversationId || conversationId !== adopted) {
      setAdopted(null)
      setConversation(null)
      setMessages([])
      setHasMore(false)
      setTypingAgent(null)
      setLoadError(false)
      setLoading(!!conversationId)
    }
  }
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingPing = useRef(0)

  const setBadge = useCallback(
    (unread: number) => {
      queryClient.setQueryData<ChatSummary>(CHAT_SUMMARY_KEY, (previous) =>
        previous ? { ...previous, unread } : previous,
      )
    },
    [queryClient],
  )

  const refresh = useCallback(async () => {
    const id = idRef.current
    if (!id) return
    const [conv, page] = await Promise.all([
      fetchConversation(id),
      fetchMessages(id),
    ])
    if (idRef.current !== id) return
    setConversation(conv)
    setMessages((current) => merge(current, page.data))
    setHasMore((previous) => previous || page.hasMore)
  }, [])

  // Load whenever the conversation changes.
  useEffect(() => {
    idRef.current = conversationId
    if (!conversationId || conversationId === adoptedRef.current) return
    adoptedRef.current = null
    let cancelled = false
    Promise.all([fetchConversation(conversationId), fetchMessages(conversationId)])
      .then(([conv, page]) => {
        if (cancelled) return
        setConversation(conv)
        setMessages(page.data)
        setHasMore(page.hasMore)
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [conversationId])

  // Live pushes for this conversation.
  useEffect(
    () =>
      subscribeToSupport((event) => {
        if (event.conversationId !== idRef.current) return
        if (event.type === 'support_message') {
          setTypingAgent(null)
          if (event.message) setMessages((current) => merge(current, [event.message!]))
          else void refresh().catch(() => {})
          setConversation((c) =>
            c ? { ...c, unreadCount: c.unreadCount + 1 } : c,
          )
        } else if (event.type === 'support_typing') {
          setTypingAgent(event.agentName || 'Support')
          if (typingTimer.current) clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(
            () => setTypingAgent(null),
            TYPING_VISIBLE_MS,
          )
        } else if (event.type === 'support_conversation') {
          setConversation((c) => (c ? { ...c, status: event.status } : c))
          void refresh().catch(() => {})
        }
      }),
    [subscribeToSupport, refresh],
  )

  // Polling fallback while the stream is down.
  useEffect(() => {
    if (!visible || connected || !conversationId) return
    const id = setInterval(() => void refresh().catch(() => {}), POLL_MS)
    return () => clearInterval(id)
  }, [visible, connected, conversationId, refresh])

  // Read receipts: anything unseen while the thread is visible is now seen.
  const unseen = conversation?.unreadCount ?? 0
  useEffect(() => {
    if (!visible || !conversationId || unseen === 0) return
    markConversationRead(conversationId)
      .then(({ unread }) => {
        setBadge(unread)
        setConversation((c) => (c ? { ...c, unreadCount: 0 } : c))
        queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY })
      })
      .catch(() => {})
  }, [visible, conversationId, unseen, setBadge, queryClient])

  const loadOlder = useCallback(async () => {
    const id = idRef.current
    const first = messages.find((m) => !m.pending && !m.failed)
    if (!id || !first || loadingOlder) return
    setLoadingOlder(true)
    try {
      const page = await fetchMessages(id, first.id)
      setMessages((current) => merge(current, page.data))
      setHasMore(page.hasMore)
    } finally {
      setLoadingOlder(false)
    }
  }, [messages, loadingOlder])

  const deliver = useCallback(
    async (body: string, clientMessageId: string, context?: ChatContext) => {
      try {
        const result = await sendChatMessage({
          conversationId: idRef.current,
          startNew: !idRef.current,
          body,
          clientMessageId,
          context,
        })
        setMessages((current) =>
          merge(
            current.filter((m) => m.clientMessageId !== clientMessageId),
            [result.message],
          ),
        )
        setConversation(result.conversation)
        if (idRef.current !== result.conversation.id) {
          idRef.current = result.conversation.id
          adoptedRef.current = result.conversation.id
          setAdopted(result.conversation.id)
          onConversation(result.conversation)
        }
        queryClient.invalidateQueries({ queryKey: CHAT_SUMMARY_KEY })
        queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY })
      } catch (error) {
        const reason = errorMessage(error)
        setMessages((current) =>
          current.map((m) =>
            m.clientMessageId === clientMessageId
              ? { ...m, pending: false, failed: true, body: m.body }
              : m,
          ),
        )
        return reason
      }
      return null
    },
    [onConversation, queryClient],
  )

  const send = useCallback(
    (text: string, context?: ChatContext) => {
      const body = text.trim()
      if (!body) return Promise.resolve(null)
      const clientMessageId = newClientMessageId()
      setMessages((current) => [
        ...current,
        {
          id: `local-${clientMessageId}`,
          clientMessageId,
          conversationId: idRef.current ?? '',
          sender: 'USER',
          body,
          agentName: null,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ])
      return deliver(body, clientMessageId, context)
    },
    [deliver],
  )

  const retry = useCallback(
    (message: DisplayMessage) => {
      if (!message.clientMessageId) return
      setMessages((current) =>
        current.map((m) =>
          m.id === message.id ? { ...m, pending: true, failed: false } : m,
        ),
      )
      void deliver(message.body, message.clientMessageId)
    },
    [deliver],
  )

  const notifyTyping = useCallback(() => {
    const id = idRef.current
    if (!id) return
    const now = Date.now()
    if (now - lastTypingPing.current < TYPING_THROTTLE_MS) return
    lastTypingPing.current = now
    void sendTyping(id).catch(() => {})
  }, [])

  return {
    conversation,
    setConversation,
    messages,
    hasMore,
    loading,
    loadError,
    loadingOlder,
    typingAgent,
    loadOlder,
    send,
    retry,
    notifyTyping,
    refresh,
  }
}
