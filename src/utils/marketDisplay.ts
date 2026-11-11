import { formatSharePrice } from './functions'
import type { EventTeam, UiMarket } from '../types/market.types'

const foldName = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * The event team a label refers to — an outcome ("Vasco DA Gama"), a score
 * line's competitor, or a name parsed from the title. Matches the full or
 * short name, case- and accent-insensitive. Null for non-team labels
 * ("Draw", "Over 2.5", "Yes").
 */
export const findTeam = (
  teams: EventTeam[] | null | undefined,
  label: string | null | undefined,
): EventTeam | null => {
  if (!teams?.length || !label) return null
  const l = foldName(label)
  if (!l) return null
  return (
    teams.find(
      (t) =>
        foldName(t.name) === l ||
        (!!t.shortName && foldName(t.shortName) === l),
    ) ?? null
  )
}

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

export const NO_LABELS = ['no', 'down', 'under', 'lose', 'false']
export const YES_LABELS = ['yes', 'up', 'over', 'win', 'true']

/**
 * Text colour for an outcome label shown without its market (portfolio,
 * orders): green for yes-like, red for no-like, neutral for everything else —
 * so "Draw" or a team name doesn't read as a loser.
 */
export const outcomeLabelClass = (label?: string | null): string => {
  const l = (label ?? '').trim().toLowerCase()
  if (YES_LABELS.includes(l)) return 'text-success'
  if (NO_LABELS.includes(l)) return 'text-error'
  return 'text-black'
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

/** A pool (parimutuel) market: odds float until close and there's no share
 *  price. Only known on the lobby feed. */
export const isPoolMarket = (market: { executionModel?: string | null }) =>
  market.executionModel === 'PARIMUTUEL'

/**
 * What an outcome button shows: the share price ("₦63"), or on a pool market —
 * which has no share price — its chance ("54%") or, if the user switched the
 * odds format, its current odds ("×1.68"). Never both. A share price
 * already reads as a percentage (₦63 = 63%), so it's left as is.
 */
/** How a pool market's outcomes are priced: payout odds or implied chance. */
export type OddsFormat = 'odds' | 'percent'

export const outcomePriceLabel = (
  market: { executionModel?: string | null },
  outcome: {
    cents: number
    price: number
    percent: number
    decimalOdds?: number | null
  },
  { format = 'percent' }: { format?: OddsFormat } = {},
): string => {
  if (!isPoolMarket(market)) return formatSharePrice(outcome.cents)
  if (format === 'percent') return `${outcome.percent}%`
  const odds =
    outcome.decimalOdds ?? (outcome.price > 0 ? 1 / outcome.price : 0)
  return odds > 0 ? `×${odds.toFixed(2)}` : '—'
}

/** Badge text for a market's status ("settled" reads as "Resolved"). */
export const MARKET_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  closed: 'Closed',
  paused: 'Paused',
  settled: 'Resolved',
  voided: 'Voided',
  disputed: 'Disputed',
  unknown: 'Unavailable',
}

/**
 * Whether a market still takes predictions. `status` only changes on refetch,
 * so a market whose close time has already passed counts as closed too.
 */
export const isMarketOpen = (
  market: { status: string; closeTime?: string | null },
  now = Date.now(),
): boolean => {
  if (market.status !== 'open') return false
  const close = market.closeTime ? new Date(market.closeTime).getTime() : NaN
  return Number.isNaN(close) || now < close
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

export interface MarketTag {
  label: string
  /** Rolling market that re-opens every round — rendered with a repeat icon. */
  recurring?: boolean
}

const RECURRENCE_LABELS: Record<number, string> = {
  300: '5 Min',
  900: '15 Min',
  1800: '30 Min',
  3600: 'Hourly',
  14400: '4 Hours',
  86400: 'Daily',
  604800: 'Weekly',
}

const recurrenceLabel = (seconds: number) => {
  if (RECURRENCE_LABELS[seconds]) return RECURRENCE_LABELS[seconds]
  if (seconds < 3600) return `${Math.round(seconds / 60)} Min`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} Hours`
  return `${Math.round(seconds / 86400)} Days`
}

const DAY_MS = 86_400_000
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** "7:45 PM", "Tomorrow 7:45 PM", "Sat 7:45 PM" or "Oct 20, 7:45 PM". */
const kickoffLabel = (date: Date) => {
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS)
  if (days === 0) return time
  if (days === 1) return `Tomorrow ${time}`
  if (days > 1 && days < 7)
    return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${time}`
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}

/** "Ends Nov 4" (year added when it isn't the current one). */
const endsLabel = (date: Date) =>
  `Ends ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear()
      ? { year: 'numeric' }
      : {}),
  })}`

/**
 * Context tags shown beside the volume on market cards (Polymarket-style):
 * - rolling rounds (crypto Up/Down) → how often a new round opens ("Hourly")
 * - sports → league + kickoff ("Premier League", "Sat 7:45 PM"); sports
 *   markets close at kickoff, so closeTime is the start time
 * - everything else → when the market ends ("Ends Nov 4")
 */
export const marketTags = (market: {
  subtitle?: string
  closeTime?: string
  seriesKey?: string | null
  durationSeconds?: number | null
}): MarketTag[] => {
  const close = market.closeTime ? new Date(market.closeTime) : null
  const upcoming =
    close && !Number.isNaN(close.getTime()) && close.getTime() > Date.now()
      ? close
      : null

  if (market.durationSeconds && market.durationSeconds > 0) {
    return [{ label: recurrenceLabel(market.durationSeconds), recurring: true }]
  }

  if (market.seriesKey?.startsWith('apisports:')) {
    const tags: MarketTag[] = []
    const league = market.subtitle?.trim()
    if (league) tags.push({ label: league })
    if (upcoming) tags.push({ label: kickoffLabel(upcoming) })
    return tags
  }

  return upcoming ? [{ label: endsLabel(upcoming) }] : []
}

