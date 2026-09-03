import { useEffect, useRef, useState } from 'react'
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
import { useNavigate } from 'react-router'
import {
  formatCurrency,
  formatDate,
  toMajorUnits,
  toMinorUnits,
} from '../../utils/functions'
import { CopyButton } from '../globals/CopyButton'
import type { UserData } from '../../types/types'

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
  const navigate = useNavigate()
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
  // Only surface errors for an explicit "Check now" click — the background
  // poll retries silently rather than toasting on every transient hiccup.
  const isManualCheckRef = useRef(false)

  const {
    mutateAsync: verifyDeposit,
    isPending: isVerifying,
    isSuccess,
  } = useSantiBetMutation<DepositRecord, void>({
    path: `/wallet/deposits/${depositId}/verify`,
    mutationOptions: {
      onSuccess: (data) => {
        setVerifyResult(data)
        if (data.status === 'PENDING') return
        if (data.status === 'COMPLETED') {
          queryClient.invalidateQueries({ queryKey: ['/wallet', {}] })
          queryClient.invalidateQueries({
            queryKey: ['wallet-transactions'],
          })
        }
        setStep('result')
      },
      onError: (error) => {
        if (!isManualCheckRef.current) return
        if (isAxiosError(error)) {
          showWarningToast(error.response?.data?.message)
        } else {
          showWarningToast(error.message)
        }
      },
    },
  })

  // Auto-detect payment: poll the same verify check the "Check now" button
  // triggers, so the transfer is picked up without a manual click. Stops as
  // soon as it settles (step leaves 'instructions') or the request expires.
  useEffect(() => {
    if (step !== 'instructions' || !depositId) return
    const expiresAtStr = startResponse?.instructions.expiresAt
    const expiresAt = expiresAtStr ? new Date(expiresAtStr).getTime() : null

    const poll = () => {
      if (expiresAt && Date.now() > expiresAt) return
      isManualCheckRef.current = false
      verifyDeposit().catch(() => {})
    }

    const intervalId = setInterval(poll, 5000)
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, depositId])

  const handleAmountSubmit = async () => {
    const numeric = Number(amount)
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount')
      return
    }
    setAmountError('')
    try {
      await startDeposit({ amount: String(toMinorUnits(numeric)) })
    } catch (error) {
      console.error(error)
    }
  }

  const handleCheckNow = async () => {
    isManualCheckRef.current = true
    try {
      await verifyDeposit()
    } catch (error) {
      console.error(error)
    } finally {
      isManualCheckRef.current = false
    }
  }

  // Crypto
  const { data: userProfile } = useSantiBetQuery<UserData>({
    path: '/auth/me',
  })

  const {
    data: cryptoAddress,
    isLoading: isLoadingAddress,
    isError: isCryptoError,
    error,
  } = useSantiBetQuery<CryptoAddressResponse>({
    path: `/wallet/crypto/address?currency=${cryptoCurrency}`,
    enabled: step === 'crypto-address' && !!cryptoCurrency,
  })

  const handleSelectMethod = (id: DepositMethod) => {
    if (id === 'crypto' && !userProfile?.emailVerified) {
      showWarningToast(
        'Please verify your email on your profile to deposit with crypto',
        {
          label: 'Verify email',
          onClick: () => {
            handleClose()
            navigate('/account-profile?tab=verification')
          },
        },
      )
      return
    }
    if (
      id === 'crypto' &&
      (!userProfile?.firstName || !userProfile?.lastName)
    ) {
      showWarningToast(
        'Please update your profile information to include your first name and last name to deposit with crypto',
        {
          label: 'Update profile',
          onClick: () => {
            handleClose()
            navigate('/account-profile')
          },
        },
      )
      return
    }
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
              : isSuccess
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
              <HugeiconsIcon icon={m.icon} size={20} className='text-black' />
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
            Transfer the <span className='font-bold'>EXACT</span> amount to
            the account below. We&apos;ll credit your wallet automatically as
            soon as it arrives — no need to stay on this screen.
          </p>

          <div className='flex flex-col gap-2.5 rounded-lg border border-border p-4'>
            {[
              {
                label: 'Amount',
                value: startResponse
                  ? formatCurrency(toMajorUnits(startResponse.deposit.amount))
                  : undefined,
              },
              { label: 'Bank', value: instructions.bankName },
              { label: 'Account Number', value: instructions.accountNumber },
              { label: 'Account Name', value: instructions.accountName },
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
                <CopyButton value={row.value!} />
              </div>
            ))}
          </div>

          <div className='flex items-center justify-center gap-2 text-xs text-neutral-10'>
            <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green' />
            Waiting for your transfer to arrive…
          </div>

          <p className='text-xs text-center text-neutral-10'>
            Expires {formatDate(instructions.expiresAt)}{' '}
          </p>

          <Button
            type='button'
            text='Check now'
            variation='plain'
            size='large'
            className='w-full'
            loading={isVerifying}
            disabled={isVerifying}
            onClick={handleCheckNow}
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
              {error?.message ??
                "Couldn't load a deposit address. Please try again."}
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

      {step === 'result' && isSuccess && verifyResult && (
        <div className='flex flex-col items-center gap-4'>
          <HugeiconsIcon
            icon={isSuccess ? CheckmarkCircle02Icon : AlertCircleIcon}
            size={32}
            className={isSuccess ? 'text-success' : 'text-error'}
          />
          <p className='text-sm text-center text-neutral-10'>
            {isSuccess
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
