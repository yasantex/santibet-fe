import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserData } from '../types/types'



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
