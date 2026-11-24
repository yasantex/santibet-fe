import { Cookies } from 'react-cookie'
import type { AxiosRequestConfig } from 'axios'
import { apiClient, useSantiBetInfiniteQuery, useSantiBetQuery } from './utils'
import type {
  ChatConversation,
  ChatSummary,
  ConversationList,
  MessagePage,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/supportChat.types'

/**
 * Live chat with support. Reads go through react-query; the per-conversation
 * writes are plain calls (their paths carry the conversation id), made by the
 * chat panel. Live updates arrive on the notification stream — see
 * `subscribeToSupport` in notificationStream.
 */

export const CHAT_SUMMARY_KEY = ['support', 'chat', 'summary'] as const
export const CHAT_CONVERSATIONS_KEY = ['support', 'chat', 'conversations'] as const
export const chatMessagesKey = (conversationId: string) =>
  ['support', 'chat', 'messages', conversationId] as const

const readToken = () => {
  const raw = new Cookies().get('token')
  return typeof raw === 'string' && raw ? raw : null
}

const request = async <T>(config: AxiosRequestConfig) => {
  const token = readToken()
  const response = await apiClient.request<T>({
    ...config,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  return response.data
}

/** The open conversation + launcher badge. */
export const useChatSummary = (enabled: boolean) =>
  useSantiBetQuery<ChatSummary>({
    path: '/support/chat',
    queryKey: CHAT_SUMMARY_KEY,
    enabled,
    queryOptions: { staleTime: 30_000, refetchOnWindowFocus: true },
  })

export const useChatConversations = (enabled: boolean) =>
  useSantiBetInfiniteQuery<ConversationList>({
    path: '/support/chat/conversations',
    queryKey: CHAT_CONVERSATIONS_KEY,
    enabled,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const fetchConversation = (id: string) =>
  request<ChatConversation>({ url: `/support/chat/conversations/${id}`, method: 'GET' })

export const fetchMessages = (id: string, before?: string) =>
  request<MessagePage>({
    url: `/support/chat/conversations/${id}/messages`,
    method: 'GET',
    params: { limit: 50, ...(before ? { before } : {}) },
  })

export const sendChatMessage = (body: SendMessageRequest) =>
  request<SendMessageResponse>({ url: '/support/chat/messages', method: 'POST', data: body })

export const markConversationRead = (id: string) =>
  request<{ unread: number }>({ url: `/support/chat/conversations/${id}/read`, method: 'POST', data: {} })

export const sendTyping = (id: string) =>
  request<null>({ url: `/support/chat/conversations/${id}/typing`, method: 'POST', data: {} })

export const rateConversation = (id: string, rating: number, comment?: string) =>
  request<ChatConversation>({
    url: `/support/chat/conversations/${id}/rating`,
    method: 'POST',
    data: { rating, ...(comment ? { comment } : {}) },
  })

/** A client message id the backend accepts: [A-Za-z0-9_-]{8,64}. */
export const newClientMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