// Sports events carry the sport in `seriesKey` (e.g. "apisports:football") and
// the league/competition in `subtitle` (e.g. "Bundesliga"). These drive the
// data-driven sport → league sub-navigation on the Sports page.
const SPORT_LABELS: Record<string, string> = {
  football: 'Football',
  basketball: 'Basketball',
  baseball: 'Baseball',
  hockey: 'Ice Hockey',
  'american-football': 'American Football',
  nfl: 'American Football',
  rugby: 'Rugby',
  tennis: 'Tennis',
  cricket: 'Cricket',
  volleyball: 'Volleyball',
  handball: 'Handball',
  mma: 'MMA',
  boxing: 'Boxing',
}

export const marketSport = (market: { seriesKey?: string | null }): string | null => {
  const key = market.seriesKey ?? ''
  if (!key.startsWith('apisports:')) return null
  const raw = key.slice('apisports:'.length).toLowerCase()
  return (
    SPORT_LABELS[raw] ??
    raw.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

const MORE_MARKETS_SUFFIX = ' - More Markets'

/** Slug of an event's "<title> - More Markets" sibling (spreads, totals…),
 *  which the feed imports as a separate event. */
export const moreMarketsSlug = (slug?: string) =>
  slug ? `${slug}-more-markets` : undefined

/**
 * Drop "<match> - More Markets" events whose main match is in the same list,
 * so one game shows as one card; its markets are on the match page.
 */
export const withoutMoreMarketsDuplicates = <T extends { title: string }>(
  events: T[],
): T[] => {
  const titles = new Set(events.map((e) => e.title))
  return events.filter(
    (e) =>
      !e.title.endsWith(MORE_MARKETS_SUFFIX) ||
      !titles.has(e.title.slice(0, -MORE_MARKETS_SUFFIX.length)),
  )
}

const isYesNoMarket = (m: { outcomes: { label: string }[] }) =>
  m.outcomes.length === 2 &&
  m.outcomes.some((o) => YES_LABELS.includes(o.label.trim().toLowerCase()))

/** Short name for one market in a group. Polymarket imports carry it as the
 *  subtitle ("Arsenal", "Draw (Arsenal vs. Chelsea)"); otherwise read it from
 *  the question: "Will Arsenal win on …?" → "Arsenal", "…a draw?" → "Draw". */
const groupItemLabel = (market: { title: string; subtitle?: string | null }) => {
  const sub = (market.subtitle ?? '').trim()
  if (/^draw\b/i.test(sub) || /\bend in a draw\b/i.test(market.title))
    return 'Draw'
  if (sub) return sub
  const win = market.title.match(/^will (.+?) win\b/i)
  return win ? win[1] : market.title
}

/**
 * Polymarket-style grouping: an event made of 2–4 Yes/No markets ("Will A
 * win?", "Draw?", "Will B win?") reads as one row of choices — each choice
 * is that market's Yes. Null when the event isn't shaped like that.
 */
export const groupedChoices = <M extends UiMarket>(markets: M[]) => {
  if (markets.length < 2 || markets.length > 4) return null
  if (!markets.every(isYesNoMarket)) return null
  return markets.map((market) => ({
    market,
    outcome: market.yes ?? market.outcomes[0],
    label: groupItemLabel(market),
  }))
}

/** Shared hover treatment for market/event cards: brand-tinted border, a
 *  soft lift and shadow. Pair with a `border` on the card. */
export const CARD_HOVER =
  'transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green/60 hover:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)] motion-reduce:transform-none'

/** Softer hover for cards that aren't one big link (positions, combos,
 *  match rows): border and shadow only, no lift. Adds its own border. */
export const CARD_HOVER_SOFT =
  'border border-transparent transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.16)]'

/**
 * An outcome's chance in the user's odds format: "58%" ("<1%" rather than a
 * misleading "0%" for long shots, as percent is rounded), or "×1.73" when
 * they picked decimal odds. Read it through `useOddsFormat().chanceLabel` so
 * it follows the menu.
 */
export const chanceLabel = (
  outcome?: { price: number; decimalOdds?: number | null } | null,
  format: OddsFormat = 'percent',
) => {
  const price = outcome?.price ?? 0
  if (format === 'odds') {
    const odds = outcome?.decimalOdds ?? (price > 0 ? 1 / price : 0)
    return odds > 0 ? `×${odds.toFixed(2)}` : '—'
  }
  const pct = price * 100
  return pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`
}

/**
 * Polymarket-style "one question, many Yes/No markets" event ("How many Fed
 * rate cuts in 2026?" → "0 (0 bps)", "1 (25 bps)", …). These read as a list
 * of choices, each with its chance and Yes/No buttons. Sports fixtures are
 * excluded: they trade as combos with their own layout.
 */
export const isMultiChoiceEvent = (
  markets: (UiMarket & { categorySlug?: string })[],
) =>
  markets.length >= 2 &&
  markets.every(isYesNoMarket) &&
  !markets.some(
    (m) =>
      m.categorySlug === 'sports' ||
      m.category.toLowerCase() === 'sports' ||
      marketSport(m) !== null,
  )

/** Short name for each market in a multi-choice event: the subtitle the
 *  import carries ("1 (25 bps)"), else the words its title doesn't share
 *  with its siblings ("Will 1 Fed rate cut happen…" → "1"). */
export const eventMarketLabels = (
  markets: { id: string; title: string; subtitle?: string | null }[],
): Map<string, string> => {
  const short = siblingShortLabels(markets.map((m) => m.title))
  return new Map(
    markets.map((m, i) => [m.id, (m.subtitle ?? '').trim() || short[i]]),
  )
}
