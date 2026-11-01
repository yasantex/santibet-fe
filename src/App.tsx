import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import ErrorPage from './pages/ErrorPage'
import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import AppLayout from './layout/AppLayout'
import AuthRoute from './routes/AuthRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import AccountLayout from './pages/account/AccountLayout'
import ReferralRedirect from './routes/ReferralRedirect'
import KycRedirect from './routes/KycRedirect'
import { KNOWN_CONTENT_PAGES } from './utils/contentPages'

/** Contact Us adds the support actions above its content. */
const CONTACT_ROUTE = '/contact-us'

// Route components are code-split so the initial bundle stays small; heavy deps
// (recharts, qrcode) load only with the pages that use them.
const MarketsDashboard = lazy(() => import('./pages/MarketsDashboard'))
const MarketDetail = lazy(() => import('./pages/markets/MarketDetail'))
const EventDetail = lazy(() => import('./pages/markets/EventDetail'))
const CategoryPage = lazy(() => import('./pages/markets/CategoryPage'))
const LiveMarkets = lazy(() => import('./pages/markets/LiveMarkets'))
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
const Bonuses = lazy(() => import('./pages/Bonuses'))
const HelpCenter = lazy(() => import('./pages/HelpCenter'))
const ContactSupport = lazy(() => import('./pages/ContactSupport'))
const Faqs = lazy(() => import('./pages/Faqs'))
const ContentPage = lazy(() => import('./pages/ContentPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const RecoverPassword = lazy(() => import('./pages/auth/RecoverPassword'))
const TwoFaPage = lazy(() => import('./pages/auth/TwoFaPage'))
const VerifyAccount = lazy(() => import('./pages/auth/VerifyAccount'))
const AgentSignup = lazy(() => import('./pages/auth/AgentSignup'))

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
            {KNOWN_CONTENT_PAGES.map(({ slug, route }) => (
              <Route
                key={slug}
                path={route}
                element={
                  route === CONTACT_ROUTE ? (
                    <ContactSupport slug={slug} />
                  ) : (
                    <ContentPage slug={slug} />
                  )
                }
              />
            ))}
            <Route path='/pages/:slug' element={<ContentPage />} />
            {/* Bonus T&Cs (`termsUrl` from the bonus API), e.g. /terms/1000-bonus. */}
            <Route path='/terms/:slug' element={<ContentPage />} />
            <Route path='/faqs' element={<Faqs />} />
            <Route path='/leaderboard' element={<Leaderboard />} />
            <Route path='/help-center' element={<HelpCenter />} />
            <Route path='/verify-account' element={<VerifyAccount />} />

            {/* Partner programme: short referral links, agent-assisted
                signups, and the KYC link agents text to customers. */}
            <Route path='/r/:code' element={<ReferralRedirect />} />
            <Route path='/agent-signup' element={<AgentSignup />} />
            <Route path='/kyc' element={<KycRedirect />} />

            <Route element={<AuthRoute />}>
              <Route path='/signin' element={<LoginPage />} />
              <Route path='/signup' element={<LoginPage />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/two-fa' element={<TwoFaPage />} />

              <Route
                path='/recover-password/:identifier'
                element={<RecoverPassword />}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path='/account' element={<AccountMenu />} />

              <Route element={<AccountLayout />}>
                <Route path='/account-profile' element={<AccountProfile />} />
                <Route path='/notifications' element={<Notifications />} />
                <Route path='/rewards' element={<Rewards />} />
                <Route path='/bonuses' element={<Bonuses />} />
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

            <Route path='*' element={<ErrorPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
