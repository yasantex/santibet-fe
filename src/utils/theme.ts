export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

export const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const getStoredPreference = (): ThemePreference => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export const resolveTheme = (pref: ThemePreference): 'light' | 'dark' =>
  pref === 'system' ? getSystemTheme() : pref

export const applyTheme = (resolved: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}