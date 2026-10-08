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
  // Thumbnail; falls back to the category icon label when missing.
  imageUrl?: string | null
  iconLabel: string
  iconBg: string
  iconTextColor?: string
  // Price columns — global search hits carry no prices, so these are optional.
  percentage?: number
  change?: number | null
  direction?: 'up' | 'down' | 'neutral'
}

export type SearchSection = {
  title: string
  results: SearchResult[]
}

export type CategoryTopic = {
  name: string
  /**
   * Words that place a market in this topic, matched whole-word against the
   * market/event title and subtitle. Defaults to the topic name itself —
   * set this when the label is a grouping ("Stablecoins") rather than a
   * word that shows up in market titles.
   */
  keywords?: string[]
}

/**
 * Sub-topics shown in the category-page sidebar (e.g. "Elections",
 * "Legislation" under Politics). Every GLOBAL-row domain's list here is
 * taken verbatim from the "Example subcategories" column of the platform's
 * taxonomy doc, so the sidebar structure matches it domain-for-domain. The
 * backend doesn't expose per-market tags yet, so this is a curated
 * placeholder list — swap for real tag data once the API returns it.
 * Counts are computed live from loaded market titles, and topics with no
 * matching markets are hidden. Keys are matched case-insensitively against
 * the category slug.
 */
export const categoryTopics: Record<string, CategoryTopic[]> = {
  Politics: [
    { name: 'Elections' },
    { name: 'Government' },
    { name: 'Legislation' },
    { name: 'Courts' },
    { name: 'Parties' },
    { name: 'Leaders' },
  ],
  // Sports doesn't use this list — its sidebar is the data-driven sport →
  // league tree in CategoryPage (`sportsGroups`) instead.
  // Crypto topics are keyword-driven (see `keywords`) since the labels are
  // groupings that never appear in market titles. Topics can overlap (a
  // Hyperliquid airdrop is both DeFi and an Airdrop); empty ones are hidden.
  Crypto: [
    {
      name: 'Assets',
      keywords: [
        'bitcoin',
        'btc',
        'ethereum',
        'eth',
        'litecoin',
        'ltc',
        'solana',
        'xrp',
        'dogecoin',
        'doge',
        'bnb',
        'cardano',
      ],
    },
    {
      name: 'Token launches',
      keywords: ['launch a token', 'token launch', 'tge', 'fdv'],
    },
    { name: 'Airdrops', keywords: ['airdrop'] },
    {
      name: 'DeFi',
      keywords: [
        'defi',
        'dex',
        'hyperliquid',
        'pump.fun',
        'uniswap',
        'aave',
        'felix protocol',
        'ostium',
        'lending',
        'yield',
        'tvl',
      ],
    },
    {
      name: 'Protocols',
      keywords: [
        'protocol',
        'metamask',
        'base',
        'abstract',
        'megaeth',
        'layer 2',
        'l2',
        'mainnet',
      ],
    },
    {
      name: 'Stablecoins',
      keywords: ['stablecoin', 'usdt', 'usdc', 'tether', 'dai', 'cngn'],
    },
    { name: 'NFTs', keywords: ['nft', 'nfts', 'opensea', 'ordinals'] },
    {
      name: 'Exchanges',
      keywords: ['kraken', 'coinbase', 'binance', 'bybit', 'exchange'],
    },
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
    { name: 'Equities' },
    { name: 'Commodities' },
    { name: 'Forex' },
    { name: 'Rates' },
    { name: 'Bonds' },
  ],
  Entertainment: [
    { name: 'Film' },
    { name: 'TV' },
    { name: 'Music' },
    { name: 'Gaming' },
    { name: 'Awards' },
    { name: 'Celebrity' },
  ],
  Tech: [
    { name: 'AI' },
    { name: 'Software' },
    { name: 'Hardware' },
    { name: 'Cybersecurity' },
    { name: 'Robotics' },
    { name: 'Startups' },
  ],
  General: [{ name: 'Trending' }, { name: 'Featured' }, { name: 'New' }],
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

export const ACCOUNT_SUSPENDED_CODE = 'ACCOUNT_SUSPENDED'
export const ACCOUNT_SUSPENDED_MESSAGE =
  "Your account is suspended — you can browse, but you can't make changes right now. Contact support."
export const SUSPENDED_CTA_HINT = 'Disabled while your account is suspended'
