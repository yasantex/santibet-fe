import type { FC } from 'react'
import { getInitials } from '../../utils/functions'

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
}> = ({ firstName, lastName, imageUrl, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className='h-10 w-10 shrink-0 overflow-hidden rounded-full bg-card'>
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
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold text-white select-none`}
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
