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
import { useNotificationStream } from '../../data_layer/notificationStreamContext'
import {
  WALLET_BALANCE_KEY,
  WALLET_TRANSACTIONS_KEY,
} from '../../data_layer/queryKeys'
import type {
  StartDepositResponse,
  DepositRecord,
  CryptoAddressResponse,
  CryptoNetworksResponse,
  CryptoNetworkId,
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
  | 'crypto-network'
  | 'crypto-address'

type DepositMethod = 'bank' | 'crypto'
type CryptoCurrency = 'USDC' | 'USDT'
type CryptoNetwork = CryptoNetworkId

// Display metadata; the actual selectable set per currency comes from the API
// (GET /api/wallet/crypto/networks).
const NETWORK_LABELS: Record<CryptoNetwork, { label: string; subtitle: string }> =
  {
    trc20: { label: 'Tron (TRC20)', subtitle: 'Low fees · fast' },
    erc20: { label: 'Ethereum (ERC20)', subtitle: 'Higher fees' },
    bep20: { label: 'BNB Smart Chain (BEP20)', subtitle: 'Low fees' },
  }

/**
 * How long to wait on the push alone before also polling. Covers the case
 * where the stream is up but its event never lands.
 */
const POLL_FALLBACK_DELAY = 3 * 60 * 1000

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
  // How the deposit finished, whichever path got there first — the pushed
  // DEPOSIT_SUCCESS event or the polled verify call.
  const [settled, setSettled] = useState<{
    status: 'COMPLETED' | 'FAILED'
    reason?: string | null
  } | null>(null)

  // Crypto state
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency | null>(
    null,
  )
  const [cryptoNetwork, setCryptoNetwork] = useState<CryptoNetwork | null>(null)

  const queryClient = useQueryClient()
  const { connected: streamConnected, subscribeToDepositSuccess } =
    useNotificationStream()

  const resetAll = () => {
    setStep('method')
    setMethod(null)
    setAmount('')
    setAmountError('')
    setStartResponse(null)
    setSettled(null)
    setCryptoCurrency(null)
    setCryptoNetwork(null)
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

  const { mutateAsync: verifyDeposit } = useSantiBetMutation<
    DepositRecord,
    void
  >({
    path: `/wallet/deposits/${depositId}/verify`,
    mutationOptions: {
      onSuccess: (data) => {
        if (data.status === 'PENDING') return
        if (data.status === 'COMPLETED') {
          queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
          queryClient.invalidateQueries({
            queryKey: WALLET_TRANSACTIONS_KEY,
          })
        }
        setSettled({
          status: data.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          reason: data.failureReason,
        })
        setStep('result')
      },
      // The fallback poll retries silently rather than toasting on every
      // transient hiccup; a real failure arrives as a settled deposit record.
      onError: () => {},
    },
  })

  // Primary path: the backend pushes DEPOSIT_SUCCESS once the transfer is
  // credited, for both the bank and crypto rails. Crypto has no deposit id up
  // front, so on that screen any success belongs to the address on display.
  const isAwaitingPayment =
    step === 'instructions' || step === 'crypto-address'

  useEffect(() => {
    if (!isAwaitingPayment) return
    return subscribeToDepositSuccess((event) => {
      if (depositId && event.depositId && event.depositId !== depositId) return
      queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
      queryClient.invalidateQueries({ queryKey: WALLET_TRANSACTIONS_KEY })
      setSettled({ status: 'COMPLETED' })
      setStep('result')
    })
  }, [
    isAwaitingPayment,
    depositId,
    subscribeToDepositSuccess,
    queryClient,
  ])

  // Fallback: poll while the push connection is down, and once the wait has
  // run long enough that a dropped event is the likelier explanation.
  useEffect(() => {
    if (step !== 'instructions' || !depositId) return

    const expiresAtStr = startResponse?.instructions.expiresAt
    const expiresAt = expiresAtStr ? new Date(expiresAtStr).getTime() : null
    const waitingSince = Date.now()

    const poll = () => {
      if (expiresAt && Date.now() > expiresAt) return
      // While the stream is healthy, hold off until the grace period lapses.
      if (streamConnected && Date.now() - waitingSince < POLL_FALLBACK_DELAY) {
        return
      }
      verifyDeposit().catch(() => {})
    }

    const intervalId = setInterval(poll, 5000)
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, depositId, streamConnected])

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

  // Crypto
  const { data: userProfile } = useSantiBetQuery<UserData>({
    path: '/auth/me',
  })

  // Supported networks per currency (drives the currency + network choices).
  const { data: networksData } = useSantiBetQuery<CryptoNetworksResponse>({
    path: '/wallet/crypto/networks',
    queryKey: ['crypto-networks'],
    enabled: method === 'crypto',
  })

  const cryptoCurrencies = (networksData?.data?.length
    ? networksData.data.map((d) => d.currency)
    : (['USDC', 'USDT'] as CryptoCurrency[]))

  const availableNetworks: CryptoNetworkId[] =
    networksData?.data?.find((d) => d.currency === cryptoCurrency)?.networks ??
    []

  const {
    data: cryptoAddress,
    isLoading: isLoadingAddress,
    isError: isCryptoError,
    error,
  } = useSantiBetQuery<CryptoAddressResponse>({
    path: `/wallet/crypto/address?currency=${cryptoCurrency}&network=${cryptoNetwork}`,
    queryKey: ['crypto-address', cryptoCurrency, cryptoNetwork],
    enabled: step === 'crypto-address' && !!cryptoCurrency && !!cryptoNetwork,
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

  const defaultNetwork =
    networksData?.data?.find((d) => d.currency === cryptoCurrency)
      ?.defaultNetwork ?? null

  const handleSelectCryptoCurrency = (currency: CryptoCurrency) => {
    setCryptoCurrency(currency)
    // Pre-select the currency's default network so the user can just continue.
    setCryptoNetwork(
      networksData?.data?.find((d) => d.currency === currency)
        ?.defaultNetwork ?? null,
    )
    setStep('crypto-network')
  }

  // If the networks list resolves after the currency was picked, adopt the
  // default (render-time adjust — no effect, to satisfy the lint rule).
  if (
    step === 'crypto-network' &&
    !cryptoNetwork &&
    defaultNetwork &&
    availableNetworks.includes(defaultNetwork)
  ) {
    setCryptoNetwork(defaultNetwork)
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
            : step === 'crypto-network'
              ? 'Select Network'
              : step === 'crypto-address'
                ? 'Deposit Crypto'
                : settled?.status === 'COMPLETED'
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
            text='Close'
            variation='plain'
            size='large'
            className='w-full'
            onClick={handleDone}
          />
        </div>
      )}

      {step === 'crypto-currency' && (
        <div className='flex flex-col gap-2.5'>
          <p className='text-sm text-left text-neutral-10 mb-1'>
            Choose which coin you want to deposit with.
          </p>
          {cryptoCurrencies.map((currency) => (
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

      {step === 'crypto-network' && (
        <div className='flex flex-col gap-2.5'>
          <p className='text-sm text-left text-neutral-10 mb-1'>
            Choose the network to receive your {cryptoCurrency} on. It must
            match the network you send from.
          </p>
          {availableNetworks.length === 0 ? (
            <p className='py-4 text-center text-sm text-neutral-10'>
              Loading supported networks…
            </p>
          ) : (
            availableNetworks.map((id) => {
              const meta = NETWORK_LABELS[id]
              const selected = cryptoNetwork === id
              return (
                <button
                  key={id}
                  type='button'
                  onClick={() => setCryptoNetwork(id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left cursor-pointer transition-colors ${
                    selected
                      ? 'border-brand-green bg-brand-green/10'
                      : 'border-border hover:bg-hover'
                  }`}
                >
                  <div className='flex-1'>
                    <p className='flex items-center gap-2 text-sm font-semibold text-black'>
                      {meta?.label ?? id.toUpperCase()}
                      {defaultNetwork === id && (
                        <span className='rounded-full bg-brand-green/20 px-2 py-0.5 text-[10px] font-bold text-success uppercase'>
                          Recommended
                        </span>
                      )}
                    </p>
                    {meta?.subtitle && (
                      <p className='text-xs text-neutral-10'>{meta.subtitle}</p>
                    )}
                  </div>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-brand-green bg-brand-green'
                        : 'border-border'
                    }`}
                  >
                    {selected && (
                      <span className='h-1.5 w-1.5 rounded-full bg-black' />
                    )}
                  </span>
                </button>
              )
            })
          )}

          <Button
            type='button'
            text='Continue'
            variation='primary'
            size='large'
            className='w-full'
            disabled={!cryptoNetwork}
            onClick={() => setStep('crypto-address')}
          />
          <button
            type='button'
            onClick={() => setStep('crypto-currency')}
            className='text-sm font-semibold text-neutral-10 hover:text-black'
          >
            ← Back
          </button>
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

              <div className='flex items-center justify-center gap-2 text-xs text-neutral-10'>
                <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green' />
                Waiting for your deposit to arrive…
              </div>

              <p className='text-xs text-center text-neutral-10'>
                Sending any other coin or network may result in permanent loss
                of funds.
              </p>
            </>
          )}

          <div className='flex gap-3'>
            <Button
              type='button'
              text='Change network'
              variation='plain'
              size='large'
              className='w-full'
              onClick={() => setStep('crypto-network')}
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
        </div>
      )}

      {step === 'result' && settled && (
        <div className='flex flex-col items-center gap-4'>
          <HugeiconsIcon
            icon={
              settled.status === 'COMPLETED'
                ? CheckmarkCircle02Icon
                : AlertCircleIcon
            }
            size={32}
            className={
              settled.status === 'COMPLETED' ? 'text-success' : 'text-error'
            }
          />
          <p className='text-sm text-center text-neutral-10'>
            {settled.status === 'COMPLETED'
              ? 'Your deposit has been credited to your wallet.'
              : settled.reason || 'This deposit could not be completed.'}
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
