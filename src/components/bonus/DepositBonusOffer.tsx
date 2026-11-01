import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, GiftIcon } from '@hugeicons/core-free-icons'
import type { BonusOffer } from '../../types/bonus.types'
import { formatKobo, koboToNumber } from '../../utils/bonus'
import { toMinorUnits } from '../../utils/functions'

interface DepositBonusOfferProps {
  offer?: BonusOffer
  checked: boolean
  onChange: (checked: boolean) => void
  /** The amount typed so far, in Naira — drives the bonus preview and hint. */
  amount?: number
  /** Crypto has no tickbox: the bonus applies automatically. */
  informational?: boolean
  onNavigate?: () => void
}

/**
 * First-deposit bonus on the deposit screen: a pre-ticked, always-visible
 * tickbox, plus the forfeit warning whenever a new-member bonus is live (any
 * deposit ends it, ticked or not).
 */
const DepositBonusOffer = ({
  offer,
  checked,
  onChange,
  amount,
  informational = false,
  onNavigate,
}: DepositBonusOfferProps) => {
  if (!offer) return null

  const minKobo = koboToNumber(offer.minDepositKobo)
  const maxKobo = koboToNumber(offer.maxBonusKobo)
  const amountKobo = amount ? toMinorUnits(amount) : 0
  const belowMin = amountKobo > 0 && minKobo > 0 && amountKobo < minKobo
  const previewKobo =
    amountKobo > 0 && !belowMin && offer.matchPercent
      ? Math.min(
          Math.floor((amountKobo * offer.matchPercent) / 100),
          maxKobo || Infinity,
        )
      : 0

  return (
    <div className='flex flex-col gap-2'>
      {offer.show && (
        <div
          className={`flex flex-col gap-2 rounded-lg border px-3 py-3 ${
            checked || informational
              ? 'border-brand-green/50 bg-surface-success/40'
              : 'border-border'
          }`}
        >
          <label
            className={`flex items-start gap-2.5 ${informational ? '' : 'cursor-pointer'}`}
          >
            {informational ? (
              <HugeiconsIcon
                icon={GiftIcon}
                size={18}
                className='mt-0.5 shrink-0 text-success'
              />
            ) : (
              <input
                type='checkbox'
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className='mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-green'
              />
            )}
            <span className='flex flex-col gap-0.5'>
              <span className='text-sm font-semibold text-black'>
                {offer.label ?? 'Get your first deposit bonus'}
              </span>
              {offer.kycRequired && (
                <span className='text-xs text-neutral-10'>
                  You’ll need to verify your ID to use it.
                </span>
              )}
              {offer.expiryDays != null && (
                <span className='text-xs text-neutral-10'>
                  Use it within {offer.expiryDays} days.
                </span>
              )}
            </span>
          </label>

          {belowMin ? (
            <p className='text-xs font-medium text-warning'>
              Deposit {formatKobo(minKobo)} or more to get the bonus.
            </p>
          ) : previewKobo > 0 && (checked || informational) ? (
            <p className='text-xs font-semibold text-success'>
              You’ll get {formatKobo(previewKobo)} in bonus credit.
            </p>
          ) : minKobo > 0 && !amountKobo ? (
            <p className='text-xs text-neutral-10'>
              Deposit {formatKobo(minKobo)} or more to get the bonus.
            </p>
          ) : null}

          {!checked && !informational && (
            <p className='text-xs text-neutral-10'>
              Unticked, this deposit declines the bonus for good.
            </p>
          )}

          {offer.termsUrl && (
            <Link
              to={offer.termsUrl}
              onClick={onNavigate}
              className='w-fit text-xs font-semibold text-neutral-10 underline underline-offset-2 hover:text-black'
            >
              Bonus terms & conditions
            </Link>
          )}
        </div>
      )}

      {offer.forfeitWarning && (
        <div className='flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5'>
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={16}
            className='mt-0.5 shrink-0 text-warning'
          />
          <p className='text-xs font-medium text-black'>
            {offer.forfeitWarning}
          </p>
        </div>
      )}
    </div>
  )
}

export default DepositBonusOffer
