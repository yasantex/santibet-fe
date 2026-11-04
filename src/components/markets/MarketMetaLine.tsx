import { Fragment } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { RepeatIcon } from '@hugeicons/core-free-icons'
import { formatCompact, formatNairaCompact } from '../../utils/functions'
import { marketTags, type MarketTag } from '../../utils/marketDisplay'
import type { UiMarket } from '../../types/market.types'

/** "₦582K Vol. · 1.2K trades · UEFA Nations League · 7:45 PM" — volume, trade
 *  count (lobby feed only) and context tags. */
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
      {market.tradeCount != null && market.tradeCount > 0 && (
        <>
          <span aria-hidden>·</span>
          <span className='shrink-0'>
            {formatCompact(market.tradeCount)}{' '}
            {market.tradeCount === 1 ? 'trade' : 'trades'}
          </span>
        </>
      )}
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
