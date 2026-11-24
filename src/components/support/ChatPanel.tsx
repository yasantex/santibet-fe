import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link } from 'react-router'
import classNames from 'classnames'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowLeft02Icon,
  Cancel01Icon,
  CustomerSupportIcon,
  MessageMultiple01Icon,
  PlusSignIcon,
  SentIcon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import { useAppSelector } from '../../utils/hooks'
import useAuthNavigate from '../../hooks/useAuthNavigate'
import {
  rateConversation,
  useChatConversations,
} from '../../data_layer/supportChat'
import { useChatThread } from '../../support/useChatThread'
import type {
  ChatConversation,
  DisplayMessage,
} from '../../types/supportChat.types'

const MAX_CHARS = 4000

const QUICK_TOPICS = [
  'My deposit hasn’t arrived',
  'I need help with a withdrawal',
  'Question about a bet',
  'Account or verification',
]

const STATUS_LABEL: Record<ChatConversation['status'], string> = {
  OPEN: 'With support',
  PENDING: 'Awaiting your reply',
  RESOLVED: 'Resolved',
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const dayLabel = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

const relative = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return dayLabel(iso)
}

interface Props {
  /** The conversation to show; undefined starts a new chat on first send. */
  conversationId: string | undefined
  onConversationChange: (id: string | undefined) => void
  onClose: () => void
}

/**
 * The player's live chat with support. Full screen on phones, a floating
 * panel bottom-right on larger screens. Two views: the thread, and the list of
 * past conversations.
 */
const ChatPanel = ({ conversationId, onConversationChange, onClose }: Props) => {
  const { user } = useAppSelector((state) => state.user)
  const authNavigate = useAuthNavigate()
  const [view, setView] = useState<'thread' | 'history'>('thread')

  // Escape closes, as a dialog should.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <section
      role='dialog'
      aria-label='Live chat with SantiBet support'
      className='fixed inset-0 z-50 flex flex-col overflow-hidden bg-white md:inset-auto md:right-4 md:bottom-6 md:h-[min(640px,calc(100vh-48px))] md:w-[380px] md:rounded-2xl md:border md:border-border md:shadow-2xl'
    >
      {!user ? (
        <>
          <PanelHeader title='Chat with support' onClose={onClose} />
          <div className='flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center'>
            <span className='flex h-14 w-14 items-center justify-center rounded-full bg-card'>
              <HugeiconsIcon icon={CustomerSupportIcon} size={26} />
            </span>
            <p className='text-sm text-neutral-10'>
              Sign in to chat with our support team. We’ll keep the conversation
              on your account so you can pick it up anywhere.
            </p>
            <button
              type='button'
              onClick={() => {
                onClose()
                authNavigate('/signin')
              }}
              className='w-full cursor-pointer rounded-full bg-black py-3 text-sm font-semibold text-white'
            >
              Sign in
            </button>
            <Link
              to='/contact-us'
              onClick={onClose}
              className='text-sm font-semibold text-black underline underline-offset-2'
            >
              Or send us a message without an account
            </Link>
          </div>
        </>
      ) : view === 'history' ? (
        <HistoryView
          onBack={() => setView('thread')}
          onClose={onClose}
          onOpen={(id) => {
            onConversationChange(id)
            setView('thread')
          }}
          onNew={() => {
            onConversationChange(undefined)
            setView('thread')
          }}
        />
      ) : (
        <ThreadView
          conversationId={conversationId}
          onConversationChange={onConversationChange}
          onHistory={() => setView('history')}
          onClose={onClose}
        />
      )}
    </section>
  )
}

