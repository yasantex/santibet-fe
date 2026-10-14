import { Link } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  ForwardIcon,
  InformationCircleIcon,
  MoneyBag02Icon,
  Share08Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { CopyButton } from '../components/globals/CopyButton'
import { Button } from '../components/globals/Button'
import { StatusBadge } from '../components/globals/ReusedText'
import { useReferrals } from '../data_layer/points'
import { useAppSelector } from '../utils/hooks'
import {
  formatPoints,
  formatReferralReward,
  formatShortDate,
  referralRewardStatusConfig,
  referralRewardStatusHint,
  referralTriggerCopy,
  referralTriggerStep,
} from '../utils/points'
import type { ReferralProgress } from '../types/points.types'

const Header = () => (
  <div className='flex flex-col gap-2'>
    <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
      Refer &amp; Earn
    </h1>
    <p className='text-sm text-neutral-10'>
      Invite friends to Santibet and earn rewards when they get started.
    </p>
  </div>
)

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className='flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm'>
    <HugeiconsIcon
      icon={InformationCircleIcon}
      size={18}
      className='mt-0.5 shrink-0 text-neutral-10'
    />
    <span className='text-neutral-10'>{children}</span>
  </div>
)

const ShareCard = ({ code, link }: { code: string; link: string }) => {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  const share = () => {
    navigator
      .share({
        title: 'Join me on Santibet',
        text: `Join me on Santibet with my code ${code}`,
        url: link,
      })
      .catch(() => {
        // dismissed — nothing to do
      })
  }

  return (
    <div className='flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6'>
      <div className='rounded-xl bg-[#ffffff] p-3'>
        <QRCodeSVG value={link} size={148} />
      </div>

      <div className='flex w-full flex-col gap-2'>
        <span className='text-xs font-semibold text-neutral-10 uppercase'>
          Your referral code
        </span>
        <div className='flex items-center justify-between rounded-lg border border-border px-4 py-3'>
          <span className='text-lg font-bold tracking-wider text-black'>
            {code}
          </span>
          <CopyButton value={code} size={18} />
        </div>
      </div>

      <div className='flex w-full flex-col gap-2'>
        <span className='text-xs font-semibold text-neutral-10 uppercase'>
          Share link
        </span>
        <div className='flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3'>
          <span className='truncate text-sm text-neutral-10'>{link}</span>
          <CopyButton value={link} size={18} />
        </div>
      </div>

      {canShare && (
        <Button
          type='button'
          text='Share invite'
          variation='primary'
          size='large'
          className='w-full!'
          extra={<HugeiconsIcon icon={Share08Icon} size={18} />}
          onClick={share}
        />
      )}
    </div>
  )
}

const Steps = ({ trigger }: { trigger: ReferralProgress['program']['trigger'] }) => {
  const steps = [
    {
      icon: ForwardIcon,
      title: 'Share your link',
      body: 'Send your code or link to friends.',
    },
    {
      icon: UserGroupIcon,
      title: 'They join',
      body: 'Your friend signs up with your link or code.',
    },
    {
      icon: MoneyBag02Icon,
      title: referralTriggerStep[trigger],
      body: `They count towards your rewards ${referralTriggerCopy[trigger]}.`,
    },
  ]

  return (
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
  )
}

const Counts = ({ data }: { data: ReferralProgress }) => (
  <section className='grid grid-cols-2 gap-3'>
    <div className='flex flex-col gap-1 rounded-2xl border border-border bg-card p-4'>
      <span className='text-xs font-semibold text-neutral-10 uppercase'>
        Friends counted
      </span>
      <span className='text-2xl font-bold text-black'>
        {formatPoints(data.counts.qualified)}
      </span>
    </div>
    <div className='flex flex-col gap-1 rounded-2xl border border-border bg-card p-4'>
      <span className='text-xs font-semibold text-neutral-10 uppercase'>
        Joined, not yet counted
      </span>
      <span className='text-2xl font-bold text-black'>
        {formatPoints(data.counts.pending)}
      </span>
      <span className='text-xs text-neutral-10'>
        They count {referralTriggerCopy[data.program.trigger]}.
      </span>
    </div>
  </section>
)

