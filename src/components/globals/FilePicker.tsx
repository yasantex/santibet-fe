import { useRef, useState, type ChangeEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CloudUploadIcon,
  MultiplicationSignIcon,
} from '@hugeicons/core-free-icons'

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
  /** Extra check on a picked file (e.g. can the image be read). Resolves to
   *  an error message, or '' to accept it. */
  validate?: (file: File) => Promise<string>
}

/**
 * Single-file picker: a dashed "Choose file" button that becomes a file row
 * (name, size, remove) once a file is selected. Rejects files outside
 * `accept`, empty or over `maxBytes`, or failing `validate`, with an inline
 * message under the picker.
 */
const FilePicker = ({
  label,
  file,
  onChange,
  hint,
  accept = DEFAULT_ACCEPT,
  maxBytes = DEFAULT_MAX_BYTES,
  disabled = false,
  validate,
}: FilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const acceptedLabel = accept
    .map((type) => type.split('/')[1]?.toUpperCase().replace('JPEG', 'JPG'))
    .join(', ')

  const handleSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    // Reset so picking the same file again still fires onChange.
    e.target.value = ''
    if (!selected) return
    setError('')
    if (/hei[cf]/i.test(selected.type) || /\.hei[cf]$/i.test(selected.name)) {
      setError(
        `HEIC photos aren’t supported. Upload a ${acceptedLabel} file, or take a screenshot of the photo and upload that.`,
      )
      return
    }
    if (!accept.includes(selected.type)) {
      setError(`This file type isn’t supported. Upload a ${acceptedLabel} file.`)
      return
    }
    if (selected.size === 0) {
      setError('This file is empty. Choose another one.')
      return
    }
    if (selected.size > maxBytes) {
      setError(
        `This file is ${formatSize(selected.size)}. It must be ${formatSize(maxBytes)} or smaller.`,
      )
      return
    }
    if (validate) {
      setChecking(true)
      const problem = await validate(selected)
      setChecking(false)
      if (problem) {
        setError(problem)
        return
      }
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
            onClick={() => {
              setError('')
              onChange(null)
            }}
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
          disabled={disabled || checking}
          className='flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-3 py-5 text-center transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70'
        >
          <HugeiconsIcon
            icon={CloudUploadIcon}
            size={22}
            className='text-neutral-10'
          />
          <span className='text-sm font-medium text-black'>
            {checking ? 'Checking file…' : 'Choose file'}
          </span>
          <span className='text-[11px] text-placeholder'>
            {hint ?? `${acceptedLabel} · max ${formatSize(maxBytes)}`}
          </span>
        </button>
      )}
      {error && (
        <p role='alert' className='text-xs font-medium text-error'>
          {error}
        </p>
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