const PanelHeader = ({
  title,
  subtitle,
  onClose,
  onBack,
  actions,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  onBack?: () => void
  actions?: React.ReactNode
}) => (
  <header className='flex items-center gap-2 border-b border-border px-3 py-3'>
    {onBack && (
      <IconButton label='Back' onClick={onBack}>
        <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
      </IconButton>
    )}
    <div className='flex min-w-0 flex-1 flex-col px-1'>
      <span className='truncate text-sm font-semibold text-black'>{title}</span>
      {subtitle && (
        <span className='truncate text-xs text-neutral-10'>{subtitle}</span>
      )}
    </div>
    {actions}
    <IconButton label='Close chat' onClick={onClose}>
      <HugeiconsIcon icon={Cancel01Icon} size={20} />
    </IconButton>
  </header>
)

const IconButton = ({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type='button'
    aria-label={label}
    title={label}
    onClick={onClick}
    className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-black hover:bg-hover'
  >
    {children}
  </button>
)

// ── Thread ───────────────────────────────────────────────────────────────────

const ThreadView = ({
  conversationId,
  onConversationChange,
  onHistory,
  onClose,
}: {
  conversationId: string | undefined
  onConversationChange: (id: string | undefined) => void
  onHistory: () => void
  onClose: () => void
}) => {
  const onConversation = useCallback(
    (c: ChatConversation) => onConversationChange(c.id),
    [onConversationChange],
  )
  const thread = useChatThread({
    conversationId,
    visible: true,
    onConversation,
  })
  const { conversation, messages, typingAgent } = thread

  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottom = useRef(true)

  // Follow new messages unless the player has scrolled up to read history.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages.length, typingAgent])

  useEffect(() => {
    inputRef.current?.focus()
  }, [conversationId])

  const submit = async (text = draft) => {
    if (!text.trim()) return
    setDraft('')
    setSendError('')
    stickToBottom.current = true
    const error = await thread.send(text, {
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    })
    if (error) setSendError(error)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  const resolved = conversation?.status === 'RESOLVED'
  const subtitle = conversation
    ? `${conversation.ticketNumber} · ${
        conversation.agentName
          ? `${conversation.agentName} is helping you`
          : STATUS_LABEL[conversation.status]
      }`
    : 'We usually reply within a few minutes'

  return (
    <>
      <PanelHeader
        title={conversation?.subject || 'SantiBet Support'}
        subtitle={subtitle}
        onClose={onClose}
        actions={
          <IconButton label='Your conversations' onClick={onHistory}>
            <HugeiconsIcon icon={MessageMultiple01Icon} size={20} />
          </IconButton>
        }
      />

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className='flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4'
        aria-live='polite'
      >
        {thread.loading ? (
          <div className='m-auto h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent' />
        ) : thread.loadError ? (
          <div className='m-auto flex flex-col items-center gap-2 text-center text-sm text-neutral-10'>
            <p>We couldn’t load this conversation.</p>
            <button
              type='button'
              onClick={() => void thread.refresh()}
              className='font-semibold text-black underline'
            >
              Try again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <Welcome onPick={(topic) => void submit(topic)} />
        ) : (
          <>
            {thread.hasMore && (
              <button
                type='button'
                onClick={() => {
                  stickToBottom.current = false
                  void thread.loadOlder()
                }}
                disabled={thread.loadingOlder}
                className='mx-auto mb-2 cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-neutral-10 hover:bg-hover'
              >
                {thread.loadingOlder ? 'Loading…' : 'Load earlier messages'}
              </button>
            )}
            {messages.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                previous={messages[index - 1]}
                onRetry={() => thread.retry(message)}
              />
            ))}
            {typingAgent && (
              <div className='mt-1 flex items-center gap-2 text-xs text-neutral-10'>
                <span className='flex gap-0.5 rounded-2xl bg-card px-3 py-2.5'>
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className='h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-10'
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
                {typingAgent} is typing…
              </div>
            )}
          </>
        )}
      </div>

      {resolved && conversation && (
        <ResolvedBar
          conversation={conversation}
          onRated={thread.setConversation}
          onNew={() => onConversationChange(undefined)}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className='border-t border-border p-3'
      >
        {sendError && (
          <p className='mb-2 flex items-center gap-1.5 text-xs text-error'>
            <HugeiconsIcon icon={Alert02Icon} size={14} />
            {sendError}
          </p>
        )}
        <div className='flex items-end gap-2 rounded-2xl border border-border bg-white px-3 py-2 focus-within:border-black'>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (e.target.value) thread.notifyTyping()
            }}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_CHARS}
            placeholder={resolved ? 'Reply to reopen this conversation…' : 'Type your message…'}
            aria-label='Message'
            className='max-h-32 min-h-6 flex-1 resize-none bg-transparent text-sm text-black outline-none [field-sizing:content] placeholder:text-placeholder'
          />
          <button
            type='submit'
            aria-label='Send'
            disabled={!draft.trim()}
            className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black text-white transition-opacity disabled:cursor-default disabled:opacity-30'
          >
            <HugeiconsIcon icon={SentIcon} size={16} />
          </button>
        </div>
        <p className='mt-1.5 text-center text-[11px] text-placeholder'>
          Never share your password or card PIN — our team will never ask.
        </p>
      </form>
    </>
  )
}

