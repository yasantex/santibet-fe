import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '../../utils/hooks'
import type { KycStatusResponse, UserData } from '../../types/types'
import { useSantiBetQuery } from '../../data_layer/utils'
import { useModalControl } from '../../hooks/useModalControl'
import VerifyEmail from '../../components/appModals/auth/VerifyEmail'
import { Tabs } from '../../components/globals/Tabs'
import ProfileTab from './profileTabs/ProfileTab'
import SecurityTab from './profileTabs/SecurityTab'
import VerificationTab from './profileTabs/VerificationTab'
import KycTab from './profileTabs/KycTab'

type AccountTab = 'profile' | 'security' | 'verification' | 'kyc'

const VALID_TABS: AccountTab[] = [
  'profile',
  'security',
  'verification',
  'kyc',
]

const AccountProfile = () => {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as AccountTab | null
  const {
    data: userProfile,
    isLoading,
    refetch,
  } = useSantiBetQuery<UserData>({
    path: '/auth/me',
  })
  const {
    data: kycStatus,
    isLoading: kycLoading,
    refetch: refetchKyc,
  } = useSantiBetQuery<KycStatusResponse>({
    path: 'kyc',
  })

  const { user } = useAppSelector((state) => state.user)
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()
  const [activeTab, setActiveTab] = useState<AccountTab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile',
  )
  const [syncedTabParam, setSyncedTabParam] = useState(tabParam)

  if (tabParam !== syncedTabParam) {
    setSyncedTabParam(tabParam)
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }

  const profile = userProfile ?? user

  return (
    <main className='mx-auto flex w-full flex-col gap-6'>
      <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
        Settings
      </h1>

      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'security', label: 'Security' },
          { id: 'verification', label: 'Verification' },
          { id: 'kyc', label: 'KYC' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as AccountTab)}
        className={'w-fit!'}
      />

      {activeTab === 'profile' &&
        (isLoading ? (
          <div className='h-32 animate-pulse rounded-lg bg-card' />
        ) : (
          <ProfileTab user={profile as UserData} refetch={refetch} />
        ))}

      {activeTab === 'security' && <SecurityTab />}

      {activeTab === 'verification' &&
        (isLoading ? (
          <div className='h-32 animate-pulse rounded-lg bg-card' />
        ) : (
          <VerificationTab
            profile={profile}
            onVerifyEmail={() => handleModalOpen('verifyEmail')}
            onVerifyPhone={() => handleModalOpen('verifyPhone')}
          />
        ))}

      {activeTab === 'kyc' &&
        (kycLoading ? (
          <div className='h-32 animate-pulse rounded-lg bg-card' />
        ) : (
          <KycTab
            kycStatus={kycStatus}
            kycLoading={kycLoading}
            refetchKyc={refetchKyc}
          />
        ))}

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
    </main>
  )
}

export default AccountProfile
