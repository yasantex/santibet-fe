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
  firstName: string | null
  lastName: string | null
  displayName: string | null
  dateOfBirth: string | null
  avatarUrl: string | null
  phone: string | null
  name: string | null
  emailVerified: boolean
  phoneVerified: boolean
  mfaEnabled: boolean
  hasPassword: boolean
  createdAt: string
  cashBalance?: number
  // Not returned by the API yet — read if/when /auth/me starts exposing it.
  suspended?: boolean
  status?: string
}

export type AuthResponse = {
  user: UserData
  accessToken: string
  challengeId?: string
  mfaRequired: boolean
  expiresIn: number
  refreshToken?: string
}

export type TwoFactorSetupResponse = {
  secret: string
  otpauthUri: string
}
export interface TwoFactorEnableResponse {
  recoveryCodes: string[]
}

export interface StatusConfig {
  label: string
  value: number | boolean | string
  color: 'green' | 'red' | 'orange' | 'plain'
}

export type FormatDateTimeOptions = {
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  locale?: string
}

export type KycStatusResponse = {
  status: string
  legalName: string
  provider: string
  submittedAt: string
  reviewedAt: string
  rejectionReason: string
}
