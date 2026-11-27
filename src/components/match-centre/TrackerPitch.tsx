import { useEffect, useMemo, useState } from 'react'
import type { MatchCentre, MatchEvent, MatchMoment, MatchSide } from '../../types/matchCentre.types'
import EventIcon from './EventIcon'
import Pitch from './Pitch'
import { eventText, isGoal, minuteLabel, shortTeam } from './matchText'

/**
 * The tracker pitch. We have no ball-tracking feed, so the pitch plays back
 * what the minute-by-minute statistics say happened (attacks, shots, corners,
 * free kicks, offsides, inferred by the backend) alongside the real timeline
 * (goals, cards, VAR): the ball moves to where each one happens, the attacked
 * third lights up in the team's colour, and a label names it. With nothing
 * new, it shows who has the ball. Up to a minute behind the live action.
 */

const TEAM_COLOR: Record<MatchSide, string> = { home: '#2fbf71', away: '#4c6ef5' }
const CYCLE_MS = 2_800
/** No play for this many minutes: show possession instead. */
const QUIET_MINUTES = 2

type Play =
  | { kind: 'moment'; key: string; minute: number; side: MatchSide; moment: MatchMoment }
  | { kind: 'event'; key: string; minute: number; side: MatchSide | null; event: MatchEvent }

const MOMENT_LABEL: Record<MatchMoment['type'], string> = {
  dangerous_attack: 'Dangerous attack',
  shot_on_target: 'Shot on target',
  shot: 'Shot',
  corner: 'Corner',
  free_kick: 'Free kick',
  offside: 'Offside',
}

