import { Navigate, Outlet } from 'react-router'
import { useCookies } from 'react-cookie'
import { useAppSelector } from '../utils/hooks'

const AuthRoute = () => {
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const isLoggedIn = Boolean(cookies?.token) || Boolean(user)

  if (isLoggedIn) {
    return <Navigate to='/' replace />
  }

  return <Outlet />
}

export default AuthRoute