import { useState } from 'react'
import { useMockPortfolioData } from '../../mockData/portfolioMockData'
import type { PositionStatus } from '../../types/portfolio.types'
import { formatNaira } from '../../utils/functions'

const AccountPortfolio = () => {
  const [activeStatus, setActiveStatus] = useState<PositionStatus>('open')
  const { data, isLoading } = useMockPortfolioData()

  const filteredPositions = data?.positions.filter(
    (p) => p.status === activeStatus,
  )

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Portfolio
      </h1>

      {isLoading || !data ? (
        <div className='flex flex-col lg:flex-row gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='h-20 animate-pulse rounded-lg bg-card' />
          ))}
        </div>
      ) : (
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='flex flex-col gap-1 min-w-60 max-w-100 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Portfolio Value</span>
            <span className='text-lg font-bold text-black'>
              {formatNaira(data?.stats.portfolioValue).replace('+', '')}
            </span>
          </div>
          <div className='flex flex-col gap-1 min-w-60 max-w-100 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Total P&L</span>
            <span
              className={`text-lg font-bold ${
                data?.stats.totalPnl >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {formatNaira(data?.stats.totalPnl)}
            </span>
          </div>
          <div className='flex flex-col gap-1 min-w-60 max-w-100 rounded-lg bg-card p-4'>
            <span className='text-sm text-placeholder'>Open Positions</span>
            <span className='text-lg font-bold text-black'>
              {data?.stats.openPositionsCount}
            </span>
          </div>
        </div>
      )}

      <div className='inline-flex w-46 items-center gap-1 rounded-full bg-hover p-1'>
        {(['open', 'settled'] as const).map((status) => (
          <button
            key={status}
            type='button'
            onClick={() => setActiveStatus(status)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition-colors ${
              activeStatus === status
                ? 'bg-text-black text-white'
                : 'text-placeholder'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {isLoading || !data ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className='h-52 animate-pulse rounded-lg bg-card' />
          ))
        ) : filteredPositions && filteredPositions.length > 0 ? (
          filteredPositions.map((position) => {
            const isProfit = position.value >= position.staked
            const winColor = isProfit ? 'bg-success' : 'bg-error'
            const winTextColor = isProfit ? 'text-success' : 'text-error'
            return (
              <div
                key={position.id}
                className='flex flex-col gap-4 rounded-lg bg-card p-4'
              >
                <span className='w-fit rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-semibold capitalize text-black'>
                  {position.status}
                </span>

                <p className='text-sm font-semibold h-12 text-black'>
                  {position.question}
                </p>

                <div className='grid grid-cols-2 gap-2'>
                  <div
                    className={`rounded-md flex flex-col gap-1 py-2.5 text-center text-sm font-bold ${
                      position.side === 'yes'
                        ? `${winColor} text-black`
                        : 'bg-surface-hover text-black'
                    }`}
                  >
                    <span
                      className={position.side === 'yes' ? '' : winTextColor}
                    >
                      YES
                    </span>{' '}
                    <span>{position.yesPercent}%</span>
                  </div>
                  <div
                    className={`rounded-md flex flex-col gap-1 py-2.5 text-center text-sm font-bold ${
                      position.side === 'no'
                        ? `${winColor} text-black`
                        : 'bg-surface-hover text-black'
                    }`}
                  >
                    <span
                      className={position.side === 'no' ? '' : winTextColor}
                    >
                      NO
                    </span>{' '}
                    <span>{position.noPercent}%</span>
                  </div>
                </div>

                <div className='flex items-center justify-between text-xs text-placeholder'>
                  <span>
                    Staked {formatNaira(position.staked).replace('+', '')}
                  </span>
                  <span>
                    Value {formatNaira(position.value).replace('+', '')}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <p className='col-span-full py-8 text-center text-sm text-placeholder'>
            No {activeStatus} positions yet.
          </p>
        )}
      </div>
    </main>
  )
}

export default AccountPortfolio
