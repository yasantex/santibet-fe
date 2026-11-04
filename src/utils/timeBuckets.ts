export type TimeBucket =
  | 'live'
  | 'today'
  | 'tomorrow'
  | 'week'
  | 'month'
  | 'later'

const DAY = 86_400_000

// Sports read by kickoff; everything else by when the market ends.
const SPORTS_BUCKETS: [TimeBucket, string][] = [
  ['live', 'Live'],
  ['today', 'Today'],
  ['tomorrow', 'Tomorrow'],
  ['week', 'This week'],
  ['later', 'Later'],
]
const DEFAULT_BUCKETS: [TimeBucket, string][] = [
  ['today', 'Ends today'],
  ['week', 'Ends this week'],
  ['month', 'Ends this month'],
  ['later', 'Later'],
]

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const timeBucketOf = (
  market: { closeTime?: string | null; live?: boolean },
  sports: boolean,
): TimeBucket => {
  if (sports && market.live) return 'live'
  const at = new Date(market.closeTime ?? '').getTime()
  if (!at) return 'later'
  const today = startOfToday()
  if (at < today + DAY) return 'today'
  if (sports && at < today + 2 * DAY) return 'tomorrow'
  if (at < today + 7 * DAY) return 'week'
  if (!sports && at < today + 30 * DAY) return 'month'
  return 'later'
}

/**
 * The time filters for a category, with counts — only the ones that have
 * markets, so each category gets the filters its own markets support.
 */
export const timeBucketOptions = (
  markets: { closeTime?: string | null; live?: boolean }[],
  sports: boolean,
) => {
  const counts = new Map<TimeBucket, number>()
  for (const m of markets) {
    const b = timeBucketOf(m, sports)
    counts.set(b, (counts.get(b) ?? 0) + 1)
  }
  return (sports ? SPORTS_BUCKETS : DEFAULT_BUCKETS)
    .filter(([key]) => counts.has(key))
    .map(([value, label]) => ({ value, label, count: counts.get(value)! }))
}
