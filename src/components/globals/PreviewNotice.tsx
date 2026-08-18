import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'

/**
 * Small banner for features whose backing API is not available yet. The UI is
 * real; the data shown is illustrative until the endpoint ships.
 */
const PreviewNotice = ({ children }: { children: React.ReactNode }) => (
  <div className='flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-black'>
    <HugeiconsIcon
      icon={InformationCircleIcon}
      size={18}
      className='mt-0.5 shrink-0 text-warning'
    />
    <span className='text-neutral-10'>{children}</span>
  </div>
)

export default PreviewNotice
