import { Button } from '../../../components/globals/Button'
import { useFormik } from 'formik'
import type {
  BaseApiResponse,
  KycStatusResponse,
  UserData,
} from '../../../types/types'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { FormInput } from '../../../components/globals/FormInput'
import CustomSelector from '../../../components/globals/CustomSelector'
import DateInput from '../../../components/globals/DateInput'

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

type VerificationTabProps = {
  profile: UserData | null | undefined
  kycStatus: KycStatusResponse | undefined
  kycLoading: boolean
  refetchKyc: () => void
  onVerifyEmail: () => void
  onVerifyPhone: () => void
}

const VerificationTab = ({
  profile,
  kycStatus,
  kycLoading,
  refetchKyc,
  onVerifyEmail,
  onVerifyPhone,
}: VerificationTabProps) => {
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
      } catch {}
    },
  })

  return (
    <div className='flex flex-col gap-5'>
      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            Phone verification
          </h2>
          <p className='text-xs text-placeholder'>
            Used to secure your account and send login alerts.
          </p>
        </div>
        <div className='flex items-center justify-between rounded-lg bg-card p-4'>
          <p className='text-sm text-black'>{profile?.phone ?? '—'}</p>
          {profile?.phoneVerified ? (
            <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
              Verified
            </span>
          ) : (
            <Button
              onClick={onVerifyPhone}
              type='button'
              size='small'
              text='Verify phone'
              variation='error'
              className='w-fit!'
            />
          )}
        </div>
      </section>

      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            Email verification
          </h2>
          <p className='text-xs text-placeholder'>
            Used for payout confirmations and account alerts.
          </p>
        </div>
        <div className='flex items-center justify-between rounded-lg bg-card p-4'>
          <p className='text-sm text-black'>{profile?.email ?? '—'}</p>
          {profile?.emailVerified ? (
            <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
              Verified
            </span>
          ) : (
            <Button
              onClick={onVerifyEmail}
              type='button'
              size='small'
              text='Verify email'
              variation='error'
              className='w-fit!'
            />
          )}
        </div>
      </section>

      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            KYC verification
          </h2>
          <p className='text-xs text-placeholder'>
            Your verified legal name will be used to secure future
            withdrawals and payout accounts.
          </p>
        </div>

        {kycLoading ? (
          <div className='h-11 w-full animate-pulse rounded-lg bg-neutral-10/20' />
        ) : kycStatus?.status === 'NOT_STARTED' ? (
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
        ) : (
          <div className='flex items-center rounded-lg bg-card p-4'>
            <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
              Verified
            </span>
          </div>
        )}
      </section>
    </div>
  )
}

export default VerificationTab
