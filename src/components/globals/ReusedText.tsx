import type { FC } from 'react'
import { getInitials } from '../../utils/functions'
import type { StatusConfig } from '../../types/types'
import { statusBadgeClass } from '../../utils/constants'

export const ErrorText = ({
  text,
  className,
}: {
  text: string
  className?: string
}) => {
  return (
    <div className={`pt-1 text-xs font-normal text-error ${className}`}>
      {text}
    </div>
  )
}

export const ProfileAvatar: FC<{
  isLoading?: boolean
  firstName: string
  lastName: string
  imageUrl?: string | null
  className?: string
}> = ({ firstName, lastName, imageUrl, isLoading = false, className }) => {
  if (isLoading) {
    return (
      <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full bg-card  `}>
        <div className='h-full w-full animate-pulse bg-neutral-10/20' />
      </div>
    )
  }
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${firstName} ${lastName}`}
        className='h-10 w-10 rounded-full object-cover shrink-0'
      />
    )
  }
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold text-white select-none ${className}`}
    >
      {getInitials(firstName, lastName)}
    </div>
  )
}

export const MarketCardSkeleton = () => {
  return (
    <div className='flex flex-col gap-3 rounded-lg bg-card p-4'>
      <div className='h-4 w-3/4 animate-pulse rounded bg-neutral-10/20' />
      <div className='grid grid-cols-2 gap-2'>
        <div className='h-8 animate-pulse rounded-md bg-neutral-10/20' />
        <div className='h-8 animate-pulse rounded-md bg-neutral-10/20' />
      </div>
      <div className='h-3 w-16 animate-pulse rounded bg-neutral-10/20' />
    </div>
  )
}


export const TextLoader = ({ count = 8 }: {count: number}) => {
  const widths = ["w-full", "w-full", "w-5/6", "w-full", "w-2/3"];

  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 rounded bg-neutral-10/20 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
};

export const StatusBadge: React.FC<{
  value: number | boolean | string
  statusConfig: StatusConfig[]
}> = ({ value, statusConfig }) => {
  const config = statusConfig.find((s) => s.value === value)
  if (!config) return <span className='text-neutral-10 text-xs'>—</span>

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium  ${
        statusBadgeClass[config.color]
      }`}
    >
      {config.label}
    </span>
  )
}