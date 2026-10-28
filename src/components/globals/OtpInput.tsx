import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { ErrorText } from './ReusedText'

export type OtpInputProps = {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  name?: string
  errors?: string
  disabled?: boolean
  autoFocus?: boolean
  hasTitle?: boolean
  title?: string
  subTitle?: string
  optional?: boolean
  containerClassName?: string
  boxClassName?: string
}

export const OtpInput = ({
  length = 4,
  value,
  onChange,
  onComplete,
  name = 'otp',
  errors = '',
  disabled = false,
  autoFocus = true,
  hasTitle = false,
  title = '',
  subTitle = '',
  optional = false,
  containerClassName = '',
  boxClassName = '',
}: OtpInputProps) => {
  // values[i] holds a single digit/char for box i
  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length }, (_, i) => value[i] || ''),
  )

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // keep internal boxes in sync if parent resets/clears value externally
  useEffect(() => {
    setValues(Array.from({ length }, (_, i) => value[i] || ''))
    // eslint-disable-next-line
  }, [value, length])

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus()
    }
    // eslint-disable-next-line
  }, [])

  const emitChange = (next: string[]) => {
    const joined = next.join('')
    onChange(joined)
    if (joined.length === length && !next.includes('') && onComplete) {
      onComplete(joined)
    }
  }

  const fillFrom = (index: number, digits: string) => {
    const next = [...values]
    let cursor = index
    for (const char of digits) {
      if (cursor >= length) break
      next[cursor] = char
      cursor++
    }
    setValues(next)
    emitChange(next)
    inputRefs.current[Math.min(cursor, length - 1)]?.focus()
  }

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    // SMS one-time-code autofill drops the whole code into one box — spread it
    // across the boxes like a paste.
    if (digits.length > 2 || (digits.length === 2 && !values[index])) {
      fillFrom(index, digits)
      return
    }
    // only keep the last typed character, digits only
    const char = digits.slice(-1)

    const next = [...values]
    next[index] = char
    setValues(next)
    emitChange(next)

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[index]) {
        const next = [...values]
        next[index] = ''
        setValues(next)
        emitChange(next)
      } else if (index > 0) {
        const next = [...values]
        next[index - 1] = ''
        setValues(next)
        emitChange(next)
        inputRefs.current[index - 1]?.focus()
      }
      return
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '')
    if (!pasted) return
    fillFrom(index, pasted)
  }

  return (
    <div className={containerClassName}>
      {hasTitle && (
        <div className='flex items-center gap-1 mb-2!'>
          <h2 className='text-sm text-neutral-10'>{title}</h2>
          {optional && (
            <span className='text-neutral-10 text-xs'>- (Optional)</span>
          )}
        </div>
      )}
      {subTitle && (
        <h2 className='text-xs font-medium text-neutral-10 mb-2'>{subTitle}</h2>
      )}

      <div className='flex items-center gap-2.5'>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type='text'
            inputMode='numeric'
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            name={`${name}-${index}`}
            value={values[index] || ''}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            className={classNames(
              'w-11 h-11 text-center rounded border border-border',
              'bg-transparent! text-sm font-bold text-neutral-10',
              'outline-none focus:outline-none focus:border-brand-green focus:border-2',
              'transition-all duration-300',
              {
                'border-error!': !!errors,
                'bg-gray-100!': disabled,
              },
              boxClassName,
            )}
          />
        ))}
      </div>

      {errors && <ErrorText text={errors} />}
    </div>
  )
}
