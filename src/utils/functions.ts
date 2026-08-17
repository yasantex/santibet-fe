import type { MarketCardVM, OutcomeVM, RawMarket } from '../types/market.types'
import type { FormatDateTimeOptions } from '../types/types'
import { currencySymbols } from './constants'

export function getInitials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export const formatNaira = (amount: number) => {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-NG', {
    minimumFractionDigits: abs % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  const sign = amount < 0 ? '-' : amount > 0 ? '+' : ''
  return `${sign}₦${formatted}`
}

export const formatCurrency = (amount: string, currency?: string) => {
  const numericAmount = parseFloat(amount) || 0
  const currencyCode = (currency || 'NGN').toUpperCase()
  const symbol = currencySymbols[currencyCode] ?? currencyCode

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)

  return `${symbol}${formattedNumber}`
}

const formatVolume = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

export const mapMarketToCard = (market: RawMarket): MarketCardVM => {
  const outcomes = market.outcomes.map((outcome) => ({
    id: outcome.id,
    label: outcome.label,
    percent: Math.round((outcome.price ?? 0) * 100),
  }))

  const percentageFor = (label: string) =>
    outcomes.find((outcome) => outcome.label.toLowerCase() === label)?.percent ?? 0

  return {
    id: market.id,
    question: market.title,
    outcomes,
    yesPercent: percentageFor('yes'),
    noPercent: percentageFor('no'),
    volume: formatVolume(market.volume),
    openTime: market.openTime,
    closeTime: market.closeTime,
  }
}

export const isSentimentMarket = (outcomes: OutcomeVM[]): boolean =>
  outcomes.length === 2 &&
  outcomes.every((o) => ['up', 'down'].includes(o.label.toLowerCase()))

// picks colour role per position: works for 2-way (blue/orange) and 3-way (blue/gray/red draw)
const outcomeColorForIndex = (index: number, total: number): string => {
  if (total === 3)
    return ['brand-blue', 'brand-gray', 'brand-red'][index] ?? 'brand-gray'
  return ['brand-blue', 'brand-orange'][index] ?? 'brand-gray'
}

export { outcomeColorForIndex }

export function formatDate(
  date: string | number | Date,
  {
    dateStyle = 'medium',
    timeStyle = 'short',
    locale,
  }: FormatDateTimeOptions = {},
): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) return 'Invalid date'

  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(d)
}
