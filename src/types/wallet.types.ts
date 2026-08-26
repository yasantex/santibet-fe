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
  codeRequired: boolean
}

export interface RequestWithdrawalRequest {
  amount: string
  paymentMethodId: string
}

export interface CryptoAddressResponse {
  address: string
  currency: string
  network: string
  destinationTag: string | null
}

export interface CryptoWithdrawalAccount {
  address: string
  network: string
  currency: string
  label: string
}

export interface CrytpoAddress {
  id: string;
  address: string;
  network: string;
  currency: string;
  label: string;
  verified: boolean;
  createdAt: string; 
}
export interface CryptoWalletResponse {
  data: CrytpoAddress[];
}

