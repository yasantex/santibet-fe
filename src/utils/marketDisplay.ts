export const categoryIcons: Record<string, string> = {
  Politics: '🏛️',
  Sports: '🏴',
  Crypto: '₿',
  Entertainment: '🎤',
  Tech: '💻',
  Finance: '🏦',
  General: '🎯',
}

export const categoryIcon = (category?: string) =>
  categoryIcons[category ?? ''] ?? '🎯'

/**
 * Build the market-detail URL. The event id is carried so the detail page can
 * resolve markets sourced from the events feed (whose ids 404 on the flat
 * single-market endpoint).
 */
export const marketHref = (
  market: { id: string; eventId?: string },
  outcomeId?: string,
) => {
  const params = new URLSearchParams()
  if (outcomeId) params.set('outcome', outcomeId)
  if (market.eventId) params.set('event', market.eventId)
  const qs = params.toString()
  return `/markets/${market.id}${qs ? `?${qs}` : ''}`
}