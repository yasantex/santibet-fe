import { useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { TicketStarIcon } from '@hugeicons/core-free-icons'
import { useComboSlip } from '../../hooks/useComboSlip'
import { FAB_STACK_CLASS, useSupport } from '../../support/supportContext'

/** Sports browsing surfaces where a combo can be built. */
const isSportsSurface = (pathname: string) =>
  pathname === '/live' || pathname.toLowerCase().startsWith('/category/sports')

/**
 * Floating "Bet slip" button (bottom-right, above the mobile bottom nav and
 * the live-chat launcher).
 * - With selections: shows the leg count and live combined odds, on any page.
 * - Empty, but on a sports/live page: shows an inviting "Build a combo" prompt
 *   so the feature is discoverable before any outcome is tapped.
 * - Empty elsewhere: hidden.
 */
const BetSlipFab = ({ onClick }: { onClick: () => void }) => {
  const { legCount, combinedOdds } = useComboSlip()
  const { pathname } = useLocation()
  const { chatAvailable } = useSupport()
  const onSportsSurface = isSportsSurface(pathname)

  if (legCount === 0 && !onSportsSurface) return null
  const empty = legCount === 0

  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={empty ? 'Build a combo bet' : 'Open bet slip'}
      className={`fixed right-4 z-40 flex items-center gap-3 rounded-full bg-black py-3 pr-5 pl-3 text-white shadow-xl transition-transform hover:scale-[1.03] ${
        chatAvailable ? FAB_STACK_CLASS.withChat : FAB_STACK_CLASS.withoutChat
      }`}
    >
      <span className='relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-green text-black'>
        <HugeiconsIcon icon={TicketStarIcon} size={20} />
        {!empty && (
          <span className='absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold text-white'>
            {legCount}
          </span>
        )}
      </span>
      <span className='flex flex-col items-start leading-tight'>
        <span className='text-sm font-bold'>
          {empty ? 'Build a combo' : 'Bet slip'}
        </span>
        <span className='text-xs font-semibold text-brand-green'>
          {empty
            ? 'Tap outcomes to start'
            : combinedOdds > 0
              ? `×${combinedOdds.toFixed(2)} odds`
              : `${legCount} selection${legCount > 1 ? 's' : ''}`}
        </span>
      </span>
    </button>
  )
}

export default BetSlipFab
