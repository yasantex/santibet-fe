import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useSantiBetMutation, useSantiBetQuery } from '../../data_layer/utils'
import type {
  CryptoWalletResponse,
  WalletBalance,
  WithdrawalAccountsListResponse,
  WithdrawalRecord,
} from '../../types/wallet.types'
import type { BaseApiResponse } from '../../types/types'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import ConfirmWithdrawal from './ConfirmWithdrawal'
import {
  formatCurrency,
  toMajorUnits,
  toMinorUnits,
} from '../../utils/functions'

type WithdrawalQuoteResponse = BaseApiResponse & {
  fromAmountNgn: string
  currency: string
  network: string
  estimatedReceive: string
  rate: string
  expiresAt: string
}

type WithdrawStep = 'form' | 'quote'

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
  const [step, setStep] = useState<WithdrawStep>('form')
  const [quote, setQuote] = useState<WithdrawalQuoteResponse | null>(null)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{
    amount: string
    paymentMethodId: string
  } | null>(null)
  const queryClient = useQueryClient()

  const { data: accountsData } =
    useSantiBetQuery<WithdrawalAccountsListResponse>({
      path: '/wallet/withdrawal-accounts',
      queryKey: ['withdrawal-accounts'],
      enabled: open,
    })
  const { data: cryptoData } = useSantiBetQuery<CryptoWalletResponse>({
    path: '/wallet/crypto/accounts',
    queryKey: ['crypto-withdrawal-accounts'],
    enabled: open,
  })
  const bankAccounts = accountsData?.data ?? []
  const cryptoAccounts = cryptoData?.data ?? []

  const withdrawalAccounts = [
    ...bankAccounts.map((account) => ({
      ...account,
      type: 'bank' as const,
    })),
    ...cryptoAccounts.map((account) => ({
      ...account,
      type: 'crypto' as const,
    })),
  ]

  const hasWithdrawalAccount = withdrawalAccounts.length > 0
  const selectedAccount = withdrawalAccounts.find(
    (account) => account.id === selectedAccountId,
  )
  const isCryptoSelected = selectedAccount?.type === 'crypto'

  useEffect(() => {
    if (!open) return
    setAmount('')
    setAmountError('')
    setConfirmOpen(false)
    setWithdrawalId('')
    setStep('form')
    setQuote(null)
    setPendingWithdrawal(null)
    setSelectedAccountId(bankAccounts[0]?.id ?? cryptoAccounts[0]?.id ?? '')
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
        setStep('form')
        setQuote(null)
        setPendingWithdrawal(null)
        if (data.codeRequired) {
          setConfirmOpen(true)
          return
        }
        handleClose()
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

  const { mutateAsync: getQuote, isPending: isQuoting } = useSantiBetMutation<
    WithdrawalQuoteResponse,
    { amount: string; paymentMethodId: string }
  >({
    path: '/wallet/crypto/withdrawal-quote',
    mutationOptions: {
      onSuccess: (data) => {
        setQuote(data)
        setStep('quote')
      },
      onError: (error) => {
        if (isAxiosError(error)) {
          showWarningToast(error.response?.data?.message)
        } else {
          showWarningToast(error.message)
        }
      },
    },
  })

  const winningBalance = toMajorUnits(wallet?.winnings ?? 0)

  const validateAmount = () => {
    const numeric = Number(amount)
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount')
      return null
    }
    if (numeric > winningBalance) {
      setAmountError('Amount exceeds your winning balance')
      return null
    }
    if (!selectedAccountId) {
      setAmountError('Select an account')
      return null
    }
    setAmountError('')
    return numeric
  }

  const handleSubmit = async () => {
    const numeric = validateAmount()
    if (numeric === null) return

    const payload = {
      amount: String(toMinorUnits(numeric)),
      paymentMethodId: selectedAccountId,
    }

    try {
      if (isCryptoSelected) {
        setPendingWithdrawal(payload)
        await getQuote(payload)
      } else {
        await requestWithdrawal(payload)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleConfirmQuote = async () => {
    if (!pendingWithdrawal) return
    try {
      await requestWithdrawal(pendingWithdrawal)
    } catch (error) {
      console.error(error)
    }
  }

  const handleBackToForm = () => {
    setStep('form')
    setQuote(null)
    setPendingWithdrawal(null)
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
        title={step === 'quote' ? 'Confirm Withdrawal Quote' : 'Withdraw Funds'}
        className='max-w-125! w-[90%]!'
      >
        {!hasWithdrawalAccount ? (
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
        ) : step === 'quote' && quote ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3 rounded-lg border border-border p-4'>
              <div className='flex justify-between gap-4 text-sm font-medium text-black'>
                <p>You send</p>
                <span>
                  {formatCurrency(
                    toMajorUnits(quote.fromAmountNgn),
                    wallet?.currency,
                  )}
                </span>
              </div>
              <div className='flex justify-between gap-4 text-sm font-medium text-black'>
                <p>You receive (est.)</p>
                <span>
                  {quote.estimatedReceive} {quote.currency}
                </span>
              </div>
              <div className='flex justify-between gap-4 text-sm font-medium text-black'>
                <p>Network</p>
                <span>{quote.network}</span>
              </div>
              <div className='flex justify-between gap-4 text-sm font-medium text-black'>
                <p>Rate</p>
                <span>{quote.rate}</span>
              </div>
              <div className='flex justify-between gap-4 text-sm font-medium text-black'>
                <p>Quote expires</p>
                <span>{new Date(quote.expiresAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <p className='text-xs text-neutral-10'>
              The on-chain network fee is deducted separately when the
              withdrawal is sent.
            </p>

            <div className='flex gap-2.5'>
              <Button
                type='button'
                text='Back'
                variation='plain'
                size='large'
                className='w-full'
                onClick={handleBackToForm}
                disabled={isPending}
              />
              <Button
                type='button'
                text='Confirm withdrawal'
                variation='primary'
                size='large'
                className='w-full'
                loading={isPending}
                disabled={isPending}
                onClick={handleConfirmQuote}
              />
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            <p className='text-sm font-semibold text-neutral-10'>
              Winning Balance:{' '}
              <span className='text-black'>
                {formatCurrency(
                  toMajorUnits(wallet?.winnings ?? 0),
                  wallet?.currency,
                )}
              </span>
            </p>
            <div className='flex flex-col gap-1.5'>
              <span className='text-xs font-medium text-neutral-10'>
                Withdraw to
              </span>
              <div className='flex flex-col gap-2 max-h-40 overflow-y-auto'>
                {withdrawalAccounts.map((account) => (
                  <button
                    key={`${account.type}-${account.id}`}
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
                        {account.type === 'bank'
                          ? account.label
                          : account.label ||
                            `${account.currency} · ${account.network}`}
                      </span>

                      <span className='text-xs text-neutral-10 font-medium truncate'>
                        {account.type === 'bank'
                          ? `${account.accountName} · ${account.accountNumber}`
                          : `${account.currency} (${account.network}) · ${account.address}`}
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
              text={isCryptoSelected ? 'Get quote' : 'Request withdrawal'}
              variation='primary'
              size='large'
              className='w-full'
              loading={isCryptoSelected ? isQuoting : isPending}
              disabled={isCryptoSelected ? isQuoting : isPending}
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