import { HugeiconsIcon } from '@hugeicons/react'
import { TicketStarIcon } from '@hugeicons/core-free-icons'
import { useComboSlip } from '../../hooks/useComboSlip'

/**
 * Floating "Bet slip" button — appears bottom-right once the combo slip has any
 * selections, showing the leg count and live combined odds. Sits above the
 * mobile bottom nav.
 */
const BetSlipFab = ({ onClick }: { onClick: () => void }) => {
  const { legCount, combinedOdds } = useComboSlip()
  if (legCount === 0) return null

  return (
    <button
      type='button'
      onClick={onClick}
      className='fixed right-4 bottom-20 z-40 flex items-center gap-3 rounded-full bg-black py-3 pr-5 pl-3 text-white shadow-xl transition-transform hover:scale-[1.03] md:bottom-6'
    >
      <span className='relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-green text-black'>
        <HugeiconsIcon icon={TicketStarIcon} size={20} />
        <span className='absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold text-white'>
          {legCount}
        </span>
      </span>
      <span className='flex flex-col items-start leading-tight'>
        <span className='text-sm font-bold'>Bet slip</span>
        {combinedOdds > 0 && (
          <span className='text-xs font-semibold text-brand-green'>
            ×{combinedOdds.toFixed(2)} odds
          </span>
        )}
      </span>
    </button>
  )
}

export default BetSlipFab
