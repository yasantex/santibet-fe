import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { isAxiosError } from 'axios'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  MultiplicationSignIcon,
  TicketStarIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '../globals/Button'
import { useComboSlip } from '../../hooks/useComboSlip'
import { useComboBet } from '../../data_layer/bets'
import { useSantiBetQuery } from '../../data_layer/utils'
import { showSuccessToast } from '../../utils/toastUtils'
import {
  NAIRA,
  formatCurrency,
  toMajorUnits,
  toMinorUnits,
} from '../../utils/functions'
import type { WalletBalance } from '../../types/wallet.types'
import type { ComboLeg } from '../../types/combo.types'

const QUICK_ADDS = [100, 500, 1000, 2000]

const legOdds = (price: number) => (price > 0 ? 1 / price : 0)

const LegRow = ({
  leg,
  onRemove,
}: {
  leg: ComboLeg
  onRemove: () => void
}) => (
  <div className='flex items-start gap-3 rounded-xl border border-border bg-card p-3'>
    <div className='min-w-0 flex-1'>
      <p className='truncate text-xs text-neutral-10'>
        {leg.eventTitle}
        {leg.league ? ` · ${leg.league}` : ''}
      </p>
      <p className='truncate text-sm font-semibold text-black'>
        {leg.marketTitle}
      </p>
      <div className='mt-1 flex items-center gap-2'>
        <span className='rounded-full bg-brand-green/15 px-2 py-0.5 text-xs font-bold text-black uppercase'>
          {leg.outcomeLabel}
        </span>
        <span className='text-xs font-semibold text-neutral-10'>
          ×{legOdds(leg.price).toFixed(2)}
        </span>
      </div>
    </div>
    <button
      type='button'
      aria-label='Remove selection'
      onClick={onRemove}
      className='shrink-0 rounded-md p-1 text-neutral-10 hover:bg-hover hover:text-error'
    >
      <HugeiconsIcon icon={MultiplicationSignIcon} size={16} />
    </button>
  </div>
)

