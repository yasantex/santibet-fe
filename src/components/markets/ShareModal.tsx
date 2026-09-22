import { HugeiconsIcon } from '@hugeicons/react'
import {
  Copy01Icon,
  Facebook01Icon,
  NewTwitterIcon,
  Share08Icon,
  TelegramIcon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import ModalComponent from '../globals/ModalComponent'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'

type ShareModalProps = {
  open: boolean
  onClose: () => void
  heading: string
  /** Bold first line of the preview box. */
  title: string
  /** Muted second line of the preview box. */
  detail?: string
  /** Helper copy under the preview. */
  hint?: string
  /** Text sent alongside the link. */
  message: string
  /** Absolute URL being shared. */
  link: string
  copiedToast?: string
}

const buttonClass =
  'flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-semibold text-black hover:bg-hover'

const ShareModal = ({
  open,
  onClose,
  heading,
  title,
  detail,
  hint,
  message,
  link,
  copiedToast = 'Link copied to clipboard',
}: ShareModalProps) => {
  const enc = encodeURIComponent
  const targets = [
    {
      label: 'WhatsApp',
      icon: WhatsappIcon,
      href: `https://wa.me/?text=${enc(`${message} ${link}`)}`,
    },
    {
      label: 'X',
      icon: NewTwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${enc(message)}&url=${enc(link)}`,
    },
    {
      label: 'Telegram',
      icon: TelegramIcon,
      href: `https://t.me/share/url?url=${enc(link)}&text=${enc(message)}`,
    },
    {
      label: 'Facebook',
      icon: Facebook01Icon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}&quote=${enc(message)}`,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${message} ${link}`)
      showSuccessToast(copiedToast)
    } catch {
      showWarningToast('Could not copy link')
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: message, url: link })
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  return (
    // The modal is portaled but React events still bubble through the parent
    // tree, so a share button inside a clickable card would otherwise trigger
    // the card's own onClick/onKeyDown.
    <span
      className='contents'
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <ModalComponent
        open={open}
        handleClose={onClose}
        title={heading}
        className='max-w-100! w-[90%]!'
      >
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1 rounded-md bg-surface-hover p-3 text-sm'>
            <span className='font-semibold text-black'>{title}</span>
            {detail && <span className='text-xs text-black/60'>{detail}</span>}
          </div>
          {hint && <p className='text-xs text-black/60'>{hint}</p>}

          <div className='grid grid-cols-4 gap-2'>
            {targets.map((t) => (
              <a
                key={t.label}
                href={t.href}
                target='_blank'
                rel='noreferrer'
                className='flex flex-col items-center gap-1 rounded-md border border-border py-3 text-xs text-black hover:bg-hover'
              >
                <HugeiconsIcon icon={t.icon} size={20} />
                {t.label}
              </a>
            ))}
          </div>

          <div className='flex gap-2'>
            <button type='button' onClick={copyLink} className={buttonClass}>
              <HugeiconsIcon icon={Copy01Icon} size={16} />
              Copy link
            </button>
            {typeof navigator.share === 'function' && (
              <button
                type='button'
                onClick={nativeShare}
                className={buttonClass}
              >
                <HugeiconsIcon icon={Share08Icon} size={16} />
                More…
              </button>
            )}
          </div>
        </div>
      </ModalComponent>
    </span>
  )
}

export default ShareModal
