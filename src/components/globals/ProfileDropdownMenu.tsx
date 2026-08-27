import { useState } from 'react'
import type { NavigateFunction } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  CircleArrowDownDoubleIcon,
} from '@hugeicons/core-free-icons'
import {
  accountMenuItems,
  generalMenuItems,
  legalMenuItems,
  appearanceOptions,
  type AppearanceOption,
} from '../../utils/constants'
import { ProfileAvatar } from './ReusedText'
import Dropdown from './Dropdown'

type ProfileUser = {
  name?: string | null
  phone?: string | null
} | null

type ProfileDropdownMenuProps = {
  user: ProfileUser
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

  const leaderboardItem = generalMenuItems.find((i) => i.id === 'leaderboard')
  const restOfGeneralItems = generalMenuItems.filter(
    (i) => i.id !== 'leaderboard',
  )

  return (
    <div className='flex text-sm flex-col gap-1 p-2'>
      {user && (
        <div className='flex items-center gap-2.5 px-2 py-1.5'>
          <ProfileAvatar
            firstName={user?.name ?? ''}
            lastName={user?.name ?? ''}
            imageUrl={null}
            className='dark:bg-[#e4e5e3]!'
          />
          <div className='flex flex-col gap-1'>
            <p className='font-semibold text-xs text-black'>
              {user?.name ?? '--'}
            </p>
            <p className='text-neutral-10 text-xs font-medium'>
              {user?.phone ?? '--'}
            </p>
          </div>
        </div>
      )}

      {user && (
        <>
          {accountMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => item.action(navigate, close)}
              className='flex gap-2.5 text-black items-center hover:bg-hover p-2 cursor-pointer'
            >
              <HugeiconsIcon icon={item.icon} size={20} />
              <p className='text-sm text-black font-semibold'>{item.label}</p>
            </div>
          ))}
          <div className='h-px bg-border my-1' />
        </>
      )}

      {leaderboardItem && (
        <div
          onClick={() => leaderboardItem.action(navigate, close)}
          className='flex gap-2.5 text-black items-center hover:bg-hover p-2 cursor-pointer'
        >
          <HugeiconsIcon icon={leaderboardItem.icon} size={20} />
          <p className='text-sm text-black font-medium'>
            {leaderboardItem.label}
          </p>
        </div>
      )}
      <Dropdown
        align='start'
        className='w-full'
        menuClassName='w-full'
        menu={({ close: closeAppearance }) => (
          <div className='flex flex-col p-1'>
            {appearanceOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  handleAppearanceSelect(option.value)
                  closeAppearance()
                }}
                className='flex items-center justify-between p-2 cursor-pointer hover:bg-hover'
              >
                <p
                  className={
                    appearance === option.value
                      ? 'text-sm text-black font-semibold'
                      : 'text-sm text-neutral-10 font-medium'
                  }
                >
                  {option.label}
                </p>
                {appearance === option.value && (
                  <span className='w-1.5 h-1.5 rounded-full bg-black' />
                )}
              </div>
            ))}
          </div>
        )}
      >
        <div className='flex gap-2.5 text-black items-center justify-between hover:bg-hover p-2 cursor-pointer'>
          <div className='flex gap-2.5 items-center'>
            <HugeiconsIcon icon={CircleArrowDownDoubleIcon} size={20} />
            <p className='text-sm text-black font-medium'>Appearance</p>
          </div>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
        </div>
      </Dropdown>

      {restOfGeneralItems.map((item) => (
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

      {legalMenuItems.map((item) => (
        <p
          key={item.id}
          onClick={() => item.action(navigate, close)}
          className='text-sm text-black font-medium px-2 py-2 cursor-pointer hover:bg-hover'
        >
          {item.label}
        </p>
      ))}

      <div className='h-px bg-border my-1' />

      <p
        onClick={() => {
          close()
          onLogout()
        }}
        className='text-sm text-error font-medium mt-1 px-2 py-2 cursor-pointer hover:bg-hover'
      >
        Log Out
      </p>
    </div>
  )
}

export default ProfileDropdownMenu
