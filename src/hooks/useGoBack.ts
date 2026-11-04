import { useLocation, useNavigate } from 'react-router'

/**
 * Go back one step in the app's history, or — when the page was opened
 * directly (a shared link, a new tab) and there's nothing to go back to —
 * to `fallbackHref`, so Back never leaves the site.
 */
export const useGoBack = (fallbackHref = '/') => {
  const navigate = useNavigate()
  const { key } = useLocation()
  // The router gives the first page of a session the key "default".
  return () => (key === 'default' ? navigate(fallbackHref) : navigate(-1))
}
