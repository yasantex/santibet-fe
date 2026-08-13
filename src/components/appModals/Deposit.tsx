import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useSantiBetMutation } from '../../data_layer/utils'
import type {
  StartDepositResponse,
  DepositRecord,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '../../utils/functions'
import { CopyButton } from '../globals/CopyButton'

type DepositStep = 'amount' | 'instructions' | 'result'

const Deposit = ({ open, handleClose }: ModalProps) => {
  const [step, setStep] = useState<DepositStep>('amount')
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [startResponse, setStartResponse] =
    useState<StartDepositResponse | null>(null)
  const [verifyResult, setVerifyResult] = useState<DepositRecord | null>(null)
  const queryClient = useQueryClient()

  const { mutateAsync: startDeposit, isPending: isStarting } =
    useSantiBetMutation<StartDepositResponse, { amount: string }>({
      path: '/wallet/deposits',
      mutationOptions: {
        onSuccess: (data) => {
          setStartResponse(data)
          setStep('instructions')
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

  const depositId = startResponse?.deposit.id ?? ''

  const { mutateAsync: verifyDeposit, isPending: isVerifying } =
    useSantiBetMutation<DepositRecord, void>({
      path: `/wallet/deposits/${depositId}/verify`,
      mutationOptions: {
        onSuccess: (data) => {
          setVerifyResult(data)
          if (data.status === 'PENDING') {
            showWarningToast(
              "We haven't received your payment yet. Try again in a moment.",
            )
            return
          }
          if (data.status === 'SUCCESS') {
            queryClient.invalidateQueries({ queryKey: ['/wallet', {}] })
            queryClient.invalidateQueries({
              queryKey: ['wallet-transactions'],
            })
          }
          setStep('result')
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

  const handleAmountSubmit = async () => {
    const numeric = Number(amount)
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount')
      return
    }
    if (numeric < 10000) {
      setAmountError('Enter must be greater then 10000')
      return
    }
    setAmountError('')
    try {
      await startDeposit({ amount })
    } catch (error) {
      console.error(error)
    }
  }


  const handleIvePaid = async () => {
    try {
      await verifyDeposit()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDone = () => {
    setStep('amount')
    setAmount('')
    setAmountError('')
    setStartResponse(null)
    setVerifyResult(null)
    handleClose()
  }

  useEffect(() => {
    if (!open) return
    setStep('amount')
    setAmount('')
    setAmountError('')
    setStartResponse(null)
    setVerifyResult(null)
  }, [open])

  const instructions = startResponse?.instructions

  return (
    <ModalComponent
      open={open}
      handleClose={handleDone}
      title={
        step === 'amount'
          ? 'Deposit Funds'
          : step === 'instructions'
            ? 'Complete Your Deposit'
            : verifyResult?.status === 'SUCCESS'
              ? 'Deposit Successful'
              : 'Deposit Failed'
      }
      className='max-w-125! w-[90%]!'
    >
      {step === 'amount' && (
        <div className='flex flex-col gap-4'>
          <FormInput
            type='text'
            name='amount'
            value={amount}
            hasTitle
            title='Amount'
            placeholder='Enter amount'
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d.]/g, '')
              setAmount(val)
              if (amountError) setAmountError('')
            }}
            onBlur={() => {}}
            errors={amountError}
          />
          <Button
            type='button'
            text='Continue'
            variation='primary'
            size='large'
            className='w-full'
            loading={isStarting}
            disabled={isStarting}
            onClick={handleAmountSubmit}
          />
        </div>
      )}

      {step === 'instructions' && instructions && (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-left text-neutral-10'>
            Transfer the exact amount to the account below, then tap
            &quot;I&apos;ve paid&quot; to confirm.
          </p>

          <div className='flex flex-col gap-2.5 rounded-lg border border-border p-4'>
            {[
              { label: 'Amount', value: startResponse?.deposit.amount },
              { label: 'Bank', value: instructions.bankName },
              { label: 'Account Number', value: instructions.accountNumber },
              { label: 'Account Name', value: instructions.accountName },
              { label: 'Reference', value: instructions.reference },
            ].map((row) => (
              <div
                key={row.label}
                className='flex items-center justify-between gap-3'
              >
                <div className='flex flex-col'>
                  <span className='text-xs text-neutral-10'>{row.label}</span>
                  <span className='text-sm font-semibold text-black'>
                    {row.value}
                  </span>
                </div>
                <CopyButton value={row.value} />
              </div>
            ))}
          </div>

          <p className='text-xs text-center text-neutral-10'>
            Expires {formatDate(instructions.expiresAt)}{' '}
          </p>

          <Button
            type='button'
            text="I've paid"
            variation='primary'
            size='large'
            className='w-full'
            loading={isVerifying}
            disabled={isVerifying}
            onClick={handleIvePaid}
          />
        </div>
      )}

      {step === 'result' && verifyResult && (
        <div className='flex flex-col items-center gap-4'>
          <HugeiconsIcon
            icon={
              verifyResult.status === 'SUCCESS'
                ? CheckmarkCircle02Icon
                : AlertCircleIcon
            }
            size={32}
            className={
              verifyResult.status === 'SUCCESS' ? 'text-success' : 'text-error'
            }
          />
          <p className='text-sm text-center text-neutral-10'>
            {verifyResult.status === 'SUCCESS'
              ? 'Your deposit has been credited to your wallet.'
              : verifyResult.failureReason ||
                'This deposit could not be completed.'}
          </p>
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

export default Deposit
