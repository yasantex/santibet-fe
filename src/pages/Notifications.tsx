import { useEffect, useMemo, useRef, useState } from 'react'
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
  ACCOUNT_VERIFICATION: 'Account verification',
  KYC_UPDATE: 'KYC update',
  DEPOSIT_SUCCESS: 'Deposit',
  DEPOSIT_FAILED: 'Deposit',
  WITHDRAWAL_REQUESTED: 'Withdrawal',
  WITHDRAWAL_APPROVED: 'Withdrawal',
  WITHDRAWAL_FAILED: 'Withdrawal',
  WITHDRAWAL_COMPLETED: 'Withdrawal',
  BET_ACCEPTED: 'Bet',
  CASH_OUT_COMPLETED: 'Cash out',
  MARKET_RESOLVED: 'Market',
  WINNINGS_CREDITED: 'Winnings',
  SECURITY_ALERT: 'Security',
}


const NotificationRow = ({ notification }: { notification: AppNotification }) => {
  const { mutate: markRead } = useMarkNotificationRead(notification.id)
  const isRead = !!notification.readAt

  const open = () => {
    if (!isRead) markRead()
  }

  return (
    <button
      type='button'
      onClick={open}
      className='flex w-full items-start gap-3 py-3.5 text-left'
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          isRead ? 'bg-transparent' : 'bg-brand-green'
        }`}
      />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className={`text-sm text-black ${isRead ? 'font-medium' : 'font-bold'}`}
          >
            {notification.title}
          </span>
          <span className='shrink-0 text-[11px] text-placeholder'>
            {typeLabels[notification.type] ?? notification.type}
          </span>
        </div>
        {notification.body && (
          <p className='text-sm text-neutral-10'>{notification.body}</p>
        )}
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

  // unreadOnly is server-side; type/read-only-shown are refined client-side
  // over whatever's loaded, since the API only filters on unreadOnly.
  const unreadOnly = filters.read.includes('UNREAD')

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotifications(unreadOnly)

  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  const notifications = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.data ?? []) ?? []
    return all
      .filter((n) => (filters.type.length ? filters.type.includes(n.type) : true))
      .filter((n) => (filters.read.includes('READ') ? !!n.readAt : true))
  }, [data, filters])

  const hasUnread = notifications.some((n) => !n.readAt)

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
            onClick={() => markAllRead()}
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
