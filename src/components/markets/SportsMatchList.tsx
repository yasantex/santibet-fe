import { useMemo } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { LiveBadge } from './LiveBits'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import { useComboSlip } from '../../hooks/useComboSlip'
import {
  CARD_HOVER,
  findTeam,
  outcomeTone,
  TONE_STYLES,
} from '../../utils/marketDisplay'
import TeamLogo from './TeamLogo'
import { formatNairaCompact } from '../../utils/functions'
import {
  buildSportsMatches,
  groupMatchesByDay,
  hasKickoff,
  MATCH_COLUMN_LABELS,
  matchColumns,
  preferMatchBoard,
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
      title={pick.fullLabel}
      className={`flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2.5 text-xs font-bold md:flex-none ${
        tone
          ? TONE_STYLES[tone].button
          : 'border border-border bg-white text-black hover:bg-hover'
      } ${active ? 'ring-2 ring-black ring-offset-1' : ''}`}
    >
      <span className='flex min-w-0 items-center gap-1.5'>
        {/* Team-named picks (moneyline) get the crest; Draw / lines don't. */}
        <TeamLogo
          team={findTeam(pick.market.teams, pick.fullLabel ?? pick.label)}
          size={14}
        />
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
  <div className='flex flex-col gap-2 rounded-xl border border-border px-4 py-3 transition-[border-color,box-shadow] duration-200 hover:border-brand-green/60 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.16)]'>
    <div className='flex items-center justify-between gap-3'>
      <div className='flex min-w-0 items-center gap-2 text-xs text-neutral-10'>
        {match.live ? (
          <LiveBadge />
        ) : !hasKickoff(match) ? null : (
          <span className='rounded-md bg-card px-2 py-0.5 font-semibold text-black'>
            {kickoffLabel(match)}
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

const kickoffLabel = (match: SportsMatch) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
    match.kickoff,
  )

/** "Today · 3:00 PM", "Tomorrow · 8:30 PM", "Sat, Nov 7 · 5:00 PM". */
const kickoffDateLabel = (match: SportsMatch) => {
  const d = new Date(match.kickoff)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const day =
    d.toDateString() === today.toDateString()
      ? 'Today'
      : d.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(d)
  return `${day} · ${kickoffLabel(match)}`
}

/**
 * One match as a card — for leagues whose games carry just one or two
 * markets, where a column-per-market board would be mostly "—". Teams with
 * crests, then one row of picks (moneyline, else the main market).
 */
const MatchCard = ({ match, onPick }: { match: SportsMatch; onPick: Handler }) => {
  const { priceLabel } = useOddsFormat()
  const combo = useComboSlip()
  const picks = match.cells.moneyline ?? match.fallback ?? []
  const pickMarket = picks[0]?.market
  // A prop's question ("Will … score 30+?") isn't the match title; say it.
  const question =
    pickMarket && pickMarket.title.trim().toLowerCase() !== match.title.toLowerCase()
      ? pickMarket.title
      : null
  const href = `/events/${match.eventId}`

  return (
    <div className={`flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4 ${CARD_HOVER}`}>
      <div className='flex items-center justify-between gap-3 text-xs text-neutral-10'>
        <div className='flex min-w-0 items-center gap-2'>
          {match.live ? (
            <LiveBadge />
          ) : hasKickoff(match) ? (
            <span className='rounded-md bg-hover px-2 py-0.5 font-semibold text-black'>
              {kickoffDateLabel(match)}
            </span>
          ) : null}
          {match.league && <span className='truncate'>{match.league}</span>}
        </div>
        {match.volume > 0 && (
          <span className='shrink-0'>{formatNairaCompact(match.volume)} Vol.</span>
        )}
      </div>

      <Link to={href} className='group flex min-w-0 flex-col gap-2'>
        {(match.teams.length >= 2 ? match.teams : [match.title]).map((team) => (
          <span key={team} className='flex min-w-0 items-center gap-2'>
            <TeamLogo team={findTeam(match.teamInfo, team)} size={22} />
            <span className='truncate text-base font-bold text-black group-hover:underline'>
              {team}
            </span>
          </span>
        ))}
      </Link>

      <div className='mt-auto flex flex-col gap-1.5'>
        {question && (
          <span className='line-clamp-1 text-xs font-semibold text-neutral-10'>
            {question}
          </span>
        )}
        {picks.length > 0 && (
          <div className='flex items-stretch gap-1.5'>
            {picks.map((pick, i) => {
              const tone = outcomeTone(
                { outcomes: picks.map((p) => p.outcome) },
                pick.outcome.id,
                i,
              )
              const active =
                combo.selectedOutcomeIdForMarket(pick.market.id) === pick.outcome.id
              return (
                <button
                  key={pick.outcome.id}
                  type='button'
                  title={pick.fullLabel}
                  onClick={() => onPick(pick.market, pick.outcome)}
                  className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-bold ${TONE_STYLES[tone].button} ${
                    active ? 'ring-2 ring-black ring-offset-1' : ''
                  }`}
                >
                  <TeamLogo
                    team={findTeam(pick.market.teams, pick.fullLabel ?? pick.label)}
                    size={14}
                  />
                  <span className='min-w-0 truncate uppercase'>{pick.label}</span>
                  <span className='shrink-0'>{priceLabel(pick.market, pick.outcome)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className='flex justify-end'>
        <Link
          to={href}
          className='flex shrink-0 items-center gap-0.5 text-xs font-semibold text-neutral-10 hover:text-black'
        >
          {match.marketCount} market{match.marketCount === 1 ? '' : 's'}
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Link>
      </div>
    </div>
  )
}

/** Polymarket-style sports board: matches by day — one row each with a
 *  column per market type for full leagues, cards for the rest. */
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
  const board = useMemo(() => preferMatchBoard(matches), [matches])

  if (!board) {
    // Cards: one dense grid (dates go on each card), live games first.
    const ordered = days.flatMap((d) => d.matches)
    const live = ordered.filter((m) => m.live)
    const rest = ordered.filter((m) => !m.live)
    const sections = [
      { label: 'Live now', matches: live },
      { label: live.length ? 'Upcoming' : '', matches: rest },
    ].filter((s) => s.matches.length)
    return (
      <div className='flex w-full flex-col gap-5'>
        {sections.map((section) => (
          <section key={section.label || 'all'} className='flex flex-col gap-3'>
            {section.label && (
              <h2 className='text-base font-bold text-black md:text-lg'>
                {section.label}
              </h2>
            )}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {section.matches.map((match) => (
                <MatchCard key={match.key} match={match} onPick={onPick} />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  // A match goes on the board only if it has a pick in a shown column; one
  // made only of props ("Goal between 15'–30'?") would be a row of "—", so
  // it shows as a card under that day's rows instead.
  const onBoard = (m: SportsMatch) => columns.some((c) => m.cells[c]?.length)
  const split = days.map((day) => ({
    label: day.label,
    rows: day.matches.filter(onBoard),
    cards: day.matches.filter((m) => !onBoard(m)),
  }))
  // Column headings once, above the first day that has rows.
  const headingDay = split.findIndex((day) => day.rows.length > 0)

  return (
    <div className='flex w-full flex-col gap-5'>
      {split.map((day, d) => (
        <section key={day.label} className='flex flex-col gap-2'>
          <div className={`grid grid-cols-1 items-end gap-3 px-4 ${gridFor(columns.length)}`}>
            <h2 className='text-base font-bold text-black md:text-lg'>
              {day.label}
            </h2>
            {d === headingDay &&
              columns.map((c) => (
                <span
                  key={c}
                  className='hidden text-center text-xs font-semibold tracking-wide text-neutral-10 uppercase md:block'
                >
                  {MATCH_COLUMN_LABELS[c]}
                </span>
              ))}
          </div>
          {day.rows.map((match) => (
            <MatchRow
              key={match.key}
              match={match}
              columns={columns}
              onPick={onPick}
            />
          ))}
          {day.cards.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
                day.rows.length ? 'pt-2' : ''
              }`}
            >
              {day.cards.map((match) => (
                <MatchCard key={match.key} match={match} onPick={onPick} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

export default SportsMatchList
