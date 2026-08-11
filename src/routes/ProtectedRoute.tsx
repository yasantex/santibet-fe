import { Navigate, Outlet } from 'react-router'
import { useCookies } from 'react-cookie'
import { useAppSelector } from '../utils/hooks'

const ProtectedRoute = () => {
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const hasToken = Boolean(cookies?.token)

  if (!hasToken || !user) {
    return <Navigate to='/' replace />
  }

  return <Outlet />
}

export default ProtectedRoute
