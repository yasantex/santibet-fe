import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { TransferResponse } from '../../types/wallet.types'
import { formatCurrency } from '../../utils/functions'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'

interface TransferToTradingProps extends ModalProps {
  winningsBalance?: string
  currency?: string
}


const TransferToTrading = ({
  open,
  handleClose,
  winningsBalance,
  currency,
}: TransferToTradingProps) => {
  const [step, setStep] = useState<'amount' | 'result'>('amount')
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [result, setResult] = useState<TransferResponse | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!open) return
    setStep('amount')
    setAmount('')
    setAmountError('')
    setResult(null)
  }, [open])

  const { mutateAsync: transfer, isPending } = useSantiBetMutation<
    TransferResponse,
    { amount: string }
  >({
    path: '/wallet/transfer',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    mutationOptions: {
      onSuccess: (data) => {
        setResult(data)
        setStep('result')
        queryClient.invalidateQueries({ queryKey: ['/wallet', {}] })
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

  const handleSubmit = async () => {
    const numeric = Number(amount)
    const available = Number(winningsBalance ?? 0)

    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount')
      return
    }
    if (winningsBalance !== undefined && numeric > available) {
      setAmountError('Amount exceeds your winnings balance')
      return
    }
    setAmountError('')
    try {
      await transfer({ amount })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDone = () => {
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleDone}
      title={
        step === 'amount' ? 'Move Winnings to Trading' : 'Transfer Complete'
      }
      className='max-w-125! w-[90%]!'
    >
      {step === 'amount' && (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-left text-neutral-10'>
            This moves funds from your winnings balance into your trading
            balance.
          </p>

          {winningsBalance !== undefined && (
            <p className='text-xs text-left text-neutral-10'>
              Available: {formatCurrency(winningsBalance, currency)}
            </p>
          )}

          <FormInput
            type='number'
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
            text='Transfer'
            variation='primary'
            size='large'
            className='w-full'
            loading={isPending}
            disabled={isPending}
            onClick={handleSubmit}
          />
        </div>
      )}

      {step === 'result' && result && (
        <div className='flex flex-col items-center gap-4'>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={32}
            className='text-green-600'
          />
          <p className='text-sm text-center text-neutral-10'>
            Your winnings have been moved to your trading balance.
          </p>

          <div className='w-full flex flex-col gap-2 rounded-lg border border-border p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-neutral-10'>Trading</span>
              <span className='font-semibold text-black'>
                {formatCurrency(result.trading, result.currency)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-neutral-10'>Winnings</span>
              <span className='font-semibold text-black'>
                {formatCurrency(result.winnings, result.currency)}
              </span>
            </div>
          </div>

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

export default TransferToTrading
