import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  GiftIcon,
  UserAdd01Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '../components/globals/Button'
import PageNav from '../components/globals/PageNav'
import { useAppSelector } from '../utils/hooks'
import useAuthNavigate from '../hooks/useAuthNavigate'
import { useBonuses, useBonusOffer } from '../data_layer/bonuses'
import { useReferrals } from '../data_layer/points'
import { bonusStatusMeta } from '../utils/bonus'
import type { BonusSummary, BonusType } from '../types/bonus.types'

type Promo = {
  id: string
  icon: IconSvgElement
  amount: string
  amountSuffix?: string
  title: string
  description: string
  /** Who qualifies, in one line. */
  eligibility: string
  /** Full terms. */
  termsHref: string
  cta: string
  /** Where the CTA goes; logged-out users sign up first, then land here. */
  to: string
  /** The bonus-engine type behind it, to read the player's own status. */
  bonusType?: BonusType
}

type PromoStatus = { label: string; className: string }

const NEUTRAL = 'bg-surface-hover text-black'
const GOOD = 'bg-surface-success text-success'

const PROMOS: Promo[] = [
  {
    id: 'welcome',
    icon: GiftIcon,
    amount: '₦1,010',
    title: 'Welcome Bonus',
    description:
      'Get ₦1,010 credited to your SantiBet account when you sign up.',
    eligibility: 'New SantiBet accounts, one per person and device.',
    termsHref: '/terms/new-member-bonus',
    cta: 'View my bonus',
    to: '/bonuses',
    bonusType: 'NO_DEPOSIT',
  },
  {
    id: 'first-deposit',
    icon: Wallet01Icon,
    amount: '₦1,000',
    title: 'First Deposit Bonus',
    description:
      'Make your first deposit and receive an additional ₦1,000 bonus.',
    eligibility: 'Your first deposit only, with the bonus box ticked.',
    termsHref: '/terms/1000-bonus',
    cta: 'Deposit',
    to: '/account-wallet',
    bonusType: 'DEPOSIT_MATCH',
  },
  {
    id: 'refer',
    icon: UserAdd01Icon,
    amount: '₦200',
    amountSuffix: 'each',
    title: 'Refer a Friend',
    description:
      'Invite your friends to SantiBet. You get ₦200, and your friend gets ₦200 when they meet the qualifying requirements.',
    eligibility: 'Friends who sign up with your link and qualify.',
    termsHref: '/terms',
    cta: 'Invite friends',
    to: '/refer-earn',
  },
]

/** Newest bonus of a type the player has had, if any. */
const latestOfType = (bonuses: BonusSummary[] | undefined, type: BonusType) =>
  bonuses?.find((b) => b.type === type)

/** Each promo's status for the signed-in player; null while loading. */
const usePromoStatuses = (signedIn: boolean) => {
  const { data: bonuses, isLoading: bonusesLoading } = useBonuses(signedIn)
  const { data: offer } = useBonusOffer(signedIn)
  const { data: referrals } = useReferrals(signedIn)

  return (promo: Promo): PromoStatus | null => {
    if (!signedIn) return null
    if (promo.bonusType) {
      if (bonusesLoading) return null
      const had = latestOfType(bonuses?.data, promo.bonusType)
      if (had) return bonusStatusMeta[had.status] ?? { label: had.status, className: NEUTRAL }
      if (promo.bonusType === 'DEPOSIT_MATCH') {
        if (!offer) return null
        if (offer.show) return { label: 'Available', className: GOOD }
        return {
          label:
            offer.hiddenReason === 'NOT_FIRST_DEPOSIT'
              ? 'Not eligible'
              : offer.hiddenReason === 'PAUSED' || offer.hiddenReason === 'NO_PROMOTION'
                ? 'Paused'
                : 'Not available',
          className: NEUTRAL,
        }
      }
      return { label: 'Not received', className: NEUTRAL }
    }
    if (!referrals) return null
    if (!referrals.program.enabled) return { label: 'Paused', className: NEUTRAL }
    const { qualified, pending } = referrals.counts
    return {
      label: `${qualified} qualified · ${pending} pending`,
      className: qualified > 0 ? GOOD : NEUTRAL,
    }
  }
}

/** The player's status for a promo, or its number while signed out. */
const PromoBadge = ({
  status,
  index,
}: {
  status: PromoStatus | null
  index: number
}) =>
  status ? (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
    >
      {status.label}
    </span>
  ) : (
    <span className='text-xs font-semibold text-placeholder'>
      {String(index + 1).padStart(2, '0')}
    </span>
  )

const Promos = () => {
  const { user } = useAppSelector((state) => state.user)
  const navigate = useNavigate()
  const authNavigate = useAuthNavigate()

  const go = (to: string) =>
    user ? navigate(to) : authNavigate('/signup', to)
  const statusOf = usePromoStatuses(!!user)

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pt-4 md:gap-8 md:px-8'>
      <PageNav crumbs={[{ label: 'Promos' }]} />

      {/* Hero — fixed black text: brand green stays light in dark mode. */}
      <section className='relative overflow-hidden rounded-3xl bg-brand-green px-5 py-7 text-[#000000] md:px-10 md:py-12'>
        <HugeiconsIcon
          icon={GiftIcon}
          size={220}
          className='pointer-events-none absolute -right-8 -bottom-10 opacity-10 md:right-6'
        />
        <div className='relative flex max-w-xl flex-col gap-3'>
          <span className='w-fit rounded-full bg-[#000000]/10 px-3 py-1 text-xs font-semibold'>
            SantiBet Promos
          </span>
          <h1 className='text-2xl font-bold md:text-4xl'>
            Extra credit from day one
          </h1>
          <p className='text-sm md:text-base'>
            Sign up, make your first deposit and invite your friends. Each
            one comes with a bonus.
          </p>
          {!user && (
            <Button
              type='button'
              text='Sign up now'
              size='medium'
              onClick={() => authNavigate('/signup', '/bonuses')}
              className='mt-2 w-fit! bg-[#000000]! px-6 text-white!'
            />
          )}
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {PROMOS.map((promo, i) => (
          <article
            key={promo.id}
            className='flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 md:p-6'
          >
            <div className='flex items-center justify-between'>
              <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green text-[#000000]'>
                <HugeiconsIcon icon={promo.icon} size={22} />
              </span>
              <PromoBadge status={statusOf(promo)} index={i} />
            </div>

            <div className='flex flex-1 flex-col gap-2'>
              <p className='text-sm font-semibold text-neutral-10'>
                {promo.title}
              </p>
              <p className='flex items-baseline gap-1.5 text-3xl font-bold text-black'>
                {promo.amount}
                {promo.amountSuffix && (
                  <span className='text-base font-semibold text-neutral-10'>
                    {promo.amountSuffix}
                  </span>
                )}
              </p>
              <p className='text-sm leading-relaxed text-neutral-10'>
                {promo.description}
              </p>
              <p className='text-xs text-neutral-10'>
                <span className='font-semibold text-black'>Who qualifies: </span>
                {promo.eligibility}
              </p>
              <Link
                to={promo.termsHref}
                className='w-fit text-xs font-semibold text-black underline underline-offset-2'
              >
                Terms apply
              </Link>
            </div>

            <Button
              type='button'
              text={user ? promo.cta : 'Sign up'}
              variation='primary'
              size='medium'
              onClick={() => go(promo.to)}
            />
          </article>
        ))}
      </section>

      <p className='text-xs text-placeholder'>
        Terms apply. Bonus credit can only be used on eligible markets and
        may require identity verification before use.
      </p>
    </div>
  )
}

export default Promos
