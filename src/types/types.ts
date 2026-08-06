export type BaseApiResponse = {
  code: string
  message: string
  statusCode: number
  error: string
}

export interface UserData {
  id: string
  email: string
  message: string
  phone: string | null
  name: string | null
  avatarUrl: string | null
  emailVerified: boolean
  phoneVerified: boolean
  hasPassword: boolean
  createdAt: string
  preAuthToken: string
  twoFaEnabled: boolean
  security: {
    two_factor_enabled: boolean
  }
}

export type AuthResponse = {
  user: UserData
  accessToken: string
  expiresIn: number
  refreshToken?: string
}
