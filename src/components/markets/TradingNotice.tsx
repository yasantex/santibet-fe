import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'

/**
 * Licence notice shown wherever positions can be bought or sold.
 * TODO(compliance): wording pending sign-off — swap the copy here only, every
 * trading surface reads it from this component.
 */
const TradingNotice = ({ className = '' }: { className?: string }) => (
  <div
    className={`flex items-start gap-2 rounded-lg border border-border bg-hover/40 px-3 py-2.5 ${className}`}
  >
    <HugeiconsIcon
      icon={InformationCircleIcon}
      size={16}
      className='mt-0.5 shrink-0 text-neutral-10'
    />
    <p className='text-[11px] leading-relaxed text-neutral-10'>
      Trading on SantiBet is provided by AWA LAWA LIMITED under an Operational
      Accord with the Ekiti State Lotteries and Gaming Commission. Prices move
      with the market, so you may get back less than you put in. 18+ only.{' '}
      <Link
        to='/terms-of-service'
        className='font-semibold text-black underline underline-offset-2'
      >
        Terms
      </Link>{' '}
      ·{' '}
      <Link
        to='/responsible-gambling'
        className='font-semibold text-black underline underline-offset-2'
      >
        Play responsibly
      </Link>
    </p>
  </div>
)

export default TradingNotice
