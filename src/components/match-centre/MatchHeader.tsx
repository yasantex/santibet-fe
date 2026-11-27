import type { MatchCentre, MatchTeam } from '../../types/matchCentre.types'
import { periodLabel, periodShort, shortTeam } from './matchText'

const Crest = ({ team, size = 36 }: { team: MatchTeam; size?: number }) =>
  team.logo ? (
    <img src={team.logo} alt='' loading='lazy' style={{ width: size, height: size }} className='shrink-0 object-contain' />
  ) : (
    <span
      style={{ width: size, height: size }}
      className='flex shrink-0 items-center justify-center rounded-full bg-[#2a2f33] text-xs font-bold text-[#fff]'
    >
      {shortTeam(team.name).slice(0, 2).toUpperCase()}
    </span>
  )

const kickoffText = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** The dark scoreboard: crests, score, period and running clock. */
const MatchHeader = ({
  match,
  clock,
  compact = false,
  goalFlash = false,
}: {
  match: MatchCentre
  clock: string | null
  compact?: boolean
  /** Briefly highlights the score after a goal. */
  goalFlash?: boolean
}) => {
  const started = match.status !== 'scheduled' && match.status !== 'postponed'
  const ht = match.score.halftime
  return (
    <div className='flex flex-col gap-2 bg-[#14181b] px-4 py-3 text-[#fff]'>
      {!compact && (
        <div className='flex items-center justify-center gap-2 text-[11px] text-[#9ba19e]'>
          {match.league.logo && <img src={match.league.logo} alt='' className='h-4 w-4 object-contain' />}
          <span className='truncate'>
            {match.league.name}
            {match.league.round ? ` · ${match.league.round}` : ''}
          </span>
        </div>
      )}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <Crest team={match.home} size={compact ? 24 : 36} />
          <span className='truncate text-sm font-semibold'>{shortTeam(match.home.name)}</span>
        </div>
        <div className='flex flex-col items-center gap-1'>
          {started ? (
            <>
              <span className='rounded border border-[#5f6360] px-1.5 text-[10px] font-semibold leading-4 tabular-nums'>
                {periodShort(match)}
                {clock ? ` | ${clock}` : ''}
              </span>
              <span
                className={`text-2xl font-bold tabular-nums transition-colors duration-700 ${goalFlash ? 'text-[#c6f135]' : ''}`}
              >
                {match.home.goals ?? 0} : {match.away.goals ?? 0}
              </span>
            </>
          ) : (
            <>
              <span className='text-[10px] text-[#9ba19e]'>{periodLabel(match)}</span>
              <span className='text-sm font-semibold'>{kickoffText(match.kickoff)}</span>
            </>
          )}
        </div>
        <div className='flex min-w-0 items-center justify-end gap-2'>
          <span className='truncate text-right text-sm font-semibold'>{shortTeam(match.away.name)}</span>
          <Crest team={match.away} size={compact ? 24 : 36} />
        </div>
      </div>
      {!compact && started && (
        <div className='flex justify-center gap-3 text-[11px] text-[#9ba19e]'>
          {!clock && <span>{periodLabel(match)}</span>}
          {ht && ht.home !== null && <span>HT {ht.home}–{ht.away}</span>}
          {match.score.penalty?.home != null && <span>Pens {match.score.penalty.home}–{match.score.penalty.away}</span>}
        </div>
      )}
      {!compact && (match.venue?.name || match.referee) && (
        <div className='flex justify-center gap-3 text-[10px] text-[#6f7572]'>
          {match.venue?.name && <span className='truncate'>🏟 {match.venue.name}{match.venue.city ? `, ${match.venue.city}` : ''}</span>}
          {match.referee && <span className='truncate'>Ref: {match.referee}</span>}
        </div>
      )}
    </div>
  )
}

export default MatchHeader
