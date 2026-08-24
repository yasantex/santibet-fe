import { useEffect, useState } from 'react'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { OtpInput } from '../globals/OtpInput'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import { VerifySchema } from '../../utils/validations'
import { StatusBadge } from '../globals/ReusedText'
import { WithdrawalStatusConfig } from '../../utils/status'
import { toMajorUnits } from '../../utils/functions'

type WithdrawalStatus = 'PENDING' | 'DISPATCHED' | 'SUCCESS' | 'FAILED'

interface WithdrawalRecord {
  id: string
  amount: string
  fee: string
  currency: string
  status: WithdrawalStatus
  destination: string
  failureReason: string | null
  createdAt: string
  dispatchedAt: string | null
  completedAt: string | null
}

interface ConfirmWithdrawalProps extends ModalProps {
  id: string
}

const ConfirmWithdrawal = ({
  open,
  handleClose,
  id,
}: ConfirmWithdrawalProps) => {
  const queryClient = useQueryClient()
  const [withdrawal, setWithdrawal] = useState<WithdrawalRecord | null>(null)

  const { mutateAsync: confirmWithdrawal, isPending } = useSantiBetMutation<
    WithdrawalRecord,
    { code: string }
  >({
    path: `/wallet/withdrawals/${id}/confirm`,
    mutationOptions: {
      onError: (error) => {
        if (isAxiosError(error)) {
          const errorData = error.response?.data
          showWarningToast(errorData?.message)
        } else {
          showWarningToast(error.message)
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/wallet', {}] })
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
        setWithdrawal(data)
        showSuccessToast('Withdrawal confirmed')
      },
    },
  })

  const {
    values,
    errors,
    touched,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    resetForm,
  } = useFormik({
    initialValues: {
      code: '',
    },
    validationSchema: VerifySchema,
    onSubmit: async (vals) => {
      try {
        await confirmWithdrawal({
          code: vals.code,
        })
      } catch {}
    },
  })

  useEffect(() => {
    if (!open) return
    resetForm()
    setWithdrawal(null)
  }, [open])

  const handleDone = () => {
    resetForm()
    setWithdrawal(null)
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleDone}
      title={withdrawal ? 'Withdrawal Confirmed' : 'Confirm Withdrawal'}
      subtitle={
        withdrawal
          ? 'Your withdrawal has been confirmed and submitted for processing.'
          : 'Enter the code sent to confirm this withdrawal'
      }
      className='max-w-105! w-[90%]!'
    >
      {withdrawal ? (
        <div className='w-full flex flex-col gap-5 mt-4'>
          <div className='flex justify-between gap-4 font-medium text-sm text-black'>
            <p>Amount</p>
            <span>
              {withdrawal.currency} {toMajorUnits(withdrawal.amount).toLocaleString('en-NG')}
            </span>
          </div>
          <div className='flex justify-between gap-4 font-medium text-sm text-black'>
            <p>Fee</p>
            <span>
              {withdrawal.currency} {toMajorUnits(withdrawal.fee).toLocaleString('en-NG')}
            </span>
          </div>
          <div className='flex justify-between gap-4 font-medium text-sm text-black'>
            <p>Destination</p>
            <span>{withdrawal.destination}</span>
          </div>
          <div className='flex justify-between gap-4 font-medium text-sm text-black'>
            <span>Status</span>
            <StatusBadge
              value={withdrawal.status}
              statusConfig={WithdrawalStatusConfig}
            />
          </div>
          <div className='flex justify-between gap-4 font-medium text-sm text-black'>
            <span>Date</span>
            <span>{new Date(withdrawal.createdAt).toLocaleString()}</span>
          </div>
          {withdrawal.failureReason && (
            <div className='flex justify-between gap-4 font-medium text-sm text-black'>
              <span className='text-neutral-10'>Failure reason</span>
              <span className='font-medium text-error text-sm'>
                {withdrawal.failureReason}
              </span>
            </div>
          )}
          <Button
            type='button'
            text='Done'
            variation='primary'
            size='large'
            onClick={handleDone}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className='w-full flex flex-col gap-2.5 mt-2.5'
        >
          <OtpInput
            length={6}
            name='code'
            value={values.code}
            hasTitle
            title='Enter Code'
            onChange={(val) => setFieldValue('code', val)}
            onComplete={() => setFieldTouched('code', true)}
            errors={errors.code && touched.code ? errors.code : ''}
          />
          <Button
            type='submit'
            text='Confirm Withdrawal'
            variation='primary'
            className='mt-2.5'
            size='large'
            loading={isPending}
            disabled={isPending}
          />
        </form>
      )}
    </ModalComponent>
  )
}

export default ConfirmWithdrawal
