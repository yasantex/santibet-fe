import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import AppLayout from './layout/AppLayout'
import AuthRoute from './routes/AuthRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import AccountLayout from './pages/account/AccountLayout'

// Route components are code-split so the initial bundle stays small; heavy deps
// (recharts, qrcode) load only with the pages that use them.
const MarketsDashboard = lazy(() => import('./pages/MarketsDashboard'))
const MarketDetail = lazy(() => import('./pages/markets/MarketDetail'))
const EventDetail = lazy(() => import('./pages/markets/EventDetail'))
const CategoryPage = lazy(() => import('./pages/markets/CategoryPage'))
const LiveMarkets = lazy(() => import('./pages/markets/LiveMarkets'))
const Perps = lazy(() => import('./pages/Perps'))
const AccountMenu = lazy(() => import('./pages/account/AccountMenu'))
const Notifications = lazy(() => import('./pages/Notifications'))
const AccountProfile = lazy(() => import('./pages/account/AccountProfile'))
const AccountWallet = lazy(() => import('./pages/account/AccountWallet'))
const AccountPortfolio = lazy(() => import('./pages/account/AccountPortfolio'))
const AccountFavorites = lazy(() => import('./pages/account/AccountFavorites'))
const Orders = lazy(() => import('./pages/Orders'))
const ReferEarn = lazy(() => import('./pages/ReferEarn'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Rewards = lazy(() => import('./pages/Rewards'))
const HelpCenter = lazy(() => import('./pages/HelpCenter'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const ResponsibleGambling = lazy(() => import('./pages/ResponsibleGambling'))
const ContactSupport = lazy(() => import('./pages/ContactSupport'))
const Faqs = lazy(() => import('./pages/Faqs'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const RecoverPassword = lazy(() => import('./pages/auth/RecoverPassword'))
const TwoFaPage = lazy(() => import('./pages/auth/TwoFaPage'))
const VerifyAccount = lazy(() => import('./pages/auth/VerifyAccount'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Cookie = lazy(() => import('./pages/Cookie'))

const RouteFallback = () => (
  <div className='flex min-h-[60vh] w-full items-center justify-center'>
    <span className='h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent' />
  </div>
)

function App() {
  return (
    <>
      <ToastNotification />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path='/' element={<MarketsDashboard />} />
            <Route path='/markets/:id' element={<MarketDetail />} />
            <Route path='/events/:id' element={<EventDetail />} />
            <Route path='/live' element={<LiveMarkets />} />
            <Route path='/perps' element={<Perps />} />
            <Route path='/browse' element={<CategoryPage />} />
            <Route path='/category/:category' element={<CategoryPage />} />
            <Route path='/terms-of-service' element={<TermsOfService />} />
            <Route path='/privacy-policy' element={<PrivacyPolicy />} />
            <Route path='/about-us' element={<AboutUs />} />
            <Route path='/faqs' element={<Faqs />} />
            <Route path='/cookie-policy' element={<Cookie />} />

            <Route
              path='/responsible-gambling'
              element={<ResponsibleGambling />}
            />
            <Route path='/contact-us' element={<ContactSupport />} />
            <Route path='/leaderboard' element={<Leaderboard />} />
            <Route path='/help-center' element={<HelpCenter />} />
            <Route path='/verify-account' element={<VerifyAccount />} />

            <Route element={<AuthRoute />}>
              <Route path='/signin' element={<LoginPage />} />
              <Route path='/signup' element={<LoginPage />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/two-fa' element={<TwoFaPage />} />

              <Route
                path='/recover-password/:email'
                element={<RecoverPassword />}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path='/account' element={<AccountMenu />} />

              <Route element={<AccountLayout />}>
                <Route path='/account-profile' element={<AccountProfile />} />
                <Route path='/notifications' element={<Notifications />} />
                <Route path='/rewards' element={<Rewards />} />
                <Route path='/account-wallet' element={<AccountWallet />} />
                <Route
                  path='/account-portfolio'
                  element={<AccountPortfolio />}
                />
                <Route
                  path='/account-favorites'
                  element={<AccountFavorites />}
                />
                <Route path='/orders' element={<Orders />} />
                <Route path='/refer-earn' element={<ReferEarn />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
