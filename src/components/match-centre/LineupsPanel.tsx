import type { CSSProperties } from 'react'
import type { LineupPlayer, MatchCentre, TeamLineup } from '../../types/matchCentre.types'
import EventIcon from './EventIcon'
import Pitch from './Pitch'
import { shortTeam } from './matchText'

const DEFAULT_KIT = { home: '2fbf71', away: '4c6ef5' }

const ratingClass = (r: number) =>
  r >= 8 ? 'bg-[#1971c2]' : r >= 7 ? 'bg-[#2f9e44]' : r >= 6.5 ? 'bg-[#e8a10c]' : 'bg-[#e8590c]'

const lastName = (name: string) => name.split(' ').slice(-1)[0] ?? name

function Marker({ player, kit, numberColor, style }: { player: LineupPlayer; kit: string; numberColor: string; style: CSSProperties }) {
  return (
    <div className='absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5' style={style}>
      <div className='relative'>
        <span
          className='flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fff]/80 text-[11px] font-bold shadow'
          style={{ background: `#${kit}`, color: `#${numberColor}` }}
        >
          {player.number ?? ''}
        </span>
        {player.rating !== null && (
          <span className={`absolute -top-2 -right-4 rounded px-1 text-[9px] font-bold text-[#fff] ${ratingClass(player.rating)}`}>
            {player.rating.toFixed(1)}
          </span>
        )}
        <span className='absolute -bottom-1 -left-3 flex gap-0.5'>
          {Array.from({ length: player.goals }).map((_, i) => <EventIcon key={i} type='goal' size={10} />)}
          {player.redCards > 0 ? <EventIcon type='red_card' size={10} /> : player.yellowCards > 0 ? <EventIcon type='yellow_card' size={10} /> : null}
          {player.subbedOff !== null && <EventIcon type='substitution' size={10} />}
        </span>
      </div>
      <span className='max-w-full truncate rounded bg-black/35 px-1 text-[10px] font-medium text-[#fff]'>
        {player.captain ? '© ' : ''}{lastName(player.name)}
      </span>
    </div>
  )
}

/** Starters placed by the feed's grid: GK at their own goal line, forwards near halfway. */
function place(lineup: TeamLineup, top: boolean) {
  const parsed = lineup.startXI.map((p) => {
    const [row, col] = (p.grid ?? '').split(':').map(Number)
    return { p, row: row || 1, col: col || 1 }
  })
  const rows = Math.max(1, ...parsed.map((x) => x.row))
  return parsed.map(({ p, row, col }) => {
    const inRow = parsed.filter((x) => x.row === row).length
    const depth = ((row - 0.5) / rows) * 46 + 2 // % of the pitch's height, from the goal line
    const across = (col / (inRow + 1)) * 100
    return {
      player: p,
      style: { top: `${top ? depth : 100 - depth}%`, left: `${top ? 100 - across : across}%` },
    }
  })
}

function Bench({ title, lineup }: { title: string; lineup: TeamLineup }) {
  return (
    <div className='flex min-w-0 flex-col gap-1'>
      <span className='text-xs font-bold text-black'>{title}</span>
      {lineup.coach && <span className='text-[11px] text-neutral-10'>Coach: {lineup.coach}</span>}
      <ul className='flex flex-col gap-0.5'>
        {lineup.substitutes.map((p) => (
          <li key={`${p.id}-${p.name}`} className='flex items-center gap-1.5 text-xs'>
            <span className='w-5 text-right tabular-nums text-neutral-10'>{p.number ?? ''}</span>
            <span className={`truncate ${p.subbedOn !== null ? 'font-semibold text-black' : 'text-neutral-10'}`}>{p.name}</span>
            {p.subbedOn !== null && <span className='text-[10px] text-success'>▲ {p.subbedOn}′</span>}
            {p.rating !== null && <span className={`ml-auto rounded px-1 text-[9px] font-bold text-[#fff] ${ratingClass(p.rating)}`}>{p.rating.toFixed(1)}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

const LineupsPanel = ({ match }: { match: MatchCentre }) => {
  const lineups = match.lineups
  if (!lineups) {
    return (
      <p className='py-6 text-center text-xs text-neutral-10'>
        Lineups are usually announced 20–40 minutes before kick-off.
      </p>
    )
  }
  const kit = (side: 'home' | 'away') => lineups[side].colors?.shirt ?? DEFAULT_KIT[side]
  const num = (side: 'home' | 'away') => lineups[side].colors?.number ?? 'ffffff'
  const gk = (side: 'home' | 'away') => lineups[side].colors?.goalkeeper ?? '222222'
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-between text-xs font-semibold text-black'>
        <span>{shortTeam(match.away.name)} · {lineups.away.formation ?? ''}</span>
      </div>
      <Pitch vertical className='mx-auto w-full max-w-sm rounded-lg'>
        {(['away', 'home'] as const).flatMap((side) =>
          place(lineups[side], side === 'away').map(({ player, style }) => (
            <Marker
              key={`${side}-${player.id}-${player.name}`}
              player={player}
              kit={player.position === 'G' ? gk(side) : kit(side)}
              numberColor={player.position === 'G' ? 'ffffff' : num(side)}
              style={style}
            />
          )),
        )}
      </Pitch>
      <div className='flex justify-between text-xs font-semibold text-black'>
        <span>{shortTeam(match.home.name)} · {lineups.home.formation ?? ''}</span>
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <Bench title={`${shortTeam(match.home.name)} bench`} lineup={lineups.home} />
        <Bench title={`${shortTeam(match.away.name)} bench`} lineup={lineups.away} />
      </div>
    </div>
  )
}

export default LineupsPanel
