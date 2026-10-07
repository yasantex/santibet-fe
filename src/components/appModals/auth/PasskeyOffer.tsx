import { useState } from 'react'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { useSantiBetQuery } from '../../../data_layer/utils'
import { useAppSelector } from '../../../utils/hooks'
import {
  PASSKEYS_QUERY_KEY,
  isPasskeyOfferPending,
  markPasskeyOfferShown,
} from '../../../utils/passkeys'
import type { PasskeyListResponse } from '../../../types/passkey.types'
import AddPasskeyModal from './AddPasskeyModal'

// After a password sign-in, offers "Add a passkey for next time" once — only
// on a browser that supports passkeys and only if the player has none yet.
const PasskeyOffer = () => {
  const { user } = useAppSelector((state) => state.user)
  const [supported] = useState(() => browserSupportsWebAuthn())
  const [dismissed, setDismissed] = useState(false)

  const pending = !!user && supported && !dismissed && isPasskeyOfferPending()

  const { data } = useSantiBetQuery<PasskeyListResponse>({
    path: '/auth/passkeys',
    queryKey: PASSKEYS_QUERY_KEY,
    enabled: pending,
  })

  const handleClose = () => {
    markPasskeyOfferShown()
    setDismissed(true)
  }

  return (
    <AddPasskeyModal
      open={pending && data?.data.length === 0}
      handleClose={handleClose}
      title='Add a passkey for next time'
      subtitle='Skip the password — sign in with Face ID, fingerprint or your device PIN.'
      cancelText='Not now'
    />
  )
}

export default PasskeyOffer
