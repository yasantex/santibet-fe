import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { clearUser, setUser } from './userSlice'

/**
 * Account-level restrictions reported by the server. A suspended account can
 * still sign in and read everything, but every write returns
 * `403 ACCOUNT_SUSPENDED`. The flag is learned reactively from that 403 (see
 * the apiClient interceptor), so this slice is deliberately NOT persisted —
 * a reload re-learns it, and an account that gets unsuspended is never left
 * stuck in read-only mode by stale local state.
 */
export interface AccountStatusState {
  suspended: boolean
}

const initialState: AccountStatusState = {
  suspended: false,
}

const accountStatusSlice = createSlice({
  name: 'accountStatus',
  initialState,
  reducers: {
    setSuspended: (state, action: PayloadAction<boolean>) => {
      state.suspended = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearUser, () => initialState)
      // Forward-compatible: once `/auth/me` (and the login response) expose a
      // suspended/status field, the read-only state renders on first paint.
      .addCase(setUser, (state, action) => {
        const { suspended, status } = action.payload ?? {}
        if (typeof suspended === 'boolean') state.suspended = suspended
        else if (typeof status === 'string')
          state.suspended = status.toLowerCase() === 'suspended'
      })
  },
})

export const { setSuspended } = accountStatusSlice.actions

export default accountStatusSlice.reducer
