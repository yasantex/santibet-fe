import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InformationCircleIcon,
  MultiplicationSignIcon,
} from '@hugeicons/core-free-icons'
import useVerificationStatus, {
  VERIFY_CONTACT_PATH,
} from '../../hooks/useVerificationStatus'
import { KYC_PATH } from '../../utils/authRedirect'

const DISMISS_KEY = 'santibet_verify_reminder_dismissed'
const WALLET_PATH = '/account-wallet'

const readDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Reminder for signed-in users who haven't verified their phone or email.
 * Sign-up and the New Member Bonus don't need it; the first withdrawal does.
 * Dismissing hides it until the browser session ends, except on the wallet
 * page, where it always shows (with ID too) until everything is verified.
 */
const VerifyReminderBanner = () => {
  const {
    signedIn,
    loading,
    emailVerified,
    phoneVerified,
    kycApproved,
    contactVerified,
  } = useVerificationStatus()
  const { pathname } = useLocation()
  const [dismissed, setDismissed] = useState(readDismissed)

  // The wallet is where withdrawals start: there the banner can't be
  // dismissed and also covers ID (KYC), until all three are verified.
  const onWallet = pathname === WALLET_PATH
  const complete = onWallet ? contactVerified && kycApproved : contactVerified

  // Hidden on the profile page, where the verification steps are.
  if (
    !signedIn ||
    loading ||
    complete ||
    (dismissed && !onWallet) ||
    pathname === '/account-profile'
  ) {
    return null
  }

  const missing = [
    !phoneVerified && 'phone number',
    !emailVerified && 'email',
    onWallet && !kycApproved && 'ID',
  ].filter(Boolean) as string[]
  // Only ID left: go straight to the KYC tab.
  const verifyPath = contactVerified ? KYC_PATH : VERIFY_CONTACT_PATH

  const dismiss = () => {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Storage blocked: stays hidden for this page view only.
    }
  }

  return (
    <div
      role='status'
      className='flex items-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-black'
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        size={18}
        className='shrink-0 text-warning'
      />
      <span className='flex-1'>
        <span className='font-semibold'>
          Verify your {missing.join(' and ')}.
        </span>{' '}
        <span className='text-neutral-10'>
          You’ll need a verified phone, email and ID before your first
          withdrawal.{' '}
          <Link
            to={verifyPath}
            className='font-semibold text-black underline underline-offset-2'
          >
            Verify now
          </Link>
        </span>
      </span>
      {!onWallet && (
        <button
          type='button'
          aria-label='Dismiss'
          onClick={dismiss}
          className='shrink-0 rounded-md p-1 hover:bg-warning/20'
        >
          <HugeiconsIcon icon={MultiplicationSignIcon} size={16} />
        </button>
      )}
    </div>
  )
}

export default VerifyReminderBanner
