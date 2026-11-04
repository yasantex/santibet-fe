import { useMemo } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { LiveBadge } from './LiveBits'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import { useComboSlip } from '../../hooks/useComboSlip'
import { findTeam, outcomeTone, TONE_STYLES } from '../../utils/marketDisplay'
import TeamLogo from './TeamLogo'
import { formatNairaCompact } from '../../utils/functions'
import {
  buildSportsMatches,
  groupMatchesByDay,
  MATCH_COLUMN_LABELS,
  matchColumns,
  type MatchColumn,
  type MatchPick,
  type SportsMatch,
} from '../../utils/sportsMatches'
import type { UiMarket, UiOutcome } from '../../types/market.types'

type Handler = (market: UiMarket, outcome: UiOutcome) => void

// Teams | one fixed-width column per market type.
const gridFor = (cols: number) =>
  ({
    1: 'md:grid-cols-[minmax(0,1fr)_9.5rem]',
    2: 'md:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem]',
    3: 'md:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem_9.5rem]',
  })[cols] ?? 'md:grid-cols-[minmax(0,1fr)_9.5rem]'

const PickButton = ({
  pick,
  tone,
  onPick,
}: {
  pick: MatchPick
  /** Moneyline picks are tinted by side; lines stay neutral. */
  tone?: keyof typeof TONE_STYLES
  onPick: Handler
}) => {
  const { priceLabel } = useOddsFormat()
  const combo = useComboSlip()
  const active = combo.selectedOutcomeIdForMarket(pick.market.id) === pick.outcome.id
  return (
    <button
      type='button'
      onClick={() => onPick(pick.market, pick.outcome)}
      className={`flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2.5 text-xs font-bold md:flex-none ${
        tone
          ? TONE_STYLES[tone].button
          : 'border border-border bg-white text-black hover:bg-hover'
      } ${active ? 'ring-2 ring-black ring-offset-1' : ''}`}
    >
      <span className='flex min-w-0 items-center gap-1.5'>
        {/* Team-named picks (moneyline) get the crest; Draw / lines don't. */}
        <TeamLogo team={findTeam(pick.market.teams, pick.label)} size={14} />
        <span className='min-w-0 truncate uppercase'>{pick.label}</span>
      </span>
      <span className='shrink-0'>{priceLabel(pick.market, pick.outcome)}</span>
    </button>
  )
}

const Cell = ({
  column,
  picks,
  onPick,
}: {
  column: MatchColumn
  picks?: MatchPick[]
  onPick: Handler
}) => {
  if (!picks?.length)
    return (
      <div className='hidden items-center justify-center text-xs text-neutral-10 md:flex'>
        —
      </div>
    )
  const outcomes = picks.map((p) => p.outcome)
  return (
    <div className='flex gap-1.5 md:flex-col md:justify-center md:gap-1'>
      {picks.map((pick, i) => (
        <PickButton
          key={pick.outcome.id}
          pick={pick}
          tone={
            column === 'moneyline'
              ? outcomeTone({ outcomes }, pick.outcome.id, i)
              : undefined
          }
          onPick={onPick}
        />
      ))}
    </div>
  )
}

const MatchRow = ({
  match,
  columns,
  onPick,
}: {
  match: SportsMatch
  columns: MatchColumn[]
  onPick: Handler
}) => (
  <div className='flex flex-col gap-2 rounded-xl border border-border px-4 py-3'>
    <div className='flex items-center justify-between gap-3'>
      <div className='flex min-w-0 items-center gap-2 text-xs text-neutral-10'>
        {match.live ? (
          <LiveBadge />
        ) : (
          <span className='rounded-md bg-card px-2 py-0.5 font-semibold text-black'>
            {new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(match.kickoff)}
          </span>
        )}
        {match.volume > 0 && <span>{formatNairaCompact(match.volume)} Vol</span>}
        {match.league && <span className='truncate'>· {match.league}</span>}
      </div>
      <Link
        to={`/events/${match.eventId}`}
        className='flex shrink-0 items-center gap-0.5 text-xs font-semibold text-neutral-10 hover:text-black'
      >
        {match.marketCount} market{match.marketCount === 1 ? '' : 's'}
        <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
      </Link>
    </div>

    <div className={`grid grid-cols-1 gap-2 md:items-center md:gap-3 ${gridFor(columns.length)}`}>
      <Link
        to={`/events/${match.eventId}`}
        className='flex min-w-0 flex-col justify-center gap-1.5'
      >
        {(match.teams.length >= 2 ? match.teams : [match.title]).map((team) => (
          <span key={team} className='flex min-w-0 items-center gap-2'>
            <TeamLogo team={findTeam(match.teamInfo, team)} size={20} />
            <span className='truncate text-sm font-semibold text-black hover:underline'>
              {team}
            </span>
          </span>
        ))}
      </Link>
      {columns.map((column, i) => (
        // On phones only the first column (moneyline) fits; the match page
        // has the rest.
        <div key={column} className={i > 0 ? 'hidden md:contents' : 'contents'}>
          <Cell column={column} picks={match.cells[column]} onPick={onPick} />
        </div>
      ))}
    </div>
  </div>
)

/** Polymarket-style sports board: matches by day, one row each. */
const SportsMatchList = ({
  markets,
  onPick,
}: {
  markets: UiMarket[]
  onPick: Handler
}) => {
  const matches = useMemo(() => buildSportsMatches(markets), [markets])
  const columns = useMemo(() => matchColumns(matches), [matches])
  const days = useMemo(() => groupMatchesByDay(matches), [matches])

  return (
    // Capped so the team names sit close to their prices on wide screens.
    <div className='flex w-full max-w-4xl flex-col gap-5'>
      {days.map((day, d) => (
        <section key={day.label} className='flex flex-col gap-2'>
          <div className={`grid grid-cols-1 items-end gap-3 px-4 ${gridFor(columns.length)}`}>
            <h2 className='text-base font-bold text-black md:text-lg'>
              {day.label}
            </h2>
            {/* Column headings once, above the first day. */}
            {d === 0 &&
              columns.map((c) => (
                <span
                  key={c}
                  className='hidden text-center text-xs font-semibold tracking-wide text-neutral-10 uppercase md:block'
                >
                  {MATCH_COLUMN_LABELS[c]}
                </span>
              ))}
          </div>
          {day.matches.map((match) => (
            <MatchRow
              key={match.key}
              match={match}
              columns={columns}
              onPick={onPick}
            />
          ))}
        </section>
      ))}
    </div>
  )
}

export default SportsMatchList
