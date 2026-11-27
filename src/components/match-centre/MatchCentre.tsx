import { useEffect, useRef, useState } from 'react'
import { useMatchCentre } from '../../data_layer/matchCentre'
import { showSuccessToast } from '../../utils/toastUtils'
import type { MatchCentre as MatchData } from '../../types/matchCentre.types'
import CommentaryFeed from './CommentaryFeed'
import TrackerPitch from './TrackerPitch'
import LineupsPanel from './LineupsPanel'
import MatchHeader from './MatchHeader'
import MatchTimeline from './MatchTimeline'
import MomentumChart from './MomentumChart'
import MyBetsOnMatch from './MyBetsOnMatch'
import PreMatchPanel from './PreMatchPanel'
import StatsPanel from './StatsPanel'
import { eventText, isGoal, minuteLabel, shortTeam } from './matchText'
import { useMatchClock } from './useMatchClock'

type Tab = 'tracker' | 'stats' | 'lineups' | 'feed' | 'facts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tracker', label: 'Tracker' },
  { id: 'stats', label: 'Stats' },
  { id: 'lineups', label: 'Lineups' },
  { id: 'feed', label: 'Commentary' },
  { id: 'facts', label: 'Facts' },
]

/**
 * Toasts each new goal (not the ones already in when the page opened) and
 * flashes the score for a few seconds.
 */
function useGoalAlerts(match: MatchData | undefined, enabled: boolean): boolean {
  const seen = useRef<Set<string> | null>(null)
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    if (!match) return
    const goals = match.events.filter(isGoal)
    if (seen.current === null) {
      seen.current = new Set(goals.map((g) => g.id))
      return
    }
    const fresh = goals.filter((g) => !seen.current!.has(g.id))
    fresh.forEach((g) => seen.current!.add(g.id))
    if (!fresh.length) return
    setFlash(true)
    if (enabled) {
      const g = fresh[fresh.length - 1]!
      showSuccessToast(
        `⚽ ${eventText(match, g).title} ${minuteLabel(g)} — ${shortTeam(match.home.name)} ${match.home.goals ?? 0}–${match.away.goals ?? 0} ${shortTeam(match.away.name)}`,
      )
    }
  }, [match, enabled])
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(false), 4_000)
    return () => clearTimeout(timer)
  }, [flash])
  return flash
}

/**
 * The live match tracker for a football event: scoreboard with a running
 * clock, the 0–90′ event strip, then tabs for the pitch card and momentum,
 * statistics, lineups, commentary and pre-match facts. `compact` is the slim
 * version that opens inside a bet card. Renders nothing when the event has no
 * live data behind it.
 */
const MatchCentre = ({
  eventId,
  compact = false,
  showMyBets = !compact,
  goalAlerts = !compact,
}: {
  eventId: string
  compact?: boolean
  showMyBets?: boolean
  goalAlerts?: boolean
}) => {
  const { data: match, isLoading, dataUpdatedAt } = useMatchCentre(eventId)
  const clock = useMatchClock(match, dataUpdatedAt)
  const flash = useGoalAlerts(match, goalAlerts)
  const [tab, setTab] = useState<Tab>('tracker')

  if (isLoading) {
    return <div className={`w-full animate-pulse rounded-xl bg-card ${compact ? 'h-40' : 'h-72'}`} />
  }
  if (!match) return null

  const tabs = compact ? TABS.filter((t) => t.id !== 'facts') : TABS
  return (
    <section className='flex w-full flex-col gap-3' aria-label='Live match tracker'>
      <div className='overflow-hidden rounded-xl border border-border'>
        <MatchHeader match={match} clock={clock} compact={compact} goalFlash={flash} />
        {match.status !== 'scheduled' && <MatchTimeline match={match} />}
        <nav className='flex overflow-x-auto border-b border-border bg-card'>
          {tabs.map((t) => (
            <button
              key={t.id}
              type='button'
              onClick={() => setTab(t.id)}
              className={`shrink-0 grow px-3 py-2 text-xs font-semibold transition-colors ${
                tab === t.id ? 'border-b-2 border-[#2fbf71] text-black' : 'text-neutral-10 hover:text-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className={`bg-background ${tab === 'tracker' ? '' : 'p-3'} ${compact ? 'max-h-[420px] overflow-y-auto' : ''}`}>
          {tab === 'tracker' && (
            <div className='flex flex-col'>
              <TrackerPitch match={match} />
              <div className='p-3'>
                <MomentumChart match={match} />
              </div>
            </div>
          )}
          {tab === 'stats' && <StatsPanel match={match} />}
          {tab === 'lineups' && <LineupsPanel match={match} />}
          {tab === 'feed' && <CommentaryFeed match={match} />}
          {tab === 'facts' && <PreMatchPanel match={match} />}
        </div>
      </div>
      {showMyBets && <MyBetsOnMatch eventId={eventId} live={match.status === 'live'} />}
    </section>
  )
}

export default MatchCentre