const ComboSlip = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const navigate = useNavigate()
  const [cookies] = useCookies(['token'])
  const isSignedIn = !!cookies?.token

  const {
    legs,
    legCount,
    minLegs,
    combinedOdds,
    hasInvalidLeg,
    minStakeNaira,
    remove,
    clear,
    payout,
  } = useComboSlip()

  const [stake, setStake] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: wallet } = useSantiBetQuery<WalletBalance>({
    path: '/wallet',
    queryKey: ['/wallet', {}],
    enabled: isSignedIn,
  })
  const cash = toMajorUnits(wallet?.total ?? 0)

  const { mutateAsync: placeCombo, isPending } = useComboBet()

  const stakeNum = Number(stake) || 0
  const toWin = payout(stakeNum)
  const enoughLegs = legCount >= minLegs

  const handleStake = (value: string) => {
    setError(null)
    setStake(value.replace(/[^\d.]/g, ''))
  }
  const addStake = (delta: number) => {
    setError(null)
    setStake(String((Number(stake) || 0) + delta))
  }

  const handlePlace = async () => {
    if (!isSignedIn) {
      onClose()
      navigate('/signin')
      return
    }
    if (!enoughLegs) {
      setError(`Add at least ${minLegs} selections to place a combo.`)
      return
    }
    if (hasInvalidLeg) {
      setError('One of your selections is no longer priced. Remove it to continue.')
      return
    }
    if (stakeNum <= 0) {
      setError('Enter a stake.')
      return
    }
    if (stakeNum > cash) {
      setError('Stake exceeds your balance.')
      return
    }
    if (minStakeNaira != null && stakeNum < minStakeNaira) {
      setError(`Minimum combo stake is ${NAIRA}${minStakeNaira.toLocaleString()}.`)
      return
    }

    try {
      await placeCombo({
        stake: String(toMinorUnits(stakeNum)),
        legs: legs.map((l) => ({
          marketId: l.marketId,
          outcomeId: l.outcomeId,
        })),
      })
      showSuccessToast(
        `Combo placed · ${formatCurrency(Math.round(toWin))} to win`,
      )
      clear()
      setStake('')
      onClose()
      navigate('/account-portfolio')
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ??
            'Could not place your combo. Odds may have moved — try again.')
          : 'Could not place your combo.',
      )
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Slide-over */}
      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-100 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border px-5 py-4'>
          <div className='flex items-center gap-2'>
            <HugeiconsIcon
              icon={TicketStarIcon}
              size={20}
              className='text-black'
            />
            <h2 className='text-base font-bold text-black'>Bet slip</h2>
            {legCount > 0 && (
              <span className='rounded-full bg-brand-green px-2 py-0.5 text-xs font-bold text-black'>
                {legCount}
              </span>
            )}
          </div>
          <button
            type='button'
            aria-label='Close bet slip'
            onClick={onClose}
            className='rounded-md p-1.5 text-neutral-10 hover:bg-hover hover:text-black'
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {legCount === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center'>
            <HugeiconsIcon
              icon={TicketStarIcon}
              size={40}
              className='text-neutral-10/50'
            />
            <p className='text-sm font-semibold text-black'>
              Your slip is empty
            </p>
            <p className='text-xs text-neutral-10'>
              Tap sports outcomes to build a combo. Every pick has to win for the
              combo to pay out.
            </p>
            <Button
              type='button'
              text='Browse sports'
              variation='plain'
              size='medium'
              className='w-fit!'
              onClick={() => {
                onClose()
                navigate('/category/Sports')
              }}
            />
          </div>
        ) : (
          <>
            {/* Legs */}
            <div className='flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold text-neutral-10 uppercase'>
                  {legCount} selection{legCount > 1 ? 's' : ''}
                </p>
                <button
                  type='button'
                  onClick={clear}
                  className='text-xs font-semibold text-neutral-10 hover:text-error'
                >
                  Clear all
                </button>
              </div>
              {legs.map((leg) => (
                <LegRow
                  key={leg.outcomeId}
                  leg={leg}
                  onRemove={() => remove(leg.outcomeId)}
                />
              ))}
              {!enoughLegs && (
                <p className='rounded-lg bg-hover/50 px-3 py-2 text-xs text-neutral-10'>
                  Add at least {minLegs} selections from different games to place
                  a combo.
                </p>
              )}
            </div>

            {/* Footer / stake */}
            <div className='flex flex-col gap-3 border-t border-border px-5 py-4'>
              <div className='flex items-center justify-between rounded-lg bg-brand-green/10 px-3 py-2.5'>
                <span className='text-sm font-semibold text-black'>
                  Total odds
                </span>
                <span className='text-lg font-bold text-black'>
                  ×{combinedOdds.toFixed(2)}
                </span>
              </div>

              <div className='flex items-center justify-between text-xs'>
                <span className='text-neutral-10'>Stake</span>
                {isSignedIn && (
                  <span className='text-neutral-10'>
                    Cash: {NAIRA}
                    {cash.toLocaleString()}
                  </span>
                )}
              </div>
              <div className='flex items-center rounded-lg border-2 border-black px-3 py-2.5'>
                <span className='text-sm font-bold text-neutral-10'>
                  {NAIRA}
                </span>
                <input
                  type='text'
                  inputMode='decimal'
                  value={stake}
                  onChange={(e) => handleStake(e.target.value)}
                  placeholder='0.00'
                  className='w-full bg-transparent px-1 text-sm font-bold text-black outline-none'
                />
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {QUICK_ADDS.map((v) => (
                  <button
                    key={v}
                    type='button'
                    onClick={() => addStake(v)}
                    className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
                  >
                    +{NAIRA}
                    {v.toLocaleString()}
                  </button>
                ))}
                {isSignedIn && cash > 0 && (
                  <button
                    type='button'
                    onClick={() => handleStake(String(cash))}
                    className='rounded-full bg-hover px-3 py-1 text-xs font-semibold text-neutral-10 hover:text-black'
                  >
                    MAX
                  </button>
                )}
              </div>

              <div className='flex items-center justify-between border-t border-border/60 pt-3'>
                <span className='text-sm text-neutral-10'>To win</span>
                <span className='text-lg font-bold text-success'>
                  {NAIRA}
                  {toWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              {error && (
                <p className='rounded-lg bg-error-bg px-3 py-2 text-xs font-medium text-error'>
                  {error}
                </p>
              )}

              <Button
                type='button'
                text={
                  !isSignedIn
                    ? 'Sign in to place combo'
                    : `Place combo · ${NAIRA}${(stakeNum || 0).toLocaleString()}`
                }
                variation='primary'
                size='large'
                className='w-full'
                loading={isPending}
                disabled={isSignedIn && (!enoughLegs || hasInvalidLeg)}
                onClick={handlePlace}
              />
              <p className='text-center text-[11px] text-neutral-10'>
                Odds are locked in when you place. Every leg must win.
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

export default ComboSlip
