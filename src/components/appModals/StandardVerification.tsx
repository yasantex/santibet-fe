import { useState } from 'react'
import { useFormik } from 'formik'
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
import {
  idNumberError,
  kycErrorMessage,
  normalizeIdNumber,
} from '../../utils/kyc'
import {
  isAdult,
  latestAdultBirthDate,
  UNDERAGE_MESSAGE,
} from '../../utils/age'
import type { KycStatusResponse, UserData } from '../../types/types'

type KycPayload = {
  idType: string
  idNumber: string
  firstName: string
  /** Optional; sent only when filled in. */
  middleName: string
  lastName: string
  dateOfBirth: string
}

type NamePayload = { firstName: string; lastName: string }

const idTypeOptions = [
  { label: 'BVN', value: 'BVN' },
  { label: 'NIN', value: 'NIN' },
  { label: "Voter's Card", value: 'VOTERS_CARD' },
  { label: "Driver's Licence", value: 'DRIVERS_LICENSE' },
]

// Statuses where the user can (re)submit verification.
const SUBMITTABLE_STATUSES = ['NOT_STARTED', 'REJECTED', 'MORE_INFO_REQUIRED']

type VerifyMethod = 'idNumber' | 'upload'

// Both flows start by capturing the name exactly as it is on the ID, so the
// document can be checked against it (SB-009). Then the ID-number flow asks
// for the ID and date of birth; the upload flow for the document.
// Each step lists the fields it gates.
const MANUAL_STEPS: (keyof KycPayload)[][] = [
  ['firstName', 'lastName'],
  ['idType', 'idNumber'],
  ['dateOfBirth'],
]
const NAME_STEP = 0

type StandardVerificationProps = ModalProps & {
  kycStatus: KycStatusResponse | undefined
  kycLoading: boolean
  refetchKyc: () => void
  /** Prefills the name and date of birth. */
  profile?: UserData | null
  /** Called after the name step saves a corrected name to the profile. */
  onProfileUpdated?: () => void
}

