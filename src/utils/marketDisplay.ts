/**
 * Outcome colour. Binary markets use yes/no (green/red). In 3+ outcome markets
 * the first is green, the last red, and each outcome in between gets its own
 * colour from MID_TONES — so "Maybe", "No" and "Kinda" never look identical.
 */
export type OutcomeTone =
  | 'yes'
  | 'no'
  | 'amber'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'cyan'

/** Middle-outcome colours, in order. Amber first so a 1X2 "Draw" stays amber. */
const MID_TONES: OutcomeTone[] = ['amber', 'blue', 'violet', 'pink', 'cyan']

type ToneStyle = {
  /** Percent text. */
  percent: string
  /** Probability bar fill. */
  bar: string
  /** Tinted outcome button (fills solid on hover). */
  button: string
  /** Selected state with outline (trade panel). */
  active: string
  /** Selected state, solid fill (market detail outcome buttons). */
  solid: string
}

/**
 * Colour styling per outcome tone, shared by MarketCard, LiveEventCard,
 * TradePanel and the market page so an outcome keeps its colour everywhere.
 * Middle tones use the Tailwind palette at low opacity, which reads well on
 * both the light and dark card backgrounds.
 */
export const TONE_STYLES: Record<OutcomeTone, ToneStyle> = {
  yes: {
    percent: 'text-success',
    bar: 'bg-success',
    button: 'bg-market-success text-success hover:bg-success hover:text-white',
    active: 'border-success bg-market-success text-success',
    solid: 'bg-success text-white',
  },
  no: {
    percent: 'text-error',
    bar: 'bg-error',
    button: 'bg-market-error text-error hover:bg-error hover:text-white',
    active: 'border-error bg-market-error text-error',
    solid: 'bg-error text-white',
  },
  amber: {
    percent: 'text-warning',
    bar: 'bg-warning',
    button: 'bg-market-warning text-warning hover:bg-warning hover:text-white',
    active: 'border-warning bg-market-warning text-warning',
    solid: 'bg-warning text-white',
  },
  blue: {
    percent: 'text-blue-500',
    bar: 'bg-blue-500',
    button: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white',
    active: 'border-blue-500 bg-blue-500/10 text-blue-500',
    solid: 'bg-blue-500 text-white',
  },
  violet: {
    percent: 'text-violet-500',
    bar: 'bg-violet-500',
    button:
      'bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white',
    active: 'border-violet-500 bg-violet-500/10 text-violet-500',
    solid: 'bg-violet-500 text-white',
  },
  pink: {
    percent: 'text-pink-500',
    bar: 'bg-pink-500',
    button: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white',
    active: 'border-pink-500 bg-pink-500/10 text-pink-500',
    solid: 'bg-pink-500 text-white',
  },
  cyan: {
    percent: 'text-cyan-600',
    bar: 'bg-cyan-600',
    button: 'bg-cyan-600/10 text-cyan-600 hover:bg-cyan-600 hover:text-white',
    active: 'border-cyan-600 bg-cyan-600/10 text-cyan-600',
    solid: 'bg-cyan-600 text-white',
  },
}

/**
 * Tone for one outcome, by its position in the market's full outcome list
 * (so an outcome keeps the same colour on cards, which show only the first
 * few, and on the market page, which shows them all).
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
  return MID_TONES[(index - 1) % MID_TONES.length]
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

/**
 * Short names for sibling markets in one event, by dropping the words every
 * title shares at the start and end: "Will Lula win the 2026 Brazilian
 * presidential election?" → "Lula"; "Kraken IPO by June 30, 2027?" → "June 30".
 * Falls back to the full title when nothing distinctive is left.
 */
export const siblingShortLabels = (titles: string[]): string[] => {
  if (titles.length < 2) return titles
  const words = titles.map((t) => t.trim().split(/\s+/))
  const minLen = Math.min(...words.map((w) => w.length))
  const shared = (at: (w: string[], i: number) => string) => {
    let n = 0
    while (n < minLen && words.every((w) => at(w, n) === at(words[0], n))) n++
    return n
  }
  const prefix = shared((w, i) => w[i])
  const suffix = Math.min(
    shared((w, i) => w[w.length - 1 - i]),
    minLen - prefix - 1,
  )
  return words.map((w, i) => {
    const label = w
      .slice(prefix, w.length - Math.max(suffix, 0))
      .join(' ')
      .replace(/[\s?:.,!-]+$/, '')
    return label || titles[i]
  })
}
