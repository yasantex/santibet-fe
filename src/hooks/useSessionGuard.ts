import { useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { restoreSession } from '../data_layer/utils'
import { useAppSelector } from '../utils/hooks'

// Refresh this long before the access token expires, so a request sent the
// moment the tab wakes doesn't race the expiry.
const EXPIRY_MARGIN_MS = 60 * 1000

/** The access token's expiry (ms), or null if it isn't a readable JWT. */
const tokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number }
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * Keeps the saved user and the access token cookie in step. The user is
 * persisted with no expiry but the token cookie isn't, so on a phone left
 * open for a while the token can vanish while the header still shows the
 * user — every protected page then bounced to home (Testing Round 1, #1).
 *
 * On load, and whenever the tab becomes visible again (including iOS
 * back/forward cache restores), a missing or nearly-expired token is
 * refreshed; if the refresh token is refused the user is signed out cleanly.
 */
const useSessionGuard = () => {
  const { user } = useAppSelector((state) => state.user)
  const [cookies] = useCookies(['token'], { doNotParse: true })
  const token = cookies?.token as string | undefined
  const signedIn = !!user

  useEffect(() => {
    if (!signedIn) return

    const check = () => {
      if (document.visibilityState !== 'visible') return
      const current = token
      const expiry = current ? tokenExpiry(current) : null
      const needsRefresh =
        !current || (expiry != null && expiry - Date.now() < EXPIRY_MARGIN_MS)
      if (needsRefresh) void restoreSession()
    }

    check()
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) check()
    }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [signedIn, token])
}

export default useSessionGuard
