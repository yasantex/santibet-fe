import { groupedChoices, YES_LABELS } from './marketDisplay'
import type { EventTeam, UiMarket, UiOutcome } from '../types/market.types'

export type MatchColumn = 'moneyline' | 'spread' | 'total' | 'btts'

export const MATCH_COLUMN_LABELS: Record<MatchColumn, string> = {
  moneyline: 'Moneyline',
  spread: 'Spread',
  total: 'Total',
  btts: 'Both score',
}

/** One button in a match row: which market/outcome it bets, and its text. */
export type MatchPick = { market: UiMarket; outcome: UiOutcome; label: string }

export type SportsMatch = {
  key: string
  /** Event to open for every market (the main match, not "More Markets"). */
  eventId: string
  title: string
  teams: string[]
  /** The event's team records (with logos), when the feed provides them. */
  teamInfo: EventTeam[]
  league: string
  kickoff: number
  live: boolean
  volume: number
  marketCount: number
  cells: Partial<Record<MatchColumn, MatchPick[]>>
}

const MORE_MARKETS = / - More Markets$/i
const baseTitle = (m: UiMarket) =>
  (m.eventTitle || m.title).replace(MORE_MARKETS, '').trim()

const time = (iso?: string | null) => new Date(iso ?? '').getTime() || 0

/** The line closest to a coin flip — the "main" spread or total. */
const mainLine = (markets: UiMarket[]) =>
  [...markets].sort(
    (a, b) =>
      Math.abs((a.outcomes[0]?.price ?? 0) - 0.5) -
      Math.abs((b.outcomes[0]?.price ?? 0) - 0.5),
  )[0]

const formatLine = (n: number) => (n > 0 ? `+${n}` : `${n}`)

const moneyline = (markets: UiMarket[]): MatchPick[] | undefined => {
  // API-Sports: one "Match Winner" market with Home / Draw / Away.
  const winner = markets.find(
    (m) =>
      /match winner|moneyline|1x2|full time result/i.test(m.title) &&
      m.outcomes.length >= 2,
  )
  if (winner)
    return winner.outcomes.map((outcome) => ({
      market: winner,
      outcome,
      label: outcome.label,
    }))
  // Polymarket: "Will A win?", "draw?", "Will B win?" as Yes/No markets.
  const binaries = markets.filter(
    (m) => /^will .+ win\b/i.test(m.title) || /\bend in a draw\b/i.test(m.title),
  )
  return groupedChoices(binaries) ?? undefined
}

const spread = (markets: UiMarket[]): MatchPick[] | undefined => {
  const line = mainLine(
    markets.filter((m) => /^spread\b/i.test(m.title) && m.outcomes.length === 2),
  )
  if (!line) return undefined
  // "Spread: Newcastle United Jets (-1.5)": the first outcome takes the line.
  const n = Number(line.title.match(/\(([-+]?\d+(?:\.\d+)?)\)/)?.[1])
  return line.outcomes.map((outcome, i) => ({
    market: line,
    outcome,
    label: Number.isFinite(n)
      ? `${outcome.label} ${formatLine(i === 0 ? n : -n)}`
      : outcome.label,
  }))
}

const total = (markets: UiMarket[]): MatchPick[] | undefined => {
  const line = mainLine(
    markets.filter(
      (m) =>
        /over\s*\/\s*under|\btotal\b/i.test(m.title) &&
        m.outcomes.some((o) => /^over\b/i.test(o.label)),
    ),
  )
  if (!line) return undefined
  return line.outcomes.map((outcome) => ({
    market: line,
    outcome,
    label: outcome.label.replace(/^over\b/i, 'O').replace(/^under\b/i, 'U'),
  }))
}

const btts = (markets: UiMarket[]): MatchPick[] | undefined => {
  const m = markets.find((x) => /both teams to score/i.test(x.title))
  if (!m) return undefined
  // Yes first, then No.
  return [...m.outcomes]
    .sort(
      (a, b) =>
        Number(YES_LABELS.includes(b.label.toLowerCase())) -
        Number(YES_LABELS.includes(a.label.toLowerCase())),
    )
    .map((outcome) => ({ market: m, outcome, label: outcome.label }))
}

/**
 * Sports markets → one row per match. Markets join their match by event
 * title, so a "<match> - More Markets" event (spreads, totals) lands on the
 * same row as the match itself.
 */
export const buildSportsMatches = (markets: UiMarket[]): SportsMatch[] => {
  const groups = new Map<string, UiMarket[]>()
  for (const m of markets) {
    const key = baseTitle(m).toLowerCase()
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  return [...groups.entries()].map(([key, ms]) => {
    const main = ms.find((m) => !MORE_MARKETS.test(m.eventTitle ?? '')) ?? ms[0]
    const title = baseTitle(main)
    const cells: SportsMatch['cells'] = {
      moneyline: moneyline(ms),
      spread: spread(ms),
      total: total(ms),
      btts: btts(ms),
    }
    // Prefer the feed's teams (home first) over parsing "A vs B" from the title.
    const teamInfo = [...(ms.find((m) => m.teams?.length)?.teams ?? [])].sort(
      (a, b) => Number(b.side === 'home') - Number(a.side === 'home'),
    )
    return {
      key,
      eventId: main.eventId || main.id,
      title,
      teams:
        teamInfo.length >= 2
          ? teamInfo.map((t) => t.name)
          : title.split(/\s+vs\.?\s+/i).map((t) => t.trim()).filter(Boolean),
      teamInfo,
      league: (main.subtitle ?? '').trim(),
      kickoff: Math.min(...ms.map((m) => time(m.closeTime)).filter(Boolean)),
      live: ms.some((m) => m.live),
      volume: ms.reduce((sum, m) => sum + (m.volume || 0), 0),
      marketCount: ms.length,
      cells,
    }
  })
}

/** Columns to show: the ones any match in the list actually has. */
export const matchColumns = (matches: SportsMatch[], max = 3): MatchColumn[] =>
  (['moneyline', 'spread', 'total', 'btts'] as const)
    .filter((c) => matches.some((m) => m.cells[c]?.length))
    .slice(0, max)

const dayKey = (ms: number) => new Date(ms).toDateString()

/** Matches grouped under a date heading, live games first, then by kickoff. */
export const groupMatchesByDay = (matches: SportsMatch[]) => {
  const sorted = [...matches].sort(
    (a, b) => Number(b.live) - Number(a.live) || a.kickoff - b.kickoff,
  )
  const days = new Map<string, { label: string; matches: SportsMatch[] }>()
  for (const m of sorted) {
    const key = m.live ? 'live' : dayKey(m.kickoff)
    const label = m.live
      ? 'Live now'
      : new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
        }).format(m.kickoff)
    if (!days.has(key)) days.set(key, { label, matches: [] })
    days.get(key)!.matches.push(m)
  }
  return [...days.values()]
}
