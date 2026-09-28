// Carries a "return to" path through the sign-in / sign-up flow so users who
// land on a shared link (e.g. /markets/:id?outcome=...) come back to it after
// authenticating.

export const AUTH_REDIRECT_PARAM = 'redirect'
const AUTH_REDIRECT_STORAGE_KEY = 'santibet_auth_redirect'

const AUTH_PATHS = [
  '/signin',
  '/signup',
  '/two-fa',
  '/forgot-password',
  '/recover-password',
]

export const isAuthPath = (pathname: string) =>
  AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

// Only same-origin, non-auth paths are allowed — anything else would be an
// open redirect or a sign-in loop.
export const getSafeRedirect = (value?: string | null) => {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\'))
    return null
  const pathname = value.split(/[?#]/)[0]
  if (isAuthPath(pathname)) return null
  return value
}

export const buildAuthPath = (
  base: '/signin' | '/signup',
  returnTo?: string | null,
) => {
  const safe = getSafeRedirect(returnTo)
  if (!safe || safe === '/') return base
  return `${base}?${AUTH_REDIRECT_PARAM}=${encodeURIComponent(safe)}`
}

// Google OAuth returns to a fixed redirect_uri (/signin) without our query
// string, so the target is parked in sessionStorage across the round trip.
export const rememberAuthRedirect = (value?: string | null) => {
  const safe = getSafeRedirect(value)
  try {
    if (safe) window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, safe)
    else window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
  } catch {
    // storage unavailable — fall back to the default landing page
  }
}

export const getRememberedAuthRedirect = () => {
  try {
    return getSafeRedirect(
      window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY),
    )
  } catch {
    return null
  }
}

export const clearRememberedAuthRedirect = () => {
  try {
    window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
