import type { MatchCentre } from '../../types/matchCentre.types'
import EventIcon from './EventIcon'
import { eventText, isGoal, minuteLabel } from './matchText'

/** Every event as a line of commentary, newest first, with kick-off and breaks. */
const CommentaryFeed = ({ match }: { match: MatchCentre }) => {
  const events = [...match.events].reverse()
  const milestones: { at: number; title: string }[] = []
  if (match.status === 'finished') milestones.push({ at: 999, title: `Full-time: ${match.home.goals ?? 0}–${match.away.goals ?? 0}` })
  const ht = match.score.halftime
  if (ht && ht.home !== null) milestones.push({ at: 45.5, title: `Half-time: ${ht.home}–${ht.away}` })
  if (match.status !== 'scheduled') milestones.push({ at: -1, title: 'Kick-off' })

  if (!events.length && !milestones.length) {
    return <p className='py-6 text-center text-xs text-neutral-10'>Live commentary starts at kick-off.</p>
  }
  const rows: ({ kind: 'event'; at: number; e: (typeof events)[number] } | { kind: 'mile'; at: number; title: string })[] = [
    ...events.map((e) => ({ kind: 'event' as const, at: e.minute + (e.extra ?? 0) / 100, e })),
    ...milestones.map((m) => ({ kind: 'mile' as const, ...m })),
  ].sort((a, b) => b.at - a.at)

  return (
    <ol className='flex flex-col'>
      {rows.map((row) =>
        row.kind === 'mile' ? (
          <li key={row.title} className='my-1 rounded bg-surface-base px-3 py-1.5 text-center text-xs font-semibold text-black'>
            {row.title}
          </li>
        ) : (
          <li key={row.e.id} className={`flex gap-3 border-b border-border py-2 ${isGoal(row.e) ? 'bg-[#c6f135]/10' : ''}`}>
            <span className='w-10 shrink-0 text-right text-xs font-bold tabular-nums text-black'>{minuteLabel(row.e)}</span>
            <span className='mt-0.5 shrink-0'><EventIcon type={row.e.type} size={14} /></span>
            <div className='flex min-w-0 flex-col'>
              <span className='text-xs font-semibold text-black'>{eventText(match, row.e).title}</span>
              <span className='text-xs text-neutral-10'>{eventText(match, row.e).body}</span>
            </div>
          </li>
        ),
      )}
    </ol>
  )
}

export default CommentaryFeed
