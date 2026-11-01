import { HugeiconsIcon } from '@hugeicons/react'
import { GiftIcon } from '@hugeicons/core-free-icons'

/** Marks a bet or position staked with bonus credit. */
const BonusBetBadge = ({ className = '' }: { className?: string }) => (
  <span
    className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success ${className}`}
  >
    <HugeiconsIcon icon={GiftIcon} size={12} />
    Bonus bet
  </span>
)

export default BonusBetBadge
