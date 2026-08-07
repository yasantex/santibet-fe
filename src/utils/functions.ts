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
