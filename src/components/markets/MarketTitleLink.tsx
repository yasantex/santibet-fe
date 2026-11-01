import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

// Market statuses whose page is gone from the lobby.
const GONE_STATUSES = new Set(['SETTLED', 'VOIDED'])

/**
 * A market's title in the player's orders and portfolio: a link to the market
 * while it's live, plain text once it has settled or been voided — the market
 * is usually gone from the lobby, so the link would land on an error page.
 * Goes by the market's own `status` when the API sends it, else by `settled`.
 */
const MarketTitleLink = ({
  marketId,
  marketStatus,
  settled,
  className,
  children,
}: {
  marketId: string
  /** `market.status` from the bet or position. */
  marketStatus?: string
  /** Fallback when there's no status, e.g. the bet has a result. */
  settled: boolean
  /** Shared by both states; the link adds its own hover underline. */
  className: string
  children: ReactNode
}) => {
  const navigate = useNavigate()
  const gone = marketStatus ? GONE_STATUSES.has(marketStatus) : settled

  if (gone) return <span className={className}>{children}</span>

  return (
    <button
      type='button'
      onClick={() => navigate(`/markets/${marketId}`)}
      className={`${className} hover:underline`}
    >
      {children}
    </button>
  )
}

export default MarketTitleLink
