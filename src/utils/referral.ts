// A friend's referral code arrives as `?ref=CODE` on any page (the backend's
// share link points at `/`). It's parked in localStorage so it survives the
// multi-step signup and the Google OAuth round trip, then sent as
// `referralCode` on /auth/complete or /auth/google. A wrong or missing code
// never fails signup, so it's only trimmed — never validated here.

export const REFERRAL_PARAM = 'ref'
const REFERRAL_STORAGE_KEY = 'santibet_referral_code'
const MAX_LENGTH = 200

export const rememberReferralCode = (value?: string | null) => {
  const code = value?.trim().slice(0, MAX_LENGTH)
  if (!code) return
  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, code)
  } catch {
    // storage unavailable — signup just goes ahead without a code
  }
}

export const getReferralCode = (): string | undefined => {
  try {
    return window.localStorage.getItem(REFERRAL_STORAGE_KEY)?.trim() || undefined
  } catch {
    return undefined
  }
}

export const clearReferralCode = () => {
  try {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // ignore
  }
}
