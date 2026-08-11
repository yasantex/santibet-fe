import React from 'react'
import { useFormik } from 'formik'

import { isAxiosError } from 'axios'
import { useSantiBetMutation } from '../../../data_layer/utils'
import type { ModalProps } from '../../globals/ModalComponent'
import { showWarningToast } from '../../../utils/toastUtils'
import type { BaseApiResponse } from '../../../types/types'
import { ChangePasswordSchema } from '../../../utils/validations'
import { FormInput } from '../../globals/FormInput'
import ModalComponent from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'

const ChangePassword = ({ open, handleClose }: ModalProps) => {
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
      onSuccess: () => {
        handleClose()
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
      } catch {}
    },
  })

  const handleClosed = () => {
    resetForm()
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleClosed}
      title='Change your password'
      className='max-w-125! w-[90%]!'
    >
      <div className='flex flex-col gap-2.5'>
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
          <button
            type='button'
            onClick={handleClosed}
            className='text-sm text-center text-neutral-10 underline underline-offset-3 cursor-pointer'
          >
            Cancel
          </button>
        </form>
      </div>
    </ModalComponent>
  )
}

export default ChangePassword
