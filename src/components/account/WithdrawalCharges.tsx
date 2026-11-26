import type { WithdrawalBreakdown } from '../../types/wallet.types'
import { formatCurrency, toMajorUnits } from '../../utils/functions'

/** `500` → `5%`, `250` → `2.5%`. */
const ratePercent = (bps: number) => `${bps / 100}%`

const Row = ({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) => (
  <div
    className={`flex justify-between gap-4 text-sm ${
      strong ? 'font-semibold text-black' : 'font-medium text-neutral-10'
    }`}
  >
    <p>{label}</p>
    <span className={strong ? '' : 'text-black'}>{value}</span>
  </div>
)

/**
 * A withdrawal's statutory charges, in the backend's order. Renders nothing
 * unless the API sent `deductions`: that's the only sign they applied.
 *
 * The charges come on top of the amount: the player receives `netPayable` (the
 * amount they asked for) and the wallet is debited amount + fee + charges.
 * Pass `fee` (kobo) once it's known (on a requested withdrawal) to show the
 * full debit; the quote doesn't include it.
 */
const WithdrawalCharges = ({
  breakdown,
  amount,
  fee,
}: {
  breakdown: WithdrawalBreakdown
  /** Kobo: the amount requested. */
  amount: string
  fee?: string
}) => {
  const { deductions, totalDeductions, netPayable } = breakdown
  if (!deductions?.length) return null

  const receive = toMajorUnits(netPayable ?? amount)
  const charges = toMajorUnits(
    totalDeductions ??
      deductions.reduce((sum, d) => sum + Number(d.amount), 0),
  )
  const feeNaira = fee != null ? toMajorUnits(fee) : null

  return (
    <div className='flex flex-col gap-2'>
      <Row label='You receive' value={formatCurrency(receive)} strong />
      {deductions.map((d) => (
        <Row
          key={d.label}
          label={`${d.label} (${ratePercent(d.rate)})`}
          value={formatCurrency(toMajorUnits(d.amount))}
        />
      ))}
      {feeNaira != null ? (
        <>
          {feeNaira > 0 && (
            <Row label='Withdrawal fee' value={formatCurrency(feeNaira)} />
          )}
          <Row
            label='Total from your wallet'
            value={formatCurrency(toMajorUnits(amount) + charges + feeNaira)}
            strong
          />
        </>
      ) : (
        <p className='text-xs text-neutral-10'>
          You receive {formatCurrency(receive)}. The{' '}
          {formatCurrency(charges)} in charges, plus the usual withdrawal fee,
          are added to what comes out of your wallet.
        </p>
      )}
    </div>
  )
}

export default WithdrawalCharges
