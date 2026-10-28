// Referral codes arrive as `?ref=CODE` on any page, or at `/r/CODE`. The same
// parameter carries a friend's player code and a partner (affiliate) code —
// the backend works out which programme a code belongs to.
//
// Two things are kept until signup finishes:
//
// 1. The referral code — what the signup form's "Referral code" field shows.
//    Pre-filled from the link, editable by the player, sent as `referralCode`.
//    It survives the multi-step signup and the Google OAuth round trip.
//
// 2. The partner code — only a code the backend confirmed on the click
//    (`POST /affiliate/track/click` → `valid`). Kept in a first-party cookie
//    and localStorage for `cookieDays`, last click wins, sent as
//    `affiliateCode`. An unconfirmed code is never stored here.
//
// A wrong or dead code never fails signup, so codes are only trimmed here —
// never validated.

export const REFERRAL_PARAM = 'ref'
export const REFERRAL_HINT =
  'Got a code from a friend or partner? Enter it now — it can’t be added later.'

const REFERRAL_STORAGE_KEY = 'santibet_referral_code'
const AFFILIATE_STORAGE_KEY = 'santibet_affiliate_code'
const AFFILIATE_COOKIE = 'sb_aff'
const TRACKED_STORAGE_KEY = 'santibet_ref_tracked'
const MAX_LENGTH = 200
const DAY_MS = 24 * 60 * 60 * 1000

/** Trims, drops inner spaces and caps the length. Codes are case-insensitive. */
export const normalizeReferralCode = (value?: string | null) =>
  value?.replace(/\s+/g, '').slice(0, MAX_LENGTH) || undefined

// ── Referral code (the form field) ──────────────────────────────────────────

export const rememberReferralCode = (value?: string | null) => {
  const code = normalizeReferralCode(value)
  try {
    if (code) window.localStorage.setItem(REFERRAL_STORAGE_KEY, code)
    else window.localStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // storage unavailable — signup just goes ahead without a code
  }
}

export const getReferralCode = (): string | undefined => {
  try {
    return normalizeReferralCode(
      window.localStorage.getItem(REFERRAL_STORAGE_KEY),
    )
  } catch {
    return undefined
  }
}

// ── Partner code (confirmed on click, sent as affiliateCode) ────────────────

interface StoredAffiliateCode {
  code: string
  expiresAt: number
}

const secureFlag = () =>
  window.location.protocol === 'https:' ? '; secure' : ''

const writeAffiliateCookie = (code: string, maxAgeSeconds: number) => {
  try {
    document.cookie = `${AFFILIATE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${maxAgeSeconds}; samesite=lax${secureFlag()}`
  } catch {
    // cookies blocked — localStorage still has it
  }
}

const readAffiliateCookie = () => {
  try {
    const match = document.cookie
      .split('; ')
      .find((part) => part.startsWith(`${AFFILIATE_COOKIE}=`))
    return match
      ? normalizeReferralCode(
          decodeURIComponent(match.slice(AFFILIATE_COOKIE.length + 1)),
        )
      : undefined
  } catch {
    return undefined
  }
}

export const rememberAffiliateCode = (value: string, cookieDays: number) => {
  const code = normalizeReferralCode(value)
  const days = Number.isFinite(cookieDays) && cookieDays > 0 ? cookieDays : 30
  if (!code) return
  const stored: StoredAffiliateCode = {
    code,
    expiresAt: Date.now() + days * DAY_MS,
  }
  try {
    window.localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // storage unavailable — the cookie still has it
  }
  writeAffiliateCookie(code, Math.round(days * 24 * 60 * 60))
}

const readStoredAffiliateCode = (): string | undefined => {
  try {
    const raw = window.localStorage.getItem(AFFILIATE_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<StoredAffiliateCode>
    if (
      typeof parsed?.code !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(AFFILIATE_STORAGE_KEY)
      return undefined
    }
    return normalizeReferralCode(parsed.code)
  } catch {
    return undefined
  }
}

/** The partner code from the last confirmed link click, if it hasn't expired. */
export const getAffiliateCode = (): string | undefined =>
  readStoredAffiliateCode() ?? readAffiliateCookie()

// ── Click de-duplication ────────────────────────────────────────────────────

/**
 * False when this code was the last one tracked in this tab session, so a
 * refresh or re-render doesn't count the same click twice. Going A → B → A
 * tracks A again, so the last click still wins.
 */
export const markReferralClickTracked = (code: string) => {
  const key = code.toUpperCase()
  try {
    if (window.sessionStorage.getItem(TRACKED_STORAGE_KEY) === key) return false
    window.sessionStorage.setItem(TRACKED_STORAGE_KEY, key)
    return true
  } catch {
    return true
  }
}

// ── After signup ────────────────────────────────────────────────────────────

/** Once signed in, the codes have done their job (only a new account uses them). */
export const clearReferralCode = () => {
  try {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY)
    window.localStorage.removeItem(AFFILIATE_STORAGE_KEY)
  } catch {
    // ignore
  }
  writeAffiliateCookie('', 0)
}

/** What signup sends: the field's value and the stored partner code. */
export const referralSignupFields = (fieldValue?: string | null) => {
  const referralCode = normalizeReferralCode(fieldValue)
  const affiliateCode = getAffiliateCode()
  return {
    ...(referralCode ? { referralCode } : {}),
    ...(affiliateCode ? { affiliateCode } : {}),
  }
}
