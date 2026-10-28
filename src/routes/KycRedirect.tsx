import { Navigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { useAppSelector } from '../utils/hooks'
import { KYC_PATH, buildAuthPath } from '../utils/authRedirect'

/**
 * `/kyc` — linked from agents' "finish your KYC" SMS reminders. Opens the KYC
 * tab; a signed-out visitor signs in first and is brought back here.
 */
const KycRedirect = () => {
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const isSignedIn = Boolean(cookies?.token) && Boolean(user)

  return (
    <Navigate
      to={isSignedIn ? KYC_PATH : buildAuthPath('/signin', '/kyc')}
      replace
    />
  )
}

export default KycRedirect
