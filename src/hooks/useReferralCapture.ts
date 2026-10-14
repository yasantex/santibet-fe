import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '../utils/hooks'
import { REFERRAL_PARAM, rememberReferralCode } from '../utils/referral'

/**
 * Keeps a `?ref=CODE` from any landing page until signup finishes. Ignored for
 * a signed-in visitor — a code only counts for a brand-new account.
 */
const useReferralCapture = () => {
  const [searchParams] = useSearchParams()
  const signedIn = useAppSelector((state) => !!state.user.user)
  const code = searchParams.get(REFERRAL_PARAM)

  useEffect(() => {
    if (!signedIn && code) rememberReferralCode(code)
  }, [signedIn, code])
}

export default useReferralCapture
