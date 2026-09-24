import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LockIcon } from '@hugeicons/core-free-icons'
import { Button } from '../../../components/globals/Button'
import ModalComponent from '../../../components/globals/ModalComponent'
import { useFormik } from 'formik'
import type { BaseApiResponse, KycStatusResponse } from '../../../types/types'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { FormInput } from '../../../components/globals/FormInput'
import CustomSelector from '../../../components/globals/CustomSelector'
import DateInput from '../../../components/globals/DateInput'
import KycDocumentUpload from './KycDocumentUpload'

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

const statusBadge = (status: string | undefined) => {
  switch (status) {
    case undefined:
    case '':
    case 'NOT_STARTED':
      return { label: 'Not verified', className: 'bg-surface-error text-error' }
    case 'PENDING':
      return { label: 'Under review', className: 'bg-warning/10 text-warning' }
    case 'REJECTED':
      return { label: 'Rejected', className: 'bg-surface-error text-error' }
    case 'MORE_INFO_REQUIRED':
      return { label: 'Action needed', className: 'bg-warning/10 text-warning' }
    default:
      return { label: 'Verified', className: 'bg-surface-success text-success' }
  }
}

type VerifyMethod = 'idNumber' | 'upload'

type KycTabProps = {
  kycStatus: KycStatusResponse | undefined
  kycLoading: boolean
  refetchKyc: () => void
}

const KycTab = ({ kycStatus, kycLoading, refetchKyc }: KycTabProps) => {
  const [kycModalOpen, setKycModalOpen] = useState(false)
  const [method, setMethod] = useState<VerifyMethod>('idNumber')
  const badge = statusBadge(kycStatus?.status)
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
    <div className='flex flex-col gap-5'>
      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            Verification levels
          </h2>
          <p className='text-xs text-placeholder'>
            Complete verification to unlock higher deposit and withdrawal
            limits.
          </p>
        </div>

        <div className='flex flex-col gap-3'>
          {/* Basic — verified automatically on sign up */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-neutral-10' />
                <span className='text-sm font-semibold text-black'>Basic</span>
              </div>
              <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
                Auto-verified
              </span>
            </div>
            <p className='text-xs text-placeholder'>
              Email or phone — confirmed automatically when you sign up.
            </p>
            <div className='grid grid-cols-2 gap-3 rounded-lg p-3'>
              <div>
                <p className='text-[11px] text-placeholder'>Deposit</p>
                <p className='text-sm font-medium text-black'>No minimum</p>
              </div>
              <div>
                <p className='text-[11px] text-placeholder'>Max withdrawal</p>
                <p className='text-sm font-medium text-black'>500,000</p>
              </div>
            </div>
          </div>

          {/* Standard — government ID verification */}
          <button
            type='button'
            onClick={() => setKycModalOpen(true)}
            className='flex flex-col gap-3 rounded-2xl cursor-pointer border border-border bg-card p-4 text-left transition-colors hover:bg-hover'
          >
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-brand-green' />
                <span className='text-sm font-semibold text-black'>
                  Standard
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {kycLoading ? (
                  <span className='h-5 w-16 animate-pulse rounded-full bg-neutral-10/20' />
                ) : (
                  <span
                    className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className='shrink-0 text-neutral-10'
                />
              </div>
            </div>
            <p className='text-xs text-placeholder'>
              Government ID, full name and date of birth.
            </p>
            <div className='grid grid-cols-2 gap-3 rounded-lg p-3'>
              <div>
                <p className='text-[11px] text-placeholder'>Deposit</p>
                <p className='text-sm font-medium text-black'>No minimum</p>
              </div>
              <div>
                <p className='text-[11px] text-placeholder'>Max withdrawal</p>
                <p className='text-sm font-medium text-black'>-</p>
              </div>
            </div>
          </button>

          {/* Advanced — not implemented yet */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 opacity-60'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-warning' />
                <span className='text-sm font-semibold text-black'>
                  Advanced
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-xs font-semibold text-placeholder'>
                <HugeiconsIcon icon={LockIcon} size={14} />
                Coming soon
              </div>
            </div>
            <p className='text-xs text-placeholder'>
              Bank statement or payslip.
            </p>
            <div className='grid grid-cols-2 gap-3 rounded-lg p-3'>
              <div>
                <p className='text-[11px] text-placeholder'>Deposit</p>
                <p className='text-sm font-medium text-black'>No minimum</p>
              </div>
              <div>
                <p className='text-[11px] text-placeholder'>Max withdrawal</p>
                <p className='text-sm font-medium text-black'>-</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModalComponent
        open={kycModalOpen}
        handleClose={() => setKycModalOpen(false)}
        title='Standard verification'
        subtitle='Verify your identity to unlock withdrawals.'
        className='max-w-125! w-[90%]!'
      >
        {kycLoading ? (
          <div className='h-11 w-full animate-pulse rounded-lg bg-neutral-10/20' />
        ) : canSubmit ? (
          <div className='flex w-full flex-col gap-3'>
            {kycStatus?.rejectionReason &&
              kycStatus.status !== 'NOT_STARTED' && (
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
                    errors.firstName && touched.firstName
                      ? errors.firstName
                      : ''
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
    </div>
  )
}

export default KycTab
