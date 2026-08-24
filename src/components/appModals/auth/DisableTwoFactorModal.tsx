import React from 'react'
import ModalComponent, { type ModalProps } from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'
import { FormInput } from '../../globals/FormInput'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { useAppDispatch } from '../../../utils/hooks'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../../utils/toastUtils'
import { setEnableTwoFA } from '../../../redux/userSlice'
import type { BaseApiResponse } from '../../../types/types'
import { DisableTwoFactorSchema } from '../../../utils/validations'

const DisableTwoFactorModal = ({ open, handleClose }: ModalProps) => {
  const dispatch = useAppDispatch()

  const { mutateAsync: disableMfa, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { code: string; password: string }
  >({
    path: `/auth/mfa`,
    method: 'DELETE',
    mutationOptions: {
      onSuccess: () => {
        dispatch(setEnableTwoFA(false))
        handleClosed()
      },
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
      code: '',
      password: '',
    },
    validationSchema: DisableTwoFactorSchema,
    onSubmit: async (vals) => {
      try {
        await disableMfa({
          code: vals.code,
          password: vals.password,
        })
      } catch (error) {
        console.error(error)
      }
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
      title='Disable Two-Factor Authentication'
      className='max-w-125! w-[90%]!'
    >
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <p className='text-sm text-center text-neutral-10'>
          This will remove the extra layer of security from your account. Enter
          your authenticator code and password to confirm.
        </p>

        <FormInput
          type='text'
          name='code'
          value={values.code}
          placeholder='enter 6-digit code'
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
            handleChange({ target: { name: 'code', value: val } })
          }}
          onBlur={handleBlur}
          errors={errors.code && touched.code ? errors.code : ''}
        />

        <FormInput
          type='password'
          name='password'
          value={values.password}
          placeholder='enter your password'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.password && touched.password ? errors.password : ''}
        />

        <Button
          type='submit'
          text='Turn Off 2FA'
          variation='primary'
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
    </ModalComponent>
  )
}

export default DisableTwoFactorModal
