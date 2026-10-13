import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAppSelector } from '../utils/hooks'
import { useChatwootIdentity } from '../data_layer/support'
import {
  chatwoot,
  isChatwootConfigured,
  loadChatwoot,
  toE164,
} from '../utils/chatwoot'
import { getStoredPreference } from '../utils/theme'
import { showWarningToast } from '../utils/toastUtils'
import type { ReportPrefill } from '../types/support.types'
import ReportIssueModal from '../components/support/ReportIssueModal'
import {
  SupportContext,
  type ChatStatus,
  type SupportContextValue,
} from './supportContext'

// Load the widget after the page has settled so it never competes with the
// first render; a launcher tap before then loads it immediately instead.
const IDLE_LOAD_DELAY_MS = 4000

const scheduleIdle = (fn: () => void) => {
  // Safari has no requestIdleCallback.
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: IDLE_LOAD_DELAY_MS })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, IDLE_LOAD_DELAY_MS)
  return () => clearTimeout(id)
}

/**
 * App-wide customer support: owns the Chatwoot live-chat widget (lazy load,
 * signed identity, logout reset, unread count) and the "Report an issue" form.
 * Pages reach both through `useSupport()`.
 */
const SupportProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.user)
  const suspended = useAppSelector((state) => state.accountStatus.suspended)

  const [chatStatus, setChatStatus] = useState<ChatStatus>('idle')
  const [unreadCount, setUnreadCount] = useState(0)
  const [report, setReport] = useState<{
    open: boolean
    prefill?: ReportPrefill
  }>({
    open: false,
  })
  const chatOpenRef = useRef(false)

  const startLoad = useCallback(() => {
    if (!isChatwootConfigured) return Promise.resolve()
    setChatStatus((s) => (s === 'ready' ? s : 'loading'))
    return loadChatwoot({
      // Follow the in-app theme choice where Chatwoot can: it only supports
      // forced-light or OS-following.
      darkMode: getStoredPreference() === 'light' ? 'light' : 'auto',
    })
      .then(() => setChatStatus('ready'))
      .catch((error) => {
        setChatStatus('error')
        throw error
      })
  }, [])

  // Lazy-load once the page is idle so agent replies (and the unread badge)
  // arrive even if the user never taps the launcher this visit.
  useEffect(() => {
    if (!isChatwootConfigured) return
    return scheduleIdle(() => {
      startLoad().catch(() => {})
    })
  }, [startLoad])

  // Widget events → unread count / open state.
  useEffect(() => {
    if (!isChatwootConfigured) return
    const onMessage = () => {
      // `isOpen` is kept on the SDK object by every widget version; the
      // opened/closed events only exist on newer Chatwoot releases.
      const open = chatOpenRef.current || window.$chatwoot?.isOpen
      if (!open) setUnreadCount((n) => n + 1)
    }
    const onOpened = () => {
      chatOpenRef.current = true
      setUnreadCount(0)
    }
    const onClosed = () => {
      chatOpenRef.current = false
    }
    window.addEventListener('chatwoot:on-message', onMessage)
    window.addEventListener('chatwoot:opened', onOpened)
    window.addEventListener('chatwoot:closed', onClosed)
    return () => {
      window.removeEventListener('chatwoot:on-message', onMessage)
      window.removeEventListener('chatwoot:opened', onOpened)
      window.removeEventListener('chatwoot:closed', onClosed)
    }
  }, [])

  // ── Identity ────────────────────────────────────────────────────────────
  const identityQuery = useChatwootIdentity(isChatwootConfigured && !!user)
  const identity = identityQuery.data
  // Wait for the signed identity (or its failure) so we don't register the
  // contact unverified first and then try to re-identify it. A disabled query
  // (no token cookie) stays pending but idle — treat that as settled too.
  const identitySettled =
    !identityQuery.isPending || identityQuery.fetchStatus === 'idle'
  const identifiedAs = useRef<string | null>(null)

  useEffect(() => {
    if (!isChatwootConfigured) return

    if (!user) {
      // Logged out — or the session was revoked/expired elsewhere. Clear the
      // widget so the next person on this browser starts fresh.
      if (identifiedAs.current) {
        chatwoot.reset()
        identifiedAs.current = null
      }
      return
    }
    if (!identitySettled) return

    const identifier = identity?.identifier ?? user.id
    if (identifiedAs.current && identifiedAs.current !== identifier) {
      chatwoot.reset()
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.displayName ||
      user.name ||
      undefined

    chatwoot.setUser(identifier, {
      email: user.email || undefined,
      name,
      phone_number: toE164(user.phone),
      avatar_url: user.avatarUrl || undefined,
      identifier_hash: identity?.identifierHash,
    })
    identifiedAs.current = identifier
  }, [user, identity, identitySettled])

  // Contact attributes shown to agents in the Chatwoot sidebar. Kept separate
  // from setUser so a status change (e.g. suspension) updates in place.
  useEffect(() => {
    if (!isChatwootConfigured || !user || !identitySettled) return
    chatwoot.setCustomAttributes({
      santibet_user_id: user.id,
      email_verified: user.emailVerified,
      phone_verified: user.phoneVerified,
      mfa_enabled: user.mfaEnabled,
      account_suspended: suspended,
      signed_up_at: user.createdAt,
      platform: 'web',
      ...identity?.customAttributes,
    })
  }, [user, identity, identitySettled, suspended])

  // ── Actions ─────────────────────────────────────────────────────────────
  const openChat = useCallback(() => {
    if (!isChatwootConfigured) {
      navigate('/contact-us')
      return
    }
    setUnreadCount(0)
    // Tell the agent where the user was when they asked for help.
    chatwoot.setCustomAttributes({ last_page_url: window.location.href })
    chatwoot.open()
    startLoad().catch(() => {
      showWarningToast('Live chat is unavailable right now.', {
        label: 'Other ways to reach us',
        onClick: () => navigate('/contact-us'),
      })
    })
  }, [navigate, startLoad])

  const openReport = useCallback((prefill?: ReportPrefill) => {
    setReport({ open: true, prefill })
  }, [])

  const value = useMemo<SupportContextValue>(
    () => ({
      chatAvailable: isChatwootConfigured,
      chatStatus,
      unreadCount,
      openChat,
      openReport,
    }),
    [chatStatus, unreadCount, openChat, openReport],
  )

  return (
    <SupportContext.Provider value={value}>
      {children}
      {report.open && (
        <ReportIssueModal
          prefill={report.prefill}
          onClose={() => setReport({ open: false })}
        />
      )}
    </SupportContext.Provider>
  )
}

export default SupportProvider
