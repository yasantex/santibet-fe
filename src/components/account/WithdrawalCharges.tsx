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
 * The backend decides whether the charges come on top of the amount or out of
 * it (`deductionsIncluded`), and every withdrawal keeps the mode it was made
 * under, so this reads the flag rather than assuming one. `amount` is always
 * what the player asked for; `netPayable` is what reaches the bank;
 * `totalDebit` is what leaves the wallet. The server's figures are shown as
 * sent; the client only adds them up for responses that predate `totalDebit`.
 *
 * Pass `fee` (kobo) once it's known to show the full debit.
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
  const { deductions, totalDeductions, netPayable, deductionsIncluded, totalDebit } =
    breakdown
  if (!deductions?.length) return null

  const requested = toMajorUnits(amount)
  const charges = toMajorUnits(
    totalDeductions ??
      deductions.reduce((sum, d) => sum + Number(d.amount), 0),
  )
  const receive =
    netPayable != null
      ? toMajorUnits(netPayable)
      : deductionsIncluded
        ? requested - charges
        : requested
  const feeNaira = fee != null ? toMajorUnits(fee) : null
  const debit =
    totalDebit != null
      ? toMajorUnits(totalDebit)
      : feeNaira != null
        ? (deductionsIncluded ? requested : requested + charges) + feeNaira
        : null

  const feeText =
    feeNaira != null && feeNaira > 0
      ? `the ${formatCurrency(feeNaira)} fee`
      : feeNaira == null
        ? 'the usual withdrawal fee'
        : null

  let explanation: string
  if (deductionsIncluded) {
    explanation = `${formatCurrency(charges)} in charges comes out of your ${formatCurrency(requested)}, so you receive ${formatCurrency(receive)}.`
    if (debit != null)
      explanation += ` ${feeText ? `With ${feeText}, ` : ''}${formatCurrency(debit)} leaves your wallet.`
    else if (feeText) explanation += ` ${feeText[0].toUpperCase()}${feeText.slice(1)} is taken from your wallet on top.`
  } else {
    explanation = `You receive ${formatCurrency(receive)}. ${formatCurrency(charges)} in charges${feeText ? ` and ${feeText}` : ''} ${feeText ? 'are' : 'is'} added`
    explanation +=
      debit != null
        ? `: ${formatCurrency(debit)} leaves your wallet.`
        : ' to what comes out of your wallet.'
  }

  return (
    <div className='flex flex-col gap-2'>
      {deductionsIncluded && (
        <Row label='Amount requested' value={formatCurrency(requested)} />
      )}
      {deductions.map((d) => (
        <Row
          key={d.label}
          label={`${d.label} (${ratePercent(d.rate)})`}
          value={formatCurrency(toMajorUnits(d.amount))}
        />
      ))}
      <Row label='You receive' value={formatCurrency(receive)} strong />
      {feeNaira != null && feeNaira > 0 && (
        <Row label='Withdrawal fee' value={formatCurrency(feeNaira)} />
      )}
      {debit != null && (
        <Row
          label='Total from your wallet'
          value={formatCurrency(debit)}
          strong
        />
      )}
      <p className='text-xs text-neutral-10'>{explanation}</p>
    </div>
  )
}

export default WithdrawalCharges
