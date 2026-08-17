import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import { Route, Routes } from 'react-router'
import AppLayout from './layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPassword from './pages/auth/ForgotPassword'
import RecoverPassword from './pages/auth/RecoverPassword'
import AccountProfile from './pages/account/AccountProfile'
import AuthRoute from './routes/AuthRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import MarketsDashboard from './pages/MarketsDashboard'
import MarketDetail from './pages/markets/MarketDetail'
import EventDetail from './pages/markets/EventDetail'
import CategoryPage from './pages/markets/CategoryPage'
import AccountWallet from './pages/account/AccountWallet'
import AccountPortfolio from './pages/account/AccountPortfolio'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Leaderboard from './pages/Leaderboard'
import Rewards from './pages/Rewards'
import ReferEarn from './pages/ReferEarn'
import HelpCenter from './pages/HelpCenter'
import TwoFaPage from './pages/auth/TwoFaPage'
import Orders from './pages/Orders'

function App() {
  return (
    <>
      <ToastNotification />
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<MarketsDashboard />} />
          <Route path='/markets/:id' element={<MarketDetail />} />
          <Route path='/events/:id' element={<EventDetail />} />
          <Route path='/browse' element={<CategoryPage />} />
          <Route path='/category/:category' element={<CategoryPage />} />
          <Route path='/terms-of-service' element={<TermsOfService />} />
          <Route path='/privacy-policy' element={<PrivacyPolicy />} />
          <Route path='/leaderboard' element={<Leaderboard />} />
          <Route path='/rewards' element={<Rewards />} />
          <Route path='/help-center' element={<HelpCenter />} />

          <Route element={<AuthRoute />}>
            <Route path='/signin' element={<LoginPage />} />
            <Route path='/signup' element={<SignupPage />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/two-fa' element={<TwoFaPage />} />

            <Route
              path='/recover-password/:email'
              element={<RecoverPassword />}
            />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path='/account-profile' element={<AccountProfile />} />
            <Route path='/account-wallet' element={<AccountWallet />} />
            <Route path='/account-portfolio' element={<AccountPortfolio />} />
            <Route path='/orders' element={<Orders />} />
            <Route path='/sports/:id' element={<MarketDetail />} />
            <Route path='/crypto/:id' element={<MarketDetail />} />
            <Route path='/refer-earn' element={<ReferEarn />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
