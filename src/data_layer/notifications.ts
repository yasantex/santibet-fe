import { useQueryClient } from '@tanstack/react-query'
import {
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
  useSantiBetQuery,
} from './utils'
import type { NotificationResponse } from '../types/notification.types'
import { NOTIFICATIONS_KEY, UNREAD_COUNT_KEY } from './queryKeys'
import { useNotificationStream } from './notificationStreamContext'

const invalidateAfterRead = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
  qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
}

export const useNotifications = (unreadOnly?: boolean, limit = 20) =>
  useSantiBetInfiniteQuery<NotificationResponse>({
    path: '/notifications/',
    queryKey: [...NOTIFICATIONS_KEY, { unreadOnly: !!unreadOnly, limit }],
    params: { limit, unreadOnly: unreadOnly ? 'true' : undefined },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const useUnreadNotificationCount = () => {
  const { connected } = useNotificationStream()
  const { data } = useSantiBetQuery<{ unread: number }>({
    path: '/notifications/unread-count',
    queryKey: UNREAD_COUNT_KEY,
    enabled: true,
    // The stream seeds this on `hello` and bumps it per push, so polling is
    // only the fallback for a dropped connection.
    queryOptions: { refetchInterval: connected ? false : 30000 },
  })
  return { count: data?.unread ?? 0 }
}

export const useMarkNotificationRead = (id: string) => {
  const qc = useQueryClient()
  return useSantiBetMutation<{ updated: number }, void>({
    path: `/notifications/${id}/read`,
    mutationOptions: {
      onSuccess: () => invalidateAfterRead(qc),
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient()
  return useSantiBetMutation<{ updated: number }, void>({
    path: '/notifications/read-all',
    mutationOptions: {
      onSuccess: () => invalidateAfterRead(qc),
    },
  })
}