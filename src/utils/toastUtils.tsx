import { toast } from 'sonner'
import type { ReactElement } from 'react'
import { Icon } from '../components/globals/Icon'

type ToastType = 'success' | 'error'

const showToast = (message: string, type: ToastType) => {
  toast.custom(
    (t): ReactElement => (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          width: '300px',
          gap: '15px',
          padding: '10px',
          fontFamily: 'Fustat',
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
          <Icon svg='close-icon' height={24} width={24} />
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
            {type === 'success' ? 'Success' : 'Error'}
          </h1>
        </div>

        <span
          className={`${
            type === 'success' ? 'text-success' : 'text-error'
          } text-sm font-semibold`}
        >
          {message}
        </span>
      </div>
    ),
    {
      duration: 3000,
      position: 'top-right',
      style: {
        background: 'white',
        border: type === 'success' ? '1px solid #238b45' : '1px solid #EF4444',
      },
    },
  )
}

export const showSuccessToast = (message: string) =>
  showToast(message, 'success')
export const showWarningToast = (message: string) => showToast(message, 'error')