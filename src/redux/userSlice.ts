import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

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

export interface UserState {
  user: UserData | null
  twoFaToken: string | null
}
const initialState: UserState = {
  user: null,
  twoFaToken: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload
    },
    clearUser: (state) => {
      state.user = null
    },
    setTwoFaToken: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload
    },
    clearTwoFaToken: (state) => {
      state.user = null
    },
    setEnableTwoFA: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.security.two_factor_enabled = action.payload
      }
    },
  },
})

// Actions
export const {
  setUser,
  clearUser,
  setTwoFaToken,
  clearTwoFaToken,
  setEnableTwoFA,
} = userSlice.actions

export default userSlice.reducer
