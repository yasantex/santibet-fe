export type NavLink = {
  label: string
  href: string
}

export type CategoryLink = {
  label: string
  href: string
  isTrending?: boolean
}

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  href: string
  iconLabel: string
  iconBg: string
  iconTextColor?: string
  percentage: number
  change: number | null
  direction: 'up' | 'down' | 'neutral'
}

export const primaryNavLinks: NavLink[] = [
  { label: 'Trending', href: '/trending' },
  { label: 'Politics', href: '/politics' },
  { label: 'Sports', href: '/sports' },
  { label: 'Crypto', href: '/crypto' },
  { label: 'Entertainments', href: '/entertainments' },
]

export const moreNavLinks: NavLink[] = [
  { label: 'Mentions', href: '/mentions' },
  { label: 'Finance', href: '/finance' },
  { label: 'Tech & Science', href: '/tech-and-science' },
  { label: 'Help center', href: '/help' },
]


export const mockSearchResults: SearchResult[] = [
  {
    id: 'fritz-vs-jodar',
    title: 'Fritz vs Jodar',
    subtitle: 'Taylor Fritz',
    href: '/markets/fritz-vs-jodar',
    iconLabel: 'ATP',
    iconBg: '#0B1D3A',
    iconTextColor: '#FFFFFF',
    percentage: 63,
    change: 5,
    direction: 'up',
  },
  {
    id: 'mlb-cba',
    title: 'Pro Baseball new CBA agreement before Dec 2, 2026',
    subtitle: 'Yes',
    href: '/markets/mlb-cba',
    iconLabel: '⚾',
    iconBg: '#1D4ED8',
    percentage: 8,
    change: 5,
    direction: 'up',
  },
  {
    id: 'steph-curry-next-team',
    title: "Steph Curry's Next Team",
    subtitle: 'GS Warriors',
    href: '/markets/steph-curry-next-team',
    iconLabel: '🏀',
    iconBg: '#1D4ED8',
    percentage: 86,
    change: 4,
    direction: 'down',
  },
  {
    id: 'gov-shutdown-oct-2026',
    title: 'Government shutdown on Oct 1, 2026?',
    subtitle: 'Yes',
    href: '/markets/gov-shutdown-oct-2026',
    iconLabel: '🏛️',
    iconBg: '#E5E7EB',
    percentage: 16,
    change: 20,
    direction: 'down',
  },
  {
    id: 'spiderman-rt-score',
    title: 'Spider-Man: Brand New Day: Rotten Tomatoes score',
    subtitle: 'Above 89',
    href: '/markets/spiderman-rt-score',
    iconLabel: 'RT',
    iconBg: '#DC2626',
    iconTextColor: '#FFFFFF',
    percentage: 95,
    change: 10,
    direction: 'up',
  },
  {
    id: 'todd-blanche-confirmed',
    title: 'When will Todd Blanche be confirmed?',
    subtitle: 'Before Sep 1, 2026',
    href: '/markets/todd-blanche-confirmed',
    iconLabel: '🇺🇸',
    iconBg: '#E5E7EB',
    percentage: 76,
    change: 57,
    direction: 'up',
  },
  {
    id: 'fed-decision-sep-2026',
    title: 'Fed decision in Sep 2026?',
    subtitle: 'Hike 25bps',
    href: '/markets/fed-decision-sep-2026',
    iconLabel: '🏦',
    iconBg: '#2563EB',
    percentage: 56,
    change: null,
    direction: 'neutral',
  },
]

export type DepositOption = {
  id: string
  label: string
  icon: 'google-pay' | 'card' | 'crypto'
  mostPopular?: boolean
}

export const depositOptions: DepositOption[] = [
  { id: 'card', label: 'Card', icon: 'card', mostPopular: true },
  { id: 'google-pay', label: 'Google Pay', icon: 'google-pay' },
  { id: 'crypto', label: 'Crypto', icon: 'crypto' },
]
// 
export type MarketCategory =
  | 'All'
  | 'Politics'
  | 'Sports'
  | 'Crypto'
  | 'Entertainment'
  | 'Tech'