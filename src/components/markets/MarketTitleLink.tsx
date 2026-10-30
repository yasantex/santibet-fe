import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

/**
 * A market's title in the player's orders and portfolio: a link to the market
 * while it's live, plain text once it has settled — a settled market is
 * usually gone from the lobby, so the link would land on an error page.
 */
const MarketTitleLink = ({
  marketId,
  settled,
  className,
  children,
}: {
  marketId: string
  settled: boolean
  /** Shared by both states; the link adds its own hover underline. */
  className: string
  children: ReactNode
}) => {
  const navigate = useNavigate()

  if (settled) return <span className={className}>{children}</span>

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
