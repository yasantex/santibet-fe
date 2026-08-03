import Header from './Header'
import { Outlet } from 'react-router'

const AppLayout = () => {
  return (
    <div className='flex min-h-screen'>
      <div className='flex w-full flex-1 flex-col '>
        <Header />

        <main className='w-full flex-1 bg-white'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
