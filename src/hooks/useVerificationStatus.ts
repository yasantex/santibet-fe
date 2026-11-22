import { useSantiBetQuery } from '../data_layer/utils'
import { useAppSelector } from '../utils/hooks'
import type { KycStatusResponse, UserData } from '../types/types'
import { KYC_PATH } from '../utils/authRedirect'

/**
 * Withdrawals of this amount (in naira) or more need a verified phone, email
 * and ID (KYC). Smaller ones need no verification at all.
 */
export const KYC_WITHDRAWAL_THRESHOLD = 500_000

/** Where each verification step is done. */
export const VERIFY_CONTACT_PATH = '/account-profile?tab=verification'

export type VerificationItem = { label: string; to: string }

/** `missing` codes on a 403 VERIFICATION_REQUIRED, as verify links. */
export const VERIFICATION_ITEMS: Record<string, VerificationItem> = {
  PHONE: { label: 'phone number', to: VERIFY_CONTACT_PATH },
  EMAIL: { label: 'email', to: VERIFY_CONTACT_PATH },
  KYC: { label: 'ID', to: KYC_PATH },
}

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
  // The server still refuses an unverified large withdrawal (KYC_REQUIRED);
  // if the KYC status can't be read, don't block here on a guess.
  const kycUnknown = kycQuery.isError

  return {
    signedIn: !!user,
    loading: on && (profileQuery.isLoading || kycQuery.isLoading),
    emailVerified,
    phoneVerified,
    kycApproved,
    contactVerified: emailVerified && phoneVerified,
    /**
     * What's still to verify before withdrawing `amount` (naira): nothing
     * below `threshold`; at or above it, phone, email and ID.
     */
    missingFor: (
      amount: number,
      threshold = KYC_WITHDRAWAL_THRESHOLD,
    ): VerificationItem[] =>
      amount >= threshold
        ? [
            !phoneVerified && VERIFICATION_ITEMS.PHONE,
            !emailVerified && VERIFICATION_ITEMS.EMAIL,
            !kycApproved && !kycUnknown && VERIFICATION_ITEMS.KYC,
          ].filter((m): m is VerificationItem => !!m)
        : [],
  }
}

export default useVerificationStatus
