import classNames from 'classnames'
import { useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export const Checkbox = ({
  checkStatus,
  handleChange = () => {},
  text = '',
  textPosition = 'right',
  className = 'right',
  disabled = false,
  textClassName = '',
  hideIconUntilSelect = false,
  type = 'checkbox',
}: {
  checkStatus: boolean
  disabled?: boolean
  handleChange: (status: boolean) => void
  text?: ReactNode
  textPosition?: 'left' | 'right'
  className?: string
  type?: 'radio' | 'checkbox'
  textClassName?: string
  hideIconUntilSelect?: boolean
}) => {
  const checkBoxRef = useRef<HTMLInputElement | null>(null)

  return (
    <button
      type='button'
      className={`flex w-fit items-center gap-2 disabled:cursor-not-allowed ${className} `}
      onClick={() => {
        checkBoxRef?.current?.click()
      }}
      disabled={disabled}
    >
      {type === 'checkbox' ? (
        <Icon
          svg={checkStatus ? 'checkbox-active' : 'checkbox-inactive'}
          width={20}
          height={20}
          className={classNames('w-fit', {
            hidden: hideIconUntilSelect && !checkStatus,
          })}
        />
      ) : (
        <Icon
          svg={checkStatus ? 'radio' : 'radio-inactive'}
          width={20}
          height={20}
          className={classNames('w-fit', {
            hidden: hideIconUntilSelect && !checkStatus,
          })}
        />
      )}
      <div
        className={classNames(
          'text-neutral-10 text-sm',
          {
            'order-last': textPosition === 'right',
            'order-first': textPosition === 'left',
          },
          textClassName,
        )}
      >
        {text}
      </div>

      <input
        type='checkbox'
        className='hidden'
        ref={checkBoxRef}
        checked={checkStatus}
        onChange={() => {
          handleChange(!checkStatus)
        }}
        disabled={disabled}
      />
    </button>
  )
}
