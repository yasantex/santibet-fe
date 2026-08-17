import { HugeiconsIcon } from '@hugeicons/react'
import {
  GiftIcon,
  Coins01Icon,
  Fire02Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons'
import PreviewNotice from '../components/globals/PreviewNotice'

const tiers = [
  { label: 'Bronze', points: '0 – 999', perk: '1% cashback on losses' },
  { label: 'Silver', points: '1,000 – 4,999', perk: '2% cashback + weekly drop' },
  { label: 'Gold', points: '5,000+', perk: '3% cashback + priority payouts' },
]

const quests = [
  { icon: Fire02Icon, label: 'Place your first prediction', reward: '+50 pts' },
  { icon: Coins01Icon, label: 'Trade 5 different markets', reward: '+150 pts' },
  { icon: GiftIcon, label: 'Refer a friend who trades', reward: '+300 pts' },
]

const Rewards = () => {
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Rewards
        </h1>
        <p className='text-sm text-neutral-10'>
          Earn points as you predict and unlock cashback and perks.
        </p>
      </div>

      <PreviewNotice>
        Rewards balances and quests activate once the rewards API is available.
      </PreviewNotice>

      <div className='flex flex-col gap-2 rounded-2xl bg-brand-green p-6 text-black'>
        <span className='text-sm font-medium opacity-80'>Your points</span>
        <span className='text-4xl font-bold'>0</span>
        <span className='text-sm font-medium opacity-80'>
          Bronze tier · start trading to climb
        </span>
      </div>

      <section className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold text-black uppercase'>Quests</h2>
        <div className='flex flex-col gap-3'>
          {quests.map((q) => (
            <div
              key={q.label}
              className='flex items-center justify-between rounded-2xl border border-border bg-card p-4'
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-hover text-black'>
                  <HugeiconsIcon icon={q.icon} size={20} />
                </div>
                <span className='text-sm font-semibold text-black'>
                  {q.label}
                </span>
              </div>
              <span className='text-sm font-bold text-success'>{q.reward}</span>
            </div>
          ))}
        </div>
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold text-black uppercase'>Tiers</h2>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {tiers.map((t) => (
            <div
              key={t.label}
              className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-4'
            >
              <div className='flex items-center gap-2'>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={18}
                  className='text-brand-green'
                />
                <span className='text-base font-bold text-black'>
                  {t.label}
                </span>
              </div>
              <span className='text-xs text-neutral-10'>{t.points} pts</span>
              <span className='text-sm text-neutral-10'>{t.perk}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Rewards
