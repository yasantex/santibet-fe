import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { BaseApiResponse } from '../../types/types'
import { NewPasswordSchema } from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import { OtpInput } from '../../components/globals/OtpInput'

const RecoverPassword = () => {
  // Email or phone number the reset code was sent to (route param), with
  // `?email=` kept as a fallback for older links.
  const { identifier: identifierParam } = useParams<{ identifier?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const identifier = identifierParam || searchParams.get('email') || ''

  const { mutateAsync: postRecover, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { identifier: string; code: string; newPassword: string }
  >({
    path: `/auth/reset-password`,
    mutationOptions: {
      onError: (error) => {
        if (isAxiosError(error)) {
          const errorData = error.response?.data
          showWarningToast(errorData?.message)
        } else {
          showWarningToast(error.message)
        }
      },
      // Resetting signs out every device and returns no tokens — sign in again.
      onSuccess: (data) => {
        showSuccessToast(data?.message)
        navigate('/signin', { replace: true })
      },
    },
  })

  const {
    values,
    handleChange,
    handleBlur,
    errors,
    touched,
    handleSubmit,
    setFieldValue,
    setFieldTouched
  } = useFormik({
    initialValues: {
      code: '',
      newPassword: '',
      identifier,
    },
    validationSchema: NewPasswordSchema,
    onSubmit: async (vals) => {
      try {
        await postRecover({
          identifier,
          code: vals.code,
          newPassword: vals.newPassword,
        })
      } catch {}
    },
  })

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>Reset your password</h1>
      <p className='text-sm text-center text-neutral-10'>
        {identifier
          ? `Enter the code we sent to ${identifier} and your new password.`
          : 'Enter the code we sent you and your new password.'}
      </p>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <OtpInput
          length={6}
          name='code'
          value={values.code}
          hasTitle
          title='Enter Code'
          onChange={(val) => setFieldValue('code', val)}
          onComplete={() => setFieldTouched('code', true)}
          errors={errors.code && touched.code ? errors.code : ''}
        />
        <FormInput
          type='password'
          name='newPassword'
          value={values.newPassword}
          hasTitle
          title='Confirm New Password'
          placeholder='**********'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.newPassword && touched.newPassword ? errors.newPassword : ''
          }
        />

        <Button
          type='submit'
          text='Reset Password'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />

        <p className='text-sm text-center text-neutral-10'>
          Back to
          <Link
            to={`/signin`}
            className='font-semibold text-black underline underline-offset-3'
          >
            {' '}
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}

export default RecoverPassword
