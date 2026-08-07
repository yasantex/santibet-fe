import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import { Route, Routes } from 'react-router'
import AppLayout from './layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPassword from './pages/auth/ForgotPassword'
import RecoverPassword from './pages/auth/RecoverPassword'
import ChangePassword from './pages/account/ChangePassword'
import AccountProfile from './pages/account/AccountProfile'
import AuthRoute from './routes/AuthRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import MarketsDashboard from './pages/MarketsDashboard'
import AccountWallet from './pages/account/AccountWallet'
import AccountPortfolio from './pages/account/AccountPortfolio'

function App() {
  return (
    <>
      <ToastNotification />
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<MarketsDashboard />} />
          <Route element={<AuthRoute />}>
            <Route path='/signin' element={<LoginPage />} />
            <Route path='/signup' element={<SignupPage />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route
              path='/recover-password/:email'
              element={<RecoverPassword />}
            />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path='/change-password' element={<ChangePassword />} />
            <Route path='/account-profile' element={<AccountProfile />} />
            <Route path='/account-wallet' element={<AccountWallet />} />
            <Route path='/account-portfolio' element={<AccountPortfolio />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
