import { useCookies } from 'react-cookie'
import type { LoginResponse } from '../types/types'

const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: true,
  maxAge: 60 * 60 * 24 * 7,
}

const useUpdateToken = () => {
  const [, setCookie] = useCookies(['token'], { doNotParse: true })

  const setAppCookie = (key: 'token', value: string) => {
    setCookie(key, value, COOKIE_OPTIONS)
  }

  return async (data: string | LoginResponse) => {
    const token =
      typeof data === 'string' ? data : data?.data?.authorization?.token

    if (!token) return
    setAppCookie('token', token)
  }
}

export default useUpdateToken
