import { toast } from 'sonner'
import type { ReactElement } from 'react'
import { Icon } from '../components/globals/Icon'
import { MultiplicationSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ACCOUNT_SUSPENDED_MESSAGE } from './constants'

type ToastType = 'success' | 'error'

export type ToastAction = {
  label: string
  onClick: () => void
}

const SUSPENDED_TOAST_ID = 'account-suspended'

const showToast = (message: string, type: ToastType, action?: ToastAction) => {
  // The apiClient interceptor already toasts ACCOUNT_SUSPENDED and rewrites the
  // error message to this text, so screens that also toast `error.message` in
  // their onError update that same toast instead of stacking a duplicate.
  const isSuspended = message === ACCOUNT_SUSPENDED_MESSAGE
  toast.custom(
    (t): ReactElement => (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          minWidth: '350px',
          maxWidth: '350px',
          gap: '15px',
          padding: '10px',
          fontFamily: 'Outfit',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            cursor: 'pointer',
          }}
          onClick={() => toast.dismiss(t)}
        >
          <HugeiconsIcon
            icon={MultiplicationSignIcon}
            size={20}
            className='text-black'
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon
            width={24}
            height={24}
            svg={type === 'success' ? 'success' : 'error'}
          />
          <h1
            className={`${
              type === 'success' ? 'text-success' : 'text-error'
            } text-sm font-semibold`}
          >
            {type === 'success'
              ? 'Success'
              : isSuspended
                ? 'Account suspended'
                : 'Error'}
          </h1>
        </div>

        <span
          className={`${
            type === 'success' ? 'text-success' : 'text-error'
          } text-sm font-semibold`}
        >
          {message}
        </span>

        {action && (
          <button
            type='button'
            onClick={() => {
              toast.dismiss(t)
              action.onClick()
            }}
            className={`${
              type === 'success' ? 'text-success' : 'text-error'
            } text-sm font-semibold hover:underline underline-offset-2 cursor-pointer`}
          >
            {action.label}
          </button>
        )}
      </div>
    ),
    {
      ...(isSuspended ? { id: SUSPENDED_TOAST_ID } : {}),
      duration: isSuspended ? 6000 : 3000,
      position: 'top-right',
      style: {
        background: 'var(--color-white)',
        border:
          type === 'success'
            ? '1px solid var(--color-success)'
            : '1px solid var(--color-error)',
      },
    },
  )
}

export const showSuccessToast = (message: string, action?: ToastAction) =>
  showToast(message, 'success', action)
export const showWarningToast = (message: string, action?: ToastAction) =>
  showToast(message, 'error', action)
export const showSuspendedToast = () =>
  showToast(ACCOUNT_SUSPENDED_MESSAGE, 'error')
