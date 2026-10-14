import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Award01FreeIcons,
  MoneyReceiveFlow02Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '../components/globals/Button'
import BadgeGrid from '../components/points/BadgeGrid'
import {
  useBadges,
  usePointsHistory,
  usePointsSummary,
} from '../data_layer/points'
import { formatDate } from '../utils/functions'
import {
  formatPoints,
  formatPointsDelta,
  pointsSourceLabels,
} from '../utils/points'

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className='flex flex-col gap-1 rounded-2xl border border-border bg-card p-4'>
    <span className='text-xs font-semibold text-neutral-10 uppercase'>{label}</span>
    <span className='text-xl font-bold text-black'>{value}</span>
  </div>
)

const PointsHistory = () => {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePointsHistory()

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data],
  )

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='h-14 animate-pulse rounded-lg bg-card' />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
        We couldn’t load your points history right now.
      </p>
    )
  }

  if (entries.length === 0) {
    return (
      <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
        No points yet. You earn them for winning markets, deposits and
        referring friends.
      </p>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col divide-y divide-border rounded-2xl border border-border bg-card px-4'>
        {entries.map((entry) => {
          const isCorrection = entry.points < 0
          return (
            <div key={entry.id} className='flex items-center justify-between gap-3 py-3.5'>
              <div className='flex min-w-0 flex-col gap-0.5'>
                <span className='text-sm font-semibold text-black'>
                  {pointsSourceLabels[entry.source] ?? entry.source}
                  {isCorrection && entry.source !== 'ADJUSTMENT' && ' · correction'}
                </span>
                {entry.reason && (
                  <span className='text-xs text-neutral-10'>{entry.reason}</span>
                )}
                <span className='text-xs text-placeholder'>
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <span
                className={`shrink-0 text-sm font-bold ${
                  isCorrection ? 'text-error' : 'text-success'
                }`}
              >
                {formatPointsDelta(entry.points)}
              </span>
            </div>
          )
        })}
      </div>
      {hasNextPage && (
        <Button
          type='button'
          text='Load more'
          variation='plain'
          className='w-fit! self-center'
          loading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        />
      )}
    </div>
  )
}

const Rewards = () => {
  const { hash } = useLocation()
  const { data: summary, isLoading, isError } = usePointsSummary()
  const badges = useBadges()

  // Arriving from the "you earned a badge" moment lands on the badges.
  useEffect(() => {
    if (hash === '#badges' && !badges.isLoading) {
      document.getElementById('badges')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash, badges.isLoading])

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Rewards
        </h1>
        <p className='text-sm text-neutral-10'>
          Earn points for winning markets, deposits and referring friends.
        </p>
      </div>

      {isLoading ? (
        <div className='h-36 animate-pulse rounded-2xl bg-card' />
      ) : (
        <div className='flex flex-col gap-2 rounded-2xl bg-brand-green p-6 text-black dark:text-[#000000]'>
          <span className='text-sm font-medium opacity-80'>Your points</span>
          <span className='text-4xl font-bold'>
            {isError ? '—' : formatPoints(summary?.total ?? 0)}
          </span>
          <span className='text-sm font-medium opacity-80'>
            {isError
              ? 'We couldn’t load your points right now.'
              : `${formatPoints(summary?.thisWeek ?? 0)} this week · ${formatPoints(
                  summary?.thisMonth ?? 0,
                )} this month`}
          </span>
        </div>
      )}

      {!isLoading && !isError && (
        <section className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <Stat label='Markets won' value={formatPoints(summary?.wins ?? 0)} />
          <Stat label='Deposits' value={formatPoints(summary?.deposits ?? 0)} />
          <Stat
            label='Current streak'
            value={formatPoints(summary?.streak.current ?? 0)}
          />
          <Stat
            label='Longest streak'
            value={formatPoints(summary?.streak.longest ?? 0)}
          />
        </section>
      )}

      <p className='-mt-2 text-xs text-neutral-10'>
        Points usually show up about a minute after a win or deposit.
      </p>

      <section className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {[
          {
            to: '/leaderboard',
            icon: Award01FreeIcons,
            title: 'Leaderboard',
            body: 'See the weekly and monthly boards.',
          },
          {
            to: '/refer-earn',
            icon: MoneyReceiveFlow02Icon,
            title: 'Refer & Earn',
            body: 'Invite friends and earn points and rewards.',
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className='flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-hover'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-hover text-black'>
              <HugeiconsIcon icon={item.icon} size={20} />
            </div>
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-sm font-bold text-black'>{item.title}</span>
              <span className='text-xs text-neutral-10'>{item.body}</span>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className='shrink-0 text-neutral-10'
            />
          </Link>
        ))}
      </section>

      <section id='badges' className='flex scroll-mt-24 flex-col gap-3'>
        <h2 className='text-sm font-semibold text-black uppercase'>Badges</h2>
        <BadgeGrid
          badges={badges.data?.data}
          isLoading={badges.isLoading}
          isError={badges.isError}
        />
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold text-black uppercase'>History</h2>
        <PointsHistory />
      </section>
    </main>
  )
}

export default Rewards
