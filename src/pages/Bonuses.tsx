import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  GiftIcon,
} from '@hugeicons/core-free-icons'
import BonusCard from '../components/bonus/BonusCard'
import Deposit from '../components/appModals/Deposit'
import { Button } from '../components/globals/Button'
import { Tabs } from '../components/globals/Tabs'
import {
  useBonuses,
  useBonusHistory,
  useBonusOffer,
  useCurrentBonus,
} from '../data_layer/bonuses'
import { formatDate } from '../utils/functions'
import {
  bonusEndedCopy,
  bonusEventMeta,
  bonusRuleLines,
  bonusStatusMeta,
  formatKobo,
  koboToNumber,
} from '../utils/bonus'
import useAccountSuspended from '../hooks/useAccountSuspended'
import type { BonusHistoryEntry } from '../types/bonus.types'

type BonusTab = 'activity' | 'past'

const TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'past', label: 'My bonuses' },
]

const Skeleton = ({ rows = 4, height = 'h-14' }) => (
  <div className='flex flex-col gap-3'>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`${height} animate-pulse rounded-lg bg-hover`} />
    ))}
  </div>
)

const HistoryRow = ({ entry }: { entry: BonusHistoryEntry }) => {
  const meta = bonusEventMeta[entry.type] ?? {
    label: entry.type.replaceAll('_', ' ').toLowerCase(),
    sign: 0,
  }
  const amount = koboToNumber(entry.amountKobo)
  const tone = meta.sign > 0 ? 'text-success' : 'text-black'
  const prefix = amount === 0 ? '' : meta.sign > 0 ? '+' : meta.sign < 0 ? '-' : ''

  return (
    <div className='flex items-center justify-between gap-4 py-3'>
      <div className='flex min-w-0 items-center gap-3'>
        <span
          className={`h-8 w-8 shrink-0 rounded-full ${
            meta.sign > 0 ? 'bg-success' : 'bg-[#16191a]! dark:bg-[#e4e5e3]!'
          }`}
        />
        <div className='flex min-w-0 flex-col'>
          <span className='text-sm font-semibold text-black'>{meta.label}</span>
          {entry.note && (
            <span className='truncate text-sm text-black'>{entry.note}</span>
          )}
          <span className='text-xs text-placeholder'>
            {entry.title} · {formatDate(entry.createdAt)}
          </span>
        </div>
      </div>
      <div className='flex shrink-0 flex-col items-end gap-0.5'>
        {amount > 0 && (
          <span className={`text-sm font-semibold ${tone}`}>
            {prefix}
            {formatKobo(amount)}
          </span>
        )}
        {entry.balanceAfterKobo != null && (
          <span className='text-[11px] text-placeholder'>
            Bonus {formatKobo(entry.balanceAfterKobo)}
            {koboToNumber(entry.lockedAfterKobo) > 0 &&
              ` · Locked ${formatKobo(entry.lockedAfterKobo)}`}
          </span>
        )}
      </div>
    </div>
  )
}

const BonusActivity = () => {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBonusHistory()

  const entries = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.data ?? []) ?? []).filter(
        (e) => !bonusEventMeta[e.type]?.hidden,
      ),
    [data],
  )

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return
    const observer = new IntersectionObserver(
      (items) => {
        if (items[0].isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <Skeleton />
  if (isError) {
    return (
      <p className='py-6 text-center text-sm text-neutral-10'>
        We couldn’t load your bonus activity right now.
      </p>
    )
  }
  if (entries.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-black'>
        No bonus activity yet.
      </p>
    )
  }

  return (
    <>
      <div className='flex max-h-150 flex-col divide-y divide-border overflow-y-auto'>
        {entries.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className='flex justify-center py-3'>
          {isFetchingNextPage && (
            <span className='text-xs text-neutral-10'>Loading more…</span>
          )}
        </div>
      )}
    </>
  )
}

