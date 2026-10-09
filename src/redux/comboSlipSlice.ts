import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ComboLeg } from '../types/combo.types'

/** Hard cap on legs in a single combo. */
export const MAX_COMBO_LEGS = 12

export interface ComboSlipState {
  legs: ComboLeg[]
}

const initialState: ComboSlipState = {
  legs: [],
}

const comboSlipSlice = createSlice({
  name: 'comboSlip',
  initialState,
  reducers: {
    /**
     * Toggle a selection:
     * - same outcome already in the slip → remove it,
     * - a different outcome from the same event → replace it (no correlated
     *   same-game legs),
     * - otherwise → append (up to MAX_COMBO_LEGS).
     */
    toggleLeg: (state, action: PayloadAction<ComboLeg>) => {
      const leg = action.payload
      const sameOutcome = state.legs.findIndex(
        (l) => l.outcomeId === leg.outcomeId,
      )
      if (sameOutcome >= 0) {
        state.legs.splice(sameOutcome, 1)
        return
      }
      const sameEvent = state.legs.findIndex((l) => l.eventId === leg.eventId)
      if (sameEvent >= 0) {
        state.legs[sameEvent] = leg
        return
      }
      if (state.legs.length >= MAX_COMBO_LEGS) return
      state.legs.push(leg)
    },
    removeLeg: (state, action: PayloadAction<string>) => {
      state.legs = state.legs.filter((l) => l.outcomeId !== action.payload)
    },
    clearSlip: (state) => {
      state.legs = []
    },
  },
})

export const { toggleLeg, removeLeg, clearSlip } = comboSlipSlice.actions

export default comboSlipSlice.reducer
