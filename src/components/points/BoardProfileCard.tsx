import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Button } from '../globals/Button'
import { FormInput } from '../globals/FormInput'
import SuspendedHint from '../globals/SuspendedHint'
import {
  useLeaderboardProfile,
  useUpdateLeaderboardProfile,
} from '../../data_layer/points'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import { HANDLE_PATTERN, handleErrorMessage } from '../../utils/points'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { ACCOUNT_SUSPENDED_CODE } from '../../utils/constants'

const HANDLE_RULE = '3–20 letters, numbers or underscores.'

/**
 * Join / leave the boards and pick the handle shown on them. Boards are off
 * until a player chooses — nothing here is pre-ticked.
 */
const BoardProfileCard = () => {
  const suspended = useAccountSuspended()
  const { data: profile, isLoading } = useLeaderboardProfile()
  const { mutateAsync: updateProfile, isPending } = useUpdateLeaderboardProfile()

  const [editing, setEditing] = useState(false)
  const [handle, setHandle] = useState('')
  const [error, setError] = useState('')

  const startEditing = () => {
    setHandle(profile?.handle ?? '')
    setError('')
    setEditing(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = handle.trim()
    if (!HANDLE_PATTERN.test(value)) {
      setError(`Choose a handle of ${HANDLE_RULE.toLowerCase()}`)
      return
    }
    setError('')
    try {
      await updateProfile({ optIn: true, handle: value })
      showSuccessToast(
        profile?.optedIn ? 'Handle updated' : 'You’re on the boards',
      )
      setEditing(false)
    } catch (err) {
      const data = isAxiosError(err) ? err.response?.data : undefined
      if (data?.code === ACCOUNT_SUSPENDED_CODE) return // already toasted
      setError(
        handleErrorMessage(data?.code) ??
          data?.message ??
          'We couldn’t save that handle. Try again.',
      )
    }
  }

  const leave = async () => {
    try {
      await updateProfile({ optIn: false })
      showSuccessToast('You’ve left the boards')
      setEditing(false)
    } catch (err) {
      const data = isAxiosError(err) ? err.response?.data : undefined
      if (data?.code === ACCOUNT_SUSPENDED_CODE) return
      showWarningToast(data?.message ?? 'We couldn’t update that. Try again.')
    }
  }

  if (isLoading) {
    return <div className='h-28 animate-pulse rounded-2xl bg-card' />
  }

  const optedIn = !!profile?.optedIn
  const showForm = editing || !optedIn

  return (
    <section className='flex flex-col gap-3 rounded-2xl border border-border bg-white p-4'>
      <div className='flex flex-col gap-1'>
        <span className='text-sm font-bold text-black'>
          {optedIn ? (
            <>
              You’re on the boards as{' '}
              <span className='text-success'>@{profile?.handle}</span>
            </>
          ) : (
            'Join the boards'
          )}
        </span>
        <span className='text-xs text-neutral-10'>
          {optedIn
            ? 'Only your handle is ever shown — never your name or number.'
            : 'Boards are opt-in. Pick a handle to appear — only your handle is shown, never your name or number.'}
        </span>
      </div>

      {showForm ? (
        <form onSubmit={submit} className='flex flex-col gap-3 sm:flex-row sm:items-start'>
          <FormInput
            type='text'
            name='handle'
            value={handle}
            placeholder='Choose a handle, e.g. ace_7'
            onChange={(e) => {
              setHandle(e.target.value)
              if (error) setError('')
            }}
            onBlur={() => {}}
            errors={error}
            maxLength={20}
            disabled={suspended}
            containerClassName='flex-1'
            infoElement={<span className='text-neutral-10'>{HANDLE_RULE}</span>}
          />
          <div className='flex gap-2'>
            <Button
              type='submit'
              text={optedIn ? 'Save handle' : 'Join the board'}
              variation='primary'
              size='large'
              className='h-11! whitespace-nowrap'
              loading={isPending}
              disabled={isPending || suspended}
            />
            {editing && (
              <Button
                type='button'
                text='Cancel'
                variation='plain'
                size='large'
                className='h-11!'
                onClick={() => setEditing(false)}
              />
            )}
          </div>
        </form>
      ) : (
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            text='Change handle'
            className='w-fit!'
            variation='plain'
            disabled={suspended}
            onClick={startEditing}
          />
          <Button
            type='button'
            text='Leave the boards'
            className='w-fit!'
            variation='plain'
            loading={isPending}
            disabled={isPending || suspended}
            onClick={leave}
          />
        </div>
      )}

      {suspended && <SuspendedHint />}
    </section>
  )
}

export default BoardProfileCard
