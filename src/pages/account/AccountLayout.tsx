import { Outlet, useLocation } from 'react-router'
import AccountSidebar from '../../components/account/AccountSidebar'
import PageNav from '../../components/globals/PageNav'
import { accountMenuItems } from '../../utils/constants'

const SECTION_LABELS: Record<string, string> = {
  '/notifications': 'Notifications',
  '/rewards': 'Rewards',
  '/bonuses': 'Bonuses',
  '/orders': 'Bet History',
  '/refer-earn': 'Refer & Earn',
}

const AccountLayout = () => {
  const { pathname } = useLocation()
  const section =
    accountMenuItems.find((item) => item.path === pathname)?.label ??
    SECTION_LABELS[pathname]

  return (
    <div className='mx-auto flex w-full lg:w-[70%] flex-col gap-6 px-3 py-10 md:flex-row '>
      <div className='hidden md:block'>
        <AccountSidebar />
      </div>

      <div className='min-w-0 flex-1'>
        <PageNav
          className='mb-4'
          fallbackHref='/account'
          crumbs={[
            { label: 'My Profile', href: '/account' },
            ...(section ? [{ label: section }] : []),
          ]}
        />

        <Outlet />
      </div>
    </div>
  )
}

export default AccountLayout
