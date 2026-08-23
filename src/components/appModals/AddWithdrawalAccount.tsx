import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type {
  WithdrawalAccount,
  AddWithdrawalAccountRequest,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast, showSuccessToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import { AddWithdrawalAccountSchema } from '../../utils/validations'
import { useBankOptions } from '../../hooks/useBankOptions'
import CustomSelector from '../globals/CustomSelector'
import { useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import type { BaseApiResponse } from '../../types/types'

type ResolveResponse = BaseApiResponse & {
  data: {
    accountName: string
  }
}

const AddWithdrawalAccount = ({ open, handleClose }: ModalProps) => {
  const queryClient = useQueryClient()
  const { banksData, setSearchBanks } = useBankOptions()

  const { mutateAsync: addAccount, isPending } = useSantiBetMutation<
    WithdrawalAccount,
    AddWithdrawalAccountRequest
  >({
    path: '/wallet/withdrawal-accounts',
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['withdrawal-accounts'] })
        showSuccessToast('Withdrawal account added')
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

  const {
    values,
    handleChange,
    handleBlur,
    errors,
    touched,
    handleSubmit,
    resetForm,
    setFieldValue,
  } = useFormik({
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
          label: vals.label,
        })
      } catch (error) {
        console.error(error)
      }
    },
  })

  const { mutateAsync: postResolveAccount, isPending: isResolving } =
    useSantiBetMutation<
      ResolveResponse,
      { bank_code: string; account_number: string }
    >({
      path: `/banking/resolve-account`,
      mutationOptions: {
        onSuccess: (data) => {
          setFieldValue('accountName', data.data.accountName)
        },
        onError: () => {
          setFieldValue('accountName', '')
        },
      },
    })

  const [debouncedAccountNumber] = useDebounce(values.accountNumber, 1000)

  const resolveAccount = async () => {
    if (
      values.bankCode &&
      debouncedAccountNumber &&
      debouncedAccountNumber.length >= 10
    ) {
      try {
        await postResolveAccount({
          bank_code: values.bankCode,
          account_number: debouncedAccountNumber,
        })
      } catch (error) {}
    } else if (!debouncedAccountNumber || debouncedAccountNumber.length < 10) {
      setFieldValue('accountName', '')
    }
  }

  useEffect(() => {
    resolveAccount()
  }, [debouncedAccountNumber, values.bankCode])

  const handleClosed = () => {
    resetForm()
    handleClose()
  }

  const bankOptions = Array.isArray(banksData)
    ? banksData?.map((bank) => ({
        label: bank?.name,
        value: bank?.code,
      })) || []
    : []

  return (
    <ModalComponent
      open={open}
      handleClose={handleClosed}
      title='Add Withdrawal Account'
      className='max-w-125! w-[90%]!'
    >
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <FormInput
          type='text'
          name='accountNumber'
          value={values.accountNumber}
          placeholder='Enter account number'
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setFieldValue('accountNumber', val)
          }}
          onBlur={handleBlur}
          errors={
            errors.accountNumber && touched.accountNumber
              ? errors.accountNumber
              : ''
          }
        />

        <div className='flex flex-col gap-1.5'>
          <CustomSelector
            options={bankOptions}
            value={values.bankCode}
            onChange={(selected) => setFieldValue('bankCode', selected)}
            placeholder='select bank'
            containerClassName='w-full'
            onSearchChange={(searchTerm) => setSearchBanks(searchTerm)}
            searchByLabel={true}
          />

          {isResolving && (
            <p className='text-sm text-neutral-10'>Resolving account…</p>
          )}

          {!isResolving && values.accountName && (
            <p className='text-sm font-semibold text-black'>
              {values.accountName}
            </p>
          )}
        </div>

        <FormInput
          type='text'
          name='label'
          value={values.label}
          placeholder='e.g. my bank account'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.label && touched.label ? errors.label : ''}
        />

        <Button
          type='submit'
          text='Save account'
          variation='primary'
          size='large'
          className='w-full'
          loading={isPending}
          disabled={isPending}
        />
      </form>
    </ModalComponent>
  )
}

export default AddWithdrawalAccount
