import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'

export type Passkey = {
  id: string
  name: string
  // multiDevice = synced (iCloud Keychain, Google Password Manager)
  deviceType: 'singleDevice' | 'multiDevice'
  backedUp: boolean
  createdAt: string
  lastUsedAt: string | null
}

export type PasskeyListResponse = {
  data: Passkey[]
}

export type PasskeyRegisterOptionsResponse = {
  challengeId: string
  options: PublicKeyCredentialCreationOptionsJSON
}

export type PasskeyRegisterVerifyPayload = {
  challengeId: string
  credential: RegistrationResponseJSON
  name?: string
}

export type PasskeyLoginOptionsResponse = {
  challengeId: string
  options: PublicKeyCredentialRequestOptionsJSON
}

export type PasskeyLoginVerifyPayload = {
  challengeId: string
  credential: AuthenticationResponseJSON
}
