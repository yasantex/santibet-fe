import { useState } from 'react'
import { useNavigate } from 'react-router'
import ModalComponent from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { BadgeIcon } from './BadgeGrid'
import { useBadges, useMarkBadgesSeen } from '../../data_layer/points'
import { useAppSelector } from '../../utils/hooks'
import useAccountSuspended from '../../hooks/useAccountSuspended'

/**
 * "You earned a badge" — shown once after sign-in when `/badges/me` reports
 * unseen badges, then `POST /badges/me/seen` so it doesn't repeat next login.
 * A suspended account can't write, so it isn't marked (the moment just waits
 * for when the account is back) and is only shown once per visit.
 */
const BadgeCelebration = () => {
  const navigate = useNavigate()
  const signedIn = useAppSelector((state) => !!state.user.user)
  const suspended = useAccountSuspended()
  const [dismissed, setDismissed] = useState(false)

  const { data } = useBadges(signedIn && !dismissed)
  const { mutate: markSeen } = useMarkBadgesSeen()

  const fresh = data?.data.filter((b) => b.isNew && b.earned) ?? []
  const open = signedIn && !dismissed && (data?.newCount ?? 0) > 0 && fresh.length > 0

  const close = () => {
    setDismissed(true)
    if (!suspended) markSeen()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={close}
      className='max-w-105!'
      closeOnOverlayClick={false}
    >
      <div className='flex flex-col items-center gap-4 pt-2 text-center'>
        <div className='flex flex-wrap justify-center gap-3'>
          {fresh.slice(0, 4).map((badge) => (
            <BadgeIcon key={badge.key} badge={badge} size={64} />
          ))}
        </div>
        <div className='flex flex-col gap-1'>
          <h2 className='text-lg font-bold text-black'>
            {fresh.length === 1
              ? 'You earned a badge'
              : `You earned ${fresh.length} badges`}
          </h2>
          <p className='text-sm text-neutral-10'>
            {fresh.length === 1
              ? `${fresh[0].name} — ${fresh[0].description}`
              : fresh.map((b) => b.name).join(', ')}
          </p>
        </div>
        <div className='flex w-full flex-col gap-2'>
          <Button
            type='button'
            text='See my badges'
            variation='primary'
            size='large'
            className='w-full!'
            onClick={() => {
              close()
              navigate('/rewards#badges')
            }}
          />
          <Button
            type='button'
            text='Close'
            variation='plain'
            size='large'
            className='w-full!'
            onClick={close}
          />
        </div>
      </div>
    </ModalComponent>
  )
}

export default BadgeCelebration
