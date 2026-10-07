import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { startRegistration } from '@simplewebauthn/browser'
import { useSantiBetMutation } from '../data_layer/utils'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'
import {
  PASSKEYS_QUERY_KEY,
  browserPromptErrorMessage,
  passkeyErrorCode,
} from '../utils/passkeys'
import type {
  Passkey,
  PasskeyRegisterOptionsResponse,
  PasskeyRegisterVerifyPayload,
} from '../types/passkey.types'

const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  PASSKEY_VERIFICATION_FAILED: 'That didn’t work. Try again.',
  PASSKEY_ALREADY_REGISTERED: 'This passkey is already on an account.',
  PASSKEY_CHALLENGE_SPENT: 'That didn’t work. Try again.',
  PASSKEY_CHALLENGE_EXPIRED: 'That took too long. Try again.',
}

// Options → browser prompt → verify. Every attempt fetches fresh options, so a
// retry after a spent/expired challenge always starts again from step 1.
const usePasskeyRegistration = () => {
  const queryClient = useQueryClient()
  const [isRegistering, setIsRegistering] = useState(false)

  const { mutateAsync: getOptions } =
    useSantiBetMutation<PasskeyRegisterOptionsResponse>({
      path: '/auth/passkeys/register/options',
    })

  const { mutateAsync: verify } = useSantiBetMutation<
    Passkey,
    PasskeyRegisterVerifyPayload
  >({
    path: '/auth/passkeys/register/verify',
  })

  // Resolves with the new passkey, or null if it wasn't added.
  const register = async (name?: string): Promise<Passkey | null> => {
    setIsRegistering(true)
    try {
      const { challengeId, options } = await getOptions({})

      let credential
      try {
        credential = await startRegistration({ optionsJSON: options })
      } catch (error) {
        // Cancelled or no authenticator stays quiet; see browserPromptErrorMessage.
        const message = browserPromptErrorMessage(error)
        if (message) showWarningToast(message)
        return null
      }

      const passkey = await verify({
        challengeId,
        credential,
        name: name?.trim() || undefined,
      })
      queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
      showSuccessToast('Passkey added')
      return passkey
    } catch (error) {
      const code = passkeyErrorCode(error)
      showWarningToast(
        (code && REGISTER_ERROR_MESSAGES[code]) ||
          (isAxiosError(error) ? error.response?.data?.message : null) ||
          'That didn’t work. Try again.',
      )
      return null
    } finally {
      setIsRegistering(false)
    }
  }

  return { register, isRegistering }
}

export default usePasskeyRegistration