const Welcome = ({ onPick }: { onPick: (topic: string) => void }) => (
  <div className='m-auto flex w-full flex-col items-center gap-4 px-2 text-center'>
    <span className='flex h-14 w-14 items-center justify-center rounded-full bg-black text-white'>
      <HugeiconsIcon icon={CustomerSupportIcon} size={26} />
    </span>
    <div>
      <p className='text-base font-semibold text-black'>Hi there 👋</p>
      <p className='mt-1 text-sm text-neutral-10'>
        How can we help? Pick a topic or type your question below.
      </p>
    </div>
    <div className='flex w-full flex-col gap-2'>
      {QUICK_TOPICS.map((topic) => (
        <button
          key={topic}
          type='button'
          onClick={() => onPick(topic)}
          className='cursor-pointer rounded-xl border border-border px-4 py-2.5 text-left text-sm text-black hover:bg-hover'
        >
          {topic}
        </button>
      ))}
    </div>
  </div>
)

const MessageRow = ({
  message,
  previous,
  onRetry,
}: {
  message: DisplayMessage
  previous: DisplayMessage | undefined
  onRetry: () => void
}) => {
  const newDay =
    !previous ||
    new Date(previous.createdAt).toDateString() !==
      new Date(message.createdAt).toDateString()
  const grouped =
    !newDay &&
    previous?.sender === message.sender &&
    previous.agentName === message.agentName &&
    new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() <
      5 * 60 * 1000

  if (message.sender === 'SYSTEM') {
    return (
      <>
        {newDay && <DayDivider iso={message.createdAt} />}
        <p className='mx-auto my-2 max-w-[85%] text-center text-xs whitespace-pre-wrap text-neutral-10'>
          {message.body}
        </p>
      </>
    )
  }

  const mine = message.sender === 'USER'
  return (
    <>
      {newDay && <DayDivider iso={message.createdAt} />}
      <div
        className={classNames('flex flex-col', mine ? 'items-end' : 'items-start', {
          'mt-3': !grouped,
        })}
      >
        {!mine && !grouped && (
          <span className='mb-1 ml-1 text-[11px] font-semibold text-neutral-10'>
            {message.agentName ?? 'Support'}
          </span>
        )}
        <div
          className={classNames(
            'max-w-[82%] rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap',
            mine ? 'rounded-br-md bg-black text-white' : 'rounded-bl-md bg-card text-black',
            { 'opacity-60': message.pending },
          )}
        >
          {message.body}
        </div>
        {message.failed ? (
          <button
            type='button'
            onClick={onRetry}
            className='mt-1 mr-1 flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-error'
          >
            <HugeiconsIcon icon={Alert02Icon} size={12} />
            Not sent — tap to retry
          </button>
        ) : (
          <span className='mx-1 mt-0.5 text-[10px] text-placeholder'>
            {message.pending ? 'Sending…' : time(message.createdAt)}
          </span>
        )}
      </div>
    </>
  )
}

