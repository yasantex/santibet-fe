import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserGroupIcon,
  MoneyBag02Icon,
  ForwardIcon,
} from '@hugeicons/core-free-icons'
import PreviewNotice from '../components/globals/PreviewNotice'
import { CopyButton } from '../components/globals/CopyButton'
import { useAppSelector } from '../utils/hooks'

const ReferEarn = () => {
  const { user } = useAppSelector((state) => state.user)

  const referralCode = useMemo(() => {
    const base = user?.id ?? user?.email ?? 'SANTI'
    return `SB-${base.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
  }, [user])

  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`

  const steps = [
    {
      icon: ForwardIcon,
      title: 'Share your link',
      body: 'Send your referral link to friends.',
    },
    {
      icon: UserGroupIcon,
      title: 'They sign up & trade',
      body: 'Your friend joins and places their first prediction.',
    },
    {
      icon: MoneyBag02Icon,
      title: 'You both earn',
      body: 'You each receive a bonus once they start trading.',
    },
  ]

  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Refer &amp; Earn
        </h1>
        <p className='text-sm text-neutral-10'>
          Invite friends and earn rewards when they start predicting.
        </p>
      </div>

      <PreviewNotice>
        Referral tracking and payouts activate once the referral API is
        available. Your link and code are generated from your account.
      </PreviewNotice>

      <div className='flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6'>
        <div className='rounded-xl bg-white p-3'>
          <QRCodeSVG value={referralLink} size={148} />
        </div>

        <div className='flex w-full flex-col gap-2'>
          <span className='text-xs font-semibold text-neutral-10 uppercase'>
            Your referral code
          </span>
          <div className='flex items-center justify-between rounded-lg border border-border px-4 py-3'>
            <span className='text-lg font-bold tracking-wider text-black'>
              {referralCode}
            </span>
            <CopyButton value={referralCode} size={18} />
          </div>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <span className='text-xs font-semibold text-neutral-10 uppercase'>
            Share link
          </span>
          <div className='flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3'>
            <span className='truncate text-sm text-neutral-10'>
              {referralLink}
            </span>
            <CopyButton value={referralLink} size={18} />
          </div>
        </div>
      </div>

      <section className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        {steps.map((s) => (
          <div
            key={s.title}
            className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-4'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-hover text-black'>
              <HugeiconsIcon icon={s.icon} size={20} />
            </div>
            <span className='text-sm font-bold text-black'>{s.title}</span>
            <span className='text-xs text-neutral-10'>{s.body}</span>
          </div>
        ))}
      </section>
    </main>
  )
}

export default ReferEarn
