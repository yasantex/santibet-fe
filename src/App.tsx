import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import AppLayout from './layout/AppLayout'
import AuthRoute from './routes/AuthRoute'
import ProtectedRoute from './routes/ProtectedRoute'

// Route components are code-split so the initial bundle stays small; heavy deps
// (recharts, qrcode) load only with the pages that use them.
const MarketsDashboard = lazy(() => import('./pages/MarketsDashboard'))
const MarketDetail = lazy(() => import('./pages/markets/MarketDetail'))
const EventDetail = lazy(() => import('./pages/markets/EventDetail'))
const CategoryPage = lazy(() => import('./pages/markets/CategoryPage'))
const LiveMarkets = lazy(() => import('./pages/markets/LiveMarkets'))
const AccountProfile = lazy(() => import('./pages/account/AccountProfile'))
const AccountWallet = lazy(() => import('./pages/account/AccountWallet'))
const AccountPortfolio = lazy(() => import('./pages/account/AccountPortfolio'))
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
// const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
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
              <Route path='/account-profile' element={<AccountProfile />} />
              <Route path='/rewards' element={<Rewards />} />
              <Route path='/account-wallet' element={<AccountWallet />} />
              <Route path='/account-portfolio' element={<AccountPortfolio />} />
              <Route path='/orders' element={<Orders />} />
              <Route path='/refer-earn' element={<ReferEarn />} />

            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
