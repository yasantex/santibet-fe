import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { FormSwitch } from '../../../components/globals/FormSwitch'
import { useSantiBetMutation } from '../../../data_layer/utils'
import type { TwoFactorSetupResponse } from '../../../types/types'
import { useAppSelector } from '../../../utils/hooks'
import { useModalControl } from '../../../hooks/useModalControl'
import TwoFactorSetupModal from '../../../components/appModals/auth/TwoFactorSetupModal'
import DisableTwoFactorModal from '../../../components/appModals/auth/DisableTwoFactorModal'
import ChangePassword from '../../../components/appModals/auth/ChangePassword'
import RegenerateRecoveryCodes from '../../../components/appModals/auth/RegenerateRecoveryCodes'

interface SecurityRow {
  id: string
  label: string
  description?: string
  hasSwitch?: boolean
  checked?: boolean
  onToggle?: () => void
  onClick?: () => void
}

const SecurityTab = () => {
  const { user } = useAppSelector((state) => state.user)
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(
    null,
  )

  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()

  const { mutateAsync: setUpMfa, isPending } =
    useSantiBetMutation<TwoFactorSetupResponse>({
      path: `/auth/mfa/setup`,
      mutationOptions: {
        onSuccess: (data) => {
          setSetupData(data)
          handleModalOpen('setup-enable')
        },
      },
    })

  const handleToggle2FA = async () => {
    try {
      await setUpMfa({})
    } catch (error) {
      console.error(error)
    }
  }

  const rows: SecurityRow[] = [
    {
      id: 'change-password',
      label: 'Change Password',
      description: 'Last changed 3 months ago',
      onClick: () => {
        handleModalOpen('change-password')
      },
    },
    {
      id: 'two-factor',
      label: 'Two-Factor Authentication',
      description: 'Extra layer of login security',
      hasSwitch: true,
      checked: user?.mfaEnabled ?? false,
      onToggle: () => {
        if (user?.mfaEnabled) {
          handleModalOpen('disable')
        } else {
          handleToggle2FA()
        }
      },
    },
    {
      id: 'generate-backup-codes',
      label: 'Generate Backup Codes',
      description: 'Generate backup codes for two-factor authentication',
      onClick: () => {
        handleModalOpen('generate-backup-codes')
      },
    },

    {
      id: 'login-activity',
      label: 'Login Activity',
      description: 'See devices and locations',
      onClick: () => {
        console.log('Navigate to login activity')
      },
    },
  ]

  return (
    <div className='flex flex-col gap-2.5'>
      {rows.map((row) => (
        <button
          key={row.id}
          type='button'
          onClick={row.hasSwitch ? undefined : row.onClick}
          className={`flex w-full bg-card rounded-lg items-center gap-3 px-4 py-4 text-left border-b border-border hover:bg-hover dark:hover:bg-white/5 ${
            row.hasSwitch ? 'cursor-default' : 'cursor-pointer'
          }`}
          disabled={row.hasSwitch}
        >
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-medium text-black'>{row.label}</div>
            <div className='text-xs text-neutral-500 dark:text-neutral-400'>
              {row.description}
            </div>
          </div>

          {row.hasSwitch ? (
            <div onClick={(e) => e.stopPropagation()}>
              <FormSwitch
                checked={row.checked || false}
                onChange={row.onToggle || (() => {})}
                disabled={isPending}
                showLabel={false}
              />
            </div>
          ) : (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className='text-neutral-10 shrink-0'
            />
          )}
        </button>
      ))}

      <TwoFactorSetupModal
        open={modalOpen && modal === 'setup-enable'}
        handleClose={() => handleModalClose()}
        secret={setupData?.secret!}
        otpauthUri={setupData?.otpauthUri!}
      />
      <DisableTwoFactorModal
        open={modalOpen && modal === 'disable'}
        handleClose={() => handleModalClose()}
      />
      <RegenerateRecoveryCodes
        open={modalOpen && modal === 'generate-backup-codes'}
        handleClose={() => handleModalClose()}
      />
      <ChangePassword
        open={modalOpen && modal === 'change-password'}
        handleClose={() => handleModalClose()}
      />
    </div>
  )
}

export default SecurityTab
