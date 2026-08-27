import { Navigate } from 'react-router'
import { useWindowDimensions } from '../../hooks/useWindowDimensions'
import AccountSidebar from '../../components/account/AccountSidebar'

const AccountMenu = () => {
  const { width } = useWindowDimensions()

  if (width >= 768) {
    return <Navigate to='/account-profile' replace />
  }

  return (
    <main className='mx-auto flex w-full flex-col py-10 px-3 '>
      <AccountSidebar />
    </main>
  )
}

export default AccountMenu
