import { useMockWalletData } from '../../mockData/walletMockData'
import { useModalControl } from '../../hooks/useModalControl'
import { formatNaira } from '../../utils/functions'
import { HugeiconsIcon } from '@hugeicons/react'
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Deposit from '../../components/appModals/Deposit'
import type { ActivityType } from '../../types/wallet.types'
import Withdraw from '../../components/appModals/Withdraw'

const positiveTypes: ActivityType[] = ['deposit', 'payout']

const AccountWallet = () => {
  const { data, isLoading } = useMockWalletData()
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const [visible, setVisible] = useState(true)
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw'>(
    'deposit',
  )

  return (
    <main className='mx-auto flex w-full flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Wallet
      </h1>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[500px_1fr]'>
        {isLoading || !data ? (
          <div className='h-64 animate-pulse rounded-lg bg-card' />
        ) : (
          <div className='flex h-60 md:h-52 flex-col gap-4 rounded-lg bg-card p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-placeholder'>
                Available Balance
              </span>
              <button
                type='button'
                onClick={() => setVisible((v) => !v)}
                className='flex items-center gap-1.5 text-xs font-semibold text-success'
              >
                <HugeiconsIcon
                  icon={visible ? ViewIcon : ViewOffIcon}
                  size={16}
                />
                {visible ? 'Hide' : 'Show'}
              </button>
            </div>

            <span className='md:text-3xl text-2xl font-bold text-black'>
              {visible ? formatNaira(data?.balance.amount) : '₦••••••'}
            </span>

            {visible && (
              <span className='text-sm font-semibold text-success'>
                {formatNaira(data?.balance.changeAmount)} (
                {data?.balance.changePercent}%) today
              </span>
            )}

            <div className='flex md:flex-row flex-col items-center gap-2.5 rounded-full p-1'>
              <button
                type='button'
                onClick={() => {
                  setActiveAction('deposit')
                  handleModalOpen('deposit')
                }}
                className={`flex-1 rounded-full py-2 w-full text-sm font-semibold transition-colors ${
                  activeAction === 'deposit'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-black'
                }`}
              >
                Deposit
              </button>
              <button
                type='button'
                onClick={() => {
                  setActiveAction('withdraw')
                  handleModalOpen('withdraw')
                }}
                className={`flex-1 rounded-full w-full py-2 text-sm font-semibold transition-colors ${
                  activeAction === 'withdraw'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-black'
                }`}
              >
                Withdraw
              </button>
            </div>
          </div>
        )}

        {isLoading || !data ? (
          <div className='h-64 animate-pulse rounded-lg bg-card' />
        ) : (
          <div className='flex flex-col gap-4'>
            <h2 className='text-base  font-semibold text-black'>
              Recent Activity
            </h2>
            <div className='flex flex-col gap-2 rounded-lg bg-card p-4'>
              <div className='flex flex-col divide-y divide-border/40'>
                {data.activity.map((item) => {
                  const isPositive = positiveTypes.includes(item.type)
                  return (
                    <div
                      key={item.id}
                      className='flex items-center justify-between gap-4 py-3'
                    >
                      <div className='flex items-center gap-3'>
                        <span
                          className={`h-8 w-8 shrink-0 rounded-full ${
                            isPositive
                              ? 'bg-success'
                              : 'bg-[#16191a]! dark:bg-[#e4e5e3]! dark:text-[#000000]!'
                          }`}
                        />
                        <div className='flex flex-col'>
                          <span className='text-sm font-semibold text-black'>
                            {item.title}
                          </span>
                          <span className='text-xs text-placeholder'>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold ${
                          item.amount >= 0 ? 'text-success' : 'text-black'
                        }`}
                      >
                        {formatNaira(item.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <Deposit
        open={modalOpen && modal === 'deposit'}
        handleClose={() => {
          handleModalClose()
        }}
      />
      <Withdraw
        open={modalOpen && modal === 'withdraw'}
        handleClose={() => {
          handleModalClose()
        }}
      />
    </main>
  )
}

export default AccountWallet
