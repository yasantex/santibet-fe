import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { BaseApiResponse } from '../../types/types'
import { ChangePasswordSchema } from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'

const ChangePassword = () => {
  const { mutateAsync: postChangePassword, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { currentPassword: string; newPassword: string }
  >({
    path: `/auth/change-password`,
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

  const {
    values,
    handleChange,
    handleBlur,
    errors,
    touched,
    handleSubmit,
    resetForm,
  } = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
    },
    validationSchema: ChangePasswordSchema,
    onSubmit: async (vals) => {
      try {
        await postChangePassword({
          currentPassword: vals.currentPassword,
          newPassword: vals.newPassword,
        })
        resetForm()
      } catch {}
    },
  })

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>Change your password</h1>
      <p className='text-sm text-center text-neutral-10'>
        Enter your current password and choose a new one.
      </p>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <FormInput
          type='password'
          name='currentPassword'
          value={values.currentPassword}
          hasTitle
          title='Current Password'
          placeholder='**********'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.currentPassword && touched.currentPassword
              ? errors.currentPassword
              : ''
          }
        />
        <FormInput
          type='password'
          name='newPassword'
          value={values.newPassword}
          hasTitle
          title='New Password'
          placeholder='**********'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.newPassword && touched.newPassword
              ? errors.newPassword
              : ''
          }
        />


        <Button
          type='submit'
          text='Change Password'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
      </form>
    </div>
  )
}

export default ChangePassword