const DayDivider = ({ iso }: { iso: string }) => (
  <div className='my-3 flex items-center gap-3 text-[11px] text-placeholder'>
    <span className='h-px flex-1 bg-border' />
    {dayLabel(iso)}
    <span className='h-px flex-1 bg-border' />
  </div>
)

const ResolvedBar = ({
  conversation,
  onRated,
  onNew,
}: {
  conversation: ChatConversation
  onRated: (c: ChatConversation) => void
  onNew: () => void
}) => {
  const [hover, setHover] = useState(0)
  const [saving, setSaving] = useState(false)
  const rating = conversation.rating ?? 0

  const rate = async (value: number) => {
    setSaving(true)
    try {
      onRated(await rateConversation(conversation.id, value))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='flex flex-col items-center gap-2 border-t border-border bg-card/50 px-4 py-3 text-center'>
      <p className='text-xs font-semibold text-black'>
        {rating ? 'Thanks for your feedback!' : 'This conversation was resolved. How did we do?'}
      </p>
      <div className='flex gap-1' onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type='button'
            disabled={saving}
            aria-label={`Rate ${value} out of 5`}
            onMouseEnter={() => setHover(value)}
            onClick={() => void rate(value)}
            className={classNames(
              'cursor-pointer transition-colors',
              (hover || rating) >= value ? 'text-warning' : 'text-placeholder',
            )}
          >
            <HugeiconsIcon icon={StarIcon} size={22} />
          </button>
        ))}
      </div>
      <button
        type='button'
        onClick={onNew}
        className='flex cursor-pointer items-center gap-1 text-xs font-semibold text-black underline underline-offset-2'
      >
        <HugeiconsIcon icon={PlusSignIcon} size={12} />
        Start a new conversation
      </button>
    </div>
  )
}

// ── History ──────────────────────────────────────────────────────────────────

const HistoryView = ({
  onBack,
  onClose,
  onOpen,
  onNew,
}: {
  onBack: () => void
  onClose: () => void
  onOpen: (id: string) => void
  onNew: () => void
}) => {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useChatConversations(true)
  const conversations = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <>
      <PanelHeader title='Your conversations' onBack={onBack} onClose={onClose} />
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='mx-auto mt-10 h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent' />
        ) : conversations.length === 0 ? (
          <p className='mt-10 px-6 text-center text-sm text-neutral-10'>
            No conversations yet.
          </p>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type='button'
                  onClick={() => onOpen(c.id)}
                  className='flex w-full cursor-pointer flex-col gap-0.5 border-b border-border px-4 py-3 text-left hover:bg-hover'
                >
                  <span className='flex items-center gap-2'>
                    <span className='truncate text-sm font-semibold text-black'>
                      {c.subject || 'Live chat'}
                    </span>
                    <span
                      className={classNames(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        c.status === 'RESOLVED'
                          ? 'bg-card text-neutral-10'
                          : c.status === 'PENDING'
                            ? 'bg-market-warning text-warning'
                            : 'bg-success-bg text-success',
                      )}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                    <span className='ml-auto shrink-0 text-[11px] text-placeholder'>
                      {relative(c.lastMessageAt)}
                    </span>
                  </span>
                  <span className='flex items-center gap-2'>
                    <span
                      className={classNames(
                        'flex-1 truncate text-xs',
                        c.unreadCount ? 'font-semibold text-black' : 'text-neutral-10',
                      )}
                    >
                      {c.lastMessageSender === 'USER' ? 'You: ' : ''}
                      {c.lastMessagePreview}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className='flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white'>
                        {c.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className='text-[11px] text-placeholder'>{c.ticketNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {hasNextPage && (
          <button
            type='button'
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className='mx-auto my-3 block cursor-pointer text-xs font-semibold text-black underline'
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
      <div className='border-t border-border p-3'>
        <button
          type='button'
          onClick={onNew}
          className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-semibold text-white'
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          New conversation
        </button>
      </div>
    </>
  )
}

export default ChatPanel
