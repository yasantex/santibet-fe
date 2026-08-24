import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
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
import { showWarningToast } from '../../utils/toastUtils'
import { setUser } from '../../redux/userSlice'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import {
  startGoogleOAuth,
  getGoogleOAuthCodeVerifier,
  removeGoogleOAuthCodeVerifier,
} from '../../utils/googleAuth'

type Step = 'identifier' | 'password' | 'otp' | 'setPassword'

interface StartAuthResponse {
  hasPassword: boolean
  codeSent: boolean
}

interface VerifyResponse {
  verificationTicket: string
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

  const [step, setStep] = useState<Step>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [verificationTicket, setVerificationTicket] = useState('')

  const handleAuthSuccess = (data: AuthResponse) => {
    if (data?.mfaRequired) {
      navigate(`/two-fa?authToken=${data?.challengeId}`)
      return
    }
    updateToken({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
    dispatch(setUser(data.user))
    navigate('/')
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
          onSuccess: handleAuthSuccess,
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

  const { mutateAsync: finishGoogleSignIn } = useSantiBetMutation<
    AuthResponse,
    { code: string; redirectUri: string; codeVerifier: string }
  >({
    path: '/auth/google',
    mutationOptions: {
      onSuccess: handleAuthSuccess,
      onError: (error) => {
        showWarningToast(error.message)
        navigate('/signin', { replace: true })
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
      navigate('/signin', { replace: true })
      return
    }

    finishGoogleSignIn({ code, codeVerifier, redirectUri })
      .catch(() => {
        showWarningToast('Google sign-in failed. Please try again.')
        navigate('/signin', { replace: true })
      })
      .finally(() => {
        removeGoogleOAuthCodeVerifier()
      })
  }, [finishGoogleSignIn, navigate])

  const goBackToIdentifier = () => {
    setStep('identifier')
    passwordForm.resetForm()
    otpForm.resetForm()
    setPasswordForm.resetForm()
  }

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-[22px] text-center'>Welcome to Santibet</h1>
      <p className='text-base text-center text-neutral-10'>
        Sign in or create an account to start predicting.
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
              startGoogleOAuth().catch((error) => {
                showWarningToast(error.message)
              })
            }}
          />
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
