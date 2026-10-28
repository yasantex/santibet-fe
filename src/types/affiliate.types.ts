// Player-app side of the Partner (affiliate) Programme.
// See docs/API_SPECS_player_app_affiliates.md.

/** `POST /affiliate/track/click` body. */
export interface TrackClickPayload {
  code: string
  landingUrl: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

/** `POST /affiliate/track/click` response. `valid: false` → store nothing. */
export interface TrackClickResponse {
  valid: boolean
  code?: string | null
  cookieDays?: number | null
}

/** `POST /affiliate/agent/customers/confirm` body. */
export interface AgentSignupConfirmPayload {
  phone: string
  code: string
  password: string
}

export type AgentSignupErrorCode =
  | 'AGENT_CODE_INVALID'
  | 'AGENT_CODE_EXPIRED'
  | 'AGENT_CODE_ATTEMPTS'
  | 'WEAK_PASSWORD'
  | 'PHONE_TAKEN'
