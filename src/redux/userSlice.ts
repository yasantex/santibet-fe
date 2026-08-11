import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserData } from '../types/types'

export interface UserState {
  user: UserData | null
}
const initialState: UserState = {
  user: null,
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

    setEnableTwoFA: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.mfaEnabled = action.payload
      }
    },
  },
})

// Actions
export const { setUser, clearUser, setEnableTwoFA } = userSlice.actions

export default userSlice.reducer
