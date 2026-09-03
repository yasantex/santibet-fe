import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification, NotificationResponse } from '../types/notification.types'

/**
 * MOCK DATA LAYER — there is no `/notifications` endpoint yet. Everything
 * below is shaped exactly like a real santibet-fe domain hook (see
 * data_layer/bets.ts) so that swapping in the real API later is a change
 * confined to this file: replace `mockFetchNotifications` with a
 * `useSantiBetInfiniteQuery({ path: '/notifications', ... })` call, and
 * `useMarkNotificationRead`/`useMarkAllNotificationsRead` with
 * `useSantiBetMutation` calls. No consumer of these hooks should need to change.
 */

const PAGE_SIZE = 8

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'BET',
    title: 'Your bet won',
    message: 'The market "Will Nigeria win AFCON 2026?" resolved YES. ₦4,200 credited to your wallet.',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    actionUrl: '/orders',
  },
  {
    id: 'n2',
    type: 'WALLET',
    title: 'Deposit confirmed',
    message: 'Your deposit of ₦10,000 has been credited to your wallet.',
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    actionUrl: '/account-wallet',
  },
  {
    id: 'n3',
    type: 'MARKET',
    title: 'Market closing soon',
    message: '"Will fuel price drop below ₦900 by March?" closes for trading in 1 hour.',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/browse',
  },
  {
    id: 'n4',
    type: 'REFERRAL',
    title: 'Referral bonus earned',
    message: 'Chidinma joined using your referral code — you both earned ₦500 in bonus credit.',
    read: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/refer-earn',
  },
  {
    id: 'n5',
    type: 'WALLET',
    title: 'Withdrawal processing',
    message: 'Your withdrawal of ₦7,500 is being processed and should arrive within 24 hours.',
    read: true,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/account-wallet',
  },
  {
    id: 'n6',
    type: 'SECURITY',
    title: 'New sign-in detected',
    message: 'Your account was just signed in from a new device in Lagos, Nigeria.',
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n7',
    type: 'BET',
    title: 'Your bet lost',
    message: 'The market "Will the Naira strengthen past ₦1,400/$ by Q1?" resolved NO.',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/orders',
  },
  {
    id: 'n8',
    type: 'PROMO',
    title: 'Weekend boost — 2x referral bonus',
    message: 'Refer a friend this weekend and earn double the usual bonus credit.',
    read: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/refer-earn',
  },
  {
    id: 'n9',
    type: 'SYSTEM',
    title: 'Scheduled maintenance',
    message: 'SantiBet will be briefly unavailable on Sunday 2–3am WAT for scheduled maintenance.',
    read: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n10',
    type: 'MARKET',
    title: 'New market: 2026 elections',
    message: 'A new market on the 2026 gubernatorial elections is now open for trading.',
    read: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/browse',
  },
]

const mockFetchNotifications = async ({
  cursor,
  type,
  read,
}: {
  cursor?: string
  type?: string[]
  read?: string[]
}): Promise<NotificationResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 350)) // simulate latency

  let filtered = MOCK_NOTIFICATIONS
  if (type?.length) filtered = filtered.filter((n) => type.includes(n.type))
  if (read?.length) {
    filtered = filtered.filter((n) =>
      read.includes(n.read ? 'READ' : 'UNREAD'),
    )
  }

  const start = cursor ? Number(cursor) : 0
  const page = filtered.slice(start, start + PAGE_SIZE)
  const nextCursor =
    start + PAGE_SIZE < filtered.length ? String(start + PAGE_SIZE) : undefined

  return { data: page, nextCursor }
}

export const useNotifications = (filters: { type?: string[]; read?: string[] }) =>
  useInfiniteQuery<NotificationResponse>({
    queryKey: ['notifications', filters],
    queryFn: ({ pageParam }) =>
      mockFetchNotifications({ cursor: pageParam as string | undefined, ...filters }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  })

export const useUnreadNotificationCount = () => {
  // Stands in for a real `/notifications/unread-count` call.
  return { count: MOCK_NOTIFICATIONS.filter((n) => !n.read).length }
}

export const useMarkNotificationRead = () => {
  const qc = useQueryClient()
  return {
    mutate: (id: string) => {
      const notification = MOCK_NOTIFICATIONS.find((n) => n.id === id)
      if (notification) notification.read = true
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  }
}

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient()
  return {
    mutate: () => {
      MOCK_NOTIFICATIONS.forEach((n) => {
        n.read = true
      })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  }
}
