import { useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BankIcon,
  BitcoinIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { OtpInput } from '../globals/OtpInput'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type {
  WithdrawalAccount,
  CryptoWithdrawalAccount,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast, showSuccessToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import {
  AddWithdrawalAccountSchema,
  AddCryptoWithdrawalAccountSchema,
  VerifySchema,
} from '../../utils/validations'
import { useBankOptions } from '../../hooks/useBankOptions'
import CustomSelector from '../globals/CustomSelector'
import { useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import type { BaseApiResponse } from '../../types/types'

type ResolveResponse = BaseApiResponse & {
  accountName: string
  bankCode: string
}

type StepUpRequestResponse = BaseApiResponse & {
  channel: string
  destination: string
}

type AccountStep = 'method' | 'bank' | 'crypto' | 'crypto-otp'
type AccountMethod = 'bank' | 'crypto'

const ACCOUNT_METHODS: {
  id: AccountMethod
  label: string
  subtitle: string
  icon: typeof BankIcon
}[] = [
  {
    id: 'bank',
    label: 'Bank Account',
    subtitle: 'Withdraw to a Nigerian bank account',
    icon: BankIcon,
  },
  {
    id: 'crypto',
    label: 'Crypto Address',
    subtitle: 'Withdraw to an on-chain wallet',
    icon: BitcoinIcon,
  },
]

// supported networks here
const cryptoNetworks = [{ label: 'TRC20', value: 'trc20' }]

const cryptoCurrencies = [
  { label: 'USDC', value: 'USDC' },
  { label: 'USDT', value: 'USDT' },
]

const AddWithdrawalAccount = ({ open, handleClose, refetch }: ModalProps & {refetch: ()=> void}) => {
  const [step, setStep] = useState<AccountStep>('method')
  const [stepUpDestination, setStepUpDestination] = useState<string | null>(
    null,
  )
  const queryClient = useQueryClient()
  const { banksData, setSearchBanks } = useBankOptions()

  const resetAll = () => {
    setStep('method')
    setStepUpDestination(null)
  }

  const handleClosed = () => {
    resetAll()
    bankForm.resetForm()
    cryptoForm.resetForm()
    otpForm.resetForm()
    handleClose()
  }

  // ---------- Bank ----------

  const { mutateAsync: addAccount, isPending: isAddingBank } =
    useSantiBetMutation<
      WithdrawalAccount,
      { accountNumber: string; bankCode: string; label?: string }
    >({
      path: '/wallet/withdrawal-accounts',
      mutationOptions: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['withdrawal-accounts'] })
          showSuccessToast('Withdrawal account added')
          refetch()
          handleClosed()
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

  const bankForm = useFormik({
    initialValues: {
      accountNumber: '',
      bankCode: '',
      label: '',
      accountName: '',
    },
    validationSchema: AddWithdrawalAccountSchema,
    onSubmit: async (vals) => {
      try {
        await addAccount({
          accountNumber: vals.accountNumber,
          bankCode: vals.bankCode,
          ...(vals.label.trim() && { label: vals.label.trim() }),
        })
      } catch (error) {
        console.error(error)
      }
    },
  })

  const { mutateAsync: postResolveAccount, isPending: isResolving } =
    useSantiBetMutation<
      ResolveResponse,
      { bankCode: string; accountNumber: string }
    >({
      path: `/wallet/banks/resolve`,
      mutationOptions: {
        onSuccess: (data) => {
          bankForm.setFieldValue('accountName', data.accountName)
        },
        onError: () => {
          bankForm.setFieldValue('accountName', '')
        },
      },
    })

  const [debouncedAccountNumber] = useDebounce(
    bankForm.values.accountNumber,
    1000,
  )

  const resolveAccount = async () => {
    if (
      bankForm.values.bankCode &&
      debouncedAccountNumber &&
      debouncedAccountNumber.length >= 10
    ) {
      try {
        await postResolveAccount({
          bankCode: bankForm.values.bankCode,
          accountNumber: debouncedAccountNumber,
        })
      } catch (error) {}
    } else if (!debouncedAccountNumber || debouncedAccountNumber.length < 10) {
      bankForm.setFieldValue('accountName', '')
    }
  }

  useEffect(() => {
    resolveAccount()
  }, [debouncedAccountNumber, bankForm.values.bankCode])

  const bankOptions = Array.isArray(banksData)
    ? banksData?.map((bank) => ({
        label: bank?.name,
        value: bank?.code,
      })) || []
    : []

  // ---------- Crypto ----------

  const { mutateAsync: addCryptoAccount, isPending: isAddingCrypto } =
    useSantiBetMutation<
      CryptoWithdrawalAccount,
      {
        address: string
        network: string
        currency: string
        label?: string
      }
    >({
      path: '/wallet/crypto/accounts',
      mutationOptions: {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['withdrawal-accounts'],
          })
          showSuccessToast('Crypto address added')
          refetch()
          handleClosed()
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

  const cryptoForm = useFormik({
    initialValues: {
      address: '',
      network: '',
      currency: '',
      label: '',
    },
    validationSchema: AddCryptoWithdrawalAccountSchema,
    onSubmit: async (vals) => {
      try {
        await addCryptoAccount({
          address: vals.address,
          network: vals.network,
          currency: vals.currency,
          ...(vals.label.trim() && { label: vals.label.trim() }),
        })
      } catch (error) {
        console.error(error)
      }
    },
  })

  // ---------- Step-up (required before crypto flow is entered) ----------

  const { mutateAsync: requestStepUp, isPending: isRequestingStepUp } =
    useSantiBetMutation<StepUpRequestResponse, { channel: string }>({
      path: '/auth/step-up/request',
      mutationOptions: {
        onSuccess: (data) => {
          setStepUpDestination(data.destination)
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

  const { mutateAsync: confirmStepUp, isPending: isConfirmingStepUp } =
    useSantiBetMutation<BaseApiResponse, { code: string }>({
      path: '/auth/step-up/confirm',
      mutationOptions: {
        onError: (error) => {
          if (isAxiosError(error)) {
            showWarningToast(error.response?.data?.message)
          } else {
            showWarningToast(error.message)
          }
        },
      },
    })

  const otpForm = useFormik({
    initialValues: {
      code: '',
    },
    validationSchema: VerifySchema,
    onSubmit: async (vals) => {
      try {
        await confirmStepUp({ code: vals.code })
        setStep('crypto')
      } catch (error) {
        console.error(error)
      }
    },
  })

  const handleSelectCrypto = async () => {
    try {
      await requestStepUp({ channel: 'email' })
      setStep('crypto-otp')
    } catch (error) {
      console.error(error)
    }
  }

  const title =
    step === 'method'
      ? 'Add Withdrawal Account'
      : step === 'bank'
        ? 'Add Bank Account'
        : step === 'crypto'
          ? 'Add Crypto Address'
          : 'Confirm Crypto Address'

  return (
    <ModalComponent
      open={open}
      handleClose={handleClosed}
      title={title}
      className='max-w-125! w-[90%]!'
    >
      {step === 'method' && (
        <div className='flex flex-col gap-2.5'>
          {ACCOUNT_METHODS.map((m) => (
            <button
              key={m.id}
              type='button'
              onClick={() => {
                if (m.id === 'crypto') {
                  handleSelectCrypto()
                } else {
                  setStep(m.id)
                }
              }}
              disabled={isRequestingStepUp}
              className='flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-hover cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
            >
              <HugeiconsIcon icon={m.icon} size={20} className='text-black' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-black'>{m.label}</p>
                <p className='text-xs text-neutral-10'>
                  {m.id === 'crypto' && isRequestingStepUp
                    ? 'Sending confirmation code…'
                    : m.subtitle}
                </p>
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

      {step === 'bank' && (
        <form onSubmit={bankForm.handleSubmit} className='flex flex-col gap-4'>
          <FormInput
            type='text'
            name='accountNumber'
            value={bankForm.values.accountNumber}
            placeholder='Enter account number'
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              bankForm.setFieldValue('accountNumber', val)
            }}
            onBlur={bankForm.handleBlur}
            errors={
              bankForm.errors.accountNumber && bankForm.touched.accountNumber
                ? bankForm.errors.accountNumber
                : ''
            }
          />

          <div className='flex flex-col gap-1.5'>
            <CustomSelector
              options={bankOptions}
              value={bankForm.values.bankCode}
              onChange={(selected) =>
                bankForm.setFieldValue('bankCode', selected)
              }
              placeholder='select bank'
              containerClassName='w-full'
              onSearchChange={(searchTerm) => setSearchBanks(searchTerm)}
              searchByLabel={true}
              enableSearch={true}
            />

            {isResolving && (
              <p className='text-sm text-neutral-10'>Resolving account…</p>
            )}

            {!isResolving && bankForm.values.accountName && (
              <p className='text-sm font-semibold text-black'>
                {bankForm.values.accountName}
              </p>
            )}
          </div>

          <FormInput
            type='text'
            name='label'
            value={bankForm.values.label}
            placeholder='e.g. my bank account'
            onChange={bankForm.handleChange}
            onBlur={bankForm.handleBlur}
            errors={
              bankForm.errors.label && bankForm.touched.label
                ? bankForm.errors.label
                : ''
            }
          />

          <Button
            type='submit'
            text='Save account'
            variation='primary'
            size='large'
            className='w-full'
            loading={isAddingBank}
            disabled={isAddingBank}
          />
        </form>
      )}

      {step === 'crypto-otp' && (
        <form
          onSubmit={otpForm.handleSubmit}
          className='w-full flex flex-col gap-2.5 mt-2.5'
        >
          {stepUpDestination && (
            <p className='text-sm text-neutral-10'>
              We sent a code to {stepUpDestination}
            </p>
          )}
          <OtpInput
            length={6}
            name='code'
            value={otpForm.values.code}
            hasTitle
            title='Enter Code'
            onChange={(val) => otpForm.setFieldValue('code', val)}
            onComplete={() => otpForm.setFieldTouched('code', true)}
            errors={
              otpForm.errors.code && otpForm.touched.code
                ? otpForm.errors.code
                : ''
            }
          />
          <Button
            type='submit'
            text='Confirm'
            variation='primary'
            className='mt-2.5'
            size='large'
            loading={isConfirmingStepUp}
            disabled={isConfirmingStepUp}
          />
        </form>
      )}

      {step === 'crypto' && (
        <form
          onSubmit={cryptoForm.handleSubmit}
          className='flex flex-col gap-4'
        >
          <FormInput
            type='text'
            name='address'
            value={cryptoForm.values.address}
            placeholder='Enter wallet address'
            onChange={cryptoForm.handleChange}
            onBlur={cryptoForm.handleBlur}
            errors={
              cryptoForm.errors.address && cryptoForm.touched.address
                ? cryptoForm.errors.address
                : ''
            }
          />

          <CustomSelector
            options={cryptoNetworks}
            value={cryptoForm.values.network}
            onChange={(selected) =>
              cryptoForm.setFieldValue('network', selected)
            }
            placeholder='select network'
            containerClassName='w-full'
          />

          <CustomSelector
            options={cryptoCurrencies}
            value={cryptoForm.values.currency}
            onChange={(selected) =>
              cryptoForm.setFieldValue('currency', selected)
            }
            placeholder='select currency'
            containerClassName='w-full'
          />

          <FormInput
            type='text'
            name='label'
            value={cryptoForm.values.label}
            placeholder='e.g. my USDC wallet'
            onChange={cryptoForm.handleChange}
            onBlur={cryptoForm.handleBlur}
            errors={
              cryptoForm.errors.label && cryptoForm.touched.label
                ? cryptoForm.errors.label
                : ''
            }
          />

          <Button
            type='submit'
            text='Save address'
            variation='primary'
            size='large'
            className='w-full'
            loading={isAddingCrypto}
            disabled={isAddingCrypto}
          />
        </form>
      )}
    </ModalComponent>
  )
}

export default AddWithdrawalAccount
