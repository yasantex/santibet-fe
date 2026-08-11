import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useSantiBetMutation, useSantiBetQuery } from '../../data_layer/utils'
import type {
  WithdrawalAccountsListResponse,
  WithdrawalRecord,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate, formatCurrency } from '../../utils/functions'

type WithdrawStep = 'amount' | 'result'

const Withdraw = ({ open, handleClose }: ModalProps) => {
  const [step, setStep] = useState<WithdrawStep>('amount')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [withdrawalId, setWithdrawalId] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(false)
  const queryClient = useQueryClient()

  const { data: accountsData } =
    useSantiBetQuery<WithdrawalAccountsListResponse>({
      path: '/wallet/withdrawal-accounts',
      queryKey: ['withdrawal-accounts'],
      enabled: open,
    })

  const verifiedAccounts = (accountsData?.data ?? []).filter((a) => a.verified)

  useEffect(() => {
    if (!open) return
    setStep('amount')
    setAmount('')
    setAmountError('')
    setWithdrawalId('')
    setCheckingStatus(false)
    setSelectedAccountId(verifiedAccounts[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountsData])

  const {
    mutateAsync: requestWithdrawal,
    isPending,
    data: withdrawalResult,
  } = useSantiBetMutation<
    WithdrawalRecord,
    { amount: string; paymentMethodId: string }
  >({
    path: '/wallet/withdrawals',
    mutationOptions: {
      onSuccess: (data) => {
        setWithdrawalId(data.id)
        queryClient.invalidateQueries({ queryKey: ['/wallet', {}] })
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
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

  const { data: statusData, isFetching: isCheckingStatus } =
    useSantiBetQuery<WithdrawalRecord>({
      path: `/wallet/withdrawals/${withdrawalId}`,
      queryKey: ['withdrawal-status', withdrawalId],
      enabled: checkingStatus && !!withdrawalId,
    })

  // statusData overrides the mutation's snapshot once a check has run
  const currentWithdrawal = statusData ?? withdrawalResult

  const handleSubmit = async () => {
    const numeric = Number(amount)
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount')
      return
    }
    if (numeric < 10000) {
      setAmountError('Enter must be greater then 10000')
      return
    }
    if (!selectedAccountId) {
      setAmountError('Select an account')
      return
    }
    setAmountError('')
    try {
      await requestWithdrawal({
        amount,
        paymentMethodId: selectedAccountId,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleCheckStatus = () => {
    setCheckingStatus(true)
  }

  const handleDone = () => {
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleDone}
      title={
        step === 'amount'
          ? 'Withdraw Funds'
          : currentWithdrawal?.reviewStatus === 'PENDING'
            ? 'Withdrawal Under Review'
            : 'Withdrawal Requested'
      }
      className='max-w-125! w-[90%]!'
    >
      {step === 'amount' &&
        (verifiedAccounts.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-4'>
            <p className='text-sm text-left text-neutral-10'>
              You need a verified withdrawal account before you can withdraw.
              Add one from your Wallet page, then come back here.
            </p>
            <Button
              type='button'
              text='Got it'
              variation='plain'
              size='large'
              className='w-full'
              onClick={handleDone}
            />
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <span className='text-xs font-medium text-neutral-10'>
                Withdraw to
              </span>
              <div className='flex flex-col gap-2'>
                {verifiedAccounts.map((account) => (
                  <button
                    key={account.id}
                    type='button'
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedAccountId === account.id
                        ? 'border-success bg-surface-success'
                        : 'border-border'
                    }`}
                  >
                    <div className='flex flex-col min-w-0'>
                      <span className='text-sm font-semibold text-black truncate'>
                        {account.label}
                      </span>
                      <span className='text-xs text-neutral-10 truncate'>
                        {account.accountName} · {account.accountNumber}
                      </span>
                    </div>
                    {selectedAccountId === account.id && (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={18}
                        className='shrink-0 text-success'
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

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
              text='Request withdrawal'
              variation='primary'
              size='large'
              className='w-full'
              loading={isPending}
              disabled={isPending}
              onClick={handleSubmit}
            />
          </div>
        ))}

      {step === 'result' && currentWithdrawal && (
        <div className='flex flex-col items-center gap-4'>
          <HugeiconsIcon
            icon={
              currentWithdrawal.reviewStatus === 'PENDING'
                ? Clock01Icon
                : currentWithdrawal.status === 'FAILED'
                  ? AlertCircleIcon
                  : CheckmarkCircle02Icon
            }
            size={32}
            className={
              currentWithdrawal.reviewStatus === 'PENDING'
                ? 'text-warning'
                : currentWithdrawal.status === 'FAILED'
                  ? 'text-error'
                  : 'text-success'
            }
          />
          <p className='text-sm text-center text-neutral-10'>
            {currentWithdrawal.reviewStatus === 'PENDING'
              ? 'This amount needs a compliance review before it can be dispatched. We will notify you once it is cleared.'
              : currentWithdrawal.status === 'FAILED'
                ? currentWithdrawal.failureReason ||
                  'This withdrawal could not be processed.'
                : currentWithdrawal.status === 'COMPLETED'
                  ? 'Your withdrawal has been completed.'
                  : 'Your withdrawal has been queued and will be dispatched shortly.'}
          </p>

          <div className='w-full flex flex-col gap-2 rounded-lg border border-border p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-neutral-10'>Status</span>
              <span className='font-semibold text-black capitalize'>
                {currentWithdrawal.status.toLowerCase()}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-neutral-10'>Amount</span>
              <span className='font-semibold text-black'>
                {formatCurrency(
                  currentWithdrawal.amount,
                  currentWithdrawal.currency,
                )}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-neutral-10'>Fee</span>
              <span className='font-semibold text-black'>
                {formatCurrency(
                  currentWithdrawal.fee,
                  currentWithdrawal.currency,
                )}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-neutral-10'>Requested</span>
              <span className='font-semibold text-black'>
                {formatDate(currentWithdrawal.createdAt)}
              </span>
            </div>
          </div>

          {currentWithdrawal.status === 'PENDING' && (
            <Button
              type='button'
              text='Check status'
              variation='plain'
              size='large'
              className='w-full'
              loading={isCheckingStatus}
              disabled={isCheckingStatus}
              onClick={handleCheckStatus}
            />
          )}

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

export default Withdraw
