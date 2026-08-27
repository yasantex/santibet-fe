import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  LogoutSquare01Icon,
} from '@hugeicons/core-free-icons'
import { NavLink } from 'react-router'
import { accountMenuItems } from '../../utils/constants'
import { useAppSelector } from '../../utils/hooks'
import { ProfileAvatar } from '../globals/ReusedText'
import useLogout from '../../hooks/useLogout'

const navItems = accountMenuItems

const AccountSidebar = () => {
  const { user } = useAppSelector((state) => state.user)
  const { logout } = useLogout()

  return (
    <aside className='w-full md:w-64 md:shrink-0'>
      <div className='flex flex-col gap-4'>
        {user && (
          <div className='flex items-center gap-2.5 px-2'>
            <ProfileAvatar
              firstName={user?.firstName ?? ''}
              lastName={user?.lastName ?? ''}
              imageUrl={null}
            />
            <div className='flex flex-col gap-0.5'>
              <p className='text-sm font-semibold text-black'>
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '--'}
              </p>
              <p className='text-xs font-medium text-neutral-10'>
                {user?.phone ?? '--'}
              </p>
            </div>
          </div>
        )}

        <nav className='flex flex-col gap-1 rounded-lg bg-card p-2'>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                  isActive
                    ? 'bg-hover font-semibold text-black'
                    : 'font-medium text-black hover:bg-hover hover:text-black/60'
                }`
              }
            >
              <HugeiconsIcon icon={item.icon} size={20} />
              <span className='flex-1'>{item.label}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </NavLink>
          ))}
        </nav>

        <button
          type='button'
          onClick={() => logout()}
          className='flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 text-sm font-semibold text-error hover:bg-hover cursor-pointer'
        >
          <HugeiconsIcon icon={LogoutSquare01Icon} size={20} />
          Log Out
        </button>
      </div>
    </aside>
  )
}

export default AccountSidebar
