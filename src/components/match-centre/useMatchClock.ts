import { useEffect, useState } from 'react'
import type { MatchCentre } from '../../types/matchCentre.types'

/** Seconds the local clock may run past the last feed reading before it waits. */
const MAX_DRIFT_S = 4 * 60

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The match clock as "21:32". The feed reports whole minutes about once a
 * minute; between readings the clock counts on locally from when it was read,
 * so it ticks like a broadcast clock. Polymarket games use Polymarket's own
 * mm:ss when its socket has one. Null when the clock is not running.
 */
export function useMatchClock(match: MatchCentre | undefined, fetchedAt: number): string | null {
  const running = !!match?.clock.running
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [running])

  if (!match || !running) return null
  const { venueClock, elapsed, at } = match.clock
  let base: number | null = null
  let since = 0
  if (venueClock && /^\d+:\d{2}$/.test(venueClock)) {
    const [mm, ss] = venueClock.split(':').map(Number)
    base = mm! * 60 + ss!
    since = (now - fetchedAt) / 1000
  } else if (elapsed !== null) {
    // `elapsed` is the minute in progress: 21 means 20:00–20:59 has passed.
    base = Math.max(elapsed - 1, 0) * 60
    since = at ? (now - Date.parse(at)) / 1000 : 0
  }
  if (base === null) return null
  const seconds = Math.floor(base + Math.min(Math.max(since, 0), MAX_DRIFT_S))
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
}
