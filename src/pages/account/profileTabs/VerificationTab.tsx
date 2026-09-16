import { Button } from '../../../components/globals/Button'
import type { UserData } from '../../../types/types'

type VerificationTabProps = {
  profile: UserData | null | undefined
  onVerifyEmail: () => void
  onVerifyPhone: () => void
}

const VerificationTab = ({
  profile,
  onVerifyEmail,
  onVerifyPhone,
}: VerificationTabProps) => {
  return (
    <div className='flex flex-col gap-5'>
      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            Phone verification
          </h2>
          <p className='text-xs text-placeholder'>
            Used to secure your account and send login alerts.
          </p>
        </div>
        <div className='flex items-center justify-between rounded-lg bg-card p-4'>
          <p className='text-sm text-black'>{profile?.phone ?? '—'}</p>
          {profile?.phoneVerified ? (
            <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
              Verified
            </span>
          ) : (
            <Button
              onClick={onVerifyPhone}
              type='button'
              size='small'
              text='Verify phone'
              variation='error'
              className='w-fit!'
            />
          )}
        </div>
      </section>

      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            Email verification
          </h2>
          <p className='text-xs text-placeholder'>
            Used for payout confirmations and account alerts.
          </p>
        </div>
        <div className='flex items-center justify-between rounded-lg bg-card p-4'>
          <p className='text-sm text-black'>{profile?.email ?? '—'}</p>
          {profile?.emailVerified ? (
            <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
              Verified
            </span>
          ) : (
            <Button
              onClick={onVerifyEmail}
              type='button'
              size='small'
              text='Verify email'
              variation='error'
              className='w-fit!'
            />
          )}
        </div>
      </section>
    </div>
  )
}

export default VerificationTab
