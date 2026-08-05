import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import AppLayout from './layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPassword from './pages/auth/ForgotPassword'
import RecoverPassword from './pages/auth/RecoverPassword'
import ChangePassword from './pages/auth/ChangePassword'
import Profile from './pages/account/Profile'

function App() {
  return (
    <>
      <ToastNotification />
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<HomePage />} />
          <Route path='/signin' element={<LoginPage />} />
          <Route path='/signup' element={<SignupPage />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />

          <Route
            path='/recover-password/:email'
            element={<RecoverPassword />}
          />
          <Route path='/change-password' element={<ChangePassword />} />
          <Route path='/account-profile' element={<Profile />} />

        </Route>
      </Routes>
    </>
  )
}

export default App
