import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { BaseApiResponse } from '../../types/types'
import {
  IdentifierSchema,
  identifierChannel,
} from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import { useNavigate, useSearchParams } from 'react-router'
import { AUTH_REDIRECT_PARAM, buildAuthPath } from '../../utils/authRedirect'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mutateAsync: postForgotPassword, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { identifier: string; channel: 'email' | 'sms' }
  >({
    path: `/auth/forgot-password`,
    mutationOptions: {
      onError: (error) => {
        if (isAxiosError(error)) {
          const errorData = error.response?.data
          showWarningToast(errorData?.message)
        } else {
          showWarningToast(error.message)
        }
      },
    },
  })

  const { values, handleChange, handleBlur, errors, touched, handleSubmit } =
    useFormik({
      initialValues: {
        identifier:
          searchParams.get('identifier') ?? searchParams.get('email') ?? '',
      },
      validationSchema: IdentifierSchema,
      onSubmit: async (vals) => {
        try {
          // Always 202 whether or not the account exists, so go straight to
          // the code-entry page.
          const identifier = vals.identifier.trim()
          await postForgotPassword({
            identifier,
            channel: identifierChannel(identifier),
          })
          navigate(`/recover-password/${encodeURIComponent(identifier)}`)
        } catch {}
      },
    })

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>Reset your password</h1>
      <p className='text-sm text-center text-neutral-10'>
        Enter the email address or phone number you registered on SantiBet.
        We&apos;ll send a one-time reset code there — by email or SMS.
      </p>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <FormInput
          type='text'
          name='identifier'
          value={values.identifier}
          hasTitle
          title='Email address or phone number'
          placeholder='email address/phone number'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.identifier && touched.identifier ? errors.identifier : ''
          }
        />

        <Button
          type='submit'
          text='Send Reset Code'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
      </form>
      <Button
        type='button'
        text='Back to Login'
        variation='plain'
        className='mt-2.5'
        size='large'
        onClick={() =>
          navigate(
            buildAuthPath('/signin', searchParams.get(AUTH_REDIRECT_PARAM)),
          )
        }
      />
    </div>
  )
}

export default ForgotPassword
