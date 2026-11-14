import { isAxiosError } from 'axios'
import { WebAuthnError } from '@simplewebauthn/browser'

export const PASSKEYS_QUERY_KEY = ['auth', 'passkeys']

// The `code` field the API puts on passkey errors, if any.
export const passkeyErrorCode = (error: unknown): string | undefined =>
  isAxiosError(error) ? error.response?.data?.code : undefined

// The API's own `message` (e.g. "That passkey could not be verified"), if any.
export const passkeyApiMessage = (error: unknown): string | undefined =>
  isAxiosError(error) ? error.response?.data?.message || undefined : undefined

// Challenge ids are single-use and live for five minutes. Either way the
// fix is the same: fetch fresh options and prompt again.
export const isChallengeError = (code?: string) =>
  code === 'PASSKEY_CHALLENGE_SPENT' || code === 'PASSKEY_CHALLENGE_EXPIRED'

// What to tell the player when the browser's passkey prompt throws. Returns
// null for a cancel, timeout or missing authenticator — those stay quiet.
export const browserPromptErrorMessage = (error: unknown): string | null => {
  // Log the real cause in dev — otherwise a failed prompt looks like nothing happened.
  if (import.meta.env.DEV) console.error('[passkey]', error)

  const code = error instanceof WebAuthnError ? error.code : undefined
  const name = error instanceof Error ? error.name : undefined

  if (code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED')
    return 'This device already has a passkey for your account.'
  // The passkey's domain (rpId) doesn't match this site — a setup problem.
  if (
    code === 'ERROR_INVALID_DOMAIN' ||
    code === 'ERROR_INVALID_RP_ID' ||
    name === 'SecurityError'
  )
    return 'Passkeys aren’t available on this site right now. Use another way for now.'
  return null
}

// Default passkey name from the browser and OS, e.g. "Chrome on Mac".
export const defaultPasskeyName = () => {
  const ua = navigator.userAgent

  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /CrOS/.test(ua)
          ? 'ChromeOS'
          : /Mac OS X|Macintosh/.test(ua)
            ? 'Mac'
            : /Windows/.test(ua)
              ? 'Windows'
              : /Linux/.test(ua)
                ? 'Linux'
                : ''

  // Order matters: Edge and Opera UAs also contain "Chrome", Chrome contains "Safari".
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox|FxiOS/.test(ua)
        ? 'Firefox'
        : /Chrome|CriOS/.test(ua)
          ? 'Chrome'
          : /Safari/.test(ua)
            ? 'Safari'
            : ''

  if (browser && os) return `${browser} on ${os}`
  return browser || os || 'My passkey'
}

// Set after a password sign-in so the app can offer "Add a passkey for next
// time" once the player lands. The offer is made once per browser.
const OFFER_PENDING_KEY = 'sb_passkey_offer_pending'
const OFFER_SHOWN_KEY = 'sb_passkey_offer_shown'

export const markPasskeyOfferPending = () => {
  try {
    if (!localStorage.getItem(OFFER_SHOWN_KEY)) {
      sessionStorage.setItem(OFFER_PENDING_KEY, '1')
    }
  } catch {
    // Storage blocked (private mode etc.) — just skip the offer.
  }
}

export const isPasskeyOfferPending = () => {
  try {
    return (
      sessionStorage.getItem(OFFER_PENDING_KEY) === '1' &&
      !localStorage.getItem(OFFER_SHOWN_KEY)
    )
  } catch {
    return false
  }
}

export const markPasskeyOfferShown = () => {
  try {
    sessionStorage.removeItem(OFFER_PENDING_KEY)
    localStorage.setItem(OFFER_SHOWN_KEY, '1')
  } catch {
    // Nothing to persist to; the offer simply may show again.
  }
}

// --- Device-aware wording (SB-048) ---------------------------------------
// Passkey copy names the unlock method the player's own device uses, so a
// phone never sees desktop wording ("Windows Hello", "security key") and
// vice versa.

/** True on a phone or tablet browser, including iPadOS in desktop mode. */
export const isMobileWeb = () => {
  const ua = navigator.userAgent
  return (
    /Android|iPhone|iPad|iPod|Mobile/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  )
}

/** How this device unlocks a passkey, e.g. "Face ID or Touch ID". */
export const passkeyUnlockMethod = () => {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
    return 'Face ID or Touch ID'
  if (/Android/.test(ua)) return 'your fingerprint, face or screen lock'
  if (/Mac OS X|Macintosh/.test(ua)) return 'Touch ID or your Mac password'
  if (/Windows/.test(ua)) return 'Windows Hello (face, fingerprint or PIN)'
  return 'your device’s screen lock'
}

/** One line saying what a passkey does on this device. */
export const passkeyPitch = () =>
  `Sign in with ${passkeyUnlockMethod()} instead of a password.`

/**
 * Whether this device can create a passkey by itself (a built-in
 * authenticator). Without one the browser falls back to "use another device"
 * QR flows, which make no sense to offer unprompted.
 */
export const hasPlatformAuthenticator = async (): Promise<boolean> => {
  try {
    return (
      (await window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.()) ??
      false
    )
  } catch {
    return false
  }
}
