/** GET /api/match-centre/:event — the live match tracker. */

export type MatchSide = 'home' | 'away'

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'missed_penalty'
  | 'yellow_card'
  | 'second_yellow'
  | 'red_card'
  | 'substitution'
  | 'var'

export interface MatchEvent {
  id: string
  minute: number
  extra: number | null
  side: MatchSide | null
  type: MatchEventType
  /** Scorer, booked player, or the player coming ON. */
  player: string | null
  /** Assist, or the player going OFF. */
  secondary: string | null
  detail: string | null
  comment: string | null
}

export interface MatchStat {
  key: string
  label: string
  home: number | null
  away: number | null
  unit: '%' | null
}

export interface LineupPlayer {
  id: number | null
  name: string
  number: number | null
  position: string | null
  /** "row:column", row 1 = goalkeeper. */
  grid: string | null
  rating: number | null
  minutes: number | null
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  captain: boolean
  subbedOn: number | null
  subbedOff: number | null
}

export interface TeamLineup {
  formation: string | null
  coach: string | null
  colors: { shirt: string | null; number: string | null; goalkeeper: string | null } | null
  startXI: LineupPlayer[]
  substitutes: LineupPlayer[]
}

export interface MatchTeam {
  id: number
  name: string
  logo: string | null
  goals: number | null
}

type ScoreLine = { home: number | null; away: number | null } | null

export interface MatchCentre {
  eventId: string
  fixtureId: string
  version: number
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | string
  statusDetail: string | null
  kickoff: string
  clock: {
    elapsed: number | null
    extra: number | null
    running: boolean
    at: string | null
    venueClock: string | null
  }
  league: {
    id: number
    name: string
    country: string | null
    logo: string | null
    season: number | null
    round: string | null
  }
  home: MatchTeam
  away: MatchTeam
  score: { halftime: ScoreLine; extratime: ScoreLine; penalty: ScoreLine }
  venue: { name: string | null; city: string | null } | null
  referee: string | null
  events: MatchEvent[]
  stats: MatchStat[]
  lineups: { home: TeamLineup; away: TeamLineup } | null
  momentum: { minute: number; home: number; away: number }[]
  preMatch: {
    headToHead: {
      date: string
      league: string | null
      home: string
      away: string
      homeGoals: number | null
      awayGoals: number | null
    }[]
    table: {
      teamId: number
      team: string
      rank: number
      points: number
      played: number
      win: number
      draw: number
      lose: number
      goalsFor: number
      goalsAgainst: number
      form: string | null
      group: string | null
    }[]
    missing: { teamId: number; player: string; type: string | null; reason: string | null }[]
  } | null
  updatedAt: string
}

export type LiveVerdict = 'winning' | 'losing' | 'won' | 'lost' | 'pending' | 'unknown'

export interface LiveStatus {
  verdict: LiveVerdict
  note: string | null
}

export interface MyMatchBets {
  singles: {
    positionId: string
    marketId: string
    market: string
    outcomeId: string
    outcome: string
    stake: string
    status: string
    live: LiveStatus | null
  }[]
  comboLegs: {
    comboBetId: string
    legId: string
    marketId: string
    market: string
    outcomeId: string
    outcome: string
    price: string
    legStatus: string
    comboStatus: string
    comboLegs: number
    combinedOdds: string
    stake: string
    potentialReturn: string
    live: LiveStatus | null
  }[]
}
