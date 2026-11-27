import type { MatchCentre } from '../../types/matchCentre.types'
import { teamCode } from './matchText'

const fmt = (v: number | null, unit: '%' | null) => (v === null ? '–' : `${Number.isInteger(v) ? v : v.toFixed(2)}${unit ?? ''}`)

/** Head-to-head bars for each statistic; the leader's side is highlighted. */
const StatsPanel = ({ match }: { match: MatchCentre }) => {
  if (!match.stats.length) {
    return <p className='py-6 text-center text-xs text-neutral-10'>Statistics appear once the match kicks off.</p>
  }
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-between text-xs font-bold text-black'>
        <span>{teamCode(match.home.name)}</span>
        <span>{teamCode(match.away.name)}</span>
      </div>
      {match.stats.map((s) => {
        const h = s.home ?? 0
        const a = s.away ?? 0
        const total = h + a || 1
        return (
          <div key={s.key} className='flex flex-col gap-1'>
            <div className='flex justify-between text-xs'>
              <span className={`tabular-nums ${h > a ? 'font-bold text-black' : 'text-neutral-10'}`}>{fmt(s.home, s.unit)}</span>
              <span className='text-neutral-10'>{s.label}</span>
              <span className={`tabular-nums ${a > h ? 'font-bold text-black' : 'text-neutral-10'}`}>{fmt(s.away, s.unit)}</span>
            </div>
            <div className='flex h-1.5 gap-1'>
              <div className='flex flex-1 justify-end overflow-hidden rounded-full bg-border'>
                <div className={`h-full rounded-full ${h >= a ? 'bg-[#2fbf71]' : 'bg-[#2fbf71]/50'}`} style={{ width: `${(h / total) * 100}%` }} />
              </div>
              <div className='flex flex-1 overflow-hidden rounded-full bg-border'>
                <div className={`h-full rounded-full ${a >= h ? 'bg-[#4c6ef5]' : 'bg-[#4c6ef5]/50'}`} style={{ width: `${(a / total) * 100}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsPanel
