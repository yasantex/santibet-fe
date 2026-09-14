export type OutcomeTone = 'yes' | 'no' | 'mid'

/**
 * Color styling per outcome tone, shared between MarketCard and TradePanel so
 * the draw/mid color always matches wherever a market's outcomes are shown.
 */
export const TONE_STYLES: Record<
  OutcomeTone,
  { percent: string; bar: string; button: string; active: string }
> = {
  yes: {
    percent: 'text-success',
    bar: 'bg-success',
    button: 'bg-market-success text-success hover:bg-success hover:text-white',
    active: 'border-success bg-market-success text-success',
  },
  no: {
    percent: 'text-error',
    bar: 'bg-error',
    button: 'bg-market-error text-error hover:bg-error hover:text-white',
    active: 'border-error bg-market-error text-error',
  },
  // Middle outcome(s) of a 3+ way market (e.g. the Draw in a 1X2 game).
  mid: {
    percent: 'text-warning',
    bar: 'bg-warning',
    button: 'bg-market-warning text-warning hover:bg-warning hover:text-white',
    active: 'border-warning bg-market-warning text-warning',
  },
}

/**
 * Tone for one outcome of a market: binary yes/no markets keep the familiar
 * green/red split; 3+ outcome markets (e.g. a 1X2 match) go green for the
 * first, red for the last, and amber for anything in between (the draw).
 */
export const outcomeTone = (
  market: { yes?: { id: string }; no?: { id: string }; outcomes: { id: string }[] },
  outcomeId: string,
  index: number,
): OutcomeTone => {
  const isBinary = !!market.yes && !!market.no && market.outcomes.length <= 2
  if (isBinary) return outcomeId === market.yes?.id ? 'yes' : 'no'
  if (index === 0) return 'yes'
  if (index === market.outcomes.length - 1) return 'no'
  return 'mid'
}

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
