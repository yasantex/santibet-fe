import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { BaseApiResponse } from '../../types/types'
import { ForgotPasswordSchema } from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import { useNavigate } from 'react-router'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const {
    mutateAsync: postForgotPassword,
    isPending,
    isSuccess,
  } = useSantiBetMutation<BaseApiResponse, { email: string }>({
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
        email: '',
      },
      validationSchema: ForgotPasswordSchema,
      onSubmit: async (vals) => {
        try {
          await postForgotPassword({ email: vals.email })
        } catch {}
      },
    })

  return (
    <>
      !isSuccess ? (
      <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
        <h1 className='text-black font-bold text-center'>
          Reset your password
        </h1>
        <p className='text-sm text-center text-neutral-10'>
          Please enter the email address that you registered on SantiBet. We
          will send you a one-time password reset link at this address.
        </p>

        <form
          // onSubmit={handleSubmit}
          className='w-full flex flex-col gap-2.5 mt-2.5'
        >
          <FormInput
            type='text'
            name='email'
            value={values.email}
            hasTitle
            title='Email address'
            placeholder='email address'
            onChange={handleChange}
            onBlur={handleBlur}
            errors={errors.email && touched.email ? errors.email : ''}
          />

          <Button
            type='submit'
            text='Send Reset Link'
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
          onClick={() => navigate('/signin')}
        />
      </div>
      ) : (
      <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
        <h1 className='text-black font-bold text-center'>Check your email</h1>
        <p className='text-sm text-center text-neutral-10'>
          If a matching SantiBet account was found, an email with password reset
          instructions was sent to:
        </p>
        <p className='text-sm font-bold text-center text-black break-all'>
          {values.email}
        </p>

        <p className='text-sm font-semibold text-neutral-10'>
          Didn&apos;t receive an email?{' '}
          <span className='font-semibold text-black underline underline-offset-3 cursor-pointer'>
            Contact support
          </span>
        </p>
      </div>
      )
    </>
  )
}

export default ForgotPassword
