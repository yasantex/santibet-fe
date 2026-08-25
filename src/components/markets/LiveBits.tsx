import type { LiveState } from '../../types/market.types'

export const LiveBadge = ({ className = '' }: { className?: string }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-bold uppercase text-error ${className}`}
  >
    <span className='relative flex h-1.5 w-1.5'>
      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75' />
      <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-error' />
    </span>
    Live
  </span>
)

/** In-play scoreboard for a live sports event (from event.liveState). */
export const ScoreBoard = ({ state }: { state: LiveState }) => {
  const meta = [state.status, state.period, state.clock]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className='flex items-center justify-between gap-3 rounded-lg bg-hover/50 px-3 py-2'>
      <div className='flex flex-col gap-0.5'>
        {(state.scores ?? []).map((s) => (
          <div
            key={s.competitor}
            className='flex items-center justify-between gap-6 text-sm'
          >
            <span className='font-medium text-black'>{s.competitor}</span>
            <span className='font-bold text-black'>{s.score}</span>
          </div>
        ))}
      </div>
      {meta && (
        <span className='shrink-0 text-xs font-semibold text-error uppercase'>
          {meta}
        </span>
      )}
    </div>
  )
}
