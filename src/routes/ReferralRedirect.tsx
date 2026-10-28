import { Navigate, useLocation, useParams } from 'react-router'
import { REFERRAL_PARAM } from '../utils/referral'

/**
 * `/r/CODE` is the short form of `/?ref=CODE`. It hands over to the home page
 * with the code (and any utm_* tags) in the query, where the link capture in
 * AppLayout records it — one code path for both link styles.
 */
const ReferralRedirect = () => {
  const { code } = useParams()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  if (code) params.set(REFERRAL_PARAM, code)
  const query = params.toString()
  return <Navigate to={query ? `/?${query}` : '/'} replace />
}

export default ReferralRedirect
