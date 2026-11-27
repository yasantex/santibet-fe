import type { MatchCentre } from '../../types/matchCentre.types'
import { teamCode } from './matchText'

/**
 * Attacking pressure: home above the line, away below, per 3-minute bucket.
 * Built from shots, shots in the box, shots on target, corners and goals.
 */
const MomentumChart = ({ match }: { match: MatchCentre }) => {
  const points = match.momentum
  if (!points.length) {
    return <p className='py-6 text-center text-xs text-neutral-10'>Momentum appears once the match is under way.</p>
  }
  const end = Math.max(90, ...points.map((p) => p.minute))
  const width = 300
  const height = 80
  const mid = height / 2
  const bar = (width / end) * 3 - 1
  const x = (minute: number) => ((minute - 3) / end) * width
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex justify-between text-[10px] font-semibold text-neutral-10'>
        <span>{teamCode(match.home.name)} ▲</span>
        <span>Momentum</span>
        <span>▼ {teamCode(match.away.name)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className='h-24 w-full' preserveAspectRatio='none' role='img' aria-label='Match momentum'>
        <line x1={0} x2={width} y1={mid} y2={mid} stroke='currentColor' className='text-border' strokeWidth={1} />
        {[45, 90].map((m) => (
          <line key={m} x1={(m / end) * width} x2={(m / end) * width} y1={0} y2={height} stroke='currentColor' className='text-border' strokeDasharray='2 3' />
        ))}
        {points.map((p) => (
          <g key={p.minute}>
            {p.home > 0 && <rect x={x(p.minute)} width={bar} y={mid - (p.home / 100) * (mid - 2)} height={(p.home / 100) * (mid - 2)} rx={1} fill='#2fbf71' />}
            {p.away > 0 && <rect x={x(p.minute)} width={bar} y={mid} height={(p.away / 100) * (mid - 2)} rx={1} fill='#4c6ef5' />}
          </g>
        ))}
      </svg>
      <div className='flex justify-between text-[10px] text-neutral-10'>
        <span>0′</span>
        <span>45′</span>
        <span>{end}′</span>
      </div>
    </div>
  )
}

export default MomentumChart
