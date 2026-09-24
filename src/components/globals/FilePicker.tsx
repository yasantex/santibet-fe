import { useRef, type ChangeEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CloudUploadIcon,
  MultiplicationSignIcon,
} from '@hugeicons/core-free-icons'
import { showWarningToast } from '../../utils/toastUtils'

const DEFAULT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`

export type FilePickerProps = {
  label: string
  file: File | null
  onChange: (file: File | null) => void
  /** Subtext under "Choose file"; defaults to the accepted types and size. */
  hint?: string
  /** Allowed MIME types. Defaults to JPG, PNG, WEBP and PDF. */
  accept?: string[]
  /** Maximum file size in bytes. Defaults to 5 MB. */
  maxBytes?: number
  disabled?: boolean
}

/**
 * Single-file picker: a dashed "Choose file" button that becomes a file row
 * (name, size, remove) once a file is selected. Rejects files outside
 * `accept` or over `maxBytes` with a toast.
 */
const FilePicker = ({
  label,
  file,
  onChange,
  hint,
  accept = DEFAULT_ACCEPT,
  maxBytes = DEFAULT_MAX_BYTES,
  disabled = false,
}: FilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptedLabel = accept
    .map((type) => type.split('/')[1]?.toUpperCase().replace('JPEG', 'JPG'))
    .join(', ')

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    // Reset so picking the same file again still fires onChange.
    e.target.value = ''
    if (!selected) return
    if (!accept.includes(selected.type)) {
      showWarningToast(`Upload a ${acceptedLabel} file`)
      return
    }
    if (selected.size > maxBytes) {
      showWarningToast(`File must be ${formatSize(maxBytes)} or smaller`)
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
            disabled={disabled}
            className='shrink-0 rounded-md p-1 hover:bg-hover'
          >
            <HugeiconsIcon icon={MultiplicationSignIcon} size={16} />
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className='flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-3 py-5 text-center transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70'
        >
          <HugeiconsIcon
            icon={CloudUploadIcon}
            size={22}
            className='text-neutral-10'
          />
          <span className='text-sm font-medium text-black'>Choose file</span>
          <span className='text-[11px] text-placeholder'>
            {hint ?? `${acceptedLabel} · max ${formatSize(maxBytes)}`}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type='file'
        accept={accept.join(',')}
        className='hidden'
        onChange={handleSelect}
      />
    </div>
  )
}

export default FilePicker
