import { Link, useSearchParams } from 'react-router'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { BaseApiResponse } from '../../types/types'
import { NewPasswordSchema } from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import { Icon } from '../../components/globals/Icon'

const RecoverPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const { mutateAsync: postRecover, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { token: string; password: string; password_comfirmation: string }
  >({
    path: `/auth/recover-password`,
    mutationOptions: {
      onError: (error) => {
        if (isAxiosError(error)) {
          const errorData = error.response?.data
          showWarningToast(errorData?.message)
        } else {
          showWarningToast(error.message)
        }
      },
      onSuccess: (data) => {
        showSuccessToast(data?.message)
      },
    },
  })

  const { values, handleChange, handleBlur, errors, touched, handleSubmit } =
    useFormik({
      initialValues: {
        password: '',
        password_comfirmation: '',
      },
      validationSchema: NewPasswordSchema,
      onSubmit: async (vals) => {
        try {
          await postRecover({
            token,
            password: vals.password,
            password_comfirmation: vals.password_comfirmation,
          })
        } catch {}
      },
    })

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>Reset your password</h1>
      <p className='text-sm text-center text-neutral-10'>
        Enter your new password below.
      </p>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <FormInput
          type='password'
          name='password'
          value={values.password}
          hasTitle
          title='Enter New Password'
          placeholder='**********'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.password && touched.password ? errors.password : ''}
        />
        <FormInput
          type='password'
          name='password_comfirmation'
          value={values.password_comfirmation}
          hasTitle
          title='Confirm New Password'
          placeholder='**********'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.password_comfirmation && touched.password_comfirmation
              ? errors.password_comfirmation
              : ''
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