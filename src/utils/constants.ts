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
  { label: 'Live', href: '/live' },
  { label: 'Trending', href: '/' },
  { label: 'Politics', href: '/category/Politics' },
  { label: 'Sports', href: '/category/Sports' },
  { label: 'Crypto', href: '/category/Crypto' },
  { label: 'Business', href: '/category/Business' },
  { label: 'Entertainment', href: '/category/Entertainment' },
  { label: 'Tech', href: '/category/Tech' },
  { label: 'General', href: '/category/General' },
  // These don't have live markets behind them yet — added ahead of the
  // backend catalogue so the header already reads like the target design.
  { label: 'Esports', href: '/category/Esports' },
  { label: 'Finance', href: '/category/Finance' },
  { label: 'Geopolitics', href: '/category/Geopolitics' },
  { label: 'Culture', href: '/category/Culture' },
  { label: 'Economy', href: '/category/Economy' },
  { label: 'Weather', href: '/category/Weather' },
  { label: 'Elections', href: '/category/Elections' },
  { label: 'Art', href: '/category/Art' },
]

/**
 * Sub-topics shown in the category-page sidebar (e.g. "Trump", "Midterms"
 * under Politics). The backend doesn't expose per-market tags yet, so this
 * is a curated placeholder list per category — swap for real tag data once
 * the API returns it. Counts shown against these are computed live from
 * loaded market titles, so they stay honest even though the topic list
 * itself is mocked.
 */
export const categoryTopics: Record<string, string[]> = {
  Politics: [
    'Trump',
    'Midterms',
    'Congress',
    'Senate',
    'White House',
    'Elections',
    'Courts',
    'Primaries',
  ],
  Sports: [
    'Football',
    'Basketball',
    'Baseball',
    'Soccer',
    'Tennis',
    'Boxing',
    'MMA',
    'Olympics',
  ],
  Crypto: [
    'Bitcoin',
    'Ethereum',
    'Solana',
    'Altcoins',
    'ETF',
    'Regulation',
    'DeFi',
    'NFT',
  ],
  Business: ['Earnings', 'IPO', 'Mergers', 'Stocks', 'Startups', 'Layoffs'],
  Entertainment: ['Movies', 'Music', 'Awards', 'TV', 'Celebrity', 'Streaming'],
  Tech: ['AI', 'Apple', 'Google', 'Meta', 'Space', 'Gadgets'],
  General: ['Trending', 'Featured', 'New'],
  Esports: ['League of Legends', 'CS2', 'Valorant', 'Dota 2', 'Overwatch'],
  Finance: ['Fed Rates', 'Inflation', 'Recession', 'Markets', 'Banks'],
  Geopolitics: ['Russia', 'China', 'Middle East', 'Ukraine', 'Trade War'],
  Culture: ['Internet', 'Viral', 'Social Media', 'Fashion'],
  Economy: ['GDP', 'Jobs', 'Inflation', 'Housing', 'Trade'],
  Weather: ['Hurricanes', 'Temperature', 'Storms', 'Climate'],
  Elections: ['Presidential', 'Senate', 'Governor', 'Midterms'],
  Art: ['Auctions', 'NFT Art', 'Exhibitions'],
}

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
