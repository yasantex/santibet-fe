// src/pages/Profile.tsx
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
import { useNavigate } from 'react-router'
import { useAppSelector } from '../../utils/hooks'
import { useModalControl } from '../../hooks/useModalControl'
import type { UserData } from '../../types/types'
import { useSantiBetQuery } from '../../data_layer/utils'

type ProfileRow = {
  icon: typeof UserIcon
  label: string
  onClick: () => void
  muted?: boolean
}

type ProfileSectionData = {
  title: string
  rows: ProfileRow[]
}

const ProfileSection = ({ title, rows }: ProfileSectionData) => (
  <section className='flex flex-col gap-2.5'>
    <h2 className='px-1 text-xs font-semibold uppercase tracking-wide text-neutral-10'>
      {title}
    </h2>
    <div className='overflow-hidden rounded-2xl divide-y divide-border/10 bg-neutral-95 dark:bg-[#262626]'>
      {rows.map((row) => (
        <button
          key={row.label}
          type='button'
          onClick={row.onClick}
          className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-hover dark:hover:bg-white/5 ${
            row.muted ? 'text-neutral-10' : 'text-foreground'
          }`}
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

const Profile = () => {
  const navigate = useNavigate()

  const { data: userProfile, isLoading } = useSantiBetQuery<UserData>({
    path: '/auth/me',
  })
  const { user } = useAppSelector((state) => state.user)
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()

  // API is source of truth; Redux is the fallback while it loads or if it fails
  const profile = userProfile ?? user

  const sections: ProfileSectionData[] = [
    {
      title: 'Account',
      rows: [
        {
          icon: UserIcon,
          label: 'Personal Information',
          onClick: () => navigate('/profile/personal-information'),
        },
        {
          icon: Shield01Icon,
          label: 'Security',
          onClick: () => navigate('/profile/security'),
        },
        {
          icon: CreditCardIcon,
          label: 'Payment Methods',
          onClick: () => handleModalOpen('paymentMethods'),
        },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        {
          icon: Notification03Icon,
          label: 'Notifications',
          onClick: () => navigate('/profile/notifications'),
        },
        {
          icon: ShieldEnergyIcon,
          label: 'Responsible Gambling',
          onClick: () => navigate('/profile/responsible-gambling'),
          muted: true,
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          icon: InformationCircleIcon,
          label: 'Help Center',
          onClick: () => navigate('/support/help-center'),
        },
        {
          icon: Message01Icon,
          label: 'Contact Us',
          onClick: () => handleModalOpen('contactUs'),
        },
      ],
    },
    {
      title: 'Legal',
      rows: [
        {
          icon: PencilEdit02Icon,
          label: 'Terms of Service',
          onClick: () => navigate('/legal/terms-of-service'),
        },
        {
          icon: Shield01Icon,
          label: 'Privacy Policy',
          onClick: () => navigate('/legal/privacy-policy'),
        },
      ],
    },
  ]

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4 pb-20 py-6 md:px-6'>
      <h1 className='text-2xl font-bold text-foreground'>Profile</h1>

      <div className='flex items-center gap-4 rounded-2xl bg-neutral-95 px-4 py-4 dark:bg-[#262626]'>
        <div className='h-14 w-14 shrink-0 overflow-hidden rounded-full bg-text-black'>
          {isLoading ? (
            <div className='h-full w-full animate-pulse bg-neutral-10/20' />
          ) : (
            profile?.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt={profile?.name ?? 'Profile picture'}
                className='h-full w-full object-cover'
              />
            )
          )}
        </div>
        <div className='flex flex-col gap-1'>
          {isLoading ? (
            <>
              <div className='h-4 w-32 animate-pulse rounded bg-neutral-10/20' />
              <div className='h-3.5 w-24 animate-pulse rounded bg-neutral-10/20' />
            </>
          ) : (
            <>
              <p className='text-base font-semibold text-foreground'>
                {profile?.name ??  '—'}
              </p>
              <p className='text-sm text-neutral-10'>
                {profile?.phone ?? profile?.email ?? '—'}
              </p>
              {profile?.emailVerified && (
                <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
                  Verified
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {sections.map((section) => (
        <ProfileSection key={section.title} {...section} />
      ))}

      <button
        type='button'
        onClick={() => handleModalOpen('logout')}
        className='rounded-2xl bg-neutral-95 px-4 py-4 text-sm font-semibold text-error transition-colors hover:bg-hover dark:bg-[#262626] dark:hover:bg-white/5'
      >
        Log Out
      </button>
    </main>
  )
}

export default Profile
