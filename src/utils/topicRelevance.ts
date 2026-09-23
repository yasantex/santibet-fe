import { normalizeText } from '../data_layer/markets'
import type { UiMarket } from '../types/market.types'

/**
 * Audience relevance for the lobby's "Hot Topics" rail. The provider feed is
 * dominated by US politics (state governor races, Senate procedure) and niche
 * token launches, while our players are Nigerian. There is no region field on
 * markets, so we score title/category text against keyword tiers and blend it
 * with volume. Keywords are matched on word boundaries against diacritic-free,
 * lower-cased text, so add them lower-case.
 */

// Nigeria / Africa — always outranks global stories, even with no volume yet.
const LOCAL = [
  'nigeria', 'nigerian', 'naija', 'lagos', 'abuja', 'kano', 'ibadan',
  'port harcourt', 'enugu', 'tinubu', 'atiku', 'peter obi', 'naira', 'cbn',
  'nepa', 'phcn', 'there be light', 'fuel price', 'dangote', 'npfl',
  'super eagles', 'super falcons', 'afcon', 'caf', 'africa', 'african',
  'ghana', 'kenya', 'south africa', 'osimhen', 'lookman', 'davido', 'wizkid',
  'burna boy', 'tems', 'rema', 'asake', 'bbnaija', 'big brother naija',
  'anthony joshua',
]

// Football and big global sport.
const SPORTS = [
  'premier league', 'champions league', 'la liga', 'serie a', 'ballon d\'or',
  'world cup', 'arsenal', 'chelsea', 'liverpool', 'manchester', 'man utd',
  'man city', 'tottenham', 'real madrid', 'barcelona', 'psg', 'bayern',
  'messi', 'ronaldo', 'mbappe', 'haaland', 'salah', 'boxing', 'nba',
]

// Crypto our players actually hold/trade.
const CRYPTO = ['bitcoin', 'btc', 'ethereum', 'eth', 'usdt', 'tether', 'solana', 'binance']

// Global headlines with broad reach.
const GLOBAL = [
  'trump', 'putin', 'russia', 'ukraine', 'china', 'israel', 'fed', 'recession',
  'oil', 'openai', 'elon', 'tesla', 'grammy', 'oscar',
]

// Low-interest for our audience: US state/procedural politics, niche token plays.
const NICHE = [
  'governor', 'mayoral', 'mayor', 'speaker', 'filibuster', 'scotus', 'senate',
  'house in', 'midterms', 'endorse', 'airdrop', 'launch a token', 'fdv',
]

const toPattern = (words: string[]) =>
  new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`)

const TIERS: { pattern: RegExp; weight: number }[] = [
  { pattern: toPattern(LOCAL), weight: 100 },
  { pattern: toPattern(SPORTS), weight: 4 },
  { pattern: toPattern(CRYPTO), weight: 2 },
  { pattern: toPattern(GLOBAL), weight: 1 },
  { pattern: toPattern(NICHE), weight: -6 },
]

const CATEGORY_WEIGHT: Record<string, number> = {
  sports: 3,
  entertainment: 2,
  culture: 2,
  crypto: 1,
}

/** Higher = more relevant. Volume contributes on a log scale (0–~11). */
export const topicRelevance = (m: UiMarket): number => {
  const text = normalizeText(`${m.eventTitle ?? ''} ${m.title} ${m.subtitle}`)
  const keyword = TIERS.reduce(
    (sum, { pattern, weight }) => sum + (pattern.test(text) ? weight : 0),
    0,
  )
  const category = CATEGORY_WEIGHT[m.category.toLowerCase()] ?? 0
  return keyword + category + Math.log10(m.volume + 1)
}

/**
 * Top `limit` hot topics: open, not-yet-closed markets, one per event (the
 * event's most-traded market), ranked by audience relevance. Rolling
 * short-interval series (e.g. "Bitcoin 5 minutes — Up or Down") are skipped;
 * they churn too fast to be a "topic".
 */
export const pickHotTopics = (
  markets: UiMarket[],
  limit = 5,
  excludeEventIds: string[] = [],
): UiMarket[] => {
  const now = Date.now()
  const byEvent = new Map<string, UiMarket>()
  for (const m of markets) {
    if (!m.yes || m.status !== 'open' || m.durationSeconds) continue
    if (m.closeTime && new Date(m.closeTime).getTime() < now) continue
    const key = m.eventId || m.id
    if (excludeEventIds.includes(key)) continue
    const current = byEvent.get(key)
    if (!current || m.volume > current.volume) byEvent.set(key, m)
  }
  return Array.from(byEvent.values())
    .map((m) => ({ m, score: topicRelevance(m) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ m }) => m)
}
