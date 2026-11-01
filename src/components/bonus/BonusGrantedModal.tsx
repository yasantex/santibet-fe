import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { GiftIcon } from '@hugeicons/core-free-icons'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { useCurrentBonus } from '../../data_layer/bonuses'
import { useAppSelector } from '../../utils/hooks'
import {
  bonusGoalCopy,
  formatKobo,
  hasSeenBonus,
  markBonusSeen,
} from '../../utils/bonus'
import { KYC_PATH } from '../../utils/authRedirect'

/**
 * "Bonus added" — shown the first time this browser sees a live bonus id:
 * the ₦1,010 on first sign-in, or the deposit bonus once a first deposit
 * lands. Nothing to call; the grant already happened server-side.
 */
const BonusGrantedModal = () => {
  const navigate = useNavigate()
  const signedIn = useAppSelector((state) => !!state.user.user)
  const { bonus } = useCurrentBonus(signedIn)
  // Mirrors localStorage so closing re-renders without waiting on storage.
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const open =
    signedIn && !!bonus && bonus.id !== dismissedId && !hasSeenBonus(bonus.id)

  if (!bonus) return null

  const close = () => {
    markBonusSeen(bonus.id)
    setDismissedId(bonus.id)
  }

  const go = (path: string) => {
    close()
    navigate(path)
  }

  const message =
    bonus.display?.grantedMessage || `${bonus.title} added to your account`

  return (
    <ModalComponent
      open={open}
      handleClose={close}
      className='max-w-105! w-[90%]!'
      closeOnOverlayClick={false}
    >
      <div className='flex flex-col items-center gap-4 pt-2 text-center'>
        <span className='flex h-16 w-16 items-center justify-center rounded-full bg-surface-success text-success'>
          <HugeiconsIcon icon={GiftIcon} size={32} />
        </span>
        <div className='flex flex-col gap-1'>
          <h2 className='text-lg font-bold text-black'>{message}</h2>
          <p className='text-3xl font-bold text-success'>
            {formatKobo(bonus.bonusAmountKobo)}
          </p>
          <p className='text-sm text-neutral-10'>
            {bonus.kycRequired
              ? 'Verify your identity to start using your bonus.'
              : bonusGoalCopy(bonus)}
          </p>
          {bonus.daysLeft != null && !bonus.kycRequired && (
            <p className='text-xs text-neutral-10'>
              {bonus.daysLeft} day{bonus.daysLeft === 1 ? '' : 's'} to use it.
            </p>
          )}
        </div>
        <div className='flex w-full flex-col gap-2'>
          <Button
            type='button'
            text={bonus.kycRequired ? 'Verify identity' : 'Start betting'}
            variation='primary'
            size='large'
            className='w-full!'
            onClick={() => go(bonus.kycRequired ? KYC_PATH : '/browse')}
          />
          <Button
            type='button'
            text='View my bonus'
            variation='plain'
            size='large'
            className='w-full!'
            onClick={() => go('/bonuses')}
          />
        </div>
        {bonus.display?.termsUrl && (
          <Link
            to={bonus.display.termsUrl}
            onClick={close}
            className='text-xs font-semibold text-neutral-10 underline underline-offset-2 hover:text-black'
          >
            Terms & conditions apply
          </Link>
        )}
      </div>
    </ModalComponent>
  )
}

export default BonusGrantedModal
