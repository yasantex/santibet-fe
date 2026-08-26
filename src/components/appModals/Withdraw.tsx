import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useSantiBetMutation, useSantiBetQuery } from '../../data_layer/utils'
import type {
  WalletBalance,
  WithdrawalAccountsListResponse,
  WithdrawalRecord,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import ConfirmWithdrawal from './ConfirmWithdrawal'
import { toMajorUnits, toMinorUnits } from '../../utils/functions'

const Withdraw = ({
  open,
  handleClose,
  wallet,
}: ModalProps & { wallet: WalletBalance }) => {
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [withdrawalId, setWithdrawalId] = useState('')
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
    setAmount('')
    setAmountError('')
    setConfirmOpen(false)
    setWithdrawalId('')
    setSelectedAccountId(verifiedAccounts[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountsData])

  const { mutateAsync: requestWithdrawal, isPending } = useSantiBetMutation<
    WithdrawalRecord,
    { amount: string; paymentMethodId: string }
  >({
    path: '/wallet/withdrawals',
    mutationOptions: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/wallet', {}] })
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
        setWithdrawalId(data.id)
        if (data.codeRequired) {
          setConfirmOpen(true)
        }
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

  const winningBalance = toMajorUnits(wallet?.winnings ?? 0)

  const handleSubmit = async () => {
    const numeric = Number(amount)
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount')
      return
    }
    if (numeric > winningBalance) {
      setAmountError('Amount exceeds your winning balance')
      return
    }
    if (!selectedAccountId) {
      setAmountError('Select an account')
      return
    }
    setAmountError('')
    try {
      await requestWithdrawal({
        amount: String(toMinorUnits(numeric)),
        paymentMethodId: selectedAccountId,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDone = () => {
    handleClose()
    setConfirmOpen(false)
  }

  return (
    <>
      <ModalComponent
        open={open}
        handleClose={handleDone}
        title='Withdraw Funds'
        className='max-w-125! w-[90%]!'
      >
        {verifiedAccounts.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-4'>
            <p className='text-sm text-left text-neutral-10'>
              You need a withdrawal account before you can withdraw. Add one
              from your Wallet page, then come back here.
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
              <div className='flex flex-col gap-2 max-h-40 overflow-y-auto'>
                {verifiedAccounts.map((account) => (
                  <button
                    key={account.id}
                    type='button'
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedAccountId === account.id
                        ? 'border-success'
                        : 'border-border'
                    }`}
                  >
                    <div className='flex flex-col gap-2.5 min-w-0'>
                      <span className='text-sm font-semibold text-black truncate'>
                        {account.label}
                      </span>
                      <span className='text-xs text-neutral-10 font-medium truncate'>
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
        )}
      </ModalComponent>

      <ConfirmWithdrawal
        open={confirmOpen}
        handleClose={handleDone}
        id={withdrawalId}
      />
    </>
  )
}

export default Withdraw
