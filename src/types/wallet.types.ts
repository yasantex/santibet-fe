export interface WalletBalance {
  currency: string
  trading: string
  winnings: string
  pendingWithdrawal: string
  pendingDeposit: string
  total: string
}
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'CONVERSION'
  | 'BET_PLACED'
  | 'BET_REFUND'
  | 'WINNINGS_PAYOUT'
  | 'CASH_OUT'
  | 'TRANSFER'
  | 'FEE'
  | 'BONUS'
  | 'ADJUSTMENT'
  | 'REVERSAL'

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
export interface Transaction {
  id: string
  type: TransactionType
  direction: string
  status: TransactionStatus
  bucket: string
  amount: string
  fee: string
  currency: string
  description: string
  createdAt: string
  completedAt: string | null
}

export interface TransactionResponse {
  data: Transaction[]
  nextCursor: string
}

export interface DepositRecord {
  id: string
  amount: string
  currency: string
  status: string
  provider: string
  providerRef: string
  failureReason: string | null
  createdAt: string
  completedAt: string | null
}

export interface DepositInstructions {
  kind: string
  bankName: string
  accountNumber: string
  accountName: string
  reference: string
  expiresAt: string
}

export interface StartDepositResponse {
  deposit: DepositRecord
  instructions: DepositInstructions
}

export interface TransferRequest {
  amount: string
}

export interface TransferResponse {
  currency: string
  trading: string
  winnings: string
  pendingWithdrawal: string
  pendingDeposit: string
  total: string
}

export interface WithdrawalAccount {
  id: string
  accountNumber: string
  bankCode: string
  accountName: string
  label: string
  verified: boolean
  createdAt: string
}

export interface WithdrawalAccountsListResponse {
  data: WithdrawalAccount[]
}

export interface AddWithdrawalAccountRequest {
  accountNumber: string
  bankCode: string
  label: string
}

export interface WithdrawalRecord {
  id: string
  amount: string
  fee: string
  currency: string
  status: string
  reviewStatus: string
  destination: string
  failureReason: string | null
  createdAt: string
  dispatchedAt: string | null
  completedAt: string | null
}

export interface RequestWithdrawalRequest {
  amount: string
  paymentMethodId: string
}
