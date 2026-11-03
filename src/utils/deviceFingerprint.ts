// A stable, random ID for this browser, sent as `X-Device-Fingerprint` on the
// referral click and on account creation. The backend stores it hashed and
// only uses it to catch partners referring themselves.
//
// It's a random ID rather than a hash of browser traits on purpose: traits
// (model, screen, timezone) are shared by thousands of phones and would flag
// innocent players. It lives in localStorage and a cookie so clearing one
// doesn't reset it. On santibet.com the cookie is set on the parent domain,
// so other SantiBet apps (e.g. the partner portal) can send the same ID.

export const DEVICE_FINGERPRINT_HEADER = 'X-Device-Fingerprint'

const STORAGE_KEY = 'santibet_device_id'
const COOKIE_NAME = 'sb_device_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2
const PARENT_DOMAIN = 'santibet.com'
const VALID_ID = /^[A-Za-z0-9-]{16,64}$/

const readCookie = (name: string) => {
  try {
    const match = document.cookie
      .split('; ')
      .find((part) => part.startsWith(`${name}=`))
    return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
  } catch {
    return undefined
  }
}

const cookieDomain = () => {
  const host = window.location.hostname
  return host === PARENT_DOMAIN || host.endsWith(`.${PARENT_DOMAIN}`)
    ? `; domain=.${PARENT_DOMAIN}`
    : ''
}

const writeCookie = (value: string) => {
  try {
    const secure = window.location.protocol === 'https:' ? '; secure' : ''
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}${cookieDomain()}`
  } catch {
    // cookies blocked — localStorage still has it
  }
}

export const randomId = () => {
  try {
    // Only exists on https / localhost.
    return crypto.randomUUID()
  } catch {
    // fall through
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

let cached: string | undefined

export const getDeviceFingerprint = (): string | undefined => {
  if (cached) return cached
  try {
    let stored: string | null | undefined
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = undefined
    }
    const fromCookie = readCookie(COOKIE_NAME)
    const id = [stored, fromCookie].find((v) => v && VALID_ID.test(v)) ?? randomId()

    if (stored !== id) {
      try {
        window.localStorage.setItem(STORAGE_KEY, id)
      } catch {
        // storage unavailable — the cookie still has it
      }
    }
    if (fromCookie !== id) writeCookie(id)

    cached = id
    return id
  } catch {
    return undefined
  }
}

/** Header to spread into a request. Empty if no ID could be made. */
export const deviceFingerprintHeaders = (): Record<string, string> => {
  const id = getDeviceFingerprint()
  return id ? { [DEVICE_FINGERPRINT_HEADER]: id } : {}
}