/** 0 or 1 from an id, so a moment keeps its spot on every render. */
const flip = (id: string) => [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 2

/** Where it happens, for a team attacking to the right (home); mirrored for away. */
function spot(play: Play): { x: number; y: number; zone: 'box' | 'third' | 'half' | null } {
  const f = flip(play.key)
  let p: { x: number; y: number; zone: 'box' | 'third' | 'half' | null }
  if (play.kind === 'moment') {
    p = {
      dangerous_attack: { x: 80, y: 50, zone: 'third' as const },
      shot_on_target: { x: 89, y: f ? 44 : 56, zone: 'box' as const },
      shot: { x: 84, y: f ? 30 : 70, zone: 'box' as const },
      corner: { x: 98, y: f ? 4 : 96, zone: 'third' as const },
      free_kick: { x: 68, y: f ? 32 : 68, zone: 'half' as const },
      offside: { x: 82, y: f ? 22 : 78, zone: 'third' as const },
    }[play.moment.type]
  } else if (isGoal(play.event)) {
    p = { x: 96, y: 50, zone: 'box' }
  } else if (play.event.type === 'missed_penalty') {
    p = { x: 89, y: 50, zone: 'box' }
  } else {
    p = { x: 55, y: f ? 40 : 60, zone: null }
  }
  return play.side === 'away' ? { ...p, x: 100 - p.x } : p
}

function playText(match: MatchCentre, play: Play): { title: string; body: string } {
  if (play.kind === 'event') {
    const t = eventText(match, play.event)
    return { title: t.title, body: `${minuteLabel(play.event)} · ${t.body}` }
  }
  const team = shortTeam(play.side === 'home' ? match.home.name : match.away.name)
  const n = play.moment.count > 1 ? ` ×${play.moment.count}` : ''
  return { title: `${MOMENT_LABEL[play.moment.type]}${n}`, body: `${team} · ${play.minute}′` }
}

/** The plays of the latest minute that had any, moments first, real events last. */
function latestPlays(match: MatchCentre): Play[] {
  const plays: Play[] = [
    ...match.moments.map((m) => ({ kind: 'moment' as const, key: m.id, minute: m.minute, side: m.side, moment: m })),
    ...match.events
      .filter((e) => e.type !== 'substitution')
      .map((e) => ({ kind: 'event' as const, key: e.id, minute: e.minute, side: e.side, event: e })),
  ]
  if (!plays.length) return []
  const last = Math.max(...plays.map((p) => p.minute))
  // The attack before the shot before the goal.
  const order = (p: Play) =>
    p.kind === 'event' ? 9 : ['free_kick', 'offside', 'dangerous_attack', 'corner', 'shot', 'shot_on_target'].indexOf(p.moment.type)
  return plays.filter((p) => p.minute === last).sort((a, b) => order(a) - order(b))
}

/** Steps through `length` plays; starts again from the first when the set changes. */
function useCycle(length: number, resetKey: string, running: boolean): number {
  const [state, setState] = useState({ key: resetKey, index: 0 })
  useEffect(() => {
    if (!running || length < 2) return
    const timer = setInterval(
      () =>
        setState((s) => ({
          key: resetKey,
          index: s.key === resetKey ? (s.index + 1) % length : 1 % length,
        })),
      CYCLE_MS,
    )
    return () => clearInterval(timer)
  }, [length, running, resetKey])
  const index = state.key === resetKey ? state.index : 0
  return length ? Math.min(index, length - 1) : 0
}

const TrackerPitch = ({ match }: { match: MatchCentre }) => {
  const plays = useMemo(() => latestPlays(match), [match])
  const live = match.status === 'live'
  const index = useCycle(plays.length, plays.map((p) => p.key).join('|'), live)

  const status =
    match.status === 'scheduled'
      ? { title: 'Kick-off', body: new Date(match.kickoff).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
      : match.status === 'finished'
        ? { title: 'Full-time', body: `${shortTeam(match.home.name)} ${match.home.goals ?? 0}–${match.away.goals ?? 0} ${shortTeam(match.away.name)}` }
        : match.statusDetail === 'HT'
          ? { title: 'Half-time', body: `${shortTeam(match.home.name)} ${match.home.goals ?? 0}–${match.away.goals ?? 0} ${shortTeam(match.away.name)}` }
          : null

  const play = plays[index]
  const quiet = !play || (match.clock.elapsed ?? 0) - play.minute > QUIET_MINUTES
  const possession = match.stats.find((s) => s.key === 'possession')
  const holder: MatchSide | null = possession && possession.home !== null && possession.away !== null
    ? possession.home >= possession.away ? 'home' : 'away'
    : null

  // What the pitch shows now: a status card, the current play, or who has the ball.
  const shown = status
    ? { ...status, side: null as MatchSide | null, x: 50, y: 50, zone: null, icon: null as MatchEvent['type'] | null, goal: false }
    : live && quiet && holder
      ? {
          title: 'In possession',
          body: `${shortTeam(holder === 'home' ? match.home.name : match.away.name)} · ${possession![holder]}% of the ball`,
          side: holder,
          x: holder === 'home' ? 60 : 40,
          y: 50,
          zone: 'half' as const,
          icon: null,
          goal: false,
        }
      : play
        ? {
            ...playText(match, play),
            ...spot(play),
            side: play.side,
            icon: play.kind === 'event' ? play.event.type : null,
            goal: play.kind === 'event' && isGoal(play.event),
          }
        : null

  const color = shown?.side ? TEAM_COLOR[shown.side] : '#ffffff'
  const attackingRight = shown?.side !== 'away'
  const zoneWidth = shown?.zone === 'box' ? 17 : shown?.zone === 'third' ? 33 : shown?.zone === 'half' ? 50 : 0
  const labelTop = (shown?.y ?? 50) > 55

  return (
    <Pitch className='w-full'>
      {/* The attacked area, in the attacking team's colour. */}
      <div
        className='absolute inset-y-0 z-0 transition-all duration-700 ease-out'
        style={{
          width: `${zoneWidth}%`,
          [attackingRight ? 'right' : 'left']: 0,
          [attackingRight ? 'left' : 'right']: 'auto',
          // A white wash reads on grass whatever the team's colour; the edge
          // where the attack is pushing from carries the team's colour.
          background: `linear-gradient(${attackingRight ? 'to right' : 'to left'}, rgba(255,255,255,0.08), rgba(255,255,255,0.38))`,
          [attackingRight ? 'borderLeft' : 'borderRight']: `3px solid ${color}`,
          opacity: zoneWidth ? 1 : 0,
        }}
      />
      <div className='absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-semibold text-[#fff] tabular-nums'>
        {match.statusDetail ?? ''}
        {match.clock.elapsed != null && live ? ` ${match.clock.elapsed}′` : ''}
      </div>

      {shown && !status && (
        // The ball glides to where the play happened.
        <div
          className='absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out'
          style={{ left: `${shown.x}%`, top: `${shown.y}%` }}
        >
          <span className='absolute inset-0 animate-ping rounded-full' style={{ background: `${color}99` }} />
          <span className='relative block h-3 w-3 rounded-full border-2 border-[#111] bg-[#fff] shadow' />
        </div>
      )}

      {shown && (
        <div
          key={shown.title + shown.body}
          className='absolute z-20 w-[44%] max-w-[190px] -translate-x-1/2 overflow-hidden rounded-lg shadow-lg transition-all duration-700'
          style={
            status
              ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
              : {
                  left: `${Math.min(Math.max(shown.x, 24), 76)}%`,
                  top: labelTop ? `calc(${shown.y}% - 12px)` : `calc(${shown.y}% + 12px)`,
                  transform: `translate(-50%, ${labelTop ? '-100%' : '0'})`,
                }
          }
        >
          <div
            className={`flex items-center gap-2 px-3 py-1 text-[13px] font-bold ${shown.goal ? 'bg-[#c6f135] text-[#000]' : 'text-[#fff]'}`}
            style={shown.goal ? undefined : { background: shown.side ? color : '#2fbf71' }}
          >
            {shown.icon && <EventIcon type={shown.icon} size={13} />}
            <span className='truncate'>{shown.title}</span>
          </div>
          <div className='truncate bg-[#0f2a17]/90 px-3 py-1.5 text-[11px] text-[#fff]'>{shown.body}</div>
        </div>
      )}

      {live && (
        <span
          className='absolute right-2 bottom-1.5 text-[9px] text-[#fff]/70'
          title='Built from the live match statistics, updated about once a minute. Not ball tracking.'
        >
          From live match stats · ⓘ
        </span>
      )}
    </Pitch>
  )
}

export default TrackerPitch
