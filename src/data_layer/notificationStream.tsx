import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Cookies, useCookies } from 'react-cookie'
import { apiClient } from './utils'
import {
  BETS_KEY,
  BET_POSITIONS_KEY,
  DEPOSITS_KEY,
  NOTIFICATIONS_KEY,
  UNREAD_COUNT_KEY,
  WALLET_BALANCE_KEY,
  WALLET_TRANSACTIONS_KEY,
} from './queryKeys'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'
import {
  NotificationStreamContext,
  type DepositListener,
  type DepositSuccessEvent,
} from './notificationStreamContext'
import type { NotificationType } from '../types/notification.types'

/** `hello` is sent once on connect and seeds the badge. */
interface HelloPayload {
  unread: number
}

/** Payload of the `notification` event. */
interface StreamNotification {
  type: 'notification'
  notificationType: NotificationType
  title: string
  body?: string | null
  data?: Record<string, unknown> | null
  at: string
}

/** Notification types whose arrival means the wallet balance moved. */
const WALLET_MOVING_TYPES: NotificationType[] = [
  'DEPOSIT_SUCCESS',
  'DEPOSIT_FAILED',
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_FAILED',
  'WITHDRAWAL_COMPLETED',
  'CASH_OUT_COMPLETED',
  'WINNINGS_CREDITED',
]

/** Types that report bad news, so they must not surface as a success toast. */
const FAILURE_TYPES: NotificationType[] = [
  'DEPOSIT_FAILED',
  'WITHDRAWAL_FAILED',
  'SECURITY_ALERT',
]

/** Notification types that change bet or position state. */
const BET_MOVING_TYPES: NotificationType[] = [
  'BET_ACCEPTED',
  'CASH_OUT_COMPLETED',
  'MARKET_RESOLVED',
  'WINNINGS_CREDITED',
]

const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000
/** How long a connection must hold before its success resets the backoff. */
const STABLE_CONNECTION_MS = 10000

/**
 * The interceptor in `utils.ts` rotates the access token through a standalone
 * `Cookies` instance, which does not notify `CookiesProvider` subscribers. Read
 * the jar directly at connect time so a reconnect always carries a fresh token.
 */
const readToken = () => {
  const raw = new Cookies().get('token')
  return typeof raw === 'string' && raw ? raw : null
}

const toAmount = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const buildStreamUrl = (token: string) => {
  const base = (apiClient.defaults.baseURL ?? '').replace(/\/+$/, '')
  // EventSource cannot set headers, so the token travels as a query param.
  return `${base}/notifications/stream?token=${encodeURIComponent(token)}`
}

const invalidateForNotification = (
  qc: QueryClient,
  notificationType: NotificationType,
) => {
  if (WALLET_MOVING_TYPES.includes(notificationType)) {
    qc.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
    qc.invalidateQueries({ queryKey: WALLET_TRANSACTIONS_KEY })
    qc.invalidateQueries({ queryKey: DEPOSITS_KEY })
  }
  if (BET_MOVING_TYPES.includes(notificationType)) {
    qc.invalidateQueries({ queryKey: BETS_KEY })
    qc.invalidateQueries({ queryKey: BET_POSITIONS_KEY })
  }
}

/**
 * Holds the SSE connection to `/notifications/stream` for the whole app.
 *
 * The notification list stays the durable source of truth — the stream only
 * nudges caches and surfaces toasts, so a dropped connection degrades to the
 * existing polling rather than losing state.
 */
export const NotificationStreamProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const queryClient = useQueryClient()
  // Reactive only for login/logout; the value itself is re-read from the jar.
  const [cookies] = useCookies(['token'])
  const hasSession = !!cookies?.token

  const [connected, setConnected] = useState(false)

  const depositListeners = useRef(new Set<DepositListener>())

  const subscribeToDepositSuccess = useCallback(
    (listener: DepositListener) => {
      depositListeners.current.add(listener)
      return () => {
        depositListeners.current.delete(listener)
      }
    },
    [],
  )

  useEffect(() => {
    if (!hasSession) return

    let source: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0
    let cancelled = false
    // Distinguishes the first connect from a reconnect, which has to backfill
    // anything the server emitted while we were disconnected.
    let hasConnectedBefore = false
    let openedAt = 0

    const scheduleReconnect = () => {
      if (cancelled) return
      const delay = Math.min(
        RECONNECT_BASE_DELAY * 2 ** attempt,
        RECONNECT_MAX_DELAY,
      )
      attempt += 1
      reconnectTimer = setTimeout(connect, delay)
    }

    function connect() {
      if (cancelled) return

      const token = readToken()
      if (!token) {
        // Token is mid-rotation or gone; retry rather than dropping the stream.
        scheduleReconnect()
        return
      }

      source = new EventSource(buildStreamUrl(token))

      source.onopen = () => {
        if (cancelled) return
        openedAt = Date.now()
        setConnected(true)

        if (hasConnectedBefore) {
          // The stream is fire-and-forget: re-read the durable list once so
          // anything emitted while we were down is not missed.
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
          queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
          queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
        }
        hasConnectedBefore = true
      }

      source.addEventListener('hello', (event) => {
        try {
          const { unread } = JSON.parse(
            (event as MessageEvent).data,
          ) as HelloPayload
          queryClient.setQueryData(UNREAD_COUNT_KEY, { unread })
        } catch (error) {
          console.error('Malformed `hello` payload', error)
        }
      })

      source.addEventListener('notification', (event) => {
        let payload: StreamNotification
        try {
          payload = JSON.parse((event as MessageEvent).data)
        } catch (error) {
          console.error('Malformed `notification` payload', error)
          return
        }

        const { notificationType, title, data } = payload

        // Bump the badge immediately, then reconcile against the server.
        queryClient.setQueryData<{ unread: number }>(
          UNREAD_COUNT_KEY,
          (previous) => ({ unread: (previous?.unread ?? 0) + 1 }),
        )
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })

        invalidateForNotification(queryClient, notificationType)

        if (notificationType === 'DEPOSIT_SUCCESS') {
          const depositEvent: DepositSuccessEvent = {
            depositId:
              typeof data?.depositId === 'string' ? data.depositId : undefined,
            // The wallet API serialises minor units as strings; accept either.
            amount: toAmount(data?.amount),
          }
          depositListeners.current.forEach((listener) => {
            try {
              listener(depositEvent)
            } catch (error) {
              console.error('Deposit listener failed', error)
            }
          })
        }

        if (title) {
          if (FAILURE_TYPES.includes(notificationType)) {
            showWarningToast(title)
          } else {
            showSuccessToast(title)
          }
        }
      })

      source.onerror = () => {
        if (cancelled) return
        setConnected(false)
        // Only a connection that actually held counts as recovery. A server
        // that accepts then drops immediately must still back off, rather than
        // being retried once a second forever.
        if (openedAt && Date.now() - openedAt > STABLE_CONNECTION_MS) {
          attempt = 0
        }
        openedAt = 0
        // Reconnect by hand instead of letting EventSource retry: its retry
        // reuses the original URL, which would pin a rotated-out token.
        source?.close()
        source = null
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      source?.close()
      setConnected(false)
    }
  }, [hasSession, queryClient])

  const value = useMemo(
    () => ({ connected, subscribeToDepositSuccess }),
    [connected, subscribeToDepositSuccess],
  )

  return (
    <NotificationStreamContext.Provider value={value}>
      {children}
    </NotificationStreamContext.Provider>
  )
}
