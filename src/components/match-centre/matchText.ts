import type { MatchCentre, MatchEvent } from '../../types/matchCentre.types'

/** 45+2′ style minute. */
export const minuteLabel = (e: Pick<MatchEvent, 'minute' | 'extra'>) =>
  e.extra ? `${e.minute}+${e.extra}′` : `${e.minute}′`

const PERIOD: Record<string, string> = {
  '1H': '1st half',
  HT: 'Half-time',
  '2H': '2nd half',
  ET: 'Extra time',
  BT: 'Break',
  P: 'Penalties',
  SUSP: 'Suspended',
  INT: 'Interrupted',
  FT: 'Full-time',
  AET: 'After extra time',
  PEN: 'After penalties',
  PST: 'Postponed',
  CANC: 'Cancelled',
  ABD: 'Abandoned',
}

export const periodLabel = (m: Pick<MatchCentre, 'status' | 'statusDetail'>) => {
  const code = (m.statusDetail ?? '').toUpperCase()
  if (PERIOD[code]) return PERIOD[code]
  if (m.status === 'finished') return 'Full-time'
  if (m.status === 'scheduled') return 'Not started'
  return code || m.status
}

/** Short tag for the scoreboard chip, e.g. "1st", "HT", "FT". */
export const periodShort = (m: Pick<MatchCentre, 'status' | 'statusDetail'>) => {
  const code = (m.statusDetail ?? '').toUpperCase()
  if (code === '1H') return '1st'
  if (code === '2H') return '2nd'
  return code || (m.status === 'finished' ? 'FT' : '')
}

const teamName = (m: MatchCentre, side: MatchEvent['side']) =>
  side === 'home' ? m.home.name : side === 'away' ? m.away.name : ''

/** One line of commentary for an event. */
export function eventText(m: MatchCentre, e: MatchEvent): { title: string; body: string } {
  const team = teamName(m, e.side)
  const who = e.player ?? 'Unknown player'
  switch (e.type) {
    case 'goal':
      return {
        title: `Goal! ${team}`,
        body: e.secondary ? `${who} scores, assisted by ${e.secondary}.` : `${who} scores.`,
      }
    case 'penalty_goal':
      return { title: `Goal! ${team} (penalty)`, body: `${who} converts the penalty.` }
    case 'own_goal':
      return { title: `Own goal · ${team} benefit`, body: `${who} turns it into their own net.` }
    case 'missed_penalty':
      return { title: `Penalty missed · ${team}`, body: `${who} fails to score from the spot.` }
    case 'yellow_card':
      return { title: `Yellow card · ${team}`, body: `${who} is booked${e.comment ? ` (${e.comment})` : ''}.` }
    case 'second_yellow':
      return { title: `Second yellow · ${team}`, body: `${who} is sent off after a second booking.` }
    case 'red_card':
      return { title: `Red card · ${team}`, body: `${who} is sent off${e.comment ? ` (${e.comment})` : ''}.` }
    case 'substitution':
      return {
        title: `Substitution · ${team}`,
        body: e.secondary ? `${who} comes on for ${e.secondary}.` : `${who} comes on.`,
      }
    case 'var':
      return { title: `VAR · ${team}`, body: `${e.detail ?? 'Decision under review'}${e.player ? ` (${e.player})` : ''}.` }
  }
}

export const isGoal = (e: MatchEvent) =>
  e.type === 'goal' || e.type === 'penalty_goal' || e.type === 'own_goal'

/** Short name for a narrow scoreboard: "FC Kairat Almaty" → "Kairat Almaty". */
export const shortTeam = (name: string) =>
  name.replace(/^(FC|AFC|CF|SC|AC|AS|SSC|SS|CD|CA|FK|SK)\s+/i, '').replace(/\s+(FC|AFC|CF|SC)$/i, '')

/** Three-letter code, e.g. "ALM" style from "Kairat Almaty" → "KAI". */
export const teamCode = (name: string) => shortTeam(name).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
