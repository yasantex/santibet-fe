import { useEffect, useState } from 'react'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { useSantiBetQuery } from '../../../data_layer/utils'
import { useAppSelector } from '../../../utils/hooks'
import {
  PASSKEYS_QUERY_KEY,
  hasPlatformAuthenticator,
  isMobileWeb,
  isPasskeyOfferPending,
  markPasskeyOfferShown,
  passkeyUnlockMethod,
} from '../../../utils/passkeys'
import type { PasskeyListResponse } from '../../../types/passkey.types'
import AddPasskeyModal from './AddPasskeyModal'

// After a password sign-in, offers "Add a passkey for next time" once: only
// when this device can hold a passkey itself (Face ID, fingerprint, Windows
// Hello…) and the player has none yet. "Not now" is remembered.
const PasskeyOffer = () => {
  const { user } = useAppSelector((state) => state.user)
  const [supported] = useState(() => browserSupportsWebAuthn())
  // null until checked. Without a built-in authenticator the browser would
  // only offer "use another device" (QR code) flows, so we don't ask.
  const [platformReady, setPlatformReady] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const pending = !!user && supported && !dismissed && isPasskeyOfferPending()

  useEffect(() => {
    if (!pending) return
    let alive = true
    hasPlatformAuthenticator().then((ok) => {
      if (alive) setPlatformReady(ok)
    })
    return () => {
      alive = false
    }
  }, [pending])

  const { data } = useSantiBetQuery<PasskeyListResponse>({
    path: '/auth/passkeys',
    queryKey: PASSKEYS_QUERY_KEY,
    enabled: pending && platformReady === true,
  })

  const handleClose = () => {
    markPasskeyOfferShown()
    setDismissed(true)
  }

  const method = passkeyUnlockMethod()

  return (
    <AddPasskeyModal
      open={pending && platformReady === true && data?.data.length === 0}
      handleClose={handleClose}
      title={
        isMobileWeb()
          ? 'Sign in faster on this phone'
          : 'Add a passkey for next time'
      }
      subtitle={
        isMobileWeb()
          ? `Next time, sign in with ${method}. No password needed.`
          : `Skip the password. Sign in with ${method} on this computer.`
      }
      cancelText='Not now'
    />
  )
}

export default PasskeyOffer
