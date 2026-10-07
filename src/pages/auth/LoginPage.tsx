import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import useUpdateToken from '../../hooks/useUpdateToken'
import { useAppDispatch } from '../../utils/hooks'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { AuthResponse } from '../../types/types'
import {
  IdentifierSchema,
  PasswordOnlySchema,
  CodeSchema,
  SetPasswordSchema,
} from '../../utils/validations'
import { isAxiosError } from 'axios'
import {
  browserSupportsWebAuthn,
  startAuthentication,
} from '@simplewebauthn/browser'
import { HugeiconsIcon } from '@hugeicons/react'
import { FingerPrintIcon } from '@hugeicons/core-free-icons'
import { showWarningToast } from '../../utils/toastUtils'
import { setUser } from '../../redux/userSlice'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import type {
  PasskeyLoginOptionsResponse,
  PasskeyLoginVerifyPayload,
} from '../../types/passkey.types'
import {
  browserPromptErrorMessage,
  isChallengeError,
  markPasskeyOfferPending,
  passkeyApiMessage,
  passkeyErrorCode,
} from '../../utils/passkeys'
import {
  startGoogleOAuth,
  getGoogleOAuthCodeVerifier,
  removeGoogleOAuthCodeVerifier,
} from '../../utils/googleAuth'
import {
  AUTH_REDIRECT_PARAM,
  buildAuthPath,
  clearRememberedAuthRedirect,
  getRememberedAuthRedirect,
  getSafeRedirect,
  rememberAuthRedirect,
} from '../../utils/authRedirect'

type Step = 'identifier' | 'password' | 'otp' | 'setPassword'

interface StartAuthResponse {
  hasPassword: boolean
  codeSent: boolean
}

interface VerifyResponse {
  verificationTicket: string
}

const PASSKEY_TRY_AGAIN =
  'That didn’t work. Try again or sign in with your password.'

// Fallback for when the API sends a code but no message.
const passkeyLoginErrorMessage = (code?: string) => {
  if (code === 'PASSKEY_UNKNOWN')
    return 'We don’t recognise that passkey. Sign in another way and add it again.'
  if (isChallengeError(code)) return 'That took too long. Try again.'
  return PASSKEY_TRY_AGAIN
}

const handleMutationError = (error: unknown) => {
  if (isAxiosError(error)) {
    showWarningToast(error.response?.data?.message)
  } else {
    showWarningToast((error as Error).message)
  }
}