const Milestones = ({ data }: { data: ReferralProgress }) => {
  if (!data.milestones.length) return null
  const ladder = [...data.milestones].sort((a, b) => a.friendCount - b.friendCount)

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-sm font-semibold text-black uppercase'>Milestones</h2>
      <ol className='flex flex-col gap-3'>
        {ladder.map((m) => {
          const progress = Math.min(data.counts.qualified, m.friendCount)
          const pct = Math.round((progress / m.friendCount) * 100)
          const perks = [
            m.bonusPoints > 0 ? `${formatPoints(m.bonusPoints)} points` : null,
            m.reward ? formatReferralReward(m.reward.kind, m.reward.amount) : null,
          ].filter(Boolean)

          return (
            <li
              key={m.friendCount}
              className='flex items-center gap-3 rounded-2xl border border-border bg-card p-4'
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  m.reached
                    ? 'bg-brand-green text-black dark:text-[#000000]'
                    : 'bg-hover text-neutral-10'
                }`}
              >
                {m.reached ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
                ) : (
                  m.friendCount
                )}
              </div>
              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm font-semibold text-black'>
                    {m.friendCount} {m.friendCount === 1 ? 'friend' : 'friends'}
                  </span>
                  <span className='text-right text-sm font-bold text-success'>
                    {perks.join(' + ') || '—'}
                  </span>
                </div>
                {!m.reached && (
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-hover'>
                      <div
                        className='h-full rounded-full bg-brand-green'
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className='shrink-0 text-[11px] font-semibold text-neutral-10'>
                      {progress}/{m.friendCount}
                    </span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const Rewards = ({ data }: { data: ReferralProgress }) => (
  <section className='flex flex-col gap-3'>
    <h2 className='text-sm font-semibold text-black uppercase'>Your rewards</h2>
    {data.rewards.length === 0 ? (
      <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
        No rewards yet. They’ll show here once your friends count.
      </p>
    ) : (
      <div className='flex flex-col divide-y divide-border rounded-2xl border border-border bg-card px-4'>
        {data.rewards.map((r) => (
          <div key={r.id} className='flex items-start justify-between gap-3 py-3.5'>
            <div className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-sm font-semibold text-black'>
                {formatReferralReward(r.kind, r.amount)}
              </span>
              <span className='text-xs text-neutral-10'>
                {r.milestone
                  ? `Milestone · ${r.milestone} friends`
                  : 'Friend referred'}{' '}
                · {formatShortDate(r.createdAt)}
              </span>
              <span className='text-xs text-placeholder'>
                {referralRewardStatusHint[r.status]}
                {r.status === 'FAILED' && (
                  <>
                    {' '}
                    <Link
                      to='/contact-us'
                      className='font-semibold text-black underline underline-offset-2'
                    >
                      Contact support
                    </Link>
                  </>
                )}
              </span>
            </div>
            <StatusBadge value={r.status} statusConfig={referralRewardStatusConfig} />
          </div>
        ))}
      </div>
    )}
  </section>
)

const ReferEarn = () => {
  const { user } = useAppSelector((state) => state.user)
  const { data, isLoading, isError, refetch } = useReferrals()

  if (isLoading) {
    return (
      <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
        <Header />
        <div className='h-80 animate-pulse rounded-2xl bg-card' />
        <div className='h-24 animate-pulse rounded-2xl bg-card' />
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
        <Header />
        <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center'>
          <p className='text-sm text-neutral-10'>
            We couldn’t load your referrals right now.
          </p>
          <Button
            type='button'
            text='Try again'
            className='w-fit!'
            variation='plain'
            onClick={() => refetch()}
          />
        </div>
      </main>
    )
  }

  if (!data.program.enabled) {
    return (
      <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
        <Header />
        <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-hover text-neutral-10'>
            <HugeiconsIcon icon={UserGroupIcon} size={22} />
          </div>
          <span className='text-base font-bold text-black'>
            Referrals aren’t running right now
          </span>
          <span className='text-sm text-neutral-10'>
            Check back soon — we’ll let you know when you can invite friends
            and earn.
          </span>
        </div>
      </main>
    )
  }

  const rewardKinds = new Set([
    ...data.rewards.map((r) => r.kind),
    ...data.milestones.flatMap((m) => (m.reward ? [m.reward.kind] : [])),
  ])
  const needsPhone = rewardKinds.has('AIRTIME') && !user?.phoneVerified

  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <Header />
      <ShareCard code={data.code} link={data.link} />
      <Steps trigger={data.program.trigger} />
      <Counts data={data} />
      <Milestones data={data} />
      <Rewards data={data} />

      <div className='flex flex-col gap-2'>
        {rewardKinds.has('CASH') && (
          <Note>
            Cash rewards go to your trading balance. You can bet with them
            straight away, but they can only be withdrawn once they’ve been
            played and won.
          </Note>
        )}
        {rewardKinds.has('AIRTIME') && (
          <Note>
            Airtime is sent to your verified phone number.
            {needsPhone && (
              <>
                {' '}
                You haven’t verified one yet, so airtime rewards will wait
                until you do.{' '}
                <Link
                  to='/account-profile?tab=verification'
                  className='font-semibold text-black underline underline-offset-2'
                >
                  Verify your phone
                </Link>
              </>
            )}
          </Note>
        )}
      </div>
    </main>
  )
}

export default ReferEarn
