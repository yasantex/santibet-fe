import { useLocation } from 'react-router'
import Seo from './Seo'
import { NOINDEX_PREFIXES, findStaticRoute } from './site'

/**
 * Tags for the fixed routes in `STATIC_ROUTES`, plus `noindex` for private
 * prefixes. Renders nothing elsewhere: dynamic pages (markets, events,
 * categories, admin pages) and the 404 render their own `<Seo>`.
 */
const RouteSeo = () => {
  const { pathname } = useLocation()
  const route = findStaticRoute(pathname)

  if (route) {
    return (
      <Seo
        title={route.path === '/' ? undefined : route.title}
        description={route.description}
        path={route.path}
        noindex={route.noindex}
      />
    )
  }
  if (NOINDEX_PREFIXES.some((p) => pathname.startsWith(p))) {
    return <Seo noindex />
  }
  return null
}

export default RouteSeo