const StandardVerification = ({
  open,
  handleClose,
  kycStatus,
  kycLoading,
  refetchKyc,
  profile,
  onProfileUpdated,
}: StandardVerificationProps) => {
  const [method, setMethod] = useState<VerifyMethod>('idNumber')
  const [step, setStep] = useState(0)
  // Set when an ID-number check fails — opens a prompt pointing the user to
  // the document upload instead. Holds the API's reason, if it gave one.
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const badge = kycStatusBadge(kycStatus?.status)
  const canSubmit = SUBMITTABLE_STATUSES.includes(kycStatus?.status ?? '')

  // Returns the KYC status, not a message: APPROVED on a name match;
  // anything else means the ID couldn't be confirmed.
  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    KycStatusResponse,
    KycPayload
  >({
    path: '/kyc/verify',
    mutationOptions: {
      onError: (error) => {
        setFailureMessage(kycErrorMessage(error))
      },
      onSuccess: (data) => {
        refetchKyc()
        if (data?.status === 'APPROVED') {
          showSuccessToast('You’re verified')
        } else {
          setFailureMessage(
            data?.rejectionReason
              ? kycErrorMessage(data.rejectionReason)
              : '',
          )
        }
      },
    },
  })

  // The name on the ID is saved to the profile, so the backend can match the
  // submitted document against it.
  const [nameError, setNameError] = useState('')
  const { mutateAsync: patchName, isPending: savingName } = useSantiBetMutation<
    UserData,
    NamePayload
  >({ path: '/auth/me', method: 'PATCH' })

  const {
    values,
    errors,
    touched,
    submitForm,
    handleChange,
    handleBlur,
    setFieldValue,
  } = useFormik<KycPayload>({
    // Refills once the profile loads; typing isn't lost after that.
    enableReinitialize: true,
    initialValues: {
      idType: '',
      idNumber: '',
      firstName: profile?.firstName ?? '',
      middleName: '',
      lastName: profile?.lastName ?? '',
      dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? '',
    },

    onSubmit: async ({ middleName, ...vals }) => {
      if (!isAdult(vals.dateOfBirth)) return
      try {
        await postVerify({
          ...vals,
          idNumber: normalizeIdNumber(vals.idNumber),
          firstName: vals.firstName.trim(),
          lastName: vals.lastName.trim(),
          // Not in the API schema yet; harmless until the backend reads it.
          ...(middleName.trim() ? { middleName: middleName.trim() } : {}),
        } as KycPayload)
      } catch {
        // Already surfaced via the failure modal (see onError above).
      }
    },
  })

  // Saves a corrected name before moving on from the name step.
  const confirmName = async () => {
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()
    setNameError('')
    if (
      firstName === (profile?.firstName ?? '').trim() &&
      lastName === (profile?.lastName ?? '').trim()
    ) {
      setStep(NAME_STEP + 1)
      return
    }
    try {
      await patchName({ firstName, lastName })
      onProfileUpdated?.()
      setStep(NAME_STEP + 1)
    } catch (error) {
      setNameError(
        kycErrorMessage(error, 'We couldn’t save your name. Try again.'),
      )
    }
  }

  // Label of the picked ID type ("BVN", "Voter's Card") for field hints.
  const idTypeLabel =
    idTypeOptions.find((o) => o.value === values.idType)?.label ?? 'your ID'

  const changeMethod = (m: VerifyMethod) => {
    setMethod(m)
    setStep(0)
  }

  const totalSteps =
    method === 'upload' ? 1 + UPLOAD_STEPS : MANUAL_STEPS.length
  // 18+ only: an under-age date of birth can't be submitted.
  const dobError =
    values.dateOfBirth && !isAdult(values.dateOfBirth) ? UNDERAGE_MESSAGE : ''
  // Format check per ID type (NIN and BVN are 11 digits, etc.).
  const idError = idNumberError(values.idType, values.idNumber)
  const stepComplete =
    MANUAL_STEPS[step]?.every((f) => values[f].trim()) &&
    !(MANUAL_STEPS[step]?.includes('dateOfBirth') && dobError) &&
    !(MANUAL_STEPS[step]?.includes('idNumber') && idError)
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

  // Shared first step of both flows.
  const nameStep = (
    <StepScreen
      title='What’s your name?'
      subtitle='Enter it exactly as it appears on your ID, including the spelling.'
      continueDisabled={
        !values.firstName.trim() || !values.lastName.trim() || savingName
      }
      loading={savingName}
      onContinue={confirmName}
      secondaryText='Not now'
      onSecondary={handleClose}
      footer={
        nameError && (
          <p role='alert' className='text-xs font-medium text-error'>
            {nameError}
          </p>
        )
      }
    >
      <FormInput
        type='text'
        name='firstName'
        value={values.firstName}
        placeholder='First name'
        onChange={handleChange}
        onBlur={handleBlur}
        errors={errors.firstName && touched.firstName ? errors.firstName : ''}
      />
      <FormInput
        type='text'
        name='middleName'
        value={values.middleName}
        placeholder='Middle name (if on your ID)'
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <FormInput
        type='text'
        name='lastName'
        value={values.lastName}
        placeholder='Last name (surname)'
        onChange={handleChange}
        onBlur={handleBlur}
        errors={errors.lastName && touched.lastName ? errors.lastName : ''}
      />
    </StepScreen>
  )

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
                <div className='flex flex-col gap-0.5 rounded-lg bg-error-bg px-3 py-2.5 text-xs text-error'>
                  <span className='font-semibold'>
                    {kycStatus.status === 'MORE_INFO_REQUIRED'
                      ? 'We need a bit more from you'
                      : 'Your last submission wasn’t approved'}
                  </span>
                  <span>{kycErrorMessage(kycStatus.rejectionReason)}</span>
                  <span className='text-neutral-10'>
                    Fix the issue above and submit again.
                  </span>
                </div>
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

            {step === NAME_STEP ? (
              nameStep
            ) : method === 'upload' ? (
              <KycDocumentUpload
                step={step - 1}
                onStepChange={(s) => setStep(s + 1)}
                onBack={() => setStep(NAME_STEP)}
                onSubmitted={refetchKyc}
              />
            ) : step === 1 ? (
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
                  inputMode={
                    values.idType === 'NIN' || values.idType === 'BVN'
                      ? 'numeric'
                      : undefined
                  }
                  placeholder={
                    values.idType
                      ? `Enter ${idTypeLabel} number`
                      : 'Enter ID number'
                  }
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errors={touched.idNumber ? idError : ''}
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
                  maxDate={latestAdultBirthDate()}
                  minDate={new Date(1900, 0, 1)}
                  placeholder='Date of birth'
                  errors={
                    dobError ||
                    (errors.dateOfBirth && touched.dateOfBirth
                      ? errors.dateOfBirth
                      : '')
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
                Submitted
                {kycStatus.submittedAt
                  ? ` on ${new Date(kycStatus.submittedAt).toLocaleDateString()}`
                  : ''}
                . We’re checking your details and usually finish within 24
                hours. We’ll notify you when it’s done; there’s nothing else
                you need to do.
              </p>
            )}
            {kycStatus?.status === 'APPROVED' && (
              <p className='text-xs text-placeholder'>
                Your identity is verified
                {kycStatus.legalName ? ` as ${kycStatus.legalName}` : ''}.
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
              // The name is already captured: go straight to the document.
              setMethod('upload')
              setStep(NAME_STEP + 1)
            }}
          />
          <Button
            type='button'
            text='Try again'
            variation='plain'
            size='large'
            onClick={() => {
              // Back to the ID step so the number can be re-checked.
              setFailureMessage(null)
              setStep(NAME_STEP + 1)
            }}
          />
        </div>
      </ModalComponent>
    </>
  )
}

export default StandardVerification
