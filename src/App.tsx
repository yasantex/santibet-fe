import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import AppLayout from './layout/AppLayout'

function App() {
  return (
    <>
      <ToastNotification />
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<HomePage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
