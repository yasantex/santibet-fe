import { useEffect, useState } from 'react'
import { isMarketOpen } from '../utils/marketDisplay'

// setTimeout overflows past ~24.8 days; longer waits just re-check later.
const MAX_DELAY = 2 ** 31 - 1

/**
 * `isMarketOpen`, re-evaluated the moment the market's close time passes so a
 * page left open can't keep accepting predictions.
 */
const useMarketOpen = (market: {
  status: string
  closeTime?: string | null
}): boolean => {
  const [, setTick] = useState(0)
  const open = isMarketOpen(market)

  useEffect(() => {
    if (!open || !market.closeTime) return
    const remaining = new Date(market.closeTime).getTime() - Date.now()
    if (Number.isNaN(remaining)) return
    const timer = setTimeout(
      () => setTick((t) => t + 1),
      Math.min(Math.max(remaining, 0) + 50, MAX_DELAY),
    )
    return () => clearTimeout(timer)
  }, [open, market.closeTime])

  return open
}

export default useMarketOpen
