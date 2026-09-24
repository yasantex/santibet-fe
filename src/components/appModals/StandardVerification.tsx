import { useState } from 'react'
import { useFormik } from 'formik'
import { isAxiosError } from 'axios'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import CustomSelector from '../globals/CustomSelector'
import DateInput from '../globals/DateInput'
import KycDocumentUpload from '../../pages/account/profileTabs/KycDocumentUpload'
import { useSantiBetMutation } from '../../data_layer/utils'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { kycStatusBadge } from '../../utils/status'
import type { BaseApiResponse, KycStatusResponse } from '../../types/types'

type KycPayload = {
  idType: string
  idNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

const idTypeOptions = [
  { label: 'BVN', value: 'BVN' },
  { label: 'NIN', value: 'NIN' },
  { label: "Voter's Card", value: "voter's card" },
  { label: "Driver's Licence", value: "driver's licence" },
]

// Statuses where the user can (re)submit verification.
const SUBMITTABLE_STATUSES = ['NOT_STARTED', 'REJECTED', 'MORE_INFO_REQUIRED']

type VerifyMethod = 'idNumber' | 'upload'

type StandardVerificationProps = ModalProps & {
  kycStatus: KycStatusResponse | undefined
  kycLoading: boolean
  refetchKyc: () => void
}

const StandardVerification = ({
  open,
  handleClose,
  kycStatus,
  kycLoading,
  refetchKyc,
}: StandardVerificationProps) => {
  const [method, setMethod] = useState<VerifyMethod>('idNumber')
  const badge = kycStatusBadge(kycStatus?.status)
  const canSubmit = SUBMITTABLE_STATUSES.includes(kycStatus?.status ?? '')

  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    BaseApiResponse,
    KycPayload
  >({
    path: '/kyc/verify',
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
        showSuccessToast(data?.message)
        refetchKyc()
      },
    },
  })

  const {
    values,
    errors,
    touched,
    handleSubmit,
    handleChange,
    handleBlur,
    setFieldValue,
  } = useFormik<KycPayload>({
    initialValues: {
      idType: '',
      idNumber: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
    },

    onSubmit: async (vals) => {
      try {
        await postVerify(vals)
      } catch {
        // Already surfaced via the mutation's onError toast above.
      }
    },
  })

  return (
    <ModalComponent
      open={open}
      handleClose={handleClose}
      title='Standard verification'
      subtitle='Verify your identity to unlock withdrawals.'
      className='max-w-125! w-[90%]!'
    >
      {kycLoading ? (
        <div className='h-11 w-full animate-pulse rounded-lg bg-neutral-10/20' />
      ) : canSubmit ? (
        <div className='flex w-full flex-col gap-3'>
          {kycStatus?.rejectionReason && kycStatus.status !== 'NOT_STARTED' && (
            <p className='rounded-lg bg-error-bg px-3 py-2.5 text-xs font-medium text-error'>
              {kycStatus.rejectionReason}
            </p>
          )}

          <div className='flex items-center gap-1 rounded-full bg-hover p-1'>
            {(
              [
                { value: 'idNumber', label: 'ID number' },
                { value: 'upload', label: 'Upload document' },
              ] as const
            ).map((m) => (
              <button
                key={m.value}
                type='button'
                onClick={() => setMethod(m.value)}
                className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors ${
                  method === m.value
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-10 hover:text-black'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === 'upload' ? (
            <KycDocumentUpload onSubmitted={refetchKyc} />
          ) : (
            <form
              onSubmit={handleSubmit}
              className='w-full flex flex-col gap-2.5'
            >
              <CustomSelector
                options={idTypeOptions}
                value={values.idType}
                onChange={(value) => setFieldValue('idType', value)}
                placeholder='Select ID type'
                containerClassName='w-full'
              />

              <FormInput
                type='text'
                name='idNumber'
                value={values.idNumber}
                placeholder='Enter ID number'
                onChange={handleChange}
                onBlur={handleBlur}
                errors={
                  errors.idNumber && touched.idNumber ? errors.idNumber : ''
                }
              />

              <FormInput
                type='text'
                name='firstName'
                value={values.firstName}
                placeholder='Enter first name'
                onChange={handleChange}
                onBlur={handleBlur}
                errors={
                  errors.firstName && touched.firstName ? errors.firstName : ''
                }
              />

              <FormInput
                type='text'
                name='lastName'
                value={values.lastName}
                placeholder='Enter last name'
                onChange={handleChange}
                onBlur={handleBlur}
                errors={
                  errors.lastName && touched.lastName ? errors.lastName : ''
                }
              />
              <DateInput
                value={values.dateOfBirth}
                onChange={(date) => setFieldValue('dateOfBirth', date)}
                placeholder='select date'
                errors={
                  errors.dateOfBirth && touched.dateOfBirth
                    ? errors.dateOfBirth
                    : ''
                }
                containerClassName='w-full'
              />

              <Button
                type='submit'
                text='Verify KYC'
                variation='primary'
                className='mt-2.5'
                size='large'
                loading={isPending}
                disabled={isPending}
              />
            </form>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-1.5 rounded-lg bg-card p-4'>
          <span
            className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          {kycStatus?.status === 'PENDING' && (
            <p className='text-xs text-placeholder'>
              We’re reviewing your details
              {kycStatus.submittedAt
                ? ` (submitted ${new Date(kycStatus.submittedAt).toLocaleDateString()})`
                : ''}
              . You’ll be notified once it’s done.
            </p>
          )}
        </div>
      )}
    </ModalComponent>
  )
}

export default StandardVerification
