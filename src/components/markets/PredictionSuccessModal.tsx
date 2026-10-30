import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import TradingNotice from './TradingNotice'
import { useMarketPositions } from '../../data_layer/bets'
import {
  formatCurrency,
  formatSharePrice,
  openPositionMark,
  toMajorUnits,
} from '../../utils/functions'
import type { UiMarket } from '../../types/market.types'
import type { PlacedOrder } from './OrderForm'

const Row = ({
  label,
  value,
  tone = 'text-black',
}: {
  label: string
  value: string
  tone?: string
}) => (
  <div className='flex justify-between gap-3 text-sm'>
    <span className='text-neutral-10'>{label}</span>
    <span className={`font-semibold ${tone}`}>{value}</span>
  </div>
)

interface PredictionSuccessModalProps {
  order: PlacedOrder | null
  market: UiMarket
  onClose: () => void
  onTrade: () => void
}

/**
 * Shown after a prediction is placed: what they predicted, the position it
 * left them with, and — only here — the way into buying and selling.
 */
const PredictionSuccessModal = ({
  order,
  market,
  onClose,
  onTrade,
}: PredictionSuccessModalProps) => {
  const navigate = useNavigate()
  const { positions, isLoading } = useMarketPositions(
    order ? market.id : undefined,
  )
  const position = positions.find((p) => p.outcomeId === order?.bet.outcomeId)

  if (!order) return null

  // Prefer what the API accepted; fall back to what the player saw.
  const stake = order.bet.stake
    ? toMajorUnits(order.bet.stake.amount)
    : order.stake
  // Pool (parimutuel) bets have no share price (`price` is null) and their
  // odds are the live effective odds, moving with the pool until close.
  const pool = order.bet.executionModel
    ? order.bet.executionModel === 'PARIMUTUEL'
    : (order.bet.estimated ?? false)
  const fee = order.bet.fee ? toMajorUnits(order.bet.fee.amount) : order.fee
  const returned = order.bet.potentialReturn
    ? toMajorUnits(order.bet.potentialReturn.amount)
    : null
  // netReturn = potentialReturn − fee (pool: fee 0). An API without it: take
  // the quoted fee off the gross fixed-odds return.
  const payout = order.bet.netReturn
    ? toMajorUnits(order.bet.netReturn.amount)
    : returned == null
      ? order.payout
      : pool
        ? returned
        : Math.max(returned - order.fee, 0)
  const profit = payout - stake
  const price = Number(order.bet.price) || order.price
  const odds =
    Number(order.bet.odds) ||
    (pool ? (stake > 0 ? payout / stake : 0) : price > 0 ? 1 / price : 0)

  const shares = Number(position?.shares) || 0
  const contracts =
    position?.contracts != null ? Number(position.contracts) : shares / 100
  const avgPrice = Number(position?.avgPrice) || 0
  const mark = position ? openPositionMark(position) : null

  return (
    <ModalComponent
      open
      handleClose={onClose}
      showHeader={false}
      className='max-w-md'
    >
      <div className='flex flex-col gap-5 py-4'>
        <div className='flex flex-col items-center gap-2 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-surface-success text-success'>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
          </div>
          <h2 className='text-lg font-bold text-black'>Prediction placed</h2>
          <p className='text-xs text-neutral-10'>{market.title}</p>
        </div>

        <section className='flex flex-col gap-2 rounded-2xl border border-border p-4'>
          <h3 className='text-xs font-semibold text-neutral-10 uppercase'>
            Your prediction
          </h3>
          <Row label='Outcome' value={order.outcomeLabel} />
          <Row label='Amount' value={formatCurrency(stake)} />
          {!pool && (
            <Row label='Price per share' value={formatSharePrice(price)} />
          )}
          {odds > 0 && (
            <Row label={pool ? 'Est. odds' : 'Odds'} value={odds.toFixed(2)} />
          )}
          {fee > 0 && <Row label='Fee' value={formatCurrency(fee)} />}
          <Row
            label={pool ? 'Est. payout if it wins' : 'Payout if it wins'}
            value={formatCurrency(payout)}
          />
          <Row
            label='Profit'
            value={`${profit >= 0 ? '+' : '-'}${formatCurrency(Math.abs(profit))}`}
            tone={profit >= 0 ? 'text-success' : 'text-error'}
          />
        </section>

        <section className='flex flex-col gap-2 rounded-2xl border border-border p-4'>
          <h3 className='text-xs font-semibold text-neutral-10 uppercase'>
            Your position
          </h3>
          {isLoading ? (
            <div className='h-16 animate-pulse rounded-lg bg-hover' />
          ) : position && mark ? (
            mark.value == null || mark.pnl == null ? (
              // Pool position: nothing to mark to market until close.
              <>
                <Row label='Total staked' value={formatCurrency(mark.staked)} />
                {mark.estPayout != null && (
                  <Row
                    label='Est. payout if it wins'
                    value={formatCurrency(mark.estPayout)}
                  />
                )}
                <p className='text-xs text-neutral-10'>
                  Pool bets are paid from the pool when the market closes, so
                  the payout can still move until then.
                </p>
              </>
            ) : (
              <>
                <Row
                  label='Shares'
                  value={`${contracts.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} @ ${formatSharePrice(avgPrice)}`}
                />
                <Row label='Current value' value={formatCurrency(mark.value)} />
                <Row
                  label='Profit / loss'
                  value={`${mark.pnl >= 0 ? '+' : '-'}${formatCurrency(Math.abs(mark.pnl))}`}
                  tone={mark.pnl >= 0 ? 'text-success' : 'text-error'}
                />
              </>
            )
          ) : (
            <p className='text-xs text-neutral-10'>
              Your position will show in your portfolio once the order fills.
            </p>
          )}
        </section>

        <div className='flex flex-col gap-2'>
          {pool ? (
            <p className='text-center text-xs text-neutral-10'>
              Pool bets can’t be cashed out. Winners are paid from the pool
              when the market closes.
            </p>
          ) : (
            <>
              <p className='text-center text-xs text-neutral-10'>
                Prices move while the market is open. You can sell your position
                before it resolves, or buy more.
              </p>
              <Button
                type='button'
                text='Trade this position'
                variation='primary'
                size='large'
                className='w-full'
                onClick={onTrade}
              />
            </>
          )}
          <div className='flex gap-2'>
            <Button
              type='button'
              text='View portfolio'
              variation='plain'
              className='flex-1'
              onClick={() => {
                onClose()
                navigate('/account-portfolio')
              }}
            />
            <Button
              type='button'
              text='Done'
              variation='plain'
              className='flex-1'
              onClick={onClose}
            />
          </div>
        </div>

        <TradingNotice />
      </div>
    </ModalComponent>
  )
}

export default PredictionSuccessModal
