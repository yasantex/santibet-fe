import { useState } from 'react'
import { isAxiosError } from 'axios'
import CustomSelector from '../../../components/globals/CustomSelector'
import FilePicker from '../../../components/globals/FilePicker'
import SuspendedHint from '../../../components/globals/SuspendedHint'
import { StepScreen } from '../../../components/globals/Stepper'
import { useSantiBetMutation } from '../../../data_layer/utils'
import useAccountSuspended from '../../../hooks/useAccountSuspended'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import type { BaseApiResponse } from '../../../types/types'

export const UPLOAD_STEPS = 3

const documentTypeOptions = [
  { label: 'International Passport', value: 'PASSPORT' },
  { label: 'NIN slip / card', value: 'NIN' },
  { label: "Driver's Licence", value: 'DRIVERS_LICENSE' },
  { label: "Voter's Card", value: 'VOTERS_CARD' },
]

type KycDocumentUploadProps = {
  step: number
  onStepChange: (step: number) => void
  onCancel: () => void
  onSubmitted: () => void
}

const KycDocumentUpload = ({
  step,
  onStepChange,
  onCancel,
  onSubmitted,
}: KycDocumentUploadProps) => {
  const suspended = useAccountSuspended()
  const [documentType, setDocumentType] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  const { mutateAsync: uploadDocument, isPending } = useSantiBetMutation<
    BaseApiResponse,
    FormData
  >({
    path: '/kyc/documents',
    headers: { 'Content-Type': 'multipart/form-data' },
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
        showSuccessToast(
          data?.message ?? 'Documents submitted — we’ll review them shortly',
        )
        onSubmitted()
      },
    },
  })

  const handleSubmit = async () => {
    if (!documentType || !idFile) return

    const body = new FormData()
    body.append('type', documentType)
    body.append('file', idFile)
    if (selfie) body.append('selfie', selfie)

    try {
      await uploadDocument(body)
    } catch {
      // Already surfaced via the mutation's onError toast above.
    }
  }

  // First step offers "Not now" (close), later steps step back.
  const secondary =
    step === 0
      ? { secondaryText: 'Not now', onSecondary: onCancel }
      : { secondaryText: 'Back', onSecondary: () => onStepChange(step - 1) }

  if (step === 0) {
    return (
      <StepScreen
        title='Which ID are you uploading?'
        subtitle='Choose a valid government-issued ID.'
        continueDisabled={!documentType}
        onContinue={() => onStepChange(1)}
        {...secondary}
      >
        <CustomSelector
          options={documentTypeOptions}
          value={documentType}
          onChange={(value) => setDocumentType(value)}
          placeholder='Select ID type'
          containerClassName='w-full'
        />
      </StepScreen>
    )
  }

  if (step === 1) {
    return (
      <StepScreen
        title='Upload your ID'
        subtitle='A clear photo or scan — all four corners visible, no glare.'
        continueDisabled={!idFile}
        onContinue={() => onStepChange(2)}
        {...secondary}
      >
        <FilePicker label='ID document' file={idFile} onChange={setIdFile} />
      </StepScreen>
    )
  }

  return (
    <StepScreen
      title='Add a selfie'
      subtitle='Optional — a selfie holding your ID speeds up the review. We usually review within 24 hours.'
      continueText='Submit for review'
      loading={isPending}
      continueDisabled={suspended}
      onContinue={handleSubmit}
      footer={suspended && <SuspendedHint className='text-center' />}
      {...secondary}
    >
      <FilePicker
        label='Selfie holding your ID'
        hint='Speeds up the review'
        accept={['image/jpeg', 'image/png', 'image/webp']}
        file={selfie}
        onChange={setSelfie}
      />
    </StepScreen>
  )
}

export default KycDocumentUpload
