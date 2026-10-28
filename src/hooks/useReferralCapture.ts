import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '../utils/hooks'
import {
  REFERRAL_PARAM,
  markReferralClickTracked,
  normalizeReferralCode,
  rememberAffiliateCode,
  rememberReferralCode,
} from '../utils/referral'
import { trackReferralClick } from '../data_layer/affiliates'

/**
 * Picks up `?ref=CODE` on any page (`/r/CODE` redirects here too) and keeps it
 * until signup finishes. Ignored for a signed-in visitor — a code only counts
 * for a brand-new account.
 *
 * The code always pre-fills the signup form's Referral code field (a friend's
 * code still works from there). It's also recorded as a click with the
 * backend, and only if the backend confirms it as a partner code is it kept
 * as the partner cookie for `cookieDays` (last click wins). The click never
 * blocks navigation and a failure is silent.
 */
const useReferralCapture = () => {
  const [searchParams] = useSearchParams()
  const signedIn = useAppSelector((state) => !!state.user.user)
  const code = normalizeReferralCode(searchParams.get(REFERRAL_PARAM))
  const utmSource = searchParams.get('utm_source') ?? undefined
  const utmMedium = searchParams.get('utm_medium') ?? undefined
  const utmCampaign = searchParams.get('utm_campaign') ?? undefined

  useEffect(() => {
    if (signedIn || !code) return
    rememberReferralCode(code)

    if (!markReferralClickTracked(code)) return
    trackReferralClick({
      code,
      landingUrl: window.location.href,
      utmSource,
      utmMedium,
      utmCampaign,
    })
      .then((result) => {
        if (result?.valid) {
          rememberAffiliateCode(result.code ?? code, result.cookieDays ?? 30)
        }
      })
      .catch(() => {
        // Rate-limited or offline — the field still carries the code.
      })
  }, [signedIn, code, utmSource, utmMedium, utmCampaign])
}

export default useReferralCapture
