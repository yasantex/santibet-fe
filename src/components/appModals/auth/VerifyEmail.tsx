import { useState } from 'react'
import ModalComponent, { type ModalProps } from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'
import { FormInput } from '../../globals/FormInput'
import { OtpInput } from '../../globals/OtpInput'
import { useFormik } from 'formik'
import type { BaseApiResponse } from '../../../types/types'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import {
  VerifySchema,
  VerifyEmailRequestSchema,
  VerifyPhoneRequestSchema,
} from '../../../utils/validations'

type VerifyType = 'email' | 'phone'

const VerifyEmail = ({
  open,
  handleClose,
  type,
  defaultValue,
  refetch,
}: ModalProps & { type: VerifyType; defaultValue?: string | null; refetch: () => void }) => {
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const isPhone = type === 'phone'

  const { mutateAsync: requestVerification, isPending: isRequesting } =
    useSantiBetMutation<BaseApiResponse, { email?: string; phone?: string }>({
      path: `/auth/verify/${type}/request`,
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
          setStep('otp')
        },
      },
    })

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
        handleClosed()
        refetch()
      },
    },
  })

  const inputForm = useFormik({
    initialValues: {
      value: defaultValue ?? '',
    },
    validationSchema: isPhone
      ? VerifyPhoneRequestSchema
      : VerifyEmailRequestSchema,
    enableReinitialize: true,
    onSubmit: async (vals) => {
      try {
        await requestVerification(
          isPhone ? { phone: vals.value } : { email: vals.value },
        )
      } catch {}
    },
  })

  const otpForm = useFormik({
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

  const handleClosed = () => {
    setStep('input')
    inputForm.resetForm()
    otpForm.resetForm()
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleClosed}
      title={`Verify ${isPhone ? 'Phone' : 'Email'}`}
      subtitle={
        step === 'input'
          ? `Enter the ${isPhone ? 'phone number' : 'email address'} you want to verify`
          : `Enter the code sent to your ${isPhone ? 'phone' : 'email'}`
      }
      className='max-w-105! w-[90%]!'
    >
      {step === 'input' && (
        <form
          onSubmit={inputForm.handleSubmit}
          className='w-full flex flex-col gap-2.5 mt-2.5'
        >
          <FormInput
            type={'text'}
            name='value'
            value={inputForm.values.value}
            placeholder={isPhone ? 'Phone number' : 'Email address'}
            onChange={inputForm.handleChange}
            onBlur={inputForm.handleBlur}
            errors={
              inputForm.errors.value && inputForm.touched.value
                ? inputForm.errors.value
                : ''
            }
          />

          <Button
            type='submit'
            text='Send Code'
            variation='primary'
            className='mt-2.5'
            size='large'
            loading={isRequesting}
            disabled={isRequesting}
          />
        </form>
      )}

      {step === 'otp' && (
        <form
          onSubmit={otpForm.handleSubmit}
          className='w-full flex flex-col gap-2.5 mt-2.5'
        >
          <OtpInput
            length={6}
            name='code'
            value={otpForm.values.code}
            hasTitle
            title='Enter Code'
            onChange={(val) => otpForm.setFieldValue('code', val)}
            onComplete={() => otpForm.setFieldTouched('code', true)}
            errors={
              otpForm.errors.code && otpForm.touched.code
                ? otpForm.errors.code
                : ''
            }
          />

          <Button
            type='submit'
            text={`Verify ${isPhone ? 'Phone' : 'Email'}`}
            variation='primary'
            className='mt-2.5'
            size='large'
            loading={isPending}
            disabled={isPending}
          />
        </form>
      )}
    </ModalComponent>
  )
}

export default VerifyEmail