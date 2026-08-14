import React, { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'

import { useFormik } from 'formik'
import { isAxiosError } from 'axios'
import { useSantiBetMutation } from '../../../data_layer/utils'
import type { ModalProps } from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'
import { FormInput } from '../../globals/FormInput'
import ModalComponent from '../../globals/ModalComponent'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { RegenerateRecoveryCodesSchema } from '../../../utils/validations'

interface RecoveryCodesResponse {
  recoveryCodes: string[]
}

type Step = 'confirm' | 'codes'

const RegenerateRecoveryCodes = ({ open, handleClose }: ModalProps) => {
  const [step, setStep] = useState<Step>('confirm')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const { mutateAsync: regenerateCodes, isPending } = useSantiBetMutation<
    RecoveryCodesResponse,
    { code: string }
  >({
    path: `/auth/mfa/recovery-codes`,
    mutationOptions: {
      onSuccess: (data) => {
        setRecoveryCodes(data.recoveryCodes)
        setStep('codes')
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
    },
    validationSchema: RegenerateRecoveryCodesSchema,
    onSubmit: async (vals) => {
      try {
        await regenerateCodes({ code: vals.code })
      } catch (error) {
        console.error(error)
      }
    },
  })

  const handleDownloadCodes = () => {
    const content = recoveryCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'santibet-recovery-codes.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showSuccessToast('Recovery codes downloaded')
  }

  const handleClosed = () => {
    resetForm()
    setStep('confirm')
    setRecoveryCodes([])
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleClosed}
      title={
        step === 'confirm'
          ? 'Generate New Recovery Codes'
          : 'Save Your New Recovery Codes'
      }
      className='max-w-125! w-[90%]!'
    >
      {step === 'confirm' && (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='flex flex-col items-center gap-2'>
            <HugeiconsIcon
              icon={Alert02Icon}
              size={28}
              className='text-yellow-600'
            />
            <p className='text-sm text-center text-neutral-10'>
              Generating new recovery codes will permanently invalidate your
              existing codes. Any of your old codes will no longer work. Enter
              your authenticator code to confirm.
            </p>
          </div>

          <FormInput
            type='text'
            name='code'
            value={values.code}
            hasTitle
            title='Verification code'
            placeholder='enter code'
            onChange={handleChange}
            onBlur={handleBlur}
            errors={errors.code && touched.code ? errors.code : ''}
          />

          <Button
            type='submit'
            text='Generate New Codes'
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
      )}

      {step === 'codes' && (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-center text-neutral-10'>
            Save these new recovery codes somewhere safe. Your previous codes no
            longer work, and each new code can only be used once.
          </p>

          <div className='grid grid-cols-2 gap-2 p-4 bg-card rounded-lg border border-border'>
            {recoveryCodes.map((rc) => (
              <span
                key={rc}
                className='text-sm font-mono text-black text-center'
              >
                {rc}
              </span>
            ))}
          </div>

          <Button
            type='button'
            text='Download codes'
            variation='plain'
            size='large'
            className='w-full'
            onClick={handleDownloadCodes}
          />

          <Button
            type='button'
            text='Done'
            variation='primary'
            size='large'
            className='w-full'
            onClick={handleClosed}
          />
        </div>
      )}
    </ModalComponent>
  )
}

export default RegenerateRecoveryCodes
