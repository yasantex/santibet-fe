import { HugeiconsIcon } from '@hugeicons/react'
import { CustomerSupportIcon, Flag01Icon } from '@hugeicons/core-free-icons'
import { useSupport } from '../../support/supportContext'

/** "Chat with us" + "Report an issue" cards for the help/contact pages. */
const SupportActions = () => {
  const { chatAvailable, unreadCount, openChat, openReport } = useSupport()

  return (
    <div className='flex flex-col gap-3 sm:flex-row'>
      {chatAvailable && (
        <button
          type='button'
          onClick={openChat}
          className='flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-hover'
        >
          <HugeiconsIcon
            icon={CustomerSupportIcon}
            size={20}
            className='text-black'
          />
          <div className='flex flex-col'>
            <span className='flex items-center gap-2 text-sm font-semibold text-black'>
              Live chat
              {unreadCount > 0 && (
                <span className='rounded-full bg-error px-1.5 text-[11px] font-bold text-white'>
                  {unreadCount}
                </span>
              )}
            </span>
            <span className='text-xs text-neutral-10'>
              Talk to our support team now
            </span>
          </div>
        </button>
      )}
      <button
        type='button'
        onClick={() => openReport()}
        className='flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-hover'
      >
        <HugeiconsIcon icon={Flag01Icon} size={20} className='text-black' />
        <div className='flex flex-col'>
          <span className='text-sm font-semibold text-black'>
            Report an issue
          </span>
          <span className='text-xs text-neutral-10'>
            Deposits, withdrawals, bets or markets
          </span>
        </div>
      </button>
    </div>
  )
}

export default SupportActions
