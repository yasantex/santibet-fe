import { Fragment } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { RepeatIcon } from '@hugeicons/core-free-icons'
import { formatNairaCompact } from '../../utils/functions'
import { marketTags, type MarketTag } from '../../utils/marketDisplay'
import type { UiMarket } from '../../types/market.types'

/** "₦582K Vol. · UEFA Nations League · 7:45 PM" — volume plus context tags. */
const MarketMetaLine = ({
  market,
  className = '',
}: {
  market: UiMarket
  className?: string
}) => {
  const tags: MarketTag[] = marketTags(market)
  return (
    <span
      className={`flex min-w-0 items-center gap-1.5 text-xs text-placeholder ${className}`}
    >
      <span className='shrink-0'>{formatNairaCompact(market.volume)} Vol.</span>
      {tags.map((tag) => (
        <Fragment key={tag.label}>
          {!tag.recurring && <span aria-hidden>·</span>}
          <span className='flex min-w-0 items-center gap-1'>
            {tag.recurring && (
              <HugeiconsIcon icon={RepeatIcon} size={14} className='shrink-0' />
            )}
            <span className='truncate'>{tag.label}</span>
          </span>
        </Fragment>
      ))}
    </span>
  )
}

export default MarketMetaLine
