import { useEffect } from 'react'
import CookieConsent, {
  COOKIE_CONSENT_KEY,
} from '../components/appModals/CookieConsent'
import { useModalControl } from '../hooks/useModalControl'
import Footer from './Footer'
import Header from './Header'
import { Outlet } from 'react-router'

const AppLayout = () => {
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (hasConsent) return

    const timer = setTimeout(() => {
      // re-check in case consent was given in another tab/action
      // during the 15s wait
      if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
        handleModalOpen('cookieConsent')
      }
    }, 15000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex min-h-screen'>
      <div className='flex w-full flex-1 flex-col '>
        <Header />
        <main className='w-full flex-1 bg-white pb-20'>
          <Outlet />
        </main>
        <Footer />
      </div>
      <CookieConsent
        open={modalOpen && modal === 'cookieConsent'}
        handleClose={() => {
          handleModalClose()
        }}
      />
    </div>
  )
}

export default AppLayout