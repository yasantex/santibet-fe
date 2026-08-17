import ModalComponent from './ModalComponent'
import { Button } from './Button'

interface ConfirmationModalProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  isConfirming?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

const ConfirmationModal = ({
  open,
  title,
  description,
  confirmText = 'Confirm',
  isConfirming = false,
  onClose,
  onConfirm,
}: ConfirmationModalProps) => (
  <ModalComponent
    open={open}
    handleClose={onClose}
    title={title}
    showCloseIcon={!isConfirming}
    closeOnOverlayClick={!isConfirming}
    className='max-w-md'
  >
    <div className='flex flex-col gap-5 py-2'>
      <p className='text-sm leading-relaxed text-neutral-10'>{description}</p>
      <div className='flex justify-end gap-3'>
        <Button
          type='button'
          text='Keep order'
          variation='plain'
          onClick={onClose}
          disabled={isConfirming}
        />
        <Button
          type='button'
          text={isConfirming ? 'Cancelling…' : confirmText}
          onClick={() => void onConfirm()}
          disabled={isConfirming}
          className='bg-error! text-white!'
        />
      </div>
    </div>
  </ModalComponent>
)

export default ConfirmationModal
