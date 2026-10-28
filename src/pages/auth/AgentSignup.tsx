import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useFormik } from 'formik'
import { isAxiosError } from 'axios'
import { useCookies } from 'react-cookie'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import { OtpInput } from '../../components/globals/OtpInput'
import { ErrorText } from '../../components/globals/ReusedText'
import { useConfirmAgentSignup } from '../../data_layer/affiliates'
import type { AgentSignupErrorCode } from '../../types/affiliate.types'
import useUpdateToken from '../../hooks/useUpdateToken'
import useLogout from '../../hooks/useLogout'
import { setUser } from '../../redux/userSlice'
import { useAppDispatch, useAppSelector } from '../../utils/hooks'
import { clearReferralCode } from '../../utils/referral'
import { KYC_PATH } from '../../utils/authRedirect'
import { showSuccessToast } from '../../utils/toastUtils'
import {
  AgentSignupSchema,
  normalizePhoneNumber,
} from '../../utils/validations'

const CODE_LENGTH = 6
const ASK_AGENT = 'ask the agent to send a new one.'

// Errors that belong to one field are shown under it; the rest go in a
// banner above the form.
type FormError = { field: 'code' | 'password'; message: string }
type BannerError = { message: ReactNode }

const describeError = (error: unknown): FormError | BannerError => {
  const data = isAxiosError(error) ? error.response?.data : undefined
  const status = isAxiosError(error) ? error.response?.status : undefined
  const code = data?.code as AgentSignupErrorCode | undefined

  if (code === 'AGENT_CODE_INVALID')
    return { field: 'code', message: 'That code is not right' }
  if (code === 'AGENT_CODE_EXPIRED')
    return { message: `Code expired — ${ASK_AGENT}` }
  if (code === 'AGENT_CODE_ATTEMPTS' || status === 429)
    return { message: `Too many tries — ${ASK_AGENT}` }
  if (code === 'WEAK_PASSWORD')
    return {
      field: 'password',
      message:
        data?.message ||
        'Use at least 8 characters with both letters and numbers',
    }
  if (code === 'PHONE_TAKEN')
    return {
      message: (
        <>
          This number already has an account —{' '}
          <Link
            to='/signin'
            className='font-semibold underline underline-offset-3'
          >
            sign in instead
          </Link>
          .
        </>
      ),
    }
  return {
    message:
      data?.message ||
      (isAxiosError(error) && !error.response
        ? 'Can’t reach SantiBet right now. Check your connection and try again.'
        : 'Something went wrong. Please try again.'),
  }
}

/** Shown when this browser is already signed in to another account. */
const SignedInNotice = () => {
  const { user } = useAppSelector((state) => state.user)
  const { logout } = useLogout()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [signingOut, setSigningOut] = useState(false)
  const name =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    user?.phone

  return (
    <div className='flex w-full flex-col gap-4 rounded-lg bg-card p-5'>
      <p className='text-sm text-black'>
        You’re signed in{name ? ` as ${name}` : ''}. To finish setting up the
        account an agent started for you, sign out first.
      </p>
      <div className='flex flex-col gap-2.5 sm:flex-row'>
        <Button
          type='button'
          text='Sign out and continue'
          variation='primary'
          size='large'
          loading={signingOut}
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true)
            await logout()
            // logout() sends the user home; bring them back here.
            navigate(`${pathname}${search}`, { replace: true })
          }}
        />
        <Button
          type='button'
          text='Go to my account'
          variation='plain'
          size='large'
          onClick={() => navigate('/account')}
        />
      </div>
    </div>
  )
}

/**
 * `/agent-signup` — an agent registered this customer in person; the customer
 * got an SMS with a 6-digit code and a link here, which they open on their own
 * phone to set a password. Success is a completed signup: sign in, go to KYC.
 */
