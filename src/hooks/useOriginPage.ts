import { useEffect } from 'react'
import { useLocation } from 'react-router'

export type OriginPage = { href: string; label: string }

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/live': 'Live',
  '/leaderboard': 'Leaderboard',
  '/notifications': 'Notifications',
  '/account-portfolio': 'Portfolio',
  '/account-favorites': 'Favorites',
  '/orders': 'Orders',
}

// Mirrors the header's /browse links.
const BROWSE_LABELS: Record<string, string> = {
  '': 'Events',
  trending: 'Breaking',
  closing_soon: 'Upcoming',
}

const titleCase = (slug: string) =>
  decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

const labelFor = (pathname: string, search: string): string | null => {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname]
  if (pathname === '/browse') {
    const sort = new URLSearchParams(search).get('sort') ?? ''
    return BROWSE_LABELS[sort] ?? 'Events'
  }
  const category = pathname.match(/^\/category\/([^/]+)/)
  if (category) return titleCase(category[1])
  if (pathname.startsWith('/events/')) return 'Event'
  return null
}

// Module-level so it outlives the market page's mount: the last listing page
// visited before opening a market. Market pages never overwrite it, so hopping
// between related markets still leads back to where the user started.
let origin: OriginPage | null = null

/** Mounted once in the app layout to record the page each market was opened from. */
export const useTrackOriginPage = () => {
  const { pathname, search } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/markets/')) return
    const label = labelFor(pathname, search)
    origin = label ? { href: `${pathname}${search}`, label } : null
  }, [pathname, search])
}

/** Where the market page's breadcrumb leads; falls back to the home lobby. */
export const getOriginPage = (): OriginPage =>
  origin ?? { href: '/', label: 'Markets' }
