import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { withdrawalOptions } from '../../utils/constants'

const Withdraw = ({ open, handleClose }: ModalProps) => {
  return (
    <ModalComponent
      open={open}
      handleClose={handleClose}
      title='Withdraw'
      className='max-w-105! w-[90%]!'
    >
      <div className='flex flex-col gap-4'>
        <span className='text-sm text-neutral-10'>⏱ 1-2 business days · No withdrawal fees</span>

        <div className='flex flex-col gap-3'>
          {withdrawalOptions.map((option) => (
            <button
              key={option.id}
              type='button'
              className='flex items-center cursor-pointer justify-between rounded-xl border border-border px-4 py-3.5 text-left transition-colors '
            >
              <span className='flex items-center gap-3 text-black font-semibold'>
                <HugeiconsIcon
                  icon={option.icon}
                  size={16}
                  className='text-brand-green'
                />
                <div className='flex flex-col gap-1'>
                  <span className='text-xs text-black'>{option.heading}</span>
                  <span className='text-xs text-neutral-10'>
                    {option.label}
                  </span>
                </div>
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

export default Withdraw
