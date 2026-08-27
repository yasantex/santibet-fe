import { Outlet, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import AccountSidebar from '../../components/account/AccountSidebar'

const AccountLayout = () => {
  const navigate = useNavigate()

  return (
    <div className='mx-auto flex w-full lg:w-[70%] flex-col gap-6 px-3 py-10 md:flex-row '>
      <div className='hidden md:block'>
        <AccountSidebar />
      </div>

      <div className='min-w-0 flex-1'>
        <button
          type='button'
          onClick={() => navigate('/account')}
          className='mb-4 flex items-center gap-1 text-sm font-medium text-black hover:text-black/60 md:hidden'
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          My Profile
        </button>

        <Outlet />
      </div>
    </div>
  )
}

export default AccountLayout
