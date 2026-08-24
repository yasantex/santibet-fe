import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserIcon,
  Shield01Icon,
  CreditCardIcon,
  Notification03Icon,
  ShieldEnergyIcon,
  InformationCircleIcon,
  Message01Icon,
  PencilEdit02Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { useAppSelector } from '../../utils/hooks'
import type { KycStatusResponse, UserData } from '../../types/types'
import { useSantiBetQuery } from '../../data_layer/utils'
import useLogout from '../../hooks/useLogout'
import { ProfileAvatar } from '../../components/globals/ReusedText'
import { useModalControl } from '../../hooks/useModalControl'
import VerifyEmail from '../../components/appModals/auth/VerifyEmail'
import { Button } from '../../components/globals/Button'
import Security from '../../components/appModals/auth/Security'
import VerifyKyc from '../../components/appModals/auth/VerifyKyc'
import { useNavigate } from 'react-router'

type ProfileRow = {
  icon: typeof UserIcon
  label: string
  onClick?: () => void
}

type ProfileSectionData = {
  title: string
  rows: ProfileRow[]
}

const ProfileSection = ({ title, rows }: ProfileSectionData) => (
  <section className='flex flex-col gap-2.5'>
    <h2 className='text-xs font-semibold uppercase  text-neutral-10'>
      {title}
    </h2>
    <div className='rounded-lg cursor-pointer bg-card'>
      {rows.map((row) => (
        <button
          key={row.label}
          type='button'
          onClick={row.onClick}
          className={`flex w-full items-center text-black gap-3 px-4 py-4 text-left border-b border-border hover:bg-hover cursor-pointer
           `}
        >
          <HugeiconsIcon icon={row.icon} size={20} />
          <span className='flex-1 text-sm font-medium'>{row.label}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={18}
            className='text-neutral-10'
          />
        </button>
      ))}
    </div>
  </section>
)

const AccountProfile = () => {
  const {
    data: userProfile,
    isLoading,
    refetch,
  } = useSantiBetQuery<UserData>({
    path: '/auth/me',
  })
  const { data: kycStatus, isLoading: kycLoading } =
    useSantiBetQuery<KycStatusResponse>({
      path: 'kyc',
    })

  const { user } = useAppSelector((state) => state.user)
  const { logout } = useLogout()
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const navigate = useNavigate()

  const profile = userProfile ?? user

  const sections: ProfileSectionData[] = [
    {
      title: 'Account',
      rows: [
        {
          icon: UserIcon,
          label: 'Personal Information',
          // onClick: () => navigate('/profile/personal-information'),
        },
        {
          icon: Shield01Icon,
          label: 'Security',
          onClick: () => handleModalOpen('security'),
        },
        {
          icon: CreditCardIcon,
          label: 'Payment Methods',
          // onClick: () => handleModalOpen('paymentMethods'),
        },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        {
          icon: Notification03Icon,
          label: 'Notifications',
          // onClick: () => navigate('/profile/notifications'),
        },
        {
          icon: ShieldEnergyIcon,
          label: 'Responsible Gambling',
          onClick: () => navigate('/responsible-gambling'),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          icon: InformationCircleIcon,
          label: 'Help Center',
          onClick: () => navigate('/contact-us'),
        },
        {
          icon: Message01Icon,
          label: 'Contact Us',
          onClick: () => navigate('/contact-us'),
        },
      ],
    },
    {
      title: 'Legal',
      rows: [
        {
          icon: PencilEdit02Icon,
          label: 'Terms of Service',
          onClick: () => navigate('/terms-of-service'),
        },
        {
          icon: Shield01Icon,
          label: 'Privacy Policy',
          onClick: () => navigate('/privacy-policy'),
        },
      ],
    },
  ]

  return (
    <main className='mx-auto flex flex-col gap-6 pt-4 pb-20 px-3 md:px-8'>
      <h1 className='text-[18px] not-first:md:text-[28px] font-bold text-black'>
        Profile
      </h1>

      <section className='flex flex-col gap-5 rounded-lg bg-card p-4'>
        <div className='flex items-center gap-4 '>
          <ProfileAvatar
            firstName={profile?.name ?? ''}
            lastName={profile?.name ?? ''}
            imageUrl={profile?.avatarUrl}
            isLoading={isLoading}
            className='bg-[#16191a]! dark:bg-[#e4e5e3]! dark:text-[#000000]!'
          />
          <div className='flex flex-col gap-1'>
            {isLoading ? (
              <>
                <div className='h-4 w-32 animate-pulse rounded bg-neutral-10/20' />
                <div className='h-3.5 w-24 animate-pulse rounded bg-neutral-10/20' />
              </>
            ) : (
              <div className='flex flex-col gap-5'>
                <p className='text-base font-semibold text-nlack'>
                  {profile?.name ?? '—'}
                </p>
                <div className='flex items-center gap-2.5'>
                  <p className='text-sm text-placeholder'>
                    {profile?.phone ?? '—'}
                  </p>
                  {profile?.phone ? (
                    profile?.phoneVerified ? (
                      <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
                        Verified
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleModalOpen('verifyPhone')}
                        type='button'
                        size='small'
                        text='Verify phone'
                        variation='error'
                      />
                    )
                  ) : null}
                </div>
                <div className='flex items-center gap-2.5'>
                  <p className='text-sm text-placeholder'>
                    {profile?.email ?? '—'}
                  </p>
                  {profile?.emailVerified ? (
                    <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
                      Verified
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleModalOpen('verifyEmail')}
                      type='button'
                      size='small'
                      text='Verify email'
                      variation='error'
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2.5'>
          <span className=' text-sm text-black font-medium'>
            KYC Verification
          </span>

          {kycLoading ? (
            <div className='h-6 w-20 animate-pulse rounded-full bg-neutral-10/20' />
          ) : kycStatus?.status === 'NOT_STARTED' ? (
            <Button
              onClick={() => handleModalOpen('verifyKyc')}
              type='button'
              size='small'
              text='Verify KYC'
              variation='error'
              className='w-fit!'
            />
          ) : (
            <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
              Verified
            </span>
          )}
        </div>
      </section>

      {sections.map((section) => (
        <ProfileSection key={section.title} {...section} />
      ))}

      <button
        type='button'
        onClick={() => {
          logout()
        }}
        className='rounded-lg cursor-pointer bg-card hover:bg-hover px-4 py-4 text-sm font-semibold text-error'
      >
        Log Out
      </button>
      <VerifyEmail
        open={modalOpen && modal === 'verifyEmail'}
        handleClose={() => {
          handleModalClose()
        }}
        type='email'
        defaultValue={profile?.email}
        refetch={refetch}
      />
      <VerifyEmail
        open={modalOpen && modal === 'verifyPhone'}
        handleClose={() => {
          handleModalClose()
        }}
        type='phone'
        defaultValue={profile?.phone}
        refetch={refetch!}
      />
      <Security
        open={modalOpen && modal === 'security'}
        handleClose={() => {
          handleModalClose()
        }}
      />
      <VerifyKyc
        open={modalOpen && modal === 'verifyKyc'}
        handleClose={() => {
          handleModalClose()
        }}
        refetch={refetch!}
      />
    </main>
  )
}

export default AccountProfile