const LoginPage = () => {
  const updateToken = useUpdateToken()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { pathname } = useLocation()

  const [step, setStep] = useState<Step>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [verificationTicket, setVerificationTicket] = useState('')
  const [supportsPasskeys] = useState(() => browserSupportsWebAuthn())
  const [isPasskeySigningIn, setIsPasskeySigningIn] = useState(false)
  // Set synchronously so the first render already shows the loader instead
  // of flashing the normal form before the callback effect below runs.
  const [isGoogleCallback] = useState(() =>
    new URLSearchParams(window.location.search).has('code'),
  )
  // Where to send the user once signed in (e.g. a shared market link). The
  // Google callback lands on bare /signin, so it reads the stashed value.
  const [redirectTo] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return (
      getSafeRedirect(params.get(AUTH_REDIRECT_PARAM)) ??
      (params.has('code') ? getRememberedAuthRedirect() : null)
    )
  })

  const handleAuthSuccess = (data: AuthResponse) => {
    if (data?.mfaRequired) {
      const params = new URLSearchParams({ authToken: data?.challengeId ?? '' })
      if (redirectTo) params.set(AUTH_REDIRECT_PARAM, redirectTo)
      navigate(`/two-fa?${params.toString()}`)
      return
    }
    updateToken({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
    dispatch(setUser(data.user))
    navigate(redirectTo ?? '/', { replace: true })
  }

  // Step 1 — identifier -> /auth/start
  const { mutateAsync: startAuth, isPending: isStarting } = useSantiBetMutation<
    StartAuthResponse,
    { identifier: string }
  >({
    path: '/auth/start',
    mutationOptions: {
      onError: handleMutationError,
      onSuccess: (data) => setStep(data.hasPassword ? 'password' : 'otp'),
    },
  })

  const identifierForm = useFormik({
    initialValues: { identifier: '' },
    validationSchema: IdentifierSchema,
    onSubmit: async (vals) => {
      try {
        setIdentifier(vals.identifier)
        await startAuth({ identifier: vals.identifier })
      } catch (error) {
        console.error(error)
      }
    },
  })

  // Step 2a — returning user -> /auth/login (unchanged endpoint)
  const { mutateAsync: postLogin, isPending: isLoggingIn } =
    useSantiBetMutation<AuthResponse, { identifier: string; password: string }>(
      {
        path: '/auth/login',
        mutationOptions: {
          onError: handleMutationError,
          onSuccess: (data) => {
            // Offer "Add a passkey for next time" once they land in the app.
            if (supportsPasskeys) markPasskeyOfferPending()
            handleAuthSuccess(data)
          },
        },
      },
    )

  const passwordForm = useFormik({
    initialValues: { password: '' },
    validationSchema: PasswordOnlySchema,
    onSubmit: async (vals) => {
      try {
        await postLogin({ identifier, password: vals.password })
      } catch (error) {
        console.error(error)
      }
    },
  })

  // Step 2b — new user -> /auth/verify
  const { mutateAsync: verifyCode, isPending: isVerifying } =
    useSantiBetMutation<VerifyResponse, { identifier: string; code: string }>({
      path: '/auth/verify',
      mutationOptions: {
        onError: handleMutationError,
        onSuccess: (data) => {
          setVerificationTicket(data.verificationTicket)
          setStep('setPassword')
        },
      },
    })

  const otpForm = useFormik({
    initialValues: { code: '' },
    validationSchema: CodeSchema,
    onSubmit: async (vals) => {
      try {
        await verifyCode({ identifier, code: vals.code })
      } catch (error) {
        console.error(error)
      }
    },
  })

  // Step 3 — set password -> /auth/complete (creates account + signs in)
  const { mutateAsync: completeAuth, isPending: isCompleting } =
    useSantiBetMutation<
      AuthResponse,
      { verificationTicket: string; password: string }
    >({
      path: '/auth/complete',
      mutationOptions: {
        onError: handleMutationError,
        onSuccess: handleAuthSuccess,
      },
    })

  const setPasswordForm = useFormik({
    initialValues: { password: '' },
    validationSchema: SetPasswordSchema,
    onSubmit: async (vals) => {
      try {
        await completeAuth({ verificationTicket, password: vals.password })
      } catch (error) {
        console.error(error)
      }
    },
  })

  // Passkey sign-in — options → browser prompt → verify. No identifier: the
  // passkey names the account. Every attempt fetches fresh options, so a
  // spent/expired challenge just means trying again.
  const { mutateAsync: getPasskeyOptions } =
    useSantiBetMutation<PasskeyLoginOptionsResponse>({
      path: '/auth/passkeys/login/options',
    })

  const { mutateAsync: verifyPasskey } = useSantiBetMutation<
    AuthResponse,
    PasskeyLoginVerifyPayload
  >({
    path: '/auth/passkeys/login/verify',
  })

  const handlePasskeySignIn = async () => {
    setIsPasskeySigningIn(true)
    try {
      const { challengeId, options } = await getPasskeyOptions({})

      let credential
      try {
        credential = await startAuthentication({ optionsJSON: options })
      } catch (error) {
        // Cancelled or no passkey on this device stays quiet; a setup problem
        // (e.g. rpId not matching this domain) gets a message.
        const message = browserPromptErrorMessage(error)
        if (message) showWarningToast(message)
        return
      }

      // Same shape as /auth/login; mfaRequired is always false (a passkey
      // counts as two-factor on its own).
      handleAuthSuccess(await verifyPasskey({ challengeId, credential }))
    } catch (error) {
      showWarningToast(
        passkeyApiMessage(error) ??
          passkeyLoginErrorMessage(passkeyErrorCode(error)),
      )
    } finally {
      setIsPasskeySigningIn(false)
    }
  }

  const { mutateAsync: finishGoogleSignIn } = useSantiBetMutation<
    AuthResponse,
    { code: string; redirectUri: string; codeVerifier: string }
  >({
    path: '/auth/google',
    mutationOptions: {
      onSuccess: handleAuthSuccess,
      onError: (error) => {
        showWarningToast(error.message)
        navigate(buildAuthPath('/signin', redirectTo), { replace: true })
      },
    },
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (!code) return

    const codeVerifier = getGoogleOAuthCodeVerifier()
    const redirectUri = `${window.location.origin}${window.location.pathname}`

    if (!codeVerifier) {
      showWarningToast('Google sign-in failed. Please try again.')
      navigate(buildAuthPath('/signin', redirectTo), { replace: true })
      return
    }

    finishGoogleSignIn({ code, codeVerifier, redirectUri })
      .catch(() => {
        showWarningToast('Google sign-in failed. Please try again.')
        navigate(buildAuthPath('/signin', redirectTo), { replace: true })
      })
      .finally(() => {
        removeGoogleOAuthCodeVerifier()
        clearRememberedAuthRedirect()
      })
  }, [finishGoogleSignIn, navigate, redirectTo])

  // Pre-fill the reset form with the email/phone they signed in with, and keep the
  // post-login redirect so they still land where they were headed.
  const forgotPasswordPath = (() => {
    const params = new URLSearchParams()
    if (identifier) params.set('identifier', identifier)
    if (redirectTo) params.set(AUTH_REDIRECT_PARAM, redirectTo)
    const query = params.toString()
    return `/forgot-password${query ? `?${query}` : ''}`
  })()

  const goBackToIdentifier = () => {
    setStep('identifier')
    passwordForm.resetForm()
    otpForm.resetForm()
    setPasswordForm.resetForm()
  }

  if (isGoogleCallback) {
    return (
      <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-4'>
        <span className='h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent' />
        <p className='text-sm text-center text-neutral-10'>
          Signing you in with Google…
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-[22px] text-center'>
        {pathname === '/signin' ? 'Welcome back' : 'Welcome to Santibet'}
      </h1>
      <p className='text-base text-center text-neutral-10'>
        {pathname === '/signin'
          ? 'Sign in to continue predicting.'
          : 'Create an account to start predicting.'}
      </p>
      {step === 'identifier' && (
        <>
          <Button
            type='button'
            text='Continue with Google'
            variation='plain'
            size='large'
            icon='google-icon'
            iconClassName='mb-1'
            onClick={() => {
              rememberAuthRedirect(redirectTo)
              startGoogleOAuth().catch((error) => {
                showWarningToast(error.message)
              })
            }}
          />
          {/* Sign-in only: a passkey can't create an account. */}
          {supportsPasskeys && pathname === '/signin' && (
            <Button
              type='button'
              text={
                <span className='flex items-center gap-2.5'>
                  <HugeiconsIcon icon={FingerPrintIcon} size={18} />
                  {isPasskeySigningIn
                    ? 'Waiting for your passkey…'
                    : 'Sign in with a passkey'}
                </span>
              }
              variation='plain'
              size='large'
              disabled={isPasskeySigningIn}
              onClick={handlePasskeySignIn}
            />
          )}
          <div className='flex items-center w-full gap-2.5 mt-2.5 text-sm text-neutral-10'>
            <span className='flex-1 h-px bg-border' />
            OR
            <span className='flex-1 h-px bg-border' />
          </div>
          <form
            onSubmit={identifierForm.handleSubmit}
            className='w-full flex flex-col my-5 gap-5'
          >
            <FormInput
              type='text'
              name='identifier'
              value={identifierForm.values.identifier}
              placeholder='email address/phone number'
              onChange={identifierForm.handleChange}
              onBlur={identifierForm.handleBlur}
              errors={
                identifierForm.errors.identifier &&
                identifierForm.touched.identifier
                  ? identifierForm.errors.identifier
                  : ''
              }
            />
            <Button
              type='submit'
              text='Continue'
              variation='primary'
              size='large'
              loading={isStarting}
              disabled={isStarting}
            />
          </form>
        </>
      )}

      {step === 'password' && (
        <form
          onSubmit={passwordForm.handleSubmit}
          className='w-full flex flex-col mt-5 gap-5'
        >
          <FormInput
            type='password'
            name='password'
            value={passwordForm.values.password}
            placeholder='Enter your password'
            onChange={passwordForm.handleChange}
            onBlur={passwordForm.handleBlur}
            errors={
              passwordForm.errors.password && passwordForm.touched.password
                ? passwordForm.errors.password
                : ''
            }
          />
          <Link
            to={forgotPasswordPath}
            className='-mt-2.5 self-end text-sm font-semibold text-black underline underline-offset-3'
          >
            Forgot password?
          </Link>
          <Button
            type='submit'
            text='Sign In'
            variation='primary'
            size='large'
            loading={isLoggingIn}
            disabled={isLoggingIn}
          />
          <button
            type='button'
            onClick={goBackToIdentifier}
            className='text-sm text-center text-neutral-10 cursor-pointer underline underline-offset-3'
          >
            Use a different email or phone number
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form
          onSubmit={otpForm.handleSubmit}
          className='w-full flex flex-col mt-5 gap-5'
        >
          <p className='text-sm text-neutral-10'>
            Enter the code sent to {identifier}
          </p>
          <FormInput
            type='text'
            name='code'
            value={otpForm.values.code}
            placeholder='6-digit code'
            onChange={otpForm.handleChange}
            onBlur={otpForm.handleBlur}
            errors={
              otpForm.errors.code && otpForm.touched.code
                ? otpForm.errors.code
                : ''
            }
          />
          <Button
            type='submit'
            text='Verify'
            variation='primary'
            size='large'
            loading={isVerifying}
            disabled={isVerifying}
          />
          <button
            type='button'
            onClick={goBackToIdentifier}
            className='text-sm text-center text-neutral-10 underline cursor-pointer underline-offset-3'
          >
            Use a different email or phone number
          </button>
        </form>
      )}

      {step === 'setPassword' && (
        <form
          onSubmit={setPasswordForm.handleSubmit}
          className='w-full flex flex-col mt-5 gap-5'
        >
          <p className='text-sm text-neutral-10'>
            Create a password to finish setting up your account
          </p>
          <FormInput
            type='password'
            name='password'
            value={setPasswordForm.values.password}
            placeholder='must be at least 8 characters'
            onChange={setPasswordForm.handleChange}
            onBlur={setPasswordForm.handleBlur}
            errors={
              setPasswordForm.errors.password &&
              setPasswordForm.touched.password
                ? setPasswordForm.errors.password
                : ''
            }
          />
          <Button
            type='submit'
            text='Create account'
            variation='primary'
            size='large'
            loading={isCompleting}
            disabled={isCompleting}
          />
        </form>
      )}
    </div>
  )
}

export default LoginPage
