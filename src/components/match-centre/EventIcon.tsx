import type { MatchEventType } from '../../types/matchCentre.types'

/** A small glyph per timeline event: ball, card, swap arrows, VAR. */
const EventIcon = ({ type, size = 14 }: { type: MatchEventType; size?: number }) => {
  const box = { width: size, height: size }
  switch (type) {
    case 'goal':
    case 'penalty_goal':
      return <span style={box} className='inline-flex items-center justify-center leading-none' aria-label='Goal'>⚽</span>
    case 'own_goal':
      return (
        <span style={box} className='relative inline-flex items-center justify-center leading-none' aria-label='Own goal'>
          ⚽<span className='absolute -right-1 -bottom-1 text-[8px] font-bold text-error'>OG</span>
        </span>
      )
    case 'missed_penalty':
      return (
        <span style={box} className='relative inline-flex items-center justify-center leading-none opacity-60' aria-label='Missed penalty'>
          ⚽<span className='absolute inset-0 flex items-center justify-center text-[11px] font-black text-error'>✕</span>
        </span>
      )
    case 'yellow_card':
      return <span aria-label='Yellow card' style={{ width: size * 0.65, height: size * 0.9 }} className='inline-block rounded-[2px] bg-[#f5c518]' />
    case 'red_card':
      return <span aria-label='Red card' style={{ width: size * 0.65, height: size * 0.9 }} className='inline-block rounded-[2px] bg-[#e03131]' />
    case 'second_yellow':
      return (
        <span aria-label='Second yellow' className='relative inline-block' style={{ width: size * 0.9, height: size * 0.9 }}>
          <span className='absolute top-0 left-0 rounded-[2px] bg-[#f5c518]' style={{ width: size * 0.55, height: size * 0.8 }} />
          <span className='absolute right-0 bottom-0 rounded-[2px] bg-[#e03131]' style={{ width: size * 0.55, height: size * 0.8 }} />
        </span>
      )
    case 'substitution':
      return (
        <span style={box} className='inline-flex flex-col items-center justify-center text-[9px] leading-[8px] font-black' aria-label='Substitution'>
          <span className='text-[#2fbf71]'>▲</span>
          <span className='text-[#e03131]'>▼</span>
        </span>
      )
    case 'var':
      return <span className='inline-flex items-center rounded-[3px] bg-[#3b5bdb] px-0.5 text-[8px] font-black leading-[12px] text-[#fff]' aria-label='VAR'>VAR</span>
  }
}

export default EventIcon
