import {
  Award01FreeIcons,
  BankIcon,
  Bitcoin01Icon,
  CreditCardIcon,
  FilesFreeIcons,
  GiftFreeIcons,
  HelpSquareFreeIcons,
  MoneyReceiveFlow02Icon,
  User02FreeIcons,
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
  { label: 'Trending', href: '/browse' },
  { label: 'Sports', href: '/category/Sports' },
  { label: 'Crypto', href: '/category/Crypto' },
  { label: 'Politics', href: '/category/Politics' },
  { label: 'Business', href: '/category/Business' },
]

export const moreNavLinks: NavLink[] = [
  { label: 'Browse all', href: '/browse' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'Help center', href: '/help-center' },
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

export const profileMenuItems: ProfileAction[] = [
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
    path: '/portfolio',
    action: (navigate, close) => {
      navigate('/account-portfolio')
      close()
    },
  },
  {
    id: 'profile-settings',
    label: 'Profile & Settings',
    icon: User02FreeIcons,
    path: '/account-profile',
    action: (navigate, close) => {
      navigate('/account-profile')
      close()
    },
  },
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
    id: 'refer-earn',
    label: 'Refer & Earn',
    icon: MoneyReceiveFlow02Icon,
    path: '/refer-earn',
    action: (navigate, close) => {
      navigate('/refer-earn')
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
  {
    id: 'terms',
    label: 'Terms of Service',
    icon: FilesFreeIcons,
    path: '/terms',
    action: (navigate, close) => {
      navigate('/terms-of-service')
      close()
    },
  },
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
