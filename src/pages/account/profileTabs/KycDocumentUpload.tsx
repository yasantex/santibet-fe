import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Button } from '../../../components/globals/Button'
import CustomSelector from '../../../components/globals/CustomSelector'
import FilePicker from '../../../components/globals/FilePicker'
import SuspendedHint from '../../../components/globals/SuspendedHint'
import { useSantiBetMutation } from '../../../data_layer/utils'
import useAccountSuspended from '../../../hooks/useAccountSuspended'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import type { BaseApiResponse } from '../../../types/types'


const documentTypeOptions = [
  { label: 'International Passport', value: 'PASSPORT' },
  { label: 'NIN slip / card', value: 'NIN' },
  { label: "Driver's Licence", value: 'DRIVERS_LICENSE' },
  { label: "Voter's Card", value: 'VOTERS_CARD' },
]

type KycDocumentUploadProps = {
  onSubmitted: () => void
}

const KycDocumentUpload = ({ onSubmitted }: KycDocumentUploadProps) => {
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
    if (!documentType) {
      showWarningToast('Select the type of ID you are uploading')
      return
    }
    if (!idFile) {
      showWarningToast('Attach a photo or scan of your ID')
      return
    }

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

  return (
    <div className='flex w-full flex-col gap-3'>
      <p className='text-sm text-neutral-10'>
        Upload a clear photo or scan of a valid government ID. Our team will
        review it, usually within 24 hours.
      </p>

      <CustomSelector
        options={documentTypeOptions}
        value={documentType}
        onChange={(value) => setDocumentType(value)}
        placeholder='Select ID type'
        containerClassName='w-full'
      />

      <FilePicker label='ID document' file={idFile} onChange={setIdFile} />

      <FilePicker
        label='Selfie holding your ID'
        hint='Speeds up the review'
        accept={['image/jpeg', 'image/png', 'image/webp']}
        file={selfie}
        onChange={setSelfie}
      />

      <Button
        type='button'
        text='Submit for review'
        variation='primary'
        className='mt-2.5'
        size='large'
        loading={isPending}
        disabled={isPending || suspended}
        onClick={handleSubmit}
      />
      {suspended && <SuspendedHint className='text-center' />}
    </div>
  )
}

export default KycDocumentUpload
