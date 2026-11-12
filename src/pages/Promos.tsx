import { useNavigate } from 'react-router'
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

type Promo = {
  id: string
  icon: IconSvgElement
  amount: string
  amountSuffix?: string
  title: string
  description: string
  cta: string
  /** Where the CTA goes; logged-out users sign up first, then land here. */
  to: string
}

const PROMOS: Promo[] = [
  {
    id: 'welcome',
    icon: GiftIcon,
    amount: '₦1,010',
    title: 'Welcome Bonus',
    description:
      'Get ₦1,010 credited to your SantiBet account when you sign up.',
    cta: 'View my bonus',
    to: '/bonuses',
  },
  {
    id: 'first-deposit',
    icon: Wallet01Icon,
    amount: '₦1,000',
    title: 'First Deposit Bonus',
    description:
      'Make your first deposit and receive an additional ₦1,000 bonus.',
    cta: 'Deposit',
    to: '/account-wallet',
  },
  {
    id: 'refer',
    icon: UserAdd01Icon,
    amount: '₦200',
    amountSuffix: 'each',
    title: 'Refer a Friend',
    description:
      'Invite your friends to SantiBet. You get ₦200, and your friend gets ₦200 when they meet the qualifying requirements.',
    cta: 'Invite friends',
    to: '/refer-earn',
  },
]

const Promos = () => {
  const { user } = useAppSelector((state) => state.user)
  const navigate = useNavigate()
  const authNavigate = useAuthNavigate()

  const go = (to: string) =>
    user ? navigate(to) : authNavigate('/signup', to)

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
            Sign up, make your first deposit and invite your friends — each
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
              <span className='text-xs font-semibold text-placeholder'>
                {String(i + 1).padStart(2, '0')}
              </span>
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
