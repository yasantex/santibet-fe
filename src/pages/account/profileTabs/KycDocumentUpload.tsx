import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import CustomSelector from '../../../components/globals/CustomSelector'
import FilePicker from '../../../components/globals/FilePicker'
import SuspendedHint from '../../../components/globals/SuspendedHint'
import { StepScreen } from '../../../components/globals/Stepper'
import { useSantiBetMutation } from '../../../data_layer/utils'
import useAccountSuspended from '../../../hooks/useAccountSuspended'
import { showSuccessToast } from '../../../utils/toastUtils'
import { checkIdImageReadable, kycErrorMessage } from '../../../utils/kyc'
import type { BaseApiResponse } from '../../../types/types'

/** Steps this component renders: ID type, ID photo, selfie. */
export const UPLOAD_STEPS = 3

const documentTypeOptions = [
  { label: 'International Passport', value: 'PASSPORT' },
  { label: 'NIN slip / card', value: 'NIN' },
  { label: "Driver's Licence", value: 'DRIVERS_LICENSE' },
  { label: "Voter's Card", value: 'VOTERS_CARD' },
]

/** What reviewers need to see. Shown before the player picks a file. */
const ID_CHECKLIST = [
  'A valid, unexpired government-issued ID',
  'Your full name, photo, date of birth and ID number clearly visible',
  'The same name as shown above',
  'All four corners in frame, in focus, with no glare or cover',
  'JPG, PNG, WEBP or PDF, up to 5 MB',
]

const Checklist = ({ items }: { items: string[] }) => (
  <ul className='flex flex-col gap-1.5 rounded-lg bg-card p-3'>
    {items.map((item) => (
      <li key={item} className='flex items-start gap-2 text-xs text-neutral-10'>
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={14}
          className='mt-px shrink-0 text-success'
        />
        {item}
      </li>
    ))}
  </ul>
)

type KycDocumentUploadProps = {
  /** 0-based step within the upload flow. */
  step: number
  onStepChange: (step: number) => void
  /** Leave the upload flow from its first step. */
  onBack: () => void
  onSubmitted: () => void
  /** Extra content on the first screen (the name on the ID). */
  intro?: ReactNode
  /**
   * Runs before leaving the first screen; resolve false to stay on it
   * (e.g. the name couldn't be saved).
   */
  onFirstContinue?: () => Promise<boolean>
  /** Blocks leaving the first screen (e.g. the name is incomplete). */
  firstContinueBlocked?: boolean
  firstContinueLoading?: boolean
}

const KycDocumentUpload = ({
  step,
  onStepChange,
  onBack,
  onSubmitted,
  intro,
  onFirstContinue,
  firstContinueBlocked,
  firstContinueLoading,
}: KycDocumentUploadProps) => {
  const suspended = useAccountSuspended()
  const [documentType, setDocumentType] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  // Shown inline on the last step, so the player can fix it and resubmit.
  const [submitError, setSubmitError] = useState('')

  const { mutateAsync: uploadDocument, isPending } = useSantiBetMutation<
    BaseApiResponse,
    FormData
  >({
    path: '/kyc/documents',
    headers: { 'Content-Type': 'multipart/form-data' },
    mutationOptions: {
      onError: (error) => {
        setSubmitError(
          kycErrorMessage(
            error,
            'We couldn’t upload your documents. Check the files and try again.',
          ),
        )
      },
      onSuccess: () => {
        showSuccessToast(
          'Documents submitted. We’ll review them and let you know the result.',
        )
        onSubmitted()
      },
    },
  })

  const handleSubmit = async () => {
    if (!documentType || !idFile) return
    setSubmitError('')

    const body = new FormData()
    body.append('type', documentType)
    body.append('file', idFile)
    if (selfie) body.append('selfie', selfie)

    try {
      await uploadDocument(body)
    } catch {
      // Shown inline via onError above.
    }
  }

  const back = () => (step === 0 ? onBack() : onStepChange(step - 1))

  if (step === 0) {
    return (
      <StepScreen
        title='Which ID are you uploading?'
        subtitle='Choose a valid government-issued ID.'
        continueDisabled={!documentType || firstContinueBlocked}
        loading={firstContinueLoading}
        onContinue={async () => {
          if (onFirstContinue && !(await onFirstContinue())) return
          onStepChange(1)
        }}
        secondaryText='Not now'
        onSecondary={back}
      >
        <CustomSelector
          options={documentTypeOptions}
          value={documentType}
          onChange={(value) => setDocumentType(value)}
          placeholder='Select ID type'
          containerClassName='w-full'
        />
        {intro}
        <p className='text-xs font-medium text-black'>Before you upload</p>
        <Checklist items={ID_CHECKLIST} />
      </StepScreen>
    )
  }

  if (step === 1) {
    return (
      <StepScreen
        title='Upload your ID'
        subtitle='A clear photo or scan of the whole document. Blurry, cropped or edited images are rejected.'
        continueDisabled={!idFile}
        onContinue={() => onStepChange(2)}
        secondaryText='Back'
        onSecondary={back}
      >
        <FilePicker
          label='ID document'
          file={idFile}
          onChange={setIdFile}
          validate={checkIdImageReadable}
        />
      </StepScreen>
    )
  }

  return (
    <StepScreen
      title='Add a selfie'
      subtitle='Optional. A selfie holding your ID speeds up the review. We usually review within 24 hours.'
      continueText={isPending ? 'Uploading…' : 'Submit for review'}
      loading={isPending}
      continueDisabled={suspended}
      onContinue={handleSubmit}
      footer={
        <>
          {submitError && (
            <p
              role='alert'
              className='rounded-lg bg-error-bg px-3 py-2.5 text-xs font-medium text-error'
            >
              {submitError}
            </p>
          )}
          {suspended && <SuspendedHint className='text-center' />}
        </>
      }
      secondaryText='Back'
      onSecondary={back}
    >
      <FilePicker
        label='Selfie holding your ID'
        // No PDF for the selfie (API accepts JPG/PNG/WEBP, ≤ 5 MB).
        accept={['image/jpeg', 'image/png', 'image/webp']}
        file={selfie}
        onChange={setSelfie}
        validate={checkIdImageReadable}
      />
    </StepScreen>
  )
}

export default KycDocumentUpload
