import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Share08Icon } from '@hugeicons/core-free-icons'
import ShareModal from './ShareModal'
import { marketDisplayTitle, marketHref } from '../../utils/marketDisplay'
import type { UiMarket } from '../../types/market.types'

type ShareMarketButtonProps = {
  market: UiMarket
  className?: string
  iconSize?: number
}

/** Icon button that opens the share sheet for a market. */
const ShareMarketButton = ({
  market,
  className = 'text-neutral-10 hover:text-black',
  iconSize = 18,
}: ShareMarketButtonProps) => {
  const [open, setOpen] = useState(false)

  const title = marketDisplayTitle(market)
  const link = `${window.location.origin}${marketHref(market)}`

  return (
    <>
      <button
        type='button'
        aria-label='Share market'
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={className}
      >
        <HugeiconsIcon icon={Share08Icon} size={iconSize} />
      </button>

      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        heading='Share this market'
        title={title}
        detail={market.category}
        message={`What’s your prediction? "${title}" on SantiBet:`}
        link={link}
      />
    </>
  )
}

export default ShareMarketButton
