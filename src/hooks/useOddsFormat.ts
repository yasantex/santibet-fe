import { useCallback, useSyncExternalStore } from 'react'
import {
  chanceLabel as formatChance,
  outcomePriceLabel,
  type OddsFormat,
} from '../utils/marketDisplay'

const STORAGE_KEY = 'oddsFormat'

const read = (): OddsFormat => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'odds' ? 'odds' : 'percent'
  } catch {
    return 'percent'
  }
}

// Held in memory and shared across every mounted card, so switching in the
// menu updates them all at once (and other tabs, via the storage event);
// localStorage only persists it.
let current: OddsFormat = read()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const onStorage = (e: StorageEvent) => {
  if (e.key !== STORAGE_KEY) return
  current = read()
  notify()
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

export const useOddsFormat = () => {
  const format = useSyncExternalStore(subscribe, () => current, () => current)

  const setFormat = useCallback((next: OddsFormat) => {
    current = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice lasts until the page reloads.
    }
    notify()
  }, [])

  const priceLabel = useCallback(
    (...[market, outcome]: Parameters<typeof outcomePriceLabel>) =>
      outcomePriceLabel(market, outcome, { format }),
    [format],
  )

  // An outcome's chance ("58%") or, in decimal mode, its odds ("×1.73").
  const chanceLabel = useCallback(
    (outcome: Parameters<typeof formatChance>[0]) =>
      formatChance(outcome, format),
    [format],
  )

  return { format, setFormat, priceLabel, chanceLabel }
}
