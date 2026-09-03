import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../data_layer/notifications'
import { formatDate } from '../utils/functions'
import FilterComponent from '../components/globals/FilterComponent'
import { notificationFilterCategories } from '../utils/filters'
import { Button } from '../components/globals/Button'
import type { AppNotification, NotificationType } from '../types/notification.types'

type NotificationFilterValues = Record<'type' | 'read', string[]>

const typeLabels: Record<NotificationType, string> = {
  BET: 'Bet',
  MARKET: 'Market',
  WALLET: 'Wallet',
  REFERRAL: 'Referral',
  SECURITY: 'Security',
  PROMO: 'Promotion',
  SYSTEM: 'System',
}

const NotificationRow = ({ notification }: { notification: AppNotification }) => {
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()

  const open = () => {
    if (!notification.read) markRead.mutate(notification.id)
    if (notification.actionUrl) navigate(notification.actionUrl)
  }

  return (
    <button
      type='button'
      onClick={open}
      className='flex w-full items-start gap-3 py-3.5 text-left'
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          notification.read ? 'bg-transparent' : 'bg-brand-green'
        }`}
      />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className={`text-sm text-black ${
              notification.read ? 'font-medium' : 'font-bold'
            }`}
          >
            {notification.title}
          </span>
          <span className='shrink-0 text-[11px] text-placeholder'>
            {typeLabels[notification.type]}
          </span>
        </div>
        <p className='text-sm text-neutral-10'>{notification.message}</p>
        <span className='text-xs text-placeholder'>
          {formatDate(notification.createdAt)}
        </span>
      </div>
    </button>
  )
}

const Notifications = () => {
  const [filters, setFilters] = useState<NotificationFilterValues>({
    type: [],
    read: [],
  })

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotifications(filters)

  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.pages.flatMap((page) => page.data ?? []) ?? []
  const hasUnread = notifications.some((n) => !n.read)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Notifications
        </h1>
        {hasUnread && (
          <Button
            type='button'
            text='Mark all as read'
            variation='plain'
            size='medium'
            className='w-fit!'
            extra={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />}
            onClick={() => markAllRead.mutate()}
          />
        )}
      </div>

      <div className='flex justify-end'>
        <FilterComponent
          categories={notificationFilterCategories}
          initialFilters={filters}
          onApply={(nextFilters) =>
            setFilters({
              type: nextFilters.type ?? [],
              read: nextFilters.read ?? [],
            })
          }
          onReset={() => setFilters({ type: [], read: [] })}
        />
      </div>

      <div className='flex flex-col gap-2 rounded-lg bg-card p-4'>
        {isLoading ? (
          <div className='flex flex-col gap-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-lg bg-hover' />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <p className='py-6 text-center text-sm text-black'>
            No notifications yet.
          </p>
        ) : (
          <>
            <div className='flex flex-col divide-y divide-border max-h-150 overflow-y-auto'>
              {notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </div>
            {hasNextPage && (
              <div ref={sentinelRef} className='flex justify-center py-3'>
                {isFetchingNextPage && (
                  <span className='text-xs text-neutral-10'>Loading more…</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default Notifications
