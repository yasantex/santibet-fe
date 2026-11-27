import type { MatchCentre, MatchEvent } from '../../types/matchCentre.types'
import EventIcon from './EventIcon'
import { eventText, minuteLabel, teamCode } from './matchText'

const KEY_TYPES = new Set(['goal', 'penalty_goal', 'own_goal', 'missed_penalty', 'red_card', 'second_yellow', 'yellow_card', 'var'])

/**
 * The 0–90′ strip with each team's events at their minute, and the match's
 * progress line. Substitutions are left to the feed so the strip stays readable.
 */
const MatchTimeline = ({ match }: { match: MatchCentre }) => {
  const extraTime = match.events.some((e) => e.minute > 90) || ['ET', 'BT', 'P', 'AET', 'PEN'].includes(match.statusDetail ?? '')
  const end = extraTime ? 120 : 90
  const ticks = extraTime ? [0, 15, 30, 45, 60, 75, 90, 105, 120] : [0, 15, 30, 45, 60, 75, 90]
  const elapsed = match.status === 'finished' ? end : Math.min(match.clock.elapsed ?? 0, end)
  const pct = (minute: number) => `${(Math.min(minute, end) / end) * 100}%`
  const row = (side: 'home' | 'away') =>
    match.events.filter((e) => e.side === side && KEY_TYPES.has(e.type))

  const renderRow = (side: 'home' | 'away') => (
    <div className='relative h-5'>
      {row(side).map((e: MatchEvent) => (
        <span
          key={e.id}
          title={`${minuteLabel(e)} ${eventText(match, e).title} – ${e.player ?? ''}`}
          className='absolute top-1/2 -translate-x-1/2 -translate-y-1/2'
          style={{ left: pct(e.minute) }}
        >
          <EventIcon type={e.type} size={12} />
        </span>
      ))}
    </div>
  )

  return (
    <div className='grid grid-cols-[36px_1fr] gap-x-2 bg-[#14181b] px-4 pt-1 pb-3 text-[10px] text-[#9ba19e]'>
      <span />
      <div className='relative h-4'>
        {ticks.map((t) => (
          <span key={t} className='absolute -translate-x-1/2' style={{ left: pct(t) }}>
            {t}
          </span>
        ))}
      </div>
      <span className='self-center font-semibold text-[#fff]'>{teamCode(match.home.name)}</span>
      {renderRow('home')}
      <span />
      <div className='relative h-1'>
        <div className='absolute inset-x-0 top-0 h-px bg-[#3a3f43]' />
        {ticks.map((t) => (
          <span key={t} className='absolute top-[-3px] h-[7px] w-px bg-[#3a3f43]' style={{ left: pct(t) }} />
        ))}
        <div className='absolute top-[-1px] left-0 h-[3px] rounded bg-[#2fbf71]' style={{ width: pct(elapsed) }} />
        {match.status === 'live' && (
          <span
            className='absolute top-[-4px] h-[9px] w-[9px] -translate-x-1/2 rounded-full border-2 border-[#2fbf71] bg-[#fff]'
            style={{ left: pct(elapsed) }}
          />
        )}
      </div>
      <span className='self-center font-semibold text-[#fff]'>{teamCode(match.away.name)}</span>
      {renderRow('away')}
      <span />
      <div className='text-right'>{extraTime ? '2×45 + ET' : '2×45 min'}</div>
    </div>
  )
}

export default MatchTimeline
