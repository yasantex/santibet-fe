import { useCookies } from 'react-cookie'

const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 7,
}

type TokenPayload =
  | string
  | {
      accessToken: string
      refreshToken?: string
    }

const useUpdateToken = () => {
  const [, setCookie] = useCookies(['token', 'sb_rt'], { doNotParse: true })

  const setAppCookie = (key: 'token' | 'sb_rt', value: string) => {
    setCookie(key, value, COOKIE_OPTIONS)
  }

  return async (data: TokenPayload) => {
    if (!data) return

    const payload =
      typeof data === 'string'
        ? { accessToken: data, refreshToken: undefined }
        : data

    if (payload.accessToken) {
      setAppCookie('token', payload.accessToken)
    }

    if (payload.refreshToken) {
      setAppCookie('sb_rt', payload.refreshToken)
    }
  }
}

export default useUpdateToken
