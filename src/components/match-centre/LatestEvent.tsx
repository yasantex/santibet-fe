import type { MatchCentre } from '../../types/matchCentre.types'
import EventIcon from './EventIcon'
import Pitch from './Pitch'
import { eventText, isGoal, minuteLabel, shortTeam } from './matchText'

/**
 * The tracker card: a pitch with the latest event on it, placed toward the
 * goal that team attacks. Our feed has no ball position, so the pitch shows
 * the moment (goal, card, change) rather than the ball's path.
 */
const LatestEvent = ({ match }: { match: MatchCentre }) => {
  const latest = [...match.events].reverse().find((e) => e.type !== 'substitution') ?? match.events.at(-1)
  const status =
    match.status === 'scheduled'
      ? { title: 'Kick-off', body: new Date(match.kickoff).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
      : match.status === 'finished'
        ? { title: 'Full-time', body: `${shortTeam(match.home.name)} ${match.home.goals ?? 0}–${match.away.goals ?? 0} ${shortTeam(match.away.name)}` }
        : match.statusDetail === 'HT'
          ? { title: 'Half-time', body: `${match.home.goals ?? 0}–${match.away.goals ?? 0}` }
          : null
  const text = latest ? eventText(match, latest) : null
  const goal = latest ? isGoal(latest) : false
  // Home attacks right, away attacks left.
  const left = latest?.side === 'home' ? '62%' : latest?.side === 'away' ? '38%' : '50%'

  return (
    <Pitch className='w-full'>
      <div className='absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-semibold text-[#fff] tabular-nums'>
        {match.statusDetail ?? ''} {match.clock.elapsed != null && match.status === 'live' ? `${match.clock.elapsed}′` : ''}
      </div>
      {(status || text) && (
        <div
          className='absolute top-1/2 w-[58%] max-w-[260px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg shadow-lg'
          style={{ left: status ? '50%' : left }}
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold ${goal && !status ? 'bg-[#c6f135] text-[#000]' : 'bg-[#2fbf71] text-[#fff]'}`}>
            {latest && !status && <EventIcon type={latest.type} size={14} />}
            <span className='truncate'>{status ? status.title : text!.title}</span>
          </div>
          <div className='bg-[#1d5e2a]/95 px-3 py-2 text-xs text-[#fff]'>
            {status ? status.body : (
              <>
                <span className='font-semibold'>{minuteLabel(latest!)}</span> · {text!.body}
              </>
            )}
          </div>
        </div>
      )}
    </Pitch>
  )
}

export default LatestEvent
