export interface WalletBalance {
  currency: string
  trading: string
  winnings: string
  pendingWithdrawal: string
  pendingDeposit: string
  /** Cash the player can bet with: `trading` + `winnings`. Not all of it can
   *  be withdrawn — see `withdrawable`. */
  total: string
  /** Cash that can be withdrawn (= `winnings`). Deposited money in `trading`
   *  has to be bet first. A withdrawal's fee is taken from this on top of the
   *  amount requested. */
  withdrawable?: string
  /** Kobo: the most this user can ask to withdraw right now, after the fee,
   *  any statutory charges and the per-withdrawal maximum. `"0"` when they
   *  can't reach the minimum. Use it for "Max", not `withdrawable`. */
  maxWithdrawal?: string
  /** Bonus credit (kobo). Never part of `total` and never withdrawable. */
  bonus?: string
  /** Locked bonus winnings (kobo). Never part of `total`. */
  bonusLocked?: string
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
/** One statutory charge on a withdrawal. `rate` is in basis points (500 = 5%). */
export interface WithdrawalDeduction {
  label: string
  rate: number
  /** Kobo. */
  amount: string
}

/**
 * Statutory charges on a withdrawal (NRC, State Regulator, SantiBet
 * commission). The backend only sends these while its
 * `withdrawal-statutory-deductions` flag is on, or on rows that were
 * snapshotted while it was; their presence is the only sign a charge applied.
 * Each withdrawal keeps the mode (on top / taken out) it was made under.
 */
export interface WithdrawalBreakdown {
  deductions?: WithdrawalDeduction[]
  /** Kobo: the sum of `deductions`. */
  totalDeductions?: string
  /** Kobo: what reaches the bank. The amount requested when the charges are
   *  on top; the amount minus the charges when they're taken out. */
  netPayable?: string
  /** Sent with `deductions`. `true`: the charges come out of the amount.
   *  `false`: they're added on top of it. */
  deductionsIncluded?: boolean
  /** Kobo: everything that leaves the wallet (amount or net + charges + fee).
   *  Show this rather than adding the parts up. */
  totalDebit?: string
}

/** `POST /wallet/withdrawal-quote`: read-only preview of a withdrawal's cost. */
export interface WithdrawalChargesQuote extends WithdrawalBreakdown {
  amount: string
  netPayable: string
  /** Kobo: the usual withdrawal fee, from the same settings as the request.
   *  Optional until every environment returns it. */
  fee?: string
  /** Kobo: the most this user can ask for right now. */
  maxAmount?: string
}

export interface Transaction extends WithdrawalBreakdown {
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

export interface StartDepositPayload {
  amount: string
  channel?: string
  /** The first-deposit bonus tickbox. Send it whenever the box was shown. */
  bonusOptIn?: boolean
}

export interface StartDepositResponse {
  deposit: DepositRecord
  /** Echo of the request's `bonusOptIn`. */
  bonusOptIn?: boolean | null
  /** Bank-transfer (virtual account) rail only; absent for hosted checkout. */
  instructions?: DepositInstructions
  /**
   * Hosted-checkout rail (channel: "kudipal") only: the full Kudipal payment
   * URL with `reference` + `amount` already appended by the backend. The
   * frontend just opens it — so the link lives server-side and can change
   * without a frontend deploy.
   */
  checkoutUrl?: string
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

export interface WithdrawalRecord extends WithdrawalBreakdown {
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
  /** READY → address is usable; GENERATING → still provisioning, keep polling. */
  status?: 'READY' | 'GENERATING'
  address: string
  currency: string
  network: string
  destinationTag: string | null
}

export type CryptoNetworkId = 'trc20' | 'erc20' | 'bep20'

export interface CryptoNetworkInfo {
  currency: 'USDC' | 'USDT'
  networks: CryptoNetworkId[]
  defaultNetwork: CryptoNetworkId
}

export interface CryptoNetworksResponse {
  data: CryptoNetworkInfo[]
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

