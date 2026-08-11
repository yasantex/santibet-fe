import type { StatusConfig } from "../types/types";


export const TransactionStatusConfig: StatusConfig[] = [
  { label: 'Pending', value: 'PENDING', color: 'orange' },
  { label: 'Processing', value: 'PROCESSING', color: 'orange' },
  { label: 'Completed', value: 'COMPLETED', color: 'green' },
  { label: 'Failed', value: 'FAILED', color: 'red' },
  { label: 'Canceled', value: 'CANCELED', color: 'plain' },
]