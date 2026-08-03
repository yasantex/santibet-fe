import ToastNotification from './components/globals/ToastNotification'
import ScrollToTop from './components/globals/ScrollToTop'
import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'

function App() {
  return (
    <>
      <ToastNotification />
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<HomePage />} />
      </Routes>
    </>
  )
}

export default App
