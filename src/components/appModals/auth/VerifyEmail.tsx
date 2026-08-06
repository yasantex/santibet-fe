import React from 'react'
import ModalComponent, { type ModalProps } from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'
import { OtpInput } from '../../globals/OtpInput'
import { useFormik } from 'formik'
import type { BaseApiResponse } from '../../../types/types'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { VerifySchema } from '../../../utils/validations'

const VerifyEmail = ({
  open,
  handleClose,
  type,
}: ModalProps & { type: string }) => {
  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { code: string }
  >({
    path: `/auth/verify/${type}/confirm`,
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
    errors,
    touched,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
  } = useFormik({
    initialValues: {
      code: '',
    },
    validationSchema: VerifySchema,
    onSubmit: async (vals) => {
      try {
        await postVerify({
          code: vals.code,
        })
      } catch {}
    },
  })
  return (
    <ModalComponent
      open={open}
      handleClose={handleClose}
      title={`Verify ${type === 'phone' ? 'Phone' : 'Email'}`}
      subtitle={`Enter code to verify ${type === 'phone' ? 'phone' : 'email'} email`}
      className='max-w-105! w-[90%]!'
    >
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

        <Button
          type='submit'
          text={`Verify ${type === 'phone' ? 'Phone' : 'Email'}`}
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
      </form>
    </ModalComponent>
  )
}

export default VerifyEmail
