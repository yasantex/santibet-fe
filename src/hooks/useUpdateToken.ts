import { useCookies } from 'react-cookie'

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

  return async (data: string) => {
    const token = data

    if (!token) return
    setAppCookie('token', token)
  }
}

export default useUpdateToken
