import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Share08Icon } from '@hugeicons/core-free-icons'
import ShareModal from './ShareModal'

type ShareBetButtonProps = {
  marketId: string
  outcomeId: string
  title: string
  outcomeLabel: string
  /** Price per share the bettor got, formatted for display (e.g. "₦50"). */
  price: string
  /** Stake formatted for display (e.g. "₦200.00"). */
  stake: string
}

/**
 * Share a bet ticket. The link points at the market with the same outcome
 * pre-selected, so whoever opens it can "clone" the bet at the market's
 * *current* price rather than the sharer's entry price.
 */
const ShareBetButton = ({
  marketId,
  outcomeId,
  title,
  outcomeLabel,
  price,
  stake,
}: ShareBetButtonProps) => {
  const [open, setOpen] = useState(false)

  const link = `${window.location.origin}/markets/${marketId}?outcome=${encodeURIComponent(outcomeId)}`
  const message = `I predicted ${outcomeLabel ? `"${outcomeLabel}"` : 'an outcome'} on "${title}" at ${price} a share (staked ${stake}) on SantiBet. Copy my bet:`

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='Share bet'
        className='flex items-center gap-1 cursor-pointer rounded-full px-2 py-1 text-sm font-semibold text-black hover:bg-hover'
      >
        <HugeiconsIcon icon={Share08Icon} size={14} className=' font-semibold text-black' />
        Share
      </button>

      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        heading='Share this bet'
        title={title}
        detail={`${outcomeLabel} · ${price} a share · Staked ${stake}`}
        hint='Anyone who opens your link can copy this bet at the market’s current price.'
        message={message}
        link={link}
        copiedToast='Bet link copied'
      />
    </>
  )
}

export default ShareBetButton
