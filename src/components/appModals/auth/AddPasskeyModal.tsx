import { useState } from 'react'
import ModalComponent, { type ModalProps } from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'
import { FormInput } from '../../globals/FormInput'
import usePasskeyRegistration from '../../../hooks/usePasskeyRegistration'
import { defaultPasskeyName } from '../../../utils/passkeys'

type AddPasskeyModalProps = ModalProps & {
  cancelText?: string
}

const AddPasskeyModal = ({
  open,
  handleClose,
  title = 'Add a passkey',
  subtitle = 'Sign in with Face ID, fingerprint or your device PIN instead of a password.',
  cancelText = 'Cancel',
}: AddPasskeyModalProps) => {
  const { register, isRegistering } = usePasskeyRegistration()
  // null = untouched, so the field shows the browser/OS default.
  const [name, setName] = useState<string | null>(null)
  const value = name ?? defaultPasskeyName()

  const close = () => {
    setName(null)
    handleClose()
  }

  const handleAdd = async () => {
    const passkey = await register(value)
    if (passkey) close()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={close}
      title={title}
      subtitle={subtitle}
      showCloseIcon={!isRegistering}
      closeOnOverlayClick={!isRegistering}
      className='max-w-100! w-[90%]!'
    >
      <form
        className='flex w-full flex-col gap-3 pt-2'
        onSubmit={(e) => {
          e.preventDefault()
          if (!isRegistering) handleAdd()
        }}
      >
        <FormInput
          type='text'
          name='passkeyName'
          hasTitle
          title='Name'
          value={value}
          placeholder='e.g. My iPhone'
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {}}
        />
        <p className='text-xs text-neutral-10'>
          Helps you tell your passkeys apart later.
        </p>
        <Button
          type='submit'
          text='Add passkey'
          variation='primary'
          size='large'
          className='mt-2.5'
          loading={isRegistering}
          disabled={isRegistering}
        />
        <Button
          type='button'
          text={cancelText}
          variation='plain'
          size='large'
          disabled={isRegistering}
          onClick={close}
        />
      </form>
    </ModalComponent>
  )
}

export default AddPasskeyModal
