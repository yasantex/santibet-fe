import { HugeiconsIcon } from '@hugeicons/react'
import { SquareLock02Icon } from '@hugeicons/core-free-icons'
import type { PlayerBadge } from '../../types/points.types'
import { formatShortDate, resolveBadgeIcon } from '../../utils/points'

export const BadgeIcon = ({
  badge,
  size = 44,
}: {
  badge: Pick<PlayerBadge, 'icon' | 'criterion' | 'earned' | 'name'>
  size?: number
}) => {
  const resolved = resolveBadgeIcon(badge.icon, badge.criterion)
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        badge.earned
          ? 'bg-brand-green text-black dark:text-[#000000]'
          : 'bg-hover text-neutral-10'
      }`}
    >
      {'url' in resolved ? (
        <img
          src={resolved.url}
          alt=''
          className={`h-full w-full object-cover ${badge.earned ? '' : 'opacity-40 grayscale'}`}
        />
      ) : (
        <HugeiconsIcon icon={resolved.icon} size={Math.round(size * 0.5)} />
      )}
    </div>
  )
}

const BadgeCard = ({ badge }: { badge: PlayerBadge }) => {
  const { current, target } = badge.progress
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  return (
    <div className='flex items-start gap-3 rounded-2xl border border-border bg-card p-4'>
      <BadgeIcon badge={badge} />
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className={`truncate text-sm font-bold ${badge.earned ? 'text-black' : 'text-neutral-10'}`}
          >
            {badge.name}
          </span>
          {!badge.earned && (
            <HugeiconsIcon
              icon={SquareLock02Icon}
              size={14}
              className='shrink-0 text-neutral-10'
            />
          )}
        </div>
        <span className='text-xs text-neutral-10'>{badge.description}</span>
        {badge.earned ? (
          <span className='text-[11px] text-placeholder'>
            {badge.awardedAt
              ? `Earned ${formatShortDate(badge.awardedAt)}`
              : 'Earned'}
          </span>
        ) : (
          <div className='mt-1 flex items-center gap-2'>
            <div
              className='h-1.5 flex-1 overflow-hidden rounded-full bg-hover'
              role='progressbar'
              aria-valuemin={0}
              aria-valuemax={target}
              aria-valuenow={current}
              aria-label={`${badge.name} progress`}
            >
              <div
                className='h-full rounded-full bg-brand-green'
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className='shrink-0 text-[11px] font-semibold text-neutral-10'>
              {current}/{target}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

type BadgeGridProps = {
  badges?: PlayerBadge[]
  isLoading?: boolean
  isError?: boolean
}

/** Every active badge — earned first, then locked ones with progress. */
const BadgeGrid = ({ badges, isLoading, isError }: BadgeGridProps) => {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='h-24 animate-pulse rounded-2xl bg-card' />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
        We couldn’t load your badges right now.
      </p>
    )
  }

  if (!badges?.length) {
    return (
      <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
        No badges yet — they’ll appear here as they’re introduced.
      </p>
    )
  }

  const sorted = [...badges].sort((a, b) => Number(b.earned) - Number(a.earned))

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      {sorted.map((badge) => (
        <BadgeCard key={badge.key} badge={badge} />
      ))}
    </div>
  )
}

export default BadgeGrid
