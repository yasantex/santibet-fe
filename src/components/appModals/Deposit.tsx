import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  CreditCardIcon,
  BitcoinIcon,
  BankIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useSantiBetMutation, useSantiBetQuery } from '../../data_layer/utils'
import type {
  StartDepositResponse,
  DepositRecord,
  CryptoAddressResponse,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '../../utils/functions'
import { CopyButton } from '../globals/CopyButton'

type DepositStep =
  | 'method'
  | 'amount'
  | 'instructions'
  | 'result'
  | 'crypto-currency'
  | 'crypto-address'

type DepositMethod = 'bank' | 'crypto'
type CryptoCurrency = 'USDC' | 'USDT'

const DEPOSIT_METHODS: {
  id: DepositMethod
  label: string
  subtitle: string
  icon: typeof CreditCardIcon
  available: boolean
}[] = [
  {
    id: 'crypto' as DepositMethod,
    label: 'Crypto',
    subtitle: 'Instant · No limit',
    icon: BitcoinIcon,
    available: true,
  },
  {
    id: 'bank' as DepositMethod,
    label: 'Bank Transfer',
    subtitle: 'Instant · No limit',
    icon: BankIcon,
    available: true,
  },
]

const Deposit = ({ open, handleClose }: ModalProps) => {
  const [step, setStep] = useState<DepositStep>('method')
  const [method, setMethod] = useState<DepositMethod | null>(null)

  // Bank transfer state
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [startResponse, setStartResponse] =
    useState<StartDepositResponse | null>(null)
  const [verifyResult, setVerifyResult] = useState<DepositRecord | null>(null)

  // Crypto state
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency | null>(
    null,
  )

  const queryClient = useQueryClient()

  const resetAll = () => {
    setStep('method')
    setMethod(null)
    setAmount('')
    setAmountError('')
    setStartResponse(null)
    setVerifyResult(null)
    setCryptoCurrency(null)
  }

  useEffect(() => {
    if (!open) return
    resetAll()
  }, [open])

  // ---------- Bank transfer ----------

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

  const {
    data: cryptoAddress,
    isLoading: isLoadingAddress,
    isError: isCryptoError,
  } = useSantiBetQuery<CryptoAddressResponse>({
    path: `/wallet/crypto/address?currency=${cryptoCurrency}`,
    enabled: step === 'crypto-address' && !!cryptoCurrency,
  })

  const handleSelectMethod = (id: DepositMethod) => {
    setMethod(id)
    setStep(id === 'bank' ? 'amount' : 'crypto-currency')
  }

  const handleSelectCryptoCurrency = (currency: CryptoCurrency) => {
    setCryptoCurrency(currency)
    setStep('crypto-address')
  }

  const handleDone = () => {
    resetAll()
    handleClose()
  }

  const instructions = startResponse?.instructions

  const title =
    step === 'method'
      ? 'Deposit Funds'
      : step === 'amount'
        ? 'Deposit Funds'
        : step === 'instructions'
          ? 'Complete Your Deposit'
          : step === 'crypto-currency'
            ? 'Select Crypto'
            : step === 'crypto-address'
              ? 'Deposit Crypto'
              : verifyResult?.status === 'SUCCESS'
                ? 'Deposit Successful'
                : 'Deposit Failed'

  return (
    <ModalComponent
      open={open}
      handleClose={handleDone}
      title={title}
      className='max-w-125! w-[90%]!'
    >
      {step === 'method' && (
        <div className='flex flex-col gap-2.5'>
          {DEPOSIT_METHODS.map((m) => (
            <button
              key={m.id}
              type='button'
              disabled={!m.available}
              onClick={() => handleSelectMethod(m.id)}
              className='flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
            >
              <HugeiconsIcon icon={m.icon} size={20} />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-black'>{m.label}</p>
                <p className='text-xs text-neutral-10'>{m.subtitle}</p>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className='text-neutral-10'
              />
            </button>
          ))}
        </div>
      )}

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

      {step === 'crypto-currency' && (
        <div className='flex flex-col gap-2.5'>
          <p className='text-sm text-left text-neutral-10 mb-1'>
            Choose which coin you want to deposit with.
          </p>
          {(['USDC', 'USDT'] as CryptoCurrency[]).map((currency) => (
            <button
              key={currency}
              type='button'
              onClick={() => handleSelectCryptoCurrency(currency)}
              className='flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-hover cursor-pointer'
            >
              <span className='flex-1 text-sm font-semibold text-black'>
                {currency}
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className='text-neutral-10'
              />
            </button>
          ))}
        </div>
      )}

      {step === 'crypto-address' && (
        <div className='flex flex-col gap-4'>
          {isLoadingAddress && (
            <p className='text-sm text-center text-neutral-10 py-6'>
              Fetching your deposit address…
            </p>
          )}

          {isCryptoError && !isLoadingAddress && (
            <p className='text-sm text-center text-error py-6'>
              Couldn't load a deposit address. Please try again.
            </p>
          )}

          {cryptoAddress && (
            <>
              <p className='text-sm text-left text-neutral-10'>
                Send only {cryptoAddress.currency} on the{' '}
                {cryptoAddress.network} network to this address. Your balance
                updates automatically once it's confirmed on-chain.
              </p>

              <div className='flex flex-col gap-2.5 rounded-lg border border-border p-4'>
                {[
                  { label: 'Currency', value: cryptoAddress.currency },
                  { label: 'Network', value: cryptoAddress.network },
                  { label: 'Address', value: cryptoAddress.address },
                  ...(cryptoAddress.destinationTag
                    ? [
                        {
                          label: 'Destination Tag',
                          value: cryptoAddress.destinationTag,
                        },
                      ]
                    : []),
                ].map((row) => (
                  <div
                    key={row.label}
                    className='flex items-center justify-between gap-3'
                  >
                    <div className='flex flex-col min-w-0'>
                      <span className='text-xs text-neutral-10'>
                        {row.label}
                      </span>
                      <span className='text-sm font-semibold text-black truncate'>
                        {row.value}
                      </span>
                    </div>
                    <CopyButton value={row.value} />
                  </div>
                ))}
              </div>

              <p className='text-xs text-center text-neutral-10'>
                Sending any other coin or network may result in permanent loss
                of funds.
              </p>
            </>
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
