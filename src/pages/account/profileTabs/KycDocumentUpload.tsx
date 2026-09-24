import { useRef, useState, type ChangeEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CloudUploadIcon,
  MultiplicationSignIcon,
} from '@hugeicons/core-free-icons'
import { isAxiosError } from 'axios'
import { Button } from '../../../components/globals/Button'
import CustomSelector from '../../../components/globals/CustomSelector'
import SuspendedHint from '../../../components/globals/SuspendedHint'
import { useSantiBetMutation } from '../../../data_layer/utils'
import useAccountSuspended from '../../../hooks/useAccountSuspended'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import type { BaseApiResponse } from '../../../types/types'

/**
 * Manual KYC: the user uploads their ID (and optionally a selfie) and an admin
 * reviews it. Each file is its own document on the backend:
 *   POST /kyc/documents  multipart/form-data  { type, file }
 */
const KYC_DOCUMENTS_PATH = '/kyc/documents'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')

// Values match the backend's KycDocumentType.
const documentTypeOptions = [
  { label: 'International Passport', value: 'PASSPORT' },
  { label: 'NIN slip / card', value: 'NIN' },
  { label: "Driver's Licence", value: 'DRIVERS_LICENSE' },
  { label: "Voter's Card", value: 'VOTERS_CARD' },
]

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`

const validateFile = (file: File) => {
  if (!ACCEPTED_TYPES.includes(file.type))
    return 'Upload a JPG, PNG, WEBP or PDF file'
  if (file.size > MAX_FILE_BYTES) return 'File must be 5 MB or smaller'
  return null
}

type FilePickerProps = {
  label: string
  hint: string
  file: File | null
  onChange: (file: File | null) => void
}

const FilePicker = ({ label, hint, file, onChange }: FilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    // Reset so picking the same file again still fires onChange.
    e.target.value = ''
    if (!selected) return
    const error = validateFile(selected)
    if (error) {
      showWarningToast(error)
      return
    }
    onChange(selected)
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-xs font-medium text-black'>{label}</span>
      {file ? (
        <div className='flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5'>
          <div className='flex min-w-0 flex-col'>
            <span className='truncate text-sm font-medium text-black'>
              {file.name}
            </span>
            <span className='text-[11px] text-placeholder'>
              {formatSize(file.size)}
            </span>
          </div>
          <button
            type='button'
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={() => onChange(null)}
            className='shrink-0 rounded-md p-1 hover:bg-hover'
          >
            <HugeiconsIcon icon={MultiplicationSignIcon} size={16} />
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-3 py-5 text-center transition-colors hover:bg-hover'
        >
          <HugeiconsIcon
            icon={CloudUploadIcon}
            size={22}
            className='text-neutral-10'
          />
          <span className='text-sm font-medium text-black'>Choose file</span>
          <span className='text-[11px] text-placeholder'>{hint}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT_ATTR}
        className='hidden'
        onChange={handleSelect}
      />
    </div>
  )
}

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
    path: KYC_DOCUMENTS_PATH,
    // Overrides the hook's JSON default — with a JSON content type axios
    // would serialise the FormData to JSON and drop the file. Axios then
    // clears this in the browser so the boundary gets set automatically.
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const toFormData = (type: string, file: File) => {
    const body = new FormData()
    body.append('type', type)
    body.append('file', file)
    return body
  }

  const handleSubmit = async () => {
    if (!documentType) {
      showWarningToast('Select the type of ID you are uploading')
      return
    }
    if (!idFile) {
      showWarningToast('Attach a photo or scan of your ID')
      return
    }

    try {
      await uploadDocument(toFormData(documentType, idFile))
      if (selfie) await uploadDocument(toFormData('SELFIE', selfie))
      showSuccessToast('Documents submitted — we’ll review them shortly')
      onSubmitted()
    } catch (error) {
      showWarningToast(
        isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not upload your document')
          : 'Could not upload your document',
      )
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

      <FilePicker
        label='ID document'
        hint='JPG, PNG, WEBP or PDF · max 5 MB'
        file={idFile}
        onChange={setIdFile}
      />

      <FilePicker
        label='Selfie holding your ID'
        hint='Speeds up the review'
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
