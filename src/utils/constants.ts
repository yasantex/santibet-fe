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

export const primaryNavLinks: NavLink[] = [
  { label: 'Trending', href: '/' },
  { label: 'Live', href: '/live' },
  { label: 'Politics', href: '/category/Politics' },
  { label: 'Sports', href: '/category/Sports' },
  { label: 'Crypto', href: '/category/Crypto' },
  { label: 'Esports', href: '/category/Esports', isMock: true },
  { label: 'Business', href: '/category/Business' },
  { label: 'Finance', href: '/category/Finance', isMock: true },
  { label: 'Geopolitics', href: '/category/Geopolitics', isMock: true },
  { label: 'Entertainment', href: '/category/Entertainment' },
  { label: 'Tech', href: '/category/Tech' },
  { label: 'Culture', href: '/category/Culture', isMock: true },
  { label: 'Economy', href: '/category/Economy', isMock: true },
  { label: 'Weather', href: '/category/Weather', isMock: true },
  { label: 'General', href: '/category/General' },
]

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
 * Sub-topics shown in the category-page sidebar (e.g. "Trump", "Midterms"
 * under Politics). The backend doesn't expose per-market tags yet, so this
 * is a curated placeholder list per category — swap for real tag data once
 * the API returns it. Counts shown against topics without `mockCount` are
 * computed live from loaded market titles, so they stay honest even though
 * the topic list itself is mocked.
 */
export const categoryTopics: Record<string, CategoryTopic[]> = {
  Politics: [
    { name: 'Trump' },
    { name: 'Midterms', mockCount: 1200 },
    { name: 'Global Elections', mockCount: 673 },
    { name: 'Congress' },
    { name: 'Senate' },
    { name: 'White House' },
    { name: 'Elections' },
    { name: 'Courts', mockCount: 24 },
    { name: 'Primaries', mockCount: 14 },
    { name: 'Trump Daily', mockCount: 3 },
    { name: 'Russia Election', mockCount: 12 },
    { name: 'UK Elections', mockCount: 1 },
    { name: 'Israel Election', mockCount: 40 },
    { name: 'Sweden Elections', mockCount: 57 },
    { name: 'German Elections', mockCount: 69 },
    { name: 'French Elections', mockCount: 4 },
    { name: 'US Election', mockCount: 666 },
  ],
  Sports: [
    { name: 'Football' },
    { name: 'Basketball' },
    { name: 'Baseball' },
    { name: 'Soccer' },
    { name: 'Tennis' },
    { name: 'Boxing' },
    { name: 'MMA' },
    { name: 'Olympics' },
  ],
  Crypto: [
    { name: 'Bitcoin' },
    { name: 'Ethereum' },
    { name: 'Solana' },
    { name: 'Altcoins' },
    { name: 'ETF' },
    { name: 'Regulation' },
    { name: 'DeFi' },
    { name: 'NFT' },
  ],
  Business: [
    { name: 'Earnings' },
    { name: 'IPO' },
    { name: 'Mergers' },
    { name: 'Stocks' },
    { name: 'Startups' },
    { name: 'Layoffs' },
  ],
  // Mock category — Business already covers earnings/IPO/etc.; Finance
  // mirrors Polymarket's separate markets-trading vertical (rates, indices,
  // forex). Delete once the backend ships a real Finance category.
  Finance: [
    { name: 'Daily', mockCount: 101 },
    { name: 'Weekly', mockCount: 54 },
    { name: 'Monthly', mockCount: 124 },
    { name: 'Stocks', mockCount: 151 },
    { name: 'Earnings', mockCount: 9 },
    { name: 'Indices', mockCount: 18 },
    { name: 'Commodities', mockCount: 21 },
    { name: 'Forex', mockCount: 34 },
    { name: 'Privates', mockCount: 46 },
    { name: 'Acquisitions', mockCount: 11 },
    { name: 'IPOs', mockCount: 46 },
    { name: 'Fed Rates', mockCount: 36 },
  ],
  Entertainment: [
    { name: 'Movies' },
    { name: 'Music' },
    { name: 'Awards' },
    { name: 'TV' },
    { name: 'Celebrity' },
    { name: 'Streaming' },
  ],
  Tech: [
    { name: 'AI' },
    { name: 'Apple' },
    { name: 'Google' },
    { name: 'Meta' },
    { name: 'Space' },
    { name: 'Gadgets' },
  ],
  // Mock categories below — no backend data at all yet, so every topic
  // carries a fixed mockCount. Delete each block once the category ships.
  Esports: [
    { name: 'League of Legends', mockCount: 42 },
    { name: 'CS2', mockCount: 35 },
    { name: 'Dota 2', mockCount: 21 },
    { name: 'Valorant', mockCount: 18 },
    { name: 'Overwatch', mockCount: 9 },
  ],
  Geopolitics: [
    { name: 'Russia-Ukraine War', mockCount: 58 },
    { name: 'Middle East', mockCount: 47 },
    { name: 'China-Taiwan', mockCount: 22 },
    { name: 'NATO', mockCount: 15 },
    { name: 'Sanctions', mockCount: 12 },
  ],
  Culture: [
    { name: 'Awards', mockCount: 30 },
    { name: 'Books', mockCount: 14 },
    { name: 'Fashion', mockCount: 11 },
    { name: 'Internet', mockCount: 26 },
    { name: 'Viral', mockCount: 19 },
  ],
  Economy: [
    { name: 'Inflation', mockCount: 41 },
    { name: 'Jobs Report', mockCount: 27 },
    { name: 'GDP', mockCount: 16 },
    { name: 'Recession', mockCount: 22 },
    { name: 'Interest Rates', mockCount: 33 },
  ],
  Weather: [
    { name: 'Hurricanes', mockCount: 12 },
    { name: 'Temperature Records', mockCount: 9 },
    { name: 'Snowfall', mockCount: 7 },
    { name: 'Wildfires', mockCount: 8 },
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
