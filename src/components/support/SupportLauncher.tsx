import { HugeiconsIcon } from '@hugeicons/react'
import { CustomerSupportIcon } from '@hugeicons/core-free-icons'
import { useSupport } from '../../support/supportContext'

/**
 * Floating live-chat launcher. Replaces Chatwoot's own bubble (hidden via
 * `hideMessageBubble`) so it can own the bottom-right corner above the mobile
 * bottom nav; the bet-slip FAB and back-to-top button stack above it (see
 * `FAB_STACK_CLASS`).
 */
const SupportLauncher = () => {
  const { chatAvailable, chatStatus, unreadCount, openChat } = useSupport()
  if (!chatAvailable) return null

  const loading = chatStatus === 'loading'

  return (
    <button
      type='button'
      onClick={openChat}
      aria-label={
        unreadCount > 0
          ? `Open live chat, ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
          : 'Open live chat'
      }
      title='Chat with support'
      className='fixed right-4 bottom-20 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-xl transition-transform hover:scale-[1.05] md:bottom-6'
    >
      {loading ? (
        <span className='h-5 w-5 animate-spin rounded-full border-2 border-brand-green border-t-transparent' />
      ) : (
        <HugeiconsIcon icon={CustomerSupportIcon} size={22} />
      )}
      {unreadCount > 0 && (
        <span className='absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold text-white'>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default SupportLauncher
