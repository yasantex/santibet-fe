import classNames from 'classnames'
import type {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ForwardedRef,
  MouseEvent,
  ReactNode,
} from 'react'
import { forwardRef } from 'react'
import { Icon } from './Icon'

export type ButtonVariations =
  | 'primary'
  | 'plain'
  | 'white'
  | 'error'
  | 'grey'
  | 'secondary'

export type ButtonSize = 'small' | 'medium' | 'large'

export type ButtonProps = {
  text: string | ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  type: 'button' | 'submit'
  className?: string
  loading?: boolean
  disabled?: boolean
  size?: ButtonSize
  icon?: string
  iconClassName?: string
  variation?: ButtonVariations
  iconFirst?: boolean
  hover?: boolean
  iconDimension?: number
  extra?: ReactNode
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      onClick,
      type = 'submit',
      className = '',
      loading = false,
      disabled = false,
      icon = '',
      size = 'medium',
      iconClassName = '',
      variation,
      iconFirst = true,
      hover = false,
      iconDimension = 18,
      extra,
      ...otherProps
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const getColors = () => {
      if (variation === 'primary')
        return 'bg-brand-green hover:bg-brand-green/75 transition-all duration-300 ease-in-out text-black dark:text-[#000000]! font-semibold px-5 w-fit'
      if (variation === 'white')
        return 'bg-white text-black px-5 font-semibold px-5 w-fit'
      if (variation === 'plain')
        return 'border border-border text-black hover:bg-hover dark:hover:text-[#000000]! transition-all duration-300 ease-in-out font-semibold w-fit px-5 '

      // Ultimate fallback
        return 'bg-brand-green hover:bg-brand-green/75 transition-all duration-300 ease-in-out text-black dark:text-[#000000]! font-semibold px-5 w-fit'
    }
    const getLoaderColor = () => {
      if (variation) {
        return variation === 'primary' ? '#ffffff' : '#04000A'
      }
      return '#ffffff'
    }

    const loaderBorderStyle = {
      borderColor: `${getLoaderColor()} transparent transparent transparent`,
    }
    return (
      <button
        {...otherProps}
        ref={ref}
        type={type}
        onClick={(e) => {
          if (onClick) {
            if (type !== 'submit') e.preventDefault()
            onClick(e)
          }
        }}
        disabled={disabled || loading}
        className={classNames(
          `soft-shrink relative flex w-full items-center rounded-full justify-center gap-2.5 cursor-pointer  font-semibold`,
          getColors(),
          {
            'text-transparent opacity-40 cursor-not-allowed!':
              loading || disabled,
            group: hover,

            'disabled:cursor-not-allowed disabled:opacity-40 ': loading,
            'h-6 text-[13px]': size == 'small',
            'h-8.5 text-sm': size === 'medium',
            'h-13 text-base': size === 'large',
          },
          className,
        )}
      >
        {icon && (
          <div
            className={`max-h-fit ${hover && 'ml-1.5'}  ${
              iconFirst ? 'order-first' : 'order-last'
            }`}
          >
            <Icon
              svg={icon}
              width={iconDimension}
              height={iconDimension}
              className={`${iconClassName}`}
            />
          </div>
        )}

        {/* {text && <span className='shrink-0 text-sm'>{text}</span>} */}
        {text && (
          <span
            className={classNames('shrink-0 text-sm ', {
              'w-0 overflow-hidden opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-200':
                hover,
            })}
          >
            {text}
          </span>
        )}

        {extra}

        {loading && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <span
              className='h-6 w-6 animate-spin rounded-full border-2 border-solid'
              style={loaderBorderStyle}
            />
          </div>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
