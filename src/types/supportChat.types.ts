/**
 * In-house live chat (replaced Chatwoot). See santibet-be docs/SUPPORT_LIVE_CHAT.md.
 */

export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED'
export type ConversationSource = 'CHAT' | 'REPORT' | 'AGENT'
export type MessageSender = 'USER' | 'AGENT' | 'SYSTEM'

export interface ChatConversation {
  id: string
  /** e.g. "SB-10423" — what the player quotes back. */
  ticketNumber: string
  /** OPEN = with support, PENDING = waiting on the player, RESOLVED = done. */
  status: ConversationStatus
  source: ConversationSource
  subject: string | null
  /** First name of the agent handling it. */
  agentName: string | null
  lastMessageAt: string
  lastMessagePreview: string | null
  lastMessageSender: MessageSender | null
  /** Agent replies the player has not seen. */
  unreadCount: number
  rating: number | null
  resolvedAt: string | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  sender: MessageSender
  body: string
  agentName: string | null
  createdAt: string
}

/** A message on screen: sent, or still on its way (optimistic) / failed. */
export interface DisplayMessage extends ChatMessage {
  clientMessageId?: string
  pending?: boolean
  failed?: boolean
}

export interface ChatSummary {
  active: ChatConversation | null
  unread: number
}

export interface ConversationList {
  data: ChatConversation[]
  nextCursor: string | null
}

export interface MessagePage {
  /** Oldest first. */
  data: ChatMessage[]
  hasMore: boolean
}

export interface ChatContext {
  pageUrl?: string
  userAgent?: string
  marketId?: string
  marketTitle?: string
}

export interface SendMessageRequest {
  conversationId?: string
  /** Without conversationId: open a fresh conversation even if one is open. */
  startNew?: boolean
  body: string
  clientMessageId?: string
  context?: ChatContext
}

export interface SendMessageResponse {
  conversation: ChatConversation
  message: ChatMessage
}

// ── Stream events (on /notifications/stream) ─────────────────────────────────

export interface SupportMessageStreamEvent {
  type: 'support_message'
  conversationId: string
  /** Null when too large to push — re-fetch the thread. */
  message: ChatMessage | null
  unread: number
  at: string
}

export interface SupportTypingStreamEvent {
  type: 'support_typing'
  conversationId: string
  agentName: string | null
  at: string
}

export interface SupportConversationStreamEvent {
  type: 'support_conversation'
  conversationId: string
  status: ConversationStatus
  at: string
}

export type SupportStreamEvent =
  | SupportMessageStreamEvent
  | SupportTypingStreamEvent
  | SupportConversationStreamEvent

export type SupportStreamListener = (event: SupportStreamEvent) => void
