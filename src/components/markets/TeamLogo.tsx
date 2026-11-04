import { useState } from 'react'
import type { EventTeam } from '../../types/market.types'

/**
 * A team's crest beside its name. Falls back to the team's initials in a
 * neutral circle when there's no logo or the image fails to load, so rows keep
 * their alignment. Renders nothing when no team is given (non-team labels like
 * "Draw").
 */
const TeamLogo = ({
  team,
  size = 20,
  className = '',
}: {
  team?: EventTeam | null
  size?: number
  className?: string
}) => {
  const [failed, setFailed] = useState(false)
  if (!team) return null

  const box = { width: size, height: size }
  if (team.logoUrl && !failed) {
    return (
      <img
        src={team.logoUrl}
        alt=''
        loading='lazy'
        onError={() => setFailed(true)}
        style={box}
        className={`shrink-0 object-contain ${className}`}
      />
    )
  }

  const initials = (team.shortName || team.name)
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  return (
    <span
      aria-hidden
      style={{ ...box, fontSize: Math.max(8, Math.round(size * 0.38)) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-border/40 font-bold text-neutral-10 ${className}`}
    >
      {initials}
    </span>
  )
}

export default TeamLogo
