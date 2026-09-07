import { useState } from 'react'
import type { NavigateFunction } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  LogoutSquare01Icon,
  User02FreeIcons,
} from '@hugeicons/core-free-icons'
import {
  appearanceOptions,
  generalMenuItems,
  type AppearanceOption,
} from '../../utils/constants'
import { ProfileAvatar } from './ReusedText'
import type { UserData } from '../../types/types'

type ProfileDropdownMenuProps = {
  user: UserData | null
  navigate: NavigateFunction
  close: () => void
  isDark: boolean
  toggleTheme: () => void
  onLogout: () => void
}

const ProfileDropdownMenu = ({
  user,
  navigate,
  close,
  isDark,
  toggleTheme,
  onLogout,
}: ProfileDropdownMenuProps) => {
  const [appearance, setAppearance] = useState<AppearanceOption>(
    isDark ? 'dark' : 'light',
  )

  const handleAppearanceSelect = (value: AppearanceOption) => {
    setAppearance(value)
    const wantsDark =
      value === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : value === 'dark'
    if (wantsDark !== isDark) toggleTheme()
  }

  return (
    <div className='flex text-sm flex-col gap-1 p-2'>
      {user && (
        <div className='flex items-center gap-2.5 px-2 py-1.5'>
          <ProfileAvatar
            firstName={user?.firstName ?? ''}
            lastName={user?.lastName ?? ''}
            imageUrl={null}
          />
          <div className='flex flex-col gap-1'>
            <p className='font-semibold text-xs text-black'>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : '--'}
            </p>
            <p className='text-neutral-10 text-xs font-medium'>
              {user?.phone ?? user?.email}
            </p>
          </div>
        </div>
      )}

      {user && (
        <>
          <div
            onClick={() => {
              navigate('/account')
              close()
            }}
            className='flex gap-2.5 text-black items-center hover:bg-hover p-2 cursor-pointer'
          >
            <HugeiconsIcon icon={User02FreeIcons} size={20} />
            <p className='text-sm text-black font-semibold'>My Profile</p>
          </div>
          <div className='h-px bg-border my-1' />
        </>
      )}

      {generalMenuItems.map((item) => (
        <div
          key={item.id}
          onClick={() => item.action(navigate, close)}
          className='flex gap-2.5 text-black items-center hover:bg-hover p-2 cursor-pointer'
        >
          <HugeiconsIcon icon={item.icon} size={20} />
          <p className='text-sm text-black font-medium'>{item.label}</p>
        </div>
      ))}

      <div className='h-px bg-border my-1' />

      <p
        onClick={() => {
          close()
          onLogout()
        }}
        className='text-sm text-error flex items-center gap-2.5 font-medium mt-1 px-2 py-2 cursor-pointer hover:bg-hover'
      >
        <HugeiconsIcon icon={LogoutSquare01Icon} size={20} />
        Log Out
      </p>

      <div className='flex items-center gap-1 border-t border-border p-1 mt-1'>
        {appearanceOptions.map((option) => {
          const active = appearance === option.value
          return (
            <button
              key={option.value}
              type='button'
              onClick={() => handleAppearanceSelect(option.value)}
              aria-label={option.label}
              aria-pressed={active}
              className={`flex flex-1 items-center text-black justify-center rounded-xl py-2 cursor-pointer transition-colors ${
                active ? 'bg-hover' : ''
              }`}
            >
              <HugeiconsIcon
                icon={option.icon}
                size={20}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProfileDropdownMenu
