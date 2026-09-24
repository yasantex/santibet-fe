import { SUSPENDED_CTA_HINT } from '../../utils/constants'

/** Subtext shown under a write CTA that's disabled for a suspended account. */
const SuspendedHint = ({ className = '' }: { className?: string }) => (
  <p className={`text-xs text-neutral-10 ${className}`}>{SUSPENDED_CTA_HINT}</p>
)

export default SuspendedHint
