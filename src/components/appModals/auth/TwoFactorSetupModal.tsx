import React, { useState } from 'react'
import ModalComponent, { type ModalProps } from '../../globals/ModalComponent'
import { QRCodeSVG } from 'qrcode.react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Button } from '../../globals/Button'
import { FormInput } from '../../globals/FormInput'
import { useSantiBetMutation } from '../../../data_layer/utils'
import type { TwoFactorEnableResponse } from '../../../types/types'
import { isAxiosError } from 'axios'
import { showSuccessToast } from '../../../utils/toastUtils'
import { useAppDispatch } from '../../../utils/hooks'
import { setEnableTwoFA } from '../../../redux/userSlice'
import { CopyButton } from '../../globals/CopyButton'

interface TwoFactorSetupModalProps extends ModalProps {
  secret: string
  otpauthUri: string
}

type SetupStep = 'scan' | 'verify' | 'backup-codes'

const TwoFactorSetupModal = ({
  open,
  handleClose,
  secret,
  otpauthUri,
}: TwoFactorSetupModalProps) => {
  const [step, setStep] = useState<SetupStep>('scan')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const dispatch = useAppDispatch()

  const { mutateAsync: enableMfa, isPending } = useSantiBetMutation<
    TwoFactorEnableResponse,
    { code: string }
  >({
    path: `/auth/mfa/enable`,
    mutationOptions: {
      onSuccess: (data) => {
        setRecoveryCodes(data.recoveryCodes)
        dispatch(setEnableTwoFA(true))
        setStep('backup-codes')
      },
      onError: (error) => {
        if (isAxiosError(error)) {
          setCodeError(
            (error.response?.data as { message?: string })?.message ||
              'Invalid code',
          )
        } else {
          setCodeError(error.message)
        }
      },
    },
  })

  const handleVerify = async () => {
    if (code.length !== 6) {
      setCodeError('Enter the 6-digit code')
      return
    }
    setCodeError('')
    try {
      await enableMfa({ code })
    } catch (error) {
      console.error(error)
    }
  }

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

  const handleDone = () => {
    setStep('scan')
    setCode('')
    setCodeError('')
    setRecoveryCodes([])
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleDone}
      title={
        step === 'scan'
          ? 'Scan QR Code'
          : step === 'verify'
            ? 'Enter Verification Code'
            : 'Save Your Recovery Codes'
      }
      className='max-w-125! w-[90%]!'
    >
      {step === 'scan' && (
        <div className='flex flex-col items-center gap-4'>
          <p className='text-sm text-center text-neutral-10'>
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </p>

          <QRCodeSVG value={otpauthUri} size={180} />

          <div className='w-full flex flex-col gap-1.5'>
            <span className='text-xs text-neutral-10'>
              Or enter this key manually
            </span>
            <div className='flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border'>
              <p className='text-sm text-neutral-10'>{secret}</p>
              <CopyButton value={secret} />
            </div>
          </div>

          <Button
            type='button'
            text="I've scanned the code"
            variation='primary'
            size='large'
            className='w-full mt-2'
            onClick={() => setStep('verify')}
          />
        </div>
      )}

      {step === 'verify' && (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-center text-neutral-10'>
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>

          <FormInput
            type='text'
            name='code'
            value={code}
            hasTitle
            title='Verification code'
            placeholder='6-digit code'
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(val)
              if (codeError) setCodeError('')
            }}
            onBlur={() => {}}
            errors={codeError}
          />

          <Button
            type='button'
            text='Verify & Enable'
            variation='primary'
            size='large'
            loading={isPending}
            disabled={isPending || code.length !== 6}
            onClick={handleVerify}
          />

          <button
            type='button'
            onClick={() => setStep('scan')}
            className='text-sm text-center text-neutral-10 underline underline-offset-3'
          >
            Back to QR code
          </button>
        </div>
      )}

      {step === 'backup-codes' && (
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col items-center gap-2'>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={32}
              className='text-green-600'
            />
            <p className='text-sm text-center text-neutral-10'>
              Two-factor authentication is now enabled. Save these recovery
              codes somewhere safe — each one can only be used once if you lose
              access to your authenticator.
            </p>
          </div>

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
            onClick={handleDone}
          />
        </div>
      )}
    </ModalComponent>
  )
}

export default TwoFactorSetupModal
