import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import CashOutButton from '../markets/CashOutButton'
import ShareBetButton from '../markets/ShareBetButton'
import MarketTitleLink from '../markets/MarketTitleLink'
import BonusBetBadge from '../bonus/BonusBetBadge'
import { MarketThumb, OutcomeChip } from './PortfolioBits'
import {
  canCashOut,
  formatCurrency,
  formatSharePrice,
  isBonusPosition,
  isPoolPosition,
} from '../../utils/functions'
import { useOddsFormat } from '../../hooks/useOddsFormat'
import { formatOdds, oddsFromPrice } from '../../utils/odds'
import { POSITION_GRID, type PositionRow as Row } from './positionRows'

const Cell = ({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={`flex flex-col text-sm md:block ${className}`}>
    <span className='text-[11px] text-neutral-10 md:hidden'>{label}</span>
    {children}
  </div>
)

/** "from → to", or just "from" when there's no current figure. */
const MoveLine = ({
  from,
  to,
  className = '',
}: {
  from: string
  to: string | null
  className?: string
}) => (
  <span className={`flex items-center gap-1 ${className}`}>
    {from}
    {to && (
      <>
        <HugeiconsIcon icon={ArrowRight02Icon} size={12} />
        {to}
      </>
    )}
  </span>
)

const PositionRow = ({ row }: { row: Extract<Row, { kind: 'position' }> }) => {
  const { position } = row
  const { format: oddsFormat } = useOddsFormat()
  const pool = isPoolPosition(position)
  const outcomeLabel = position.outcomeLabel ?? ''
  const avg = Number(position.avgPrice) || 0
  const now = Number(position.currentPrice) || 0
  const contracts =
    position.contracts != null
      ? Number(position.contracts)
      : (Number(position.shares) || 0) / 100
  const pnlPct = row.pnl != null && row.traded > 0 ? (row.pnl / row.traded) * 100 : null

  return (
    <div
      className={`grid grid-cols-3 items-center gap-x-3 gap-y-3 rounded-xl bg-card p-3 md:gap-y-0 ${POSITION_GRID}`}
    >
      <div className='col-span-3 flex min-w-0 items-center gap-3 md:col-span-1'>
        <MarketThumb imageUrl={position.market?.imageUrl} title={row.title} />
        <div className='flex min-w-0 flex-col gap-1'>
          <MarketTitleLink
            marketId={position.marketId}
            marketStatus={position.market?.status}
            settled={false}
            className='truncate text-left text-sm font-semibold text-black'
          >
            {row.title}
          </MarketTitleLink>
          <div className='flex items-center gap-2'>
            {outcomeLabel && (
              <OutcomeChip
                label={outcomeLabel}
                price={pool ? undefined : formatSharePrice(avg)}
              />
            )}
            {!pool && contracts > 0 && (
              <span className='text-xs text-neutral-10'>
                {contracts.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                shares
              </span>
            )}
            {pool && <span className='text-xs text-neutral-10'>Pool</span>}
            {isBonusPosition(position) && <BonusBetBadge />}
          </div>
        </div>
      </div>

      <Cell label='Odds: Bought → Now' className='text-neutral-10'>
        {pool ? (
          '-'
        ) : (
          // The user's format leads and the other reads underneath, so the
          // share price and its decimal odds are both on screen (SB-042).
          <span className='flex flex-col'>
            <MoveLine
              from={oddsFormat === 'odds' ? formatOdds(oddsFromPrice(avg)) : formatSharePrice(avg)}
              to={now > 0 ? (oddsFormat === 'odds' ? formatOdds(oddsFromPrice(now)) : formatSharePrice(now)) : null}
              className='text-black'
            />
            <MoveLine
              from={oddsFormat === 'odds' ? formatSharePrice(avg) : formatOdds(oddsFromPrice(avg))}
              to={now > 0 ? (oddsFormat === 'odds' ? formatSharePrice(now) : formatOdds(oddsFromPrice(now))) : null}
              className='text-xs'
            />
          </span>
        )}
      </Cell>
      <Cell label='Stake' className='text-neutral-10'>
        {formatCurrency(row.traded)}
      </Cell>
      <Cell label='Potential Winnings' className='text-neutral-10'>
        {formatCurrency(row.toWin)}
      </Cell>
      <Cell label='Cash Out Value'>
        {row.value == null ? (
          <span className='flex flex-col'>
            <span className='font-semibold text-black'>-</span>
            <span className='text-xs text-neutral-10'>Settles at close</span>
          </span>
        ) : (
          <span className='flex flex-col'>
            <span className='font-semibold text-black'>
              {formatCurrency(row.value)}
            </span>
            {row.pnl != null && (
              <span
                className={`text-xs font-medium ${row.pnl >= 0 ? 'text-success' : 'text-error'}`}
              >
                {row.pnl >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(row.pnl))}
                {pnlPct != null && ` (${Math.abs(pnlPct).toFixed(2)}%)`}
              </span>
            )}
          </span>
        )}
      </Cell>

      <div className='col-span-3 flex items-center justify-end gap-2 md:col-span-1'>
        {canCashOut(position) && (
          <CashOutButton
            position={position}
            title={row.title}
            outcomeLabel={outcomeLabel}
            size='small'
            label='Cash Out'
          />
        )}
        <ShareBetButton
          marketId={position.marketId}
          outcomeId={position.outcomeId}
          title={row.title}
          outcomeLabel={outcomeLabel}
          price={pool ? undefined : formatSharePrice(avg)}
          stake={formatCurrency(row.traded)}
        />
      </div>
    </div>
  )
}

const ComboRow = ({ row }: { row: Extract<Row, { kind: 'combo' }> }) => {
  const { combo } = row
  return (
    <div
      className={`grid grid-cols-3 items-center gap-x-3 gap-y-3 rounded-xl bg-card p-3 md:gap-y-0 ${POSITION_GRID}`}
    >
      <div className='col-span-3 flex min-w-0 items-center gap-3 md:col-span-1'>
        <MarketThumb imageUrl={combo.legs[0]?.market?.imageUrl} title='Combo' />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='truncate text-sm font-semibold text-black'>
            {row.title}
          </span>
          <div className='flex min-w-0 items-center gap-2'>
            <OutcomeChip label={formatOdds(combo.combinedOdds)} />
            <span className='truncate text-xs text-neutral-10'>
              {combo.legs
                .map((l) => l.outcomeLabel ?? l.market?.title ?? '')
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        </div>
      </div>
      <Cell label='Odds: Bought → Now' className='text-neutral-10'>
        -
      </Cell>
      <Cell label='Stake' className='text-neutral-10'>
        {formatCurrency(row.traded)}
      </Cell>
      <Cell label='Potential Winnings' className='text-neutral-10'>
        {formatCurrency(row.toWin)}
      </Cell>
      <Cell label='Cash Out Value'>
        <span className='flex flex-col'>
          <span className='font-semibold text-black'>-</span>
          <span className='text-xs text-neutral-10'>
            {combo.legs.filter((l) => l.status === 'WON').length}/
            {combo.legs.length} legs won
          </span>
        </span>
      </Cell>
      <div className='hidden md:block' />
    </div>
  )
}

const PositionsTable = ({ rows }: { rows: Row[] }) => (
  <div className='flex flex-col gap-2'>
    <div
      className={`hidden items-end gap-x-3 px-3 pb-1 text-xs font-medium text-neutral-10 md:grid ${POSITION_GRID}`}
    >
      <span>Event / Your Pick</span>
      <span>Odds: Bought → Now</span>
      <span>Stake</span>
      <span>Potential Winnings</span>
      <span>Cash Out Value</span>
      <span />
    </div>
    {rows.map((row) =>
      row.kind === 'combo' ? (
        <ComboRow key={row.id} row={row} />
      ) : (
        <PositionRow key={row.id} row={row} />
      ),
    )}
  </div>
)

export default PositionsTable
