import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  getStoredPreference,
  resolveTheme,
  type ThemePreference,
} from '../utils/theme'

export const useTheme = () => {
  const [preference, setPreference] = useState<ThemePreference>(
    getStoredPreference,
  )
  const [resolved, setResolved] = useState(() => resolveTheme(preference))

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  useEffect(() => {
    setResolved(resolveTheme(preference))
  }, [preference])

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (preference === 'system') {
        setResolved(mql.matches ? 'dark' : 'light')
      }
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [preference])

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref)
    if (pref === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', pref)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  return { preference, resolved, isDark: resolved === 'dark', setTheme, toggleTheme }
}