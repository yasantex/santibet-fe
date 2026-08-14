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

const AddWithdrawalAccount = ({ open, handleClose }: ModalProps) => {
  const queryClient = useQueryClient()

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
    },
    validationSchema: AddWithdrawalAccountSchema,
    onSubmit: async (vals) => {
      try {
        await addAccount(vals)
      } catch (error) {
        console.error(error)
      }
    },
  })

  const handleClosed = () => {
    resetForm()
    handleClose()
  }

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
          hasTitle
          title='Account Number'
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

        {/* TODO: replace with a bank picker once a list-banks endpoint exists */}
        <FormInput
          type='text'
          name='bankCode'
          value={values.bankCode}
          hasTitle
          title='Bank Code'
          placeholder='Enter bank code'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.bankCode && touched.bankCode ? errors.bankCode : ''}
        />

        <FormInput
          type='text'
          name='label'
          value={values.label}
          hasTitle
          title='Label'
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
