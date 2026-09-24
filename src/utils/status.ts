import type { StatusConfig } from '../types/types'

export const TransactionStatusConfig: StatusConfig[] = [
  { label: 'Pending', value: 'PENDING', color: 'orange' },
  { label: 'Processing', value: 'PROCESSING', color: 'orange' },
  { label: 'Completed', value: 'COMPLETED', color: 'green' },
  { label: 'Failed', value: 'FAILED', color: 'red' },
  { label: 'Canceled', value: 'CANCELED', color: 'plain' },
]

export const WithdrawalStatusConfig: StatusConfig[] = [
  {
    label: 'Pending',
    value: 'PENDING',
    color: 'orange',
  },
  {
    label: 'Dispatched',
    value: 'DISPATCHED',
    color: 'orange',
  },
  {
    label: 'Success',
    value: 'SUCCESS',
    color: 'green',
  },
  {
    label: 'Failed',
    value: 'FAILED',
    color: 'red',
  },
]

// Label + badge classes for a KYC status (NOT_STARTED, PENDING, APPROVED, …).
// Unknown non-empty statuses read as verified, matching the original UI.
export const kycStatusBadge = (status: string | undefined) => {
  switch (status) {
    case undefined:
    case '':
    case 'NOT_STARTED':
      return { label: 'Not verified', className: 'bg-surface-error text-error' }
    case 'PENDING':
      return { label: 'Under review', className: 'bg-warning/10 text-warning' }
    case 'REJECTED':
      return { label: 'Rejected', className: 'bg-surface-error text-error' }
    case 'MORE_INFO_REQUIRED':
      return { label: 'Action needed', className: 'bg-warning/10 text-warning' }
    default:
      return { label: 'Verified', className: 'bg-surface-success text-success' }
  }
}
