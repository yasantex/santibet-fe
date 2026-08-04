export type BaseApiResponse = {
  status: string
  message: string
}

export interface UserData {
  uuid: string
  first_name: string
  last_name: string
  email: string
  mobile: string
  email_verified: boolean
  security: {
    two_factor_enabled: number
    two_factor_type: string | null
    transaction_pin_set: boolean
  }
  last_login: string
  prev_login: string | null
  created_at: string
  updated_at: string
  two_fa_enabled: boolean
  user_uuid: string
  pre_auth_token: string
}

export type LoginResponse = BaseApiResponse & {
  data: UserData & {
    authorization: {
      type: string
      token: string
    }
  }
}
