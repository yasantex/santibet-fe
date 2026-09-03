import { useQueryClient } from '@tanstack/react-query'
import {
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
  useSantiBetQuery,
} from './utils'
import type { NotificationResponse } from '../types/notification.types'

const UNREAD_COUNT_KEY = ['/notifications/unread-count', {}]

const invalidateAfterRead = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['notifications'] })
  qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
}

export const useNotifications = (unreadOnly?: boolean, limit = 20) =>
  useSantiBetInfiniteQuery<NotificationResponse>({
    path: '/notifications/',
    queryKey: ['notifications', { unreadOnly: !!unreadOnly, limit }],
    params: { limit, unreadOnly: unreadOnly ? 'true' : undefined },
    enabled: true,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const useUnreadNotificationCount = () => {
  const { data } = useSantiBetQuery<{ unread: number }>({
    path: '/notifications/unread-count',
    queryKey: UNREAD_COUNT_KEY,
    enabled: true,
    // No socket yet on the backend — poll for the badge.
    queryOptions: { refetchInterval: 30000 },
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
