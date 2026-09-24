import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InformationCircleIcon,
  MultiplicationSignIcon,
} from '@hugeicons/core-free-icons'
import useAccountSuspended from '../../hooks/useAccountSuspended'

/**
 * App-wide "viewing only" banner for suspended accounts. Dismissing hides it
 * for the current page only — it comes back on the next navigation.
 */
const SuspendedBanner = () => {
  const suspended = useAccountSuspended()
  const { pathname } = useLocation()
  const [dismissedOn, setDismissedOn] = useState<string | null>(null)

  if (!suspended || dismissedOn === pathname) return null

  return (
    <div
      role='status'
      className='flex items-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-black'
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        size={18}
        className='shrink-0 text-warning'
      />
      <span className='flex-1'>
        <span className='font-semibold'>Account suspended — viewing only.</span>{' '}
        <span className='text-neutral-10'>
          You can browse, but changes are disabled.{' '}
          <Link
            to='/contact-us'
            className='font-semibold text-black underline underline-offset-2'
          >
            Contact support
          </Link>
        </span>
      </span>
      <button
        type='button'
        aria-label='Dismiss'
        onClick={() => setDismissedOn(pathname)}
        className='shrink-0 rounded-md p-1 hover:bg-warning/20'
      >
        <HugeiconsIcon icon={MultiplicationSignIcon} size={16} />
      </button>
    </div>
  )
}

export default SuspendedBanner
