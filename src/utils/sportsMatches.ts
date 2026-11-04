import { groupedChoices, YES_LABELS } from './marketDisplay'
import { shortOutcomeLabel, teamsFromTitle } from './teamNames'
import type { EventTeam, UiMarket, UiOutcome } from '../types/market.types'

export type MatchColumn = 'moneyline' | 'spread' | 'total' | 'btts'

export const MATCH_COLUMN_LABELS: Record<MatchColumn, string> = {
  moneyline: 'Moneyline',
  spread: 'Spread',
  total: 'Total',
  btts: 'Both score',
}

/** One button in a match row: which market/outcome it bets, and its text. */
export type MatchPick = {
  market: UiMarket
  outcome: UiOutcome
  label: string
  /** Unshortened label, for the button's tooltip. */
  fullLabel?: string
}

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
  /** Picks for a match with no moneyline: its main market's outcomes. */
  fallback?: MatchPick[]
  /** The market a card's question/buttons belong to. */
  lead: UiMarket
}

const MORE_MARKETS = / - More Markets$/i
const baseTitle = (m: UiMarket) =>
  (m.eventTitle || m.title).replace(MORE_MARKETS, '').trim()

const time = (iso?: string | null) => new Date(iso ?? '').getTime() || 0

/** Earliest close time among a match's markets; 0 when none has one
 *  (season-long futures like "Team Win Totals" ship `closeTime: null`). */
const kickoffOf = (ms: UiMarket[]) => {
  const times = ms.map((m) => time(m.closeTime)).filter(Boolean)
  return times.length ? Math.min(...times) : 0
}

/** Whether a match has a usable kickoff time to show or group by. */
export const hasKickoff = (m: Pick<SportsMatch, 'kickoff'>) =>
  Number.isFinite(m.kickoff) && m.kickoff > 0

/** The line closest to a coin flip — the "main" spread or total. */
const mainLine = (markets: UiMarket[]) =>
  [...markets].sort(
    (a, b) =>
      Math.abs((a.outcomes[0]?.price ?? 0) - 0.5) -
      Math.abs((b.outcomes[0]?.price ?? 0) - 0.5),
  )[0]

const formatLine = (n: number) => (n > 0 ? `+${n}` : `${n}`)

const isYesNo = (m: UiMarket) =>
  m.outcomes.length === 2 &&
  m.outcomes.some((o) => YES_LABELS.includes(o.label.trim().toLowerCase()))

const moneyline = (
  markets: UiMarket[],
  title: string,
): MatchPick[] | undefined => {
  // API-Sports: one "Match Winner" market with Home / Draw / Away.
  // Polymarket games: the market is titled like the match ("Hawks vs.
  // Wizards") and its outcomes are the teams.
  const winner = markets.find(
    (m) =>
      m.outcomes.length >= 2 &&
      !isYesNo(m) &&
      (/match winner|moneyline|1x2|full time result/i.test(m.title) ||
        m.title.trim().toLowerCase() === title.toLowerCase()),
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
        /over\s*\/\s*under|\bO\/U\b|\btotal\b/i.test(m.title) &&
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
      moneyline: moneyline(ms, title),
      spread: spread(ms),
      total: total(ms),
      btts: btts(ms),
    }
    // Nothing recognisable (e.g. a one-off prop): the card still offers the
    // main market's outcomes.
    const picked = new Set(
      Object.values(cells).flatMap((p) => p?.map((x) => x.market.id) ?? []),
    )
    // Prefer one still open: a live match's earlier props ("Goal between
    // 15'–30'?") close as the game goes on.
    const spare = ms.filter((m) => !picked.has(m.id) && m.outcomes.length >= 2)
    const lead = spare.find((m) => m.status === 'open') ?? spare[0]
    const fallback: MatchPick[] | undefined =
      !cells.moneyline && lead
        ? lead.outcomes.slice(0, 3).map((outcome) => ({
            market: lead,
            outcome,
            label: outcome.label,
          }))
        : undefined
    // Prefer the feed's teams (home first) over parsing "A vs B" from the title.
    const teamInfo = [...(ms.find((m) => m.teams?.length)?.teams ?? [])].sort(
      (a, b) => Number(b.side === 'home') - Number(a.side === 'home'),
    )
    const teams =
      teamInfo.length >= 2 ? teamInfo.map((t) => t.name) : teamsFromTitle(title)
    // Team names on the buttons become codes ("GAL", "GAL -1.5").
    const shorten = shortOutcomeLabel(
      teams,
      teamInfo.length >= 2 ? teamInfo.map((t) => t.shortName) : [],
    )
    for (const picks of [...Object.values(cells), fallback]) {
      picks?.forEach((pick) => {
        pick.fullLabel = pick.label
        pick.label = shorten(pick.label)
      })
    }
    return {
      key,
      eventId: main.eventId || main.id,
      title,
      teams,
      teamInfo,
      // API-Sports puts the league in the subtitle; Polymarket imports put the
      // outcome's short name there instead, so no league for those.
      league: main.seriesKey?.startsWith('apisports:')
        ? (main.subtitle ?? '').trim()
        : '',
      kickoff: kickoffOf(ms),
      live: ms.some((m) => m.live),
      volume: ms.reduce((sum, m) => sum + (m.volume || 0), 0),
      marketCount: ms.length,
      cells,
      fallback,
      lead: ms.find((m) => cells.moneyline?.[0]?.market.id === m.id) ?? lead ?? main,
    }
  })
}

/** Market types a match has (moneyline, spread…). */
export const filledColumns = (m: SportsMatch) =>
  (Object.values(m.cells) as (MatchPick[] | undefined)[]).filter(
    (p) => p?.length,
  ).length

/**
 * Board (one row, a column per market type) only pays off when most matches
 * have several market types — big leagues with moneyline + spread + total.
 * Otherwise the columns are mostly "—", so the list shows as cards.
 */
export const preferMatchBoard = (matches: SportsMatch[]) =>
  matches.length > 0 &&
  matches.filter((m) => filledColumns(m) >= 2).length >= matches.length / 2

/** Columns to show: the market types the most matches have (a column only
 *  one prop-heavy match fills shouldn't push out a common one). */
export const matchColumns = (matches: SportsMatch[], max = 3): MatchColumn[] => {
  const order = ['moneyline', 'spread', 'total', 'btts'] as const
  const count = (c: MatchColumn) =>
    matches.filter((m) => m.cells[c]?.length).length
  return order
    .filter((c) => count(c) > 0)
    .sort((a, b) => count(b) - count(a) || order.indexOf(a) - order.indexOf(b))
    .slice(0, max)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

const dayKey = (ms: number) => new Date(ms).toDateString()

/** Matches grouped under a date heading, live games first, then by kickoff;
 *  anything without a kickoff time goes last under "Date to be confirmed". */
export const groupMatchesByDay = (matches: SportsMatch[]) => {
  const rank = (m: SportsMatch) => (m.live ? 0 : hasKickoff(m) ? 1 : 2)
  const sorted = [...matches].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (hasKickoff(a) && hasKickoff(b) ? a.kickoff - b.kickoff : 0),
  )
  const days = new Map<string, { label: string; matches: SportsMatch[] }>()
  for (const m of sorted) {
    const dated = hasKickoff(m)
    const key = m.live ? 'live' : dated ? dayKey(m.kickoff) : 'tbc'
    const label = m.live
      ? 'Live now'
      : !dated
        ? 'Date to be confirmed'
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
