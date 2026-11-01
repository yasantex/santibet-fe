import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Clock01Icon,
  GiftIcon,
  SquareLock02Icon,
  UserCheck01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import type { CurrentBonus } from '../../types/bonus.types'
import {
  bonusGoalCopy,
  bonusStatusMeta,
  formatKobo,
  koboToNumber,
} from '../../utils/bonus'
import { KYC_PATH } from '../../utils/authRedirect'

interface BonusCardProps {
  bonus: CurrentBonus
  /** Wallet version: balance, progress and a link to the bonus page. */
  compact?: boolean
}

const ProgressBar = ({ percent }: { percent: number }) => {
  const width = Math.min(Math.max(percent, 0), 100)
  return (
    <div
      className='h-2 w-full overflow-hidden rounded-full bg-hover'
      role='progressbar'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className='h-full rounded-full bg-brand-green transition-[width] duration-500'
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

/** The progress line under the bar, in the spec's words for each bonus kind. */
const ProgressLine = ({ bonus }: { bonus: CurrentBonus }) => {
  if (bonus.completionMode === 'TARGET_BALANCE') {
    return (
      <div className='flex items-center justify-between text-xs text-neutral-10'>
        <span>
          {formatKobo(bonus.balanceKobo)} of{' '}
          {formatKobo(bonus.progress.targetBalanceKobo)}
        </span>
        <span className='font-semibold text-black'>
          {Math.round(bonus.progress.percent)}%
        </span>
      </div>
    )
  }
  const remaining = koboToNumber(bonus.progress.remainingToBetKobo)
  return (
    <div className='flex items-center justify-between text-xs text-neutral-10'>
      <span>
        {remaining > 0 ? (
          <>
            <span className='font-semibold text-black'>
              {formatKobo(remaining)}
            </span>{' '}
            still to bet
          </>
        ) : (
          'Playthrough complete — settling'
        )}
      </span>
      <span className='font-semibold text-black'>
        {Math.round(bonus.progress.percent)}%
      </span>
    </div>
  )
}

/**
 * The player's live bonus: balance (apart from cash), progress toward cash,
 * locked winnings, expiry and the KYC prompt for a PENDING_KYC bonus.
 */
const BonusCard = ({ bonus, compact = false }: BonusCardProps) => {
  const navigate = useNavigate()
  const status = bonusStatusMeta[bonus.status]
  const isPlaythrough = bonus.completionMode === 'PLAYTHROUGH'
  const showLocked =
    bonus.payoutMode === 'PROFIT_LOCKED' ||
    koboToNumber(bonus.lockedWinningsKobo) > 0
  const termsUrl = bonus.display?.termsUrl
  const title = bonus.display?.title || bonus.title

  return (
    <section className='flex flex-col gap-4 rounded-lg border border-brand-green/40 bg-card p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-success text-success'>
            <HugeiconsIcon icon={GiftIcon} size={18} />
          </span>
          <div className='flex min-w-0 flex-col'>
            <span className='truncate text-sm font-semibold text-black'>
              {title}
            </span>
            <span className='text-xs text-neutral-10'>
              Bonus credit · can’t be withdrawn
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className='flex flex-wrap items-end gap-x-8 gap-y-3'>
        <div className='flex flex-col'>
          <span className='text-xs text-neutral-10'>Bonus balance</span>
          <span className='text-2xl font-bold text-black'>
            {formatKobo(bonus.balanceKobo)}
          </span>
        </div>
        {showLocked && (
          <div className='flex flex-col'>
            <span className='flex items-center gap-1 text-xs text-neutral-10'>
              <HugeiconsIcon icon={SquareLock02Icon} size={12} />
              Locked winnings
            </span>
            <span className='text-lg font-bold text-black'>
              {formatKobo(bonus.lockedWinningsKobo)}
            </span>
          </div>
        )}
        {bonus.daysLeft != null && (
          <span className='mb-1 flex items-center gap-1 rounded-full bg-hover px-2.5 py-1 text-xs font-semibold text-black'>
            <HugeiconsIcon icon={Clock01Icon} size={12} />
            {bonus.daysLeft <= 0
              ? 'Ends today'
              : `${bonus.daysLeft} day${bonus.daysLeft === 1 ? '' : 's'} left`}
          </span>
        )}
      </div>

      {bonus.kycRequired ? (
        <div className='flex flex-col gap-3 rounded-lg bg-warning/10 p-3 sm:flex-row sm:items-center'>
          <HugeiconsIcon
            icon={UserCheck01Icon}
            size={20}
            className='shrink-0 text-warning'
          />
          <p className='flex-1 text-xs text-black'>
            Verify your identity to start using your bonus. Your credit is
            waiting — it can be bet as soon as your ID is approved.
          </p>
          <Button
            type='button'
            text='Verify identity'
            variation='primary'
            size='small'
            className='w-fit! shrink-0'
            onClick={() => navigate(KYC_PATH)}
          />
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          <ProgressBar percent={bonus.progress.percent} />
          <ProgressLine bonus={bonus} />
          {!compact && (
            <p className='text-xs text-neutral-10'>{bonusGoalCopy(bonus)}</p>
          )}
        </div>
      )}

      {!compact && bonus.openBets.count > 0 && (
        <p className='text-xs text-neutral-10'>
          {bonus.openBets.count} open bonus bet
          {bonus.openBets.count === 1 ? '' : 's'} ·{' '}
          {formatKobo(bonus.openBets.stakeKobo)} staked. Your bonus can’t end
          while a bonus bet is open.
        </p>
      )}

      {!compact && isPlaythrough && !bonus.kycRequired && (
        <p className='text-xs text-neutral-10'>
          Turn on <span className='font-semibold text-black'>Use bonus</span>{' '}
          on the bet slip to stake this credit.
        </p>
      )}

      <div className='flex flex-wrap items-center justify-between gap-3'>
        {compact ? (
          <Link
            to='/bonuses'
            className='flex items-center gap-0.5 text-xs font-semibold text-black hover:underline'
          >
            View bonus details
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        ) : (
          !bonus.kycRequired && (
            <Button
              type='button'
              text='Find a market'
              variation='primary'
              size='medium'
              className='w-fit!'
              onClick={() => navigate('/browse')}
            />
          )
        )}
        {termsUrl && (
          <Link
            to={termsUrl}
            className='text-xs font-semibold text-neutral-10 underline underline-offset-2 hover:text-black'
          >
            Terms & conditions
          </Link>
        )}
      </div>
    </section>
  )
}

export default BonusCard
