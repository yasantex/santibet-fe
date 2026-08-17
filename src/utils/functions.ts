import type { FormatDateTimeOptions } from "../types/types"
import { currencySymbols } from "./constants"

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




export function formatDate(
  date: string | number | Date,
  { dateStyle = "medium", timeStyle = "short", locale }: FormatDateTimeOptions = {}
): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(d);
}

/**
 * Market pricing helpers. Outcome `price` is a probability in [0, 1].
 * cents = price * 100 rounded (e.g. 0.63 -> "63¢"), percent = same integer.
 */
export const toCents = (price: number): number =>
  Math.round((Number(price) || 0) * 100)

export const toPercent = (price: number): number => toCents(price)

/**
 * Compact money/number formatting, e.g. 45321 -> "45.3K", 2400000 -> "2.4M".
 */
export const formatCompact = (value: number | string): string => {
  const n = Number(value) || 0
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

/**
 * Human "closes in" timer for a market close time.
 * Returns "Closed", "Closes · 12:34" (mm:ss < 1h),
 * "Closes · 5h 12m" (< 1d) or "Closes · Aug 20" otherwise.
 */
export const formatCloseTimer = (iso?: string | null): string => {
  if (!iso) return ''
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return ''
  const diff = target - Date.now()
  if (diff <= 0) return 'Closed'

  const totalMinutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60) % 24
  const days = Math.floor(totalMinutes / (60 * 24))

  if (days >= 1) {
    return `Closes · ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(target)}`
  }
  if (hours >= 1) return `Closes · ${hours}h ${minutes}m`
  return `Closes · ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}