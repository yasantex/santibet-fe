import PreviewNotice from '../components/globals/PreviewNotice'
import { ProfileAvatar } from '../components/globals/ReusedText'
import { formatCurrency } from '../utils/functions'

type Trader = {
  rank: number
  name: string
  volume: number
  pnl: number
}

// Illustrative until a leaderboard API is available (see API gaps).
const SAMPLE: Trader[] = [
  { rank: 1, name: 'Ada O.', volume: 4820000, pnl: 512300 },
  { rank: 2, name: 'Chidi N.', volume: 3910000, pnl: 388100 },
  { rank: 3, name: 'Zainab K.', volume: 3560000, pnl: 274500 },
  { rank: 4, name: 'Emeka U.', volume: 2980000, pnl: 191200 },
  { rank: 5, name: 'Ngozi A.', volume: 2610000, pnl: 154900 },
  { rank: 6, name: 'Tunde B.', volume: 2200000, pnl: 121400 },
  { rank: 7, name: 'Fatima S.', volume: 1870000, pnl: 98700 },
  { rank: 8, name: 'Kelechi I.', volume: 1540000, pnl: -22300 },
]

const rankBadge = (rank: number) => {
  if (rank === 1) return 'bg-brand-green text-black'
  if (rank === 2) return 'bg-neutral-10/30 text-black'
  if (rank === 3) return 'bg-warning/30 text-warning'
  return 'bg-hover text-neutral-10'
}

const Leaderboard = () => {
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Leaderboard
        </h1>
        <p className='text-sm text-neutral-10'>
          Top predictors by trading volume and realised profit.
        </p>
      </div>

      <PreviewNotice>
        Live rankings will appear here once the leaderboard API is available.
        The figures below are illustrative.
      </PreviewNotice>

      <div className='overflow-hidden rounded-2xl border border-border bg-card'>
        <div className='grid grid-cols-[48px_1fr_auto_auto] gap-4 border-b border-border/60 px-4 py-3 text-xs font-semibold text-neutral-10'>
          <span>#</span>
          <span>Trader</span>
          <span className='text-right'>Volume</span>
          <span className='text-right'>P&L</span>
        </div>
        {SAMPLE.map((t) => (
          <div
            key={t.rank}
            className='grid grid-cols-[48px_1fr_auto_auto] items-center gap-4 border-b border-border/40 px-4 py-3 last:border-0'
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankBadge(
                t.rank,
              )}`}
            >
              {t.rank}
            </span>
            <div className='flex items-center gap-2'>
              <ProfileAvatar
                firstName={t.name.split(' ')[0]}
                lastName={t.name.split(' ')[1] ?? ''}
              />
              <span className='text-sm font-semibold text-black'>{t.name}</span>
            </div>
            <span className='text-right text-sm text-neutral-10'>
              {formatCurrency(String(t.volume), 'NGN')}
            </span>
            <span
              className={`text-right text-sm font-semibold ${
                t.pnl >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {t.pnl >= 0 ? '+' : '-'}
              {formatCurrency(String(Math.abs(t.pnl)), 'NGN')}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Leaderboard
