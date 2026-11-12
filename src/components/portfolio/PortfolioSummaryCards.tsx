import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { Button } from '../globals/Button'
import { formatCurrency, toMajorUnits } from '../../utils/functions'
import useAccountSuspended from '../../hooks/useAccountSuspended'
import { SUSPENDED_CTA_HINT } from '../../utils/constants'
import type { PortfolioSummary } from '../../types/bet.types'

const HIDE_KEY = 'portfolioHidden'
const MASK = '••••••'

const signed = (n: number) =>
  `${n >= 0 ? '+' : '-'}${formatCurrency(Math.abs(n))}`
const pnlClass = (n: number) => (n >= 0 ? 'text-success' : 'text-error')

const readHidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === '1'
  } catch {
    return false
  }
}

type PortfolioSummaryCardsProps = {
  summary?: PortfolioSummary
  /** Cash the user can trade with, in naira. */
  cash: number
  /** The part of `cash` that can be withdrawn (winnings), in naira. */
  withdrawable?: number
  /** Stake on live bets in naira, split by funding; undefined while loading. */
  openStake?: { cash: number; bonus: number }
  loading: boolean
  onDeposit: () => void
  onWithdraw: () => void
}

const PortfolioSummaryCards = ({
  summary,
  cash,
  withdrawable,
  openStake,
  loading,
  onDeposit,
  onWithdraw,
}: PortfolioSummaryCardsProps) => {
  const suspended = useAccountSuspended()
  const [hidden, setHidden] = useState(readHidden)
  const toggleHidden = () => {
    setHidden((h) => {
      try {
        localStorage.setItem(HIDE_KEY, h ? '0' : '1')
      } catch {
        // Storage blocked: the choice lasts for this visit.
      }
      return !h
    })
  }

  // Total Balance = free cash + the CASH staked on live bets, at its stake —
  // what the user would have if every live bet were handed back. Bonus stakes
  // are left out: they came from bonus credit and are never cash.
  const cashStaked = openStake?.cash ?? 0
  const bonusStaked = openStake?.bonus ?? 0
  const total = cash + cashStaked
  // Combos are included by the API (won/lost exactly as History labels them).
  const net = summary ? toMajorUnits(summary.netPnl.amount) : 0
  const unrealized = summary ? toMajorUnits(summary.unrealizedPnl.amount) : 0
  const realized = summary ? toMajorUnits(summary.realizedPnl.amount) : 0
  // Net Winnings and the P/L tiles are cash bets only; bonus-bet results are
  // reported apart (they're paid as bonus credit, not cash).
  const bonusNet = summary?.bonus ? toMajorUnits(summary.bonus.netPnl.amount) : 0
  const wonCount = summary?.wonCount ?? 0
  const lostCount = summary?.lostCount ?? 0
  const show = (s: string) => (hidden ? MASK : s)

  if (loading)
    return (
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <div className='h-56 animate-pulse rounded-2xl bg-card' />
        <div className='h-56 animate-pulse rounded-2xl bg-card' />
      </div>
    )

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      <section className='flex flex-col justify-between gap-6 rounded-2xl border border-border p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 flex-col gap-1'>
            <span
              className='text-sm text-neutral-10'
              title='Cash available to bet plus the cash staked on your live bets. Bonus bets are not included.'
            >
              Total Balance
            </span>
            <div className='flex items-center gap-2'>
              {openStake ? (
                <span className='truncate text-2xl font-bold text-black md:text-3xl'>
                  {show(formatCurrency(total))}
                </span>
              ) : (
                <span className='h-8 w-36 animate-pulse rounded-md bg-card' />
              )}
              <button
                type='button'
                aria-label={hidden ? 'Show balances' : 'Hide balances'}
                onClick={toggleHidden}
                className='shrink-0 text-neutral-10 hover:text-black'
              >
                <HugeiconsIcon icon={hidden ? ViewIcon : ViewOffSlashIcon} size={18} />
              </button>
            </div>
            {summary && openStake && (
              <span className='text-xs text-neutral-10'>
                {summary.openPositions} live bet
                {summary.openPositions === 1 ? '' : 's'} ·{' '}
                {show(formatCurrency(cashStaked))} staked
              </span>
            )}
            {bonusStaked > 0 && (
              <span className='text-xs text-success'>
                + {show(formatCurrency(bonusStaked))} in bonus bets · not
                included
              </span>
            )}
          </div>
          <div className='flex shrink-0 flex-col items-end gap-1 text-right'>
            <span className='text-xs text-neutral-10'>Available to bet</span>
            <span className='text-lg font-bold text-black md:text-2xl'>
              {show(formatCurrency(cash))}
            </span>
            {withdrawable != null && (
              <span className='text-xs text-neutral-10'>
                {show(formatCurrency(withdrawable))} withdrawable
              </span>
            )}
          </div>
        </div>

        <div
          className='grid grid-cols-2 gap-3'
          title={suspended ? SUSPENDED_CTA_HINT : undefined}
        >
          <Button
            type='button'
            text={
              <span className='flex items-center gap-2'>
                <HugeiconsIcon icon={ArrowDown02Icon} size={18} />
                Deposit
              </span>
            }
            disabled={suspended}
            onClick={onDeposit}
          />
          <Button
            type='button'
            variation='plain'
            text={
              <span className='flex items-center gap-2'>
                <HugeiconsIcon icon={ArrowUp02Icon} size={18} />
                Withdraw
              </span>
            }
            disabled={suspended}
            onClick={onWithdraw}
          />
        </div>
      </section>

      <section className='flex flex-col justify-between gap-6 rounded-2xl border border-border p-5'>
        <div className='flex flex-col gap-1'>
          <span className='flex items-center gap-1.5 text-sm text-neutral-10'>
            <span
              className={`h-2 w-2 rounded-full ${net >= 0 ? 'bg-success' : 'bg-error'}`}
            />
            Net Winnings
          </span>
          <span className={`text-2xl font-bold md:text-3xl ${pnlClass(net)}`}>
            {show(signed(net))}
          </span>
          <span className='text-xs text-neutral-10'>All time · cash bets</span>
          {bonusNet !== 0 && (
            <span className={`text-xs ${pnlClass(bonusNet)}`}>
              Bonus bets: {show(signed(bonusNet))} · paid as bonus credit
            </span>
          )}
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-0.5 rounded-xl bg-card p-3'>
            <span className='text-xs text-neutral-10'>Live P/L</span>
            <span className={`text-sm font-bold ${pnlClass(unrealized)}`}>
              {show(signed(unrealized))}
            </span>
            <span className='text-[11px] text-neutral-10'>On running bets</span>
          </div>
          <div className='flex flex-col gap-0.5 rounded-xl bg-card p-3'>
            <span className='text-xs text-neutral-10'>Settled</span>
            <span className={`text-sm font-bold ${pnlClass(realized)}`}>
              {show(signed(realized))}
            </span>
            {summary && (
              <span className='text-[11px] text-neutral-10'>
                {wonCount} won · {lostCount} lost
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default PortfolioSummaryCards
