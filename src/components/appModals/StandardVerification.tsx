import { useState } from 'react'
import { useFormik } from 'formik'
import { isAxiosError } from 'axios'
import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import CustomSelector from '../globals/CustomSelector'
import DateInput from '../globals/DateInput'
import { Stepper, StepScreen } from '../globals/Stepper'
import KycDocumentUpload, {
  UPLOAD_STEPS,
} from '../../pages/account/profileTabs/KycDocumentUpload'
import { useSantiBetMutation } from '../../data_layer/utils'
import { showSuccessToast } from '../../utils/toastUtils'
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

// Manual flow: ID → name → date of birth. Each step lists the fields it gates.
const MANUAL_STEPS: (keyof KycPayload)[][] = [
  ['idType', 'idNumber'],
  ['firstName', 'lastName'],
  ['dateOfBirth'],
]

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
  const [step, setStep] = useState(0)
  // Set when an ID-number check fails — opens a prompt pointing the user to
  // the document upload instead. Holds the API's reason, if it gave one.
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const badge = kycStatusBadge(kycStatus?.status)
  const canSubmit = SUBMITTABLE_STATUSES.includes(kycStatus?.status ?? '')

  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    BaseApiResponse,
    KycPayload
  >({
    path: '/kyc/verify',
    mutationOptions: {
      onError: (error) => {
        setFailureMessage(
          (isAxiosError(error) ? error.response?.data?.message : null) ??
            error.message ??
            '',
        )
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
    submitForm,
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
        // Already surfaced via the failure modal (see onError above).
      }
    },
  })

  // Label of the picked ID type ("BVN", "Voter's Card") for field hints.
  const idTypeLabel =
    idTypeOptions.find((o) => o.value === values.idType)?.label ?? 'your ID'

  const changeMethod = (m: VerifyMethod) => {
    setMethod(m)
    setStep(0)
  }

  const totalSteps = method === 'upload' ? UPLOAD_STEPS : MANUAL_STEPS.length
  const stepComplete = MANUAL_STEPS[step]?.every((f) => values[f].trim())
  const isLastStep = step === MANUAL_STEPS.length - 1

  const manualSecondary =
    step === 0
      ? { secondaryText: 'Not now', onSecondary: handleClose }
      : { secondaryText: 'Back', onSecondary: () => setStep(step - 1) }

  const manualStepProps = {
    continueDisabled: !stepComplete,
    continueText: isLastStep ? 'Verify' : 'Continue',
    loading: isLastStep && isPending,
    onContinue: () => (isLastStep ? submitForm() : setStep(step + 1)),
    ...manualSecondary,
  }

  return (
    <>
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
            {kycStatus?.rejectionReason &&
              kycStatus.status !== 'NOT_STARTED' && (
                <p className='rounded-lg bg-error-bg px-3 py-2.5 text-xs font-medium text-error'>
                  {kycStatus.rejectionReason}
                </p>
              )}

            {/* Method can only be switched before the flow is underway. */}
            {step === 0 && (
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
                    onClick={() => changeMethod(m.value)}
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
            )}

            <Stepper steps={totalSteps} current={step} className='my-2' />

            {method === 'upload' ? (
              <KycDocumentUpload
                step={step}
                onStepChange={setStep}
                onCancel={handleClose}
                onSubmitted={refetchKyc}
              />
            ) : step === 0 ? (
              <StepScreen title='Which ID will you use?' {...manualStepProps}>
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
                  placeholder={
                    values.idType
                      ? `Enter ${idTypeLabel} number`
                      : 'Enter ID number'
                  }
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errors={
                    errors.idNumber && touched.idNumber ? errors.idNumber : ''
                  }
                />
              </StepScreen>
            ) : step === 1 ? (
              <StepScreen
                title='What’s your name?'
                subtitle={`Enter it exactly as it appears on ${idTypeLabel}.`}
                {...manualStepProps}
              >
                <FormInput
                  type='text'
                  name='firstName'
                  value={values.firstName}
                  placeholder='Legal first name'
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
                  placeholder='Legal last name'
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errors={
                    errors.lastName && touched.lastName ? errors.lastName : ''
                  }
                />
              </StepScreen>
            ) : (
              <StepScreen
                title='When were you born?'
                subtitle={`Use the date of birth on ${idTypeLabel}.`}
                {...manualStepProps}
              >
                <DateInput
                  value={values.dateOfBirth}
                  onChange={(date) => setFieldValue('dateOfBirth', date ?? '')}
                  placeholder='Date of birth'
                  errors={
                    errors.dateOfBirth && touched.dateOfBirth
                      ? errors.dateOfBirth
                      : ''
                  }
                  containerClassName='w-full'
                />
              </StepScreen>
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

      <ModalComponent
        open={open && failureMessage !== null}
        handleClose={() => setFailureMessage(null)}
        title='Verification failed'
        subtitle="We couldn't verify your ID number."
        className='max-w-100! w-[90%]!'
      >
        <div className='flex w-full flex-col gap-3'>
          {failureMessage && (
            <p className='rounded-lg bg-error-bg px-3 py-2.5 text-xs font-medium text-error'>
              {failureMessage}
            </p>
          )}
          <p className='text-sm text-neutral-10'>
            Please verify by uploading a photo of your ID document instead.
          </p>
          <Button
            type='button'
            text='Upload document'
            variation='primary'
            size='large'
            onClick={() => {
              setFailureMessage(null)
              changeMethod('upload')
            }}
          />
          <Button
            type='button'
            text='Try again'
            variation='plain'
            size='large'
            onClick={() => {
              // Back to the start so the ID number can be re-checked.
              setFailureMessage(null)
              setStep(0)
            }}
          />
        </div>
      </ModalComponent>
    </>
  )
}

export default StandardVerification
