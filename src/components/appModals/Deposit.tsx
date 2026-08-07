import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CreditCardIcon,
  Bitcoin01Icon,
  FlashIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { depositOptions, type DepositOption } from '../../utils/constants'

const OptionIcon = ({ icon }: { icon: DepositOption['icon'] }) => {
  switch (icon) {
    case 'google-pay':
      return (
        <span className='text-sm font-semibold text-neutral-70'>G Pay</span>
      )
    case 'card':
      return <HugeiconsIcon icon={CreditCardIcon} size={20} />

    case 'crypto':
      return <HugeiconsIcon icon={Bitcoin01Icon} size={20} />
    default:
      return null
  }
}

const Deposit = ({ open, handleClose }: ModalProps) => {
  return (
    <ModalComponent
      open={open}
      handleClose={handleClose}
      title='Deposit'
      className='max-w-105! w-[90%]!'
    >
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-1.5 text-sm text-black'>
          <HugeiconsIcon
            icon={FlashIcon}
            size={16}
            className='text-brand-green'
          />
          <p>
            Instant transfer.
            <span className='text-black font-medium'>{' '}No fees {' '}</span>
            on first deposit
          </p>
        </div>

        <div className='flex flex-col gap-3'>
          {depositOptions.map((option) => (
            <button
              key={option.id}
              type='button'
              className='flex items-center cursor-pointer justify-between rounded-xl border border-border px-4 py-3.5 text-left transition-colors '
            >
              <span className='flex items-center gap-3 text-black font-semibold'>
                <OptionIcon icon={option.icon} />
                {option.icon !== 'google-pay' && <span>{option.label}</span>}
              </span>

              <span className='flex items-center gap-2'>
                {option.mostPopular && (
                  <span className='rounded-full bg-brand-green px-2.5 py-1 text-xs font-medium text-black'>
                    Most popular
                  </span>
                )}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className='text-black'
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </ModalComponent>
  )
}

export default Deposit
