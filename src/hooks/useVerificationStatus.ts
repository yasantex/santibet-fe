import { useSantiBetQuery } from '../data_layer/utils'
import { useAppSelector } from '../utils/hooks'
import type { KycStatusResponse, UserData } from '../types/types'

/** Where each verification step is done. */
export const VERIFY_CONTACT_PATH = '/account-profile?tab=verification'

/**
 * Phone, email and ID (KYC) verification for the signed-in user. Reads the
 * same `/auth/me` and `kyc` queries as the profile page, so verifying there
 * updates every reader.
 */
const useVerificationStatus = (enabled = true) => {
  const { user } = useAppSelector((state) => state.user)
  const on = !!user && enabled

  const profileQuery = useSantiBetQuery<UserData>({
    path: '/auth/me',
    enabled: on,
  })
  const kycQuery = useSantiBetQuery<KycStatusResponse>({
    path: 'kyc',
    enabled: on,
  })

  const profile = profileQuery.data ?? user
  const emailVerified = !!profile?.emailVerified
  const phoneVerified = !!profile?.phoneVerified
  const kycApproved = kycQuery.data?.status === 'APPROVED'
  // The server still refuses an unverified withdrawal (KYC_REQUIRED); if the
  // KYC status can't be read, don't block here on a guess.
  const kycUnknown = kycQuery.isError

  return {
    signedIn: !!user,
    loading: on && (profileQuery.isLoading || kycQuery.isLoading),
    emailVerified,
    phoneVerified,
    kycApproved,
    contactVerified: emailVerified && phoneVerified,
    canWithdraw:
      emailVerified && phoneVerified && (kycApproved || kycUnknown),
  }
}

export default useVerificationStatus