const AgentSignup = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const updateToken = useUpdateToken()
  const [searchParams] = useSearchParams()
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const isSignedIn = Boolean(cookies?.token) && Boolean(user)
  const [banner, setBanner] = useState<ReactNode>(null)

  const { mutateAsync: confirmSignup, isPending } = useConfirmAgentSignup()

  const form = useFormik({
    initialValues: {
      phone: searchParams.get('phone') ?? '',
      code: (searchParams.get('code') ?? '')
        .replace(/\D/g, '')
        .slice(0, CODE_LENGTH),
      password: '',
      acceptTerms: false,
    },
    validationSchema: AgentSignupSchema,
    onSubmit: async (vals, helpers) => {
      setBanner(null)
      try {
        const data = await confirmSignup({
          phone: normalizePhoneNumber(vals.phone),
          code: vals.code,
          password: vals.password,
        })
        // The account was made by the agent, so any stored link code is moot.
        clearReferralCode()
        updateToken({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        dispatch(setUser(data.user))
        showSuccessToast(
          'Your account is ready. Verify your identity to start predicting.',
        )
        navigate(KYC_PATH, { replace: true })
      } catch (error) {
        const result = describeError(error)
        if ('field' in result) {
          helpers.setFieldError(result.field, result.message)
          if (result.field === 'code') helpers.setFieldValue('code', '', false)
        } else {
          setBanner(result.message)
        }
      }
    },
  })

  const fieldError = (name: keyof typeof form.values) =>
    form.errors[name] && form.touched[name] ? String(form.errors[name]) : ''

  return (
    <div className='mx-auto mt-10 flex w-full max-w-100 flex-col items-center justify-center gap-2.5 px-5 md:mt-20 md:max-w-125!'>
      <h1 className='text-center text-[22px] font-bold text-black'>
        Finish setting up your account
      </h1>
      <p className='text-center text-sm text-neutral-10'>
        A SantiBet agent started an account for you. Enter your phone number,
        the 6-digit code we texted you, and choose your own password.
      </p>

      {isSignedIn ? (
        <div className='mt-5 w-full'>
          <SignedInNotice />
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit}
          className='mt-5 flex w-full flex-col gap-5'
          noValidate
        >
          {banner && (
            <div
              role='alert'
              className='rounded-lg bg-error-bg px-4 py-3 text-sm text-error'
            >
              {banner}
            </div>
          )}

          <FormInput
            type='tel'
            name='phone'
            value={form.values.phone}
            hasTitle
            title='Phone number'
            placeholder='e.g. 0803 123 4567'
            autoComplete='tel'
            inputMode='tel'
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            errors={fieldError('phone')}
          />

          <OtpInput
            length={CODE_LENGTH}
            name='code'
            value={form.values.code}
            onChange={(value) => {
              setBanner(null)
              form.setFieldValue('code', value)
            }}
            hasTitle
            title='Code from the SMS'
            autoFocus={false}
            errors={fieldError('code')}
          />

          <FormInput
            type='password'
            name='password'
            value={form.values.password}
            hasTitle
            title='Create a password'
            placeholder='At least 8 characters'
            autoComplete='new-password'
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            errors={fieldError('password')}
            infoElement={
              <span className='text-neutral-10'>
                Use at least 8 characters with both letters and numbers.
              </span>
            }
          />

          <div className='flex flex-col'>
            <div className='flex items-start gap-2'>
              <input
                type='checkbox'
                id='acceptTerms'
                name='acceptTerms'
                checked={form.values.acceptTerms}
                onChange={(e) => {
                  form.setFieldTouched('acceptTerms', true, false)
                  form.setFieldValue('acceptTerms', e.target.checked)
                }}
                className='mt-0.5 h-4 w-4 shrink-0 border-border accent-brand-green'
              />
              <label htmlFor='acceptTerms' className='text-sm text-neutral-10'>
                I agree to the{' '}
                <Link
                  to='/terms-of-service'
                  target='_blank'
                  className='font-semibold text-black underline underline-offset-3'
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to='/privacy-policy'
                  target='_blank'
                  className='font-semibold text-black underline underline-offset-3'
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {fieldError('acceptTerms') && (
              <ErrorText text={fieldError('acceptTerms')} />
            )}
          </div>

          <Button
            type='submit'
            text='Create my account'
            variation='primary'
            size='large'
            loading={isPending}
            disabled={isPending}
          />

          <p className='text-center text-sm text-neutral-10'>
            Didn’t get a code, or it expired? Ask the agent to send a new one.
          </p>
          <p className='-mt-2.5 text-center text-sm text-neutral-10'>
            Already have an account?{' '}
            <Link
              to='/signin'
              className='font-semibold text-black underline underline-offset-3'
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}

export default AgentSignup
