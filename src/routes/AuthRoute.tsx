import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useCookies } from 'react-cookie'
import { useAppSelector } from '../utils/hooks'
import { AUTH_REDIRECT_PARAM, getSafeRedirect } from '../utils/authRedirect'

const AuthRoute = () => {
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const [searchParams] = useSearchParams()
  // Both, not either: a saved user whose token has gone must still be able
  // to reach sign-in (Testing Round 1, #1). The session guard restores the
  // token if it can, and this then redirects as before.
  const isLoggedIn = Boolean(cookies?.token) && Boolean(user)

  if (isLoggedIn) {
    const redirectTo = getSafeRedirect(searchParams.get(AUTH_REDIRECT_PARAM))
    return <Navigate to={redirectTo ?? '/'} replace />
  }

  return <Outlet />
}

export default AuthRoute