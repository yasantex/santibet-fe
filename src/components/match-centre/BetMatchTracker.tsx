import { useState } from 'react'
import type { LiveState } from '../../types/market.types'
import MatchCentre from './MatchCentre'

/**
 * The live strip on a bet card: score and clock, and a button that opens the
 * compact tracker under the bet. The tracker is only fetched once opened, so a
 * long My Bets list doesn't poll every match.
 */
const BetMatchTracker = ({
  eventId,
  liveState,
}: {
  eventId: string
  liveState?: LiveState | null
}) => {
  const [open, setOpen] = useState(false)
  const live = liveState?.status === 'live'
  const score = liveState?.scores?.map((s) => s.score).join(':')
  const meta = [liveState?.clock, liveState?.period].filter(Boolean).join(' ')
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        {liveState ? (
          <span className={`text-sm font-semibold tabular-nums ${live ? 'text-success' : 'text-neutral-10'}`}>
            {meta ? `${meta} | ` : ''}
            <span className='font-bold'>{score}</span>
          </span>
        ) : (
          <span className='text-xs text-neutral-10'>Match tracker</span>
        )}
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          aria-expanded={open}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            open ? 'bg-[#2fbf71]/15 text-success' : 'bg-hover text-black hover:bg-[#2fbf71]/10'
          }`}
        >
          <span aria-hidden>▣</span>
          {open ? 'Hide tracker' : live ? 'Track live' : 'Match centre'}
        </button>
      </div>
      {open && (
        <div onClick={(e) => e.stopPropagation()}>
          <MatchCentre eventId={eventId} compact showMyBets={false} goalAlerts={false} />
        </div>
      )}
    </div>
  )
}

export default BetMatchTracker
