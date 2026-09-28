import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useCookies } from 'react-cookie'
import { useAppSelector } from '../utils/hooks'
import { AUTH_REDIRECT_PARAM, getSafeRedirect } from '../utils/authRedirect'

const AuthRoute = () => {
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const [searchParams] = useSearchParams()
  const isLoggedIn = Boolean(cookies?.token) || Boolean(user)

  if (isLoggedIn) {
    const redirectTo = getSafeRedirect(searchParams.get(AUTH_REDIRECT_PARAM))
    return <Navigate to={redirectTo ?? '/'} replace />
  }

  return <Outlet />
}

export default AuthRoute