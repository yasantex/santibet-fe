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
 * Display title for a market card: prefix the parent event so generic market
 * names read in context ("Hamburger SV vs 1. FC Köln: Match Winner"). Skips the
 * prefix when the event title is absent, identical, or already the start of the
 * market title, to avoid duplication on single-market events.
 */
export const marketDisplayTitle = (market: {
  title: string
  eventTitle?: string
}): string => {
  const event = (market.eventTitle ?? '').trim()
  const title = (market.title ?? '').trim()
  if (!event || !title) return title || event
  // Compare with trailing punctuation/whitespace stripped so near-identical
  // single-market events ("Putin out…?" vs "Putin out…") don't double up.
  const strip = (s: string) => s.toLowerCase().replace(/[\s?:.!,-]+$/, '')
  const e = strip(event)
  const t = strip(title)
  if (e === t || t.startsWith(e) || e.startsWith(t)) return title
  return `${event}: ${title}`
}

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
