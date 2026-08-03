import classNames from 'classnames'
import type { ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { Icon } from './Icon'

export type ModalProps = {
  open: boolean
  handleClose: () => void
  children?: ReactNode
  className?: string
  dialogClassName?: string
  containerClassName?: string
  showCloseIcon?: boolean
  title?: string | ReactNode
  subtitle?: string
  closeOnOverlayClick?: boolean
  showHeader?: boolean
}

const ModalComponent: React.FC<ModalProps> = ({
  open,
  handleClose,
  children,
  className,
  dialogClassName = '',
  containerClassName = '',
  showCloseIcon = true,
  title = '',
  subtitle = '',
  closeOnOverlayClick = true,
  showHeader = true,
}) => {
  if (!open) return null

  return ReactDOM.createPortal(
    <div
      className={classNames(
        `fixed inset-0 z-999 w-screen`,
        'flex justify-center items-center',
        containerClassName
      )}
    >
      {/* Overlay  */}
      <div
        className='absolute inset-0 z-10 bg-black/40'
        onClick={() => {
          if (closeOnOverlayClick) handleClose()
        }}
      />

      {/* Modal dialog  */}
      <div
        className={`z-30 w-full bg-white py-3 px-6 rounded max-w-[90dvh] h-fit max-h-[90dvh] flex flex-col overflow-hidden ${className}`}
      >
        {showHeader && (
          <div
            className={`flex items-center justify-between border-b border-border pb-3 gap-4`}
          >
            {title && (
              <div className='flex flex-col gap-2.5'>
                <div className='font-medium text-base'>{title}</div>
                <div className='text-sm'>{subtitle}</div>
              </div>
            )}

            {showCloseIcon && (
              <div className='flex flex-1 items-end cursor-pointer justify-end'>
                <button type='button' onClick={handleClose} className={`w-fit`}>
                  <Icon
                    svg={'close-icon'}
                    className='soft-shrink'
                    width={24}
                    height={24}
                    containerClassName='cursor'
                  />
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className={`hide-scroll-bar my-4 flex-1 overflow-y-scroll ${dialogClassName} `}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalComponent
