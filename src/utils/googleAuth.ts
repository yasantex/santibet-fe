const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_OAUTH_CODE_VERIFIER_KEY = 'santibet_google_auth_code_verifier'
const PKCE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

const generateRandomString = (length = 128) => {
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues)
    .map((value) => PKCE_CHARS[value % PKCE_CHARS.length])
    .join('')
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return await crypto.subtle.digest('SHA-256', data)
}

const base64UrlEncode = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const getGoogleOAuthCodeVerifier = () =>
  typeof window !== 'undefined'
    ? window.localStorage.getItem(GOOGLE_OAUTH_CODE_VERIFIER_KEY)
    : null

export const removeGoogleOAuthCodeVerifier = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(GOOGLE_OAUTH_CODE_VERIFIER_KEY)
  }
}

export const startGoogleOAuth = async (redirectPath?: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in is only available in the browser.')
  }

  const clientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Google client ID is not configured.')
  }

  if (!window.crypto?.subtle) {
    throw new Error('Your browser does not support the required crypto APIs.')
  }

  const codeVerifier = generateRandomString(128)
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier))
  const currentPath = redirectPath ?? window.location.pathname
  const redirectUri = `${window.location.origin}${currentPath}`

  window.localStorage.setItem(GOOGLE_OAUTH_CODE_VERIFIER_KEY, codeVerifier)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`
}
