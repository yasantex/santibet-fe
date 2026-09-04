import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCookies } from 'react-cookie'
import { toast } from 'sonner'
import {
  useSantiBetInfiniteQuery,
  useSantiBetMutation,
  useSantiBetQuery,
} from './utils'
import type {
  NotificationResponse,
  NotificationType,
} from '../types/notification.types'
import { NOTIFICATIONS_KEY } from './queryKeys'

const UNREAD_COUNT_KEY = ['/notifications/unread-count', {}]

// Types that also move the wallet balance - worth an extra refetch so the
// balance shown in the header/wallet page doesn't sit stale after the toast.
const BALANCE_AFFECTING_TYPES = new Set<NotificationType>([
  'DEPOSIT_SUCCESS',
  'WITHDRAWAL_COMPLETED',
  'WINNINGS_CREDITED',
  'CASH_OUT_COMPLETED',
])
const ERROR_TYPES = new Set<NotificationType>([
  'DEPOSIT_FAILED',
  'WITHDRAWAL_FAILED',
])
const WARNING_TYPES = new Set<NotificationType>(['SECURITY_ALERT'])

interface NotificationEvent {
  type: 'notification'
  notificationType: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown> | null
  at: string
}

/**
 * Opens the SSE connection (`GET /notifications/stream?token=`) that pushes
 * notifications live, pops a toast for each one, and keeps the unread badge
 * and notification list in sync without polling. Mounted globally alongside
 * <Toaster /> so it's live on every authenticated page.
 */
export const useNotificationStream = () => {
  const qc = useQueryClient()
  const [cookies] = useCookies(['token'])
  const token = cookies?.token as string | undefined
  const hasConnectedBefore = useRef(false)

  useEffect(() => {
    if (!token) return
    if (typeof window === 'undefined' || !('EventSource' in window)) return

    const base = import.meta.env.VITE_APP_API_BASE_URL || ''
    const es = new EventSource(
      `${base}/notifications/stream?token=${encodeURIComponent(token)}`,
    )

    es.onopen = () => {
      // A re-open after the initial connect means we were disconnected for a
      // while - re-fetch to catch anything missed, per the API's own guidance.
      if (hasConnectedBefore.current) {
        qc.invalidateQueries({ queryKey: ['notifications'] })
        qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
      }
      hasConnectedBefore.current = true
    }

    es.addEventListener('hello', (e) => {
      try {
        const { unread } = JSON.parse((e as MessageEvent).data)
        if (typeof unread === 'number') {
          qc.setQueryData(UNREAD_COUNT_KEY, { unread })
        }
      } catch {
        // ignore malformed payload
      }
    })

    es.addEventListener('notification', (e) => {
      let payload: NotificationEvent
      try {
        payload = JSON.parse((e as MessageEvent).data)
      } catch {
        return
      }

      const { notificationType, title, body } = payload
      if (title) {
        const toastFn = ERROR_TYPES.has(notificationType)
          ? toast.error
          : WARNING_TYPES.has(notificationType)
            ? toast.warning
            : toast.success
        toastFn(title, { description: body ?? undefined })
      }

      qc.setQueryData<{ unread: number }>(UNREAD_COUNT_KEY, (old) => ({
        unread: (old?.unread ?? 0) + 1,
      }))
      qc.invalidateQueries({ queryKey: ['notifications'] })

      if (BALANCE_AFFECTING_TYPES.has(notificationType)) {
        qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === '/wallet' })
      }
    })

    es.onerror = () => {
      /* EventSource auto-reconnects; ignore transient errors */
    }

    return () => {
      es.close()
      hasConnectedBefore.current = false
    }
  }, [qc, token])
}

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
  // const { connected } = useNotificationStream()
  const { data } = useSantiBetQuery<{ unread: number }>({
    path: '/notifications/unread-count',
    queryKey: UNREAD_COUNT_KEY,
    enabled: true,
    // useNotificationStream keeps this live via SSE; poll stays as a fallback
    // for when the stream is unavailable (e.g. blocked, or EventSource-less).
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
