import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  AUTH_REDIRECT_PARAM,
  buildAuthPath,
  isAuthPath,
} from '../utils/authRedirect'

// Navigates to /signin or /signup, remembering where the user came from so
// they're sent back there after authenticating. On an auth page already, the
// existing redirect target is carried over instead.
const useAuthNavigate = () => {
  const navigate = useNavigate()
  const { pathname, search, hash } = useLocation()

  return useCallback(
    (base: '/signin' | '/signup', returnTo?: string) => {
      const target =
        returnTo ??
        (isAuthPath(pathname)
          ? new URLSearchParams(search).get(AUTH_REDIRECT_PARAM)
          : `${pathname}${search}${hash}`)
      navigate(buildAuthPath(base, target))
    },
    [navigate, pathname, search, hash],
  )
}

export default useAuthNavigate
