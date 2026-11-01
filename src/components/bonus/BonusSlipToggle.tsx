import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { GiftIcon } from '@hugeicons/core-free-icons'
import type { BonusSlip } from '../../hooks/useBonusSlip'
import { formatKobo } from '../../utils/bonus'
import { KYC_PATH } from '../../utils/authRedirect'

/**
 * "Use bonus" switch on the bet slip. Shown only while the player has a live
 * bonus. A PENDING_KYC bonus shows the credit with a verify prompt instead.
 */
const BonusSlipToggle = ({ slip }: { slip: BonusSlip }) => {
  const { bonus } = slip
  if (!bonus) return null

  const disabled = slip.pendingKyc || slip.marketOrdersOnly || !bonus.canBet

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-brand-green/40 bg-surface-success/40 px-3 py-2.5'>
      <label
        className={`flex items-center gap-2.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <HugeiconsIcon icon={GiftIcon} size={18} className='shrink-0 text-success' />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='text-sm font-semibold text-black'>Use bonus</span>
          <span className='truncate text-xs text-neutral-10'>
            {formatKobo(bonus.balanceKobo)} bonus credit · {bonus.title}
          </span>
        </span>
        <span className='relative shrink-0'>
          <input
            type='checkbox'
            className='peer sr-only'
            checked={slip.useBonus && !disabled}
            disabled={disabled}
            onChange={(e) => slip.setUseBonus(e.target.checked)}
            aria-label='Use bonus credit for this bet'
          />
          <span
            className={`block h-5 w-11 rounded-full transition-colors ${
              slip.useBonus && !disabled ? 'bg-brand-green' : 'bg-plain'
            } ${disabled ? 'opacity-50' : ''}`}
          />
          <span
            className={`absolute top-0.5 left-1 h-4 w-4 rounded-full transition-transform ${
              slip.useBonus && !disabled
                ? 'translate-x-5 bg-surface-base'
                : 'bg-track'
            }`}
          />
        </span>
      </label>

      {slip.pendingKyc ? (
        <p className='text-xs text-warning'>
          Verify your identity to start using your bonus.{' '}
          <Link to={KYC_PATH} className='font-semibold underline underline-offset-2'>
            Verify now
          </Link>
        </p>
      ) : slip.marketOrdersOnly ? (
        <p className='text-xs text-neutral-10'>
          Bonus bets are placed at the current price — switch to Market to use
          your bonus.
        </p>
      ) : slip.active ? (
        <p className='text-xs text-neutral-10'>
          {slip.creditsTo === 'LOCKED_WINNINGS'
            ? 'A win adds the profit to your locked winnings. Bonus bets can’t be cashed out.'
            : 'A win goes back to your bonus balance. Bonus bets can’t be cashed out.'}
        </p>
      ) : null}
    </div>
  )
}

export default BonusSlipToggle
