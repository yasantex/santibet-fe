import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserData } from '../types/types'

export interface UserState {
  user: UserData | null
  signupType: 'email' | 'phone' | null
}
const initialState: UserState = {
  user: null,
  signupType: null,
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
      state.signupType = null
    },

    setEnableTwoFA: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.mfaEnabled = action.payload
      }
    },
    setSignupType: (state, action: PayloadAction<'email' | 'phone'>) => {
      state.signupType = action.payload
    },
    clearSignupType: (state) => {
      state.signupType = null
    },
  },
})

// Actions
export const {
  setUser,
  clearUser,
  setEnableTwoFA,
  setSignupType,
  clearSignupType,
} = userSlice.actions

export default userSlice.reducer