const PastBonuses = () => {
  const { data, isLoading, isError } = useBonuses()
  const bonuses = data?.data ?? []

  if (isLoading) return <Skeleton rows={3} height='h-20' />
  if (isError) {
    return (
      <p className='py-6 text-center text-sm text-neutral-10'>
        We couldn’t load your bonuses right now.
      </p>
    )
  }
  if (bonuses.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-black'>
        You haven’t had a bonus yet.
      </p>
    )
  }

  return (
    <div className='flex flex-col divide-y divide-border'>
      {bonuses.map((b) => {
        const status = bonusStatusMeta[b.status] ?? {
          label: b.status,
          className: 'bg-surface-hover text-black',
        }
        const released = koboToNumber(b.cashReleasedKobo)
        return (
          <div key={b.id} className='flex flex-col gap-1.5 py-3'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-sm font-semibold text-black'>{b.title}</span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-10'>
              {koboToNumber(b.bonusAmountKobo) > 0 && (
                <span>Bonus {formatKobo(b.bonusAmountKobo)}</span>
              )}
              {released > 0 && (
                <span className='font-semibold text-success'>
                  {formatKobo(released)} paid to cash
                </span>
              )}
              {b.grantedAt && <span>Added {formatDate(b.grantedAt)}</span>}
              {b.endedAt && <span>Ended {formatDate(b.endedAt)}</span>}
            </div>
            {bonusEndedCopy[b.status] && (
              <p className='text-xs text-neutral-10'>{bonusEndedCopy[b.status]}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

const Bonuses = () => {
  const suspended = useAccountSuspended()
  const [tab, setTab] = useState<BonusTab>('activity')
  const [depositOpen, setDepositOpen] = useState(false)
  const { bonus, isLoading } = useCurrentBonus()
  const { data: offer } = useBonusOffer(!bonus)

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Bonuses
      </h1>

      {isLoading ? (
        <div className='h-56 animate-pulse rounded-lg bg-card' />
      ) : bonus ? (
        <>
          <BonusCard bonus={bonus} />
          <section className='flex flex-col gap-3 rounded-lg bg-card p-4'>
            <h2 className='text-base font-semibold text-black'>
              How your bonus works
            </h2>
            <ul className='flex flex-col gap-2'>
              {bonusRuleLines(bonus).map((line) => (
                <li key={line} className='flex items-start gap-2 text-sm text-black'>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    className='mt-0.5 shrink-0 text-success'
                  />
                  {line}
                </li>
              ))}
            </ul>
            {bonus.display?.termsUrl && (
              <Link
                to={bonus.display.termsUrl}
                className='w-fit text-xs font-semibold text-neutral-10 underline underline-offset-2 hover:text-black'
              >
                Full terms & conditions
              </Link>
            )}
          </section>
        </>
      ) : offer?.show ? (
        <section className='flex flex-col gap-4 rounded-lg border border-brand-green/40 bg-card p-4 sm:flex-row sm:items-center'>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-success text-success'>
            <HugeiconsIcon icon={GiftIcon} size={24} />
          </span>
          <div className='flex flex-1 flex-col gap-1'>
            <span className='text-base font-semibold text-black'>
              {offer.label ?? 'First deposit bonus'}
            </span>
            <span className='text-xs text-neutral-10'>
              {offer.minDepositKobo &&
                `Deposit ${formatKobo(offer.minDepositKobo)} or more. `}
              {offer.expiryDays != null && `Use it within ${offer.expiryDays} days. `}
              {offer.kycRequired && 'You’ll need to verify your ID to use it.'}
            </span>
            {offer.termsUrl && (
              <Link
                to={offer.termsUrl}
                className='w-fit text-xs font-semibold text-neutral-10 underline underline-offset-2 hover:text-black'
              >
                Terms & conditions
              </Link>
            )}
          </div>
          <Button
            type='button'
            text='Deposit now'
            variation='primary'
            size='medium'
            className='w-fit! shrink-0'
            disabled={suspended}
            onClick={() => setDepositOpen(true)}
          />
        </section>
      ) : (
        <section className='flex flex-col items-center gap-2 rounded-lg bg-card p-6 text-center'>
          <HugeiconsIcon icon={GiftIcon} size={28} className='text-neutral-10' />
          <p className='text-sm font-semibold text-black'>No active bonus</p>
          <p className='text-xs text-neutral-10'>
            When you get a bonus, its balance and progress show up here.
          </p>
        </section>
      )}

      <div className='flex flex-col gap-4'>
        <Tabs
          tabs={TABS}
          activeTab={tab}
          onChange={(id) => setTab(id as BonusTab)}
          className='w-fit'
        />
        <div className='rounded-lg bg-card p-4'>
          {tab === 'activity' ? <BonusActivity /> : <PastBonuses />}
        </div>
      </div>

      <Deposit open={depositOpen} handleClose={() => setDepositOpen(false)} />
    </main>
  )
}

export default Bonuses
