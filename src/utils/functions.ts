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