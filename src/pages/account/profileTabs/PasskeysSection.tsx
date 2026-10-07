import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Delete02Icon,
  FingerPrintIcon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import {
  useSantiBetMutation,
  useSantiBetQuery,
} from '../../../data_layer/utils'
import { Button } from '../../../components/globals/Button'
import AddPasskeyModal from '../../../components/appModals/auth/AddPasskeyModal'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { PASSKEYS_QUERY_KEY, passkeyErrorCode } from '../../../utils/passkeys'
import type { Passkey, PasskeyListResponse } from '../../../types/passkey.types'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const showApiError = (error: Error) =>
  showWarningToast(
    (isAxiosError(error) ? error.response?.data?.message : null) ??
      error.message,
  )

const PasskeyRow = ({ passkey }: { passkey: Passkey }) => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(passkey.name)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // Set when the backend refuses removal because it's the only way in.
  const [lastMethod, setLastMethod] = useState(false)

  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })

  const { mutateAsync: rename, isPending: isRenaming } = useSantiBetMutation<
    Passkey,
    { name: string }
  >({
    path: `/auth/passkeys/${passkey.id}`,
    method: 'PATCH',
    mutationOptions: {
      onSuccess: () => {
        refreshList()
        setEditing(false)
      },
      onError: showApiError,
    },
  })

  const { mutateAsync: remove, isPending: isRemoving } = useSantiBetMutation({
    path: `/auth/passkeys/${passkey.id}`,
    method: 'DELETE',
    mutationOptions: {
      onSuccess: () => {
        refreshList()
        showSuccessToast('Passkey removed')
      },
      onError: (error) => {
        if (passkeyErrorCode(error) === 'LAST_SIGN_IN_METHOD') {
          setLastMethod(true)
          return
        }
        showApiError(error)
      },
    },
  })

  const cancelEdit = () => {
    setName(passkey.name)
    setEditing(false)
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === passkey.name) {
      cancelEdit()
      return
    }
    try {
      await rename({ name: trimmed })
    } catch {
      // Surfaced via onError.
    }
  }

  const handleDeleteTap = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    try {
      await remove({})
    } catch {
      // Surfaced via onError.
    } finally {
      setConfirmingDelete(false)
    }
  }

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-border p-3'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 items-start gap-2.5'>
          <HugeiconsIcon
            icon={FingerPrintIcon}
            size={18}
            className='mt-0.5 shrink-0 text-neutral-10'
          />
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            {editing ? (
              <form
                className='flex items-center gap-2'
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
              >
                <input
                  autoFocus
                  value={name}
                  maxLength={60}
                  disabled={isRenaming}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
                  aria-label='Passkey name'
                  className='min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-sm font-semibold text-black outline-none focus:border-brand-green'
                />
                <button
                  type='submit'
                  disabled={isRenaming}
                  className='cursor-pointer text-xs font-semibold text-black underline underline-offset-3 disabled:opacity-50'
                >
                  Save
                </button>
                <button
                  type='button'
                  disabled={isRenaming}
                  onClick={cancelEdit}
                  className='cursor-pointer text-xs font-semibold text-neutral-10 disabled:opacity-50'
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className='flex min-w-0 items-center gap-2'>
                <span className='truncate text-sm font-semibold text-black'>
                  {passkey.name}
                </span>
                {passkey.deviceType === 'multiDevice' && (
                  <span className='shrink-0 rounded-full bg-surface-success px-2 py-0.5 text-[11px] font-semibold text-success'>
                    Synced
                  </span>
                )}
              </div>
            )}
            <span className='text-xs text-neutral-10'>
              Added {formatDate(passkey.createdAt)} ·{' '}
              {passkey.lastUsedAt
                ? `Last used ${formatDate(passkey.lastUsedAt)}`
                : 'Never used'}
            </span>
          </div>
        </div>

        {!editing && (
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setEditing(true)}
              className='flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-hover'
            >
              <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
              Rename
            </button>
            <button
              type='button'
              onClick={handleDeleteTap}
              onBlur={() => setConfirmingDelete(false)}
              disabled={isRemoving}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                confirmingDelete
                  ? 'bg-error text-white'
                  : 'border border-error text-error hover:bg-surface-error'
              }`}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
              {confirmingDelete ? 'Tap to confirm' : 'Remove'}
            </button>
          </div>
        )}
      </div>

      {lastMethod && (
        <p className='rounded-lg bg-error-bg px-3 py-2.5 text-xs font-medium text-error'>
          This passkey is the only way into your account. Set a password first,
          then you can remove it.
        </p>
      )}
    </div>
  )
}

const PasskeysSection = () => {
  const [addOpen, setAddOpen] = useState(false)
  const [supported] = useState(() => browserSupportsWebAuthn())

  const { data, isLoading } = useSantiBetQuery<PasskeyListResponse>({
    path: '/auth/passkeys',
    queryKey: PASSKEYS_QUERY_KEY,
  })
  const passkeys = data?.data ?? []

  return (
    <section className='flex flex-col gap-2.5 rounded-lg bg-card p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-sm font-medium text-black'>Passkeys</h3>
          <p className='text-xs text-neutral-500 dark:text-neutral-400'>
            Sign in with Face ID, fingerprint or your device PIN.
          </p>
        </div>
        {supported && (
          <Button
            type='button'
            text='Add passkey'
            variation='primary'
            size='medium'
            className='shrink-0'
            onClick={() => setAddOpen(true)}
          />
        )}
      </div>

      {isLoading ? (
        <div className='h-14 w-full animate-pulse rounded-lg bg-neutral-10/20' />
      ) : passkeys.length ? (
        <div className='flex flex-col gap-2'>
          {passkeys.map((passkey) => (
            <PasskeyRow key={passkey.id} passkey={passkey} />
          ))}
        </div>
      ) : (
        <p className='text-xs text-neutral-10'>
          {supported
            ? 'No passkeys yet.'
            : 'This browser doesn’t support passkeys.'}
        </p>
      )}

      <AddPasskeyModal open={addOpen} handleClose={() => setAddOpen(false)} />
    </section>
  )
}

export default PasskeysSection
