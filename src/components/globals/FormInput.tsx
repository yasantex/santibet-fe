import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import type {
  DetailedHTMLProps,
  FocusEventHandler,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import { useWindowDimensions } from '../../hooks/useWindowDimensions'
import { ErrorText } from './ReusedText'
import { HugeiconsIcon } from '@hugeicons/react'
import { EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons'

export type FormInputProps = {
  type: string
  name: string
  value?: string
  placeholder: string
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onBlur: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  errors?: string
  rows?: number
  className?: string
  containerClassName?: string
  hasTitle?: boolean
  title?: string
  autoComplete?: string
  disabled?: boolean
  infoElement?: ReactNode
  readOnly?: boolean
  autoFocus?: boolean
  autoFocusOnMobile?: boolean
  optional?: boolean
  subTitle?: string
  customChild?: ReactNode
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export const FormInput = ({
  type = 'text',
  name = '',
  value = '',
  placeholder = 'placeholder',
  onChange,
  onBlur,
  onKeyDown = () => {},
  errors = '',
  rows = 3,
  className = '',
  containerClassName = '',
  optional = false,
  hasTitle = false,
  title = '',
  autoComplete = 'off',
  disabled = false,
  infoElement,
  readOnly = false,
  autoFocus = false,
  autoFocusOnMobile = true,
  subTitle = '',
  ...inputProps
}: FormInputProps) => {
  const [viewPassword, setViewPassword] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  const { width } = useWindowDimensions()

  const inputClassName = `
  bg-transparent w-full 
  outline-none focus:outline-none
  font-bold text-neutral-10
  placeholder:text-placeholder placeholder:font-normal
  autofill:focus:bg-transparent autofill:bg-transparent
  text-sm
  transition-all duration-300
  `

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      if (!autoFocusOnMobile && width < 768) {
        return
      } else {
        inputRef.current.focus()
      }
    }
    // eslint-disable-next-line
  }, [])

  return (
    <div className={containerClassName}>
      {hasTitle && (
        <div className='flex items-center gap-1 mb-2!'>
          <h2 className={`text-sm text-neutral-10`}>{title}</h2>

          {optional && (
            <span className='text-neutral-10 text-xs '>- (Optional)</span>
          )}
        </div>
      )}
      {subTitle && (
        <h2 className={`text-xs font-medium text-neutral-10 mb-2`}>
          {subTitle}
        </h2>
      )}
      <div
        className={classNames(
          `group w-full flex border border-border rounded items-center `,
          ` px-2.5 py-px text-sm font-normal bg-transparent! focus-within:border-brand-green focus-within:border-2`,
          {
            'focus-within:border-error!': !!errors,
            'bg-gray-100!': disabled,
          },
          {
            'h-11': type !== 'textarea',
            'h-30': type === 'textarea',
          },
          className,
        )}
      >
        {type !== 'textarea' ? (
          <input
            type={viewPassword ? 'text' : type}
            name={name}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={(e) => {
              if (onBlur) {
                onBlur(e)
              }
            }}
            onKeyDown={onKeyDown}
            className={`autofill:bg-transparent bg-transparent!  ${inputClassName} `}
            autoComplete={autoComplete}
            disabled={disabled}
            readOnly={readOnly}
            ref={inputRef}
            {...inputProps}
          />
        ) : undefined}

        {type === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            rows={rows}
            disabled={disabled}
            className={`${inputClassName} py-2.5 autofill:bg-transparent px-2.5 bg-transparent! resize-none overflow-y-auto h-full`}
            readOnly={readOnly}
            onBlur={(e) => {
              if (onBlur) {
                onBlur(e)
              }
            }}
            onKeyDown={onKeyDown}
            ref={textAreaRef}
          />
        ) : undefined}

        {type === 'password' && (
          <button
            type='button'
            onClick={() => {
              setViewPassword(!viewPassword)
            }}
          >
            <HugeiconsIcon
              icon={viewPassword ? EyeOffIcon : EyeIcon}
              size={16}
              className='text-black'
            />
          </button>
        )}
      </div>
      {errors && <ErrorText text={errors} />}

      {infoElement && (
        <div className='mt-2 text-xs leading-5! text-primary'>
          {infoElement}
        </div>
      )}
    </div>
  )
}
