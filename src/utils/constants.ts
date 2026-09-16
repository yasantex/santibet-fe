import {
  Award01FreeIcons,
  BankIcon,
  Bitcoin01Icon,
  Bookmark02Icon,
  ComputerIcon,
  CreditCardIcon,
  GiftFreeIcons,
  HelpSquareFreeIcons,
  Invoice01Icon,
  Moon02Icon,
  MoneyReceiveFlow02Icon,
  Notification03Icon,
  Settings02Icon,
  Sun01Icon,
  Wallet01FreeIcons,
  Wallet03FreeIcons,
} from '@hugeicons/core-free-icons'
import type { NavigateFunction } from 'react-router'

export type NavLink = {
  label: string
  href: string
  /** Category the backend doesn't serve yet — always shown regardless of
   *  `useAvailableCategories`, unlike real category links which are hidden
   *  once loaded if they have zero open markets. Drop this flag once the
   *  backend actually returns markets for the category. */
  isMock?: boolean
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

/**
 * Order and labels follow the GLOBAL row of the platform's taxonomy doc:
 * Home | Trending | Sports | Finance | Crypto | Economics | Politics |
 * Tech & AI | Culture | Climate | Science | Entertainment | Weather | More.
 * Esports moved out of this list — the doc lists it as a Sports
 * subcategory (see `mockSportsTree`), not a sibling domain.
 * Categories not in the doc's primary row (Business, Geopolitics, General)
 * live in `moreNavLinks` instead, under a "More" dropdown.
 * Pro", they're distinct products/states rather than market categories, so
 * they're surfaced in the header's top row instead; see `Header.tsx`.
 */
export const primaryNavLinks: NavLink[] = [
  { label: 'Trending', href: '/' },
  { label: 'Sports', href: '/category/Sports' },
  { label: 'Finance', href: '/category/Finance', isMock: true },
  { label: 'Crypto', href: '/category/Crypto' },
  { label: 'Economics', href: '/category/Economics', isMock: true },
  { label: 'Politics', href: '/category/Politics' },
  { label: 'Tech & AI', href: '/category/Tech' },
  { label: 'Culture', href: '/category/Culture', isMock: true },
  { label: 'Climate', href: '/category/Climate', isMock: true },
  { label: 'Science', href: '/category/Science', isMock: true },
  { label: 'Entertainment', href: '/category/Entertainment' },
  { label: 'Weather', href: '/category/Weather', isMock: true },
]

/** Overflow categories shown in the nav's "More" dropdown — real categories
 *  the doc's GLOBAL row doesn't call out by name, plus the catch-all. */
export const moreNavLinks: NavLink[] = [
  { label: 'Business', href: '/category/Business' },
  { label: 'Geopolitics', href: '/category/Geopolitics', isMock: true },
  { label: 'General', href: '/category/General' },
]

/**
 * Display label for a category route slug (e.g. "Tech" -> "Tech & AI"),
 * looked up from the nav links so the category-page heading matches
 * whatever the nav pill says. Falls back to the raw slug for categories
 * reachable only by direct URL (not in either nav list).
 */
export const categoryLabel = (slug: string): string =>
  [...primaryNavLinks, ...moreNavLinks].find(
    (link) => link.href.toLowerCase() === `/category/${slug}`.toLowerCase(),
  )?.label ?? slug

export type CategoryTopic = {
  name: string
  /**
   * Fixed display count for a topic with no backing market data yet (the
   * backend doesn't tag markets by topic, or doesn't have any for this one
   * at all) — shown instead of the live per-market count so the sidebar
   * looks populated ahead of real data. Delete this field (or the whole
   * entry) once the API returns markets that actually match the topic; the
   * count then falls back to the honest live count automatically.
   */
  mockCount?: number
}

/**
 * Sub-topics shown in the category-page sidebar (e.g. "Elections",
 * "Legislation" under Politics). Every GLOBAL-row domain's list here is
 * taken verbatim from the "Example subcategories" column of the platform's
 * taxonomy doc, so the sidebar structure matches it domain-for-domain. The
 * backend doesn't expose per-market tags yet, so this is a curated
 * placeholder list — swap for real tag data once the API returns it.
 * Counts shown against topics without `mockCount` are computed live from
 * loaded market titles, so they stay honest even though the topic list
 * itself is mocked.
 */
export const categoryTopics: Record<string, CategoryTopic[]> = {
  Politics: [
    { name: 'Elections', mockCount: 312 },
    { name: 'Government', mockCount: 58 },
    { name: 'Legislation', mockCount: 27 },
    { name: 'Courts', mockCount: 19 },
    { name: 'Parties', mockCount: 41 },
    { name: 'Leaders', mockCount: 64 },
  ],
  // Sports doesn't use this list — its sidebar is the data-driven sport →
  // league tree in CategoryPage (`sportsGroups` + `mockSportsTree`) instead.
  // `mockCount` acts as a floor here (real count still grows past it via
  // `Math.max`), since these generic doc labels rarely substring-match a
  // market title the way specific coin names ("Bitcoin") used to.
  Crypto: [
    { name: 'Assets', mockCount: 64 },
    { name: 'DeFi', mockCount: 22 },
    { name: 'NFTs', mockCount: 11 },
    { name: 'Protocols', mockCount: 18 },
    { name: 'Stablecoins', mockCount: 9 },
  ],
  // Not in the doc's 11-domain table — a real backend category, so its
  // topic list stays as its own curated set rather than following the doc.
  Business: [
    { name: 'Earnings' },
    { name: 'IPO' },
    { name: 'Mergers' },
    { name: 'Stocks' },
    { name: 'Startups' },
    { name: 'Layoffs' },
  ],
  Finance: [
    { name: 'Equities', mockCount: 151 },
    { name: 'Commodities', mockCount: 21 },
    { name: 'Forex', mockCount: 34 },
    { name: 'Rates', mockCount: 36 },
    { name: 'Bonds', mockCount: 19 },
  ],
  Entertainment: [
    { name: 'Film', mockCount: 26 },
    { name: 'TV', mockCount: 18 },
    { name: 'Music', mockCount: 14 },
    { name: 'Gaming', mockCount: 21 },
    { name: 'Awards', mockCount: 33 },
    { name: 'Celebrity', mockCount: 17 },
  ],
  Tech: [
    { name: 'AI', mockCount: 47 },
    { name: 'Software', mockCount: 19 },
    { name: 'Hardware', mockCount: 12 },
    { name: 'Cybersecurity', mockCount: 15 },
    { name: 'Robotics', mockCount: 9 },
    { name: 'Startups', mockCount: 23 },
  ],
  // Mock categories below — no backend data at all yet, so every topic
  // carries a fixed mockCount. Delete each block once the category ships.
  Geopolitics: [
    { name: 'Russia-Ukraine War', mockCount: 58 },
    { name: 'Middle East', mockCount: 47 },
    { name: 'China-Taiwan', mockCount: 22 },
    { name: 'NATO', mockCount: 15 },
    { name: 'Sanctions', mockCount: 12 },
  ],
  Culture: [
    { name: 'Music', mockCount: 22 },
    { name: 'Movies', mockCount: 30 },
    { name: 'TV', mockCount: 18 },
    { name: 'Books', mockCount: 14 },
    { name: 'Art', mockCount: 11 },
    { name: 'Internet Culture', mockCount: 26 },
  ],
  Economics: [
    { name: 'Inflation', mockCount: 41 },
    { name: 'Employment', mockCount: 27 },
    { name: 'GDP', mockCount: 16 },
    { name: 'Rates', mockCount: 33 },
    { name: 'Trade', mockCount: 19 },
    { name: 'Housing', mockCount: 14 },
  ],
  Weather: [
    { name: 'Temperature', mockCount: 12 },
    { name: 'Rain', mockCount: 9 },
    { name: 'Storms', mockCount: 7 },
    { name: 'Wind', mockCount: 5 },
    { name: 'Severe Weather', mockCount: 8 },
  ],
  Climate: [
    { name: 'Climate Change', mockCount: 24 },
    { name: 'Energy', mockCount: 31 },
    { name: 'Environment', mockCount: 17 },
    { name: 'Natural Events', mockCount: 13 },
  ],
  Science: [
    { name: 'Space', mockCount: 28 },
    { name: 'Biology', mockCount: 11 },
    { name: 'Medicine', mockCount: 19 },
    { name: 'Physics', mockCount: 9 },
    { name: 'Chemistry', mockCount: 6 },
    { name: 'Earth Science', mockCount: 8 },
  ],
  General: [{ name: 'Trending' }, { name: 'Featured' }, { name: 'New' }],
}

export type MockLeague = { name: string; count: number }
export type MockSportGroup = { sport: string; leagues: MockLeague[] }

/**
 * Sports leagues shown in the Sports sidebar that the live feed doesn't
 * cover yet — either a whole sport our sports-data provider doesn't carry
 * (NFL, MLB, UFC, College Football), or extra leagues within a sport we do
 * cover (Serie A, MLS, Süper Lig alongside the Premier League/Bundesliga/
 * LaLiga markets that already come through). Merged into the live sport →
 * league tree in CategoryPage; a league here is skipped once a market with
 * a matching sport/league already exists, and the whole entry should be
 * deleted once the backend/API actually returns markets for it.
 */
export const mockSportsTree: MockSportGroup[] = [
  {
    sport: 'Football',
    leagues: [
      { name: 'Premier League', count: 112 },
      { name: 'Serie A', count: 116 },
      { name: 'MLS', count: 233 },
      { name: 'Süper Lig', count: 71 },
    ],
  },
  { sport: 'American Football', leagues: [{ name: 'NFL', count: 500 }] },
  { sport: 'Baseball', leagues: [{ name: 'MLB', count: 326 }] },
  {
    sport: 'College Football',
    leagues: [{ name: 'College Football', count: 141 }],
  },
  { sport: 'MMA', leagues: [{ name: 'UFC', count: 30 }] },
  // Basketball, Tennis, Cricket, Hockey, Golf and Motorsport are named
  // explicitly as Sports subcategories in the taxonomy doc, alongside
  // Football/Baseball/Esports above — added here so the sidebar covers the
  // doc's full list even though the sports-data provider has no markets
  // for them yet.
  { sport: 'Basketball', leagues: [{ name: 'NBA', count: 89 }] },
  { sport: 'Tennis', leagues: [{ name: 'Wimbledon', count: 24 }] },
  { sport: 'Cricket', leagues: [{ name: 'ICC World Cup', count: 17 }] },
  { sport: 'Hockey', leagues: [{ name: 'NHL', count: 45 }] },
  { sport: 'Golf', leagues: [{ name: 'PGA Tour', count: 12 }] },
  { sport: 'Motorsport', leagues: [{ name: 'Formula 1', count: 20 }] },
  {
    sport: 'Esports',
    leagues: [
      { name: 'League of Legends', count: 42 },
      { name: 'CS2', count: 35 },
      { name: 'Dota 2', count: 21 },
      { name: 'Valorant', count: 18 },
      { name: 'Overwatch', count: 9 },
    ],
  },
]

export type DepositOption = {
  id: string
  label: string
  icon: 'google-pay' | 'card' | 'crypto'
  mostPopular?: boolean
}

export type WithdrawalOption = {
  id: string
  heading: string
  label: string
  icon: any
  mostPopular?: boolean
}

export const withdrawalOptions: WithdrawalOption[] = [
  {
    id: 'bank',
    heading: 'Bank Transfer',
    label: '1-2 business days · No limit',
    icon: BankIcon,
    mostPopular: true,
  },
  {
    id: 'card',
    heading: 'Card',
    label: 'Instant · ₦500K limit',
    icon: CreditCardIcon,
  },
  {
    id: 'crypto',
    heading: 'Crypto',
    label: 'Instant · USDT, USDC',
    icon: Bitcoin01Icon,
  },
]
//
export type MarketCategory =
  | 'All'
  | 'Politics'
  | 'Sports'
  | 'Crypto'
  | 'Entertainment'
  | 'Tech'

import type { IconSvgElement } from '@hugeicons/react'
import type { StatusConfig } from '../types/types'

export type ProfileAction = {
  id: string
  label: string
  icon: IconSvgElement
  path: string
  action: (navigate: NavigateFunction, close: () => void) => void
}

export const accountMenuItems: ProfileAction[] = [
  {
    id: 'profile-settings',
    label: 'Settings',
    icon: Settings02Icon,
    path: '/account-profile',
    action: (navigate, close) => {
      navigate('/account-profile')
      close()
    },
  },

  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet01FreeIcons,
    path: '/account-wallet',
    action: (navigate, close) => {
      navigate('/account-wallet')
      close()
    },
  },

  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Wallet03FreeIcons,
    path: '/account-portfolio',
    action: (navigate, close) => {
      navigate('/account-portfolio')
      close()
    },
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: Bookmark02Icon,
    path: '/account-favorites',
    action: (navigate, close) => {
      navigate('/account-favorites')
      close()
    },
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: Invoice01Icon,
    path: '/orders',
    action: (navigate, close) => {
      navigate('/orders')
      close()
    },
  },

  {
    id: 'rewards',
    label: 'Rewards',
    icon: GiftFreeIcons,
    path: '/rewards',
    action: (navigate, close) => {
      navigate('/rewards')
      close()
    },
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Notification03Icon,
    path: '/notifications',
    action: (navigate, close) => {
      navigate('/notifications')
      close()
    },
  },
  {
    id: 'refer-earn',
    label: 'Refer & Earn',
    icon: MoneyReceiveFlow02Icon,
    path: '/refer-earn',
    action: (navigate, close) => {
      navigate('/refer-earn')
      close()
    },
  },
]

export const generalMenuItems: ProfileAction[] = [
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Award01FreeIcons,
    path: '/leaderboard',
    action: (navigate, close) => {
      navigate('/leaderboard')
      close()
    },
  },

  {
    id: 'help-center',
    label: 'Help Center',
    icon: HelpSquareFreeIcons,
    path: '/help-center',
    action: (navigate, close) => {
      navigate('/help-center')
      close()
    },
  },
]

export type AppearanceOption = 'system' | 'light' | 'dark'

export const appearanceOptions: {
  value: AppearanceOption
  label: string
  icon: IconSvgElement
}[] = [
  { value: 'light', label: 'Light', icon: Sun01Icon },
  { value: 'dark', label: 'Dark', icon: Moon02Icon },
  { value: 'system', label: 'System', icon: ComputerIcon },
]

export const currencySymbols: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
}
// TODO: Check styling for these classes
export const statusBadgeClass: Record<StatusConfig['color'], string> = {
  green: 'bg-success-bg text-success ',
  red: 'bg-error-bg text-error',
  orange: 'bg-warning/20 text-warning',
  plain: 'bg-hover/50 text-neutral-10',
}
