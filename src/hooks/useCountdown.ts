// hooks/useCountdown.ts
import { useEffect, useState } from 'react'

interface CountdownResult {
  label: 'Starts' | 'Closes' | 'Closed'
  display: string
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return hours > 0
    ? `${hours}h : ${minutes.toString().padStart(2, '0')}m`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const useCountdown = (openTime?: string, closeTime?: string): CountdownResult => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const open = openTime ? new Date(openTime).getTime() : undefined
  const close = closeTime ? new Date(closeTime).getTime() : undefined

  if (open && now < open) return { label: 'Starts', display: formatDuration(open - now) }
  if (close && now < close) return { label: 'Closes', display: formatDuration(close - now) }
  return { label: 'Closed', display: '' }
}