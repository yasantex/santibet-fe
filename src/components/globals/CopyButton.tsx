import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { showWarningToast } from '../../utils/toastUtils'

type CopyButtonProps = {
  value: string
  size?: number
  className?: string
  resetAfterMs?: number
}

export const CopyButton = ({
  value,
  size = 16,
  className = 'shrink-0 text-neutral-10',
  resetAfterMs = 2000,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), resetAfterMs)
    } catch {
      showWarningToast('Could not copy')
    }
  }

  return (
    <button type='button' onClick={handleCopy} className={className}>
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={size} />
    </button>
  )
}