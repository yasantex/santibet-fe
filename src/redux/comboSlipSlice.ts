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
     * Add a selection, or switch the pick WITHIN a market already on the ticket
     * (same marketId → replace). Does NOT enforce the one-market-per-event rule
     * or the max-legs cap — those are decided in `useComboSlip` so a clear
     * message can be shown; this reducer only ever runs for allowed adds.
     */
    addOrReplaceMarketLeg: (state, action: PayloadAction<ComboLeg>) => {
      const leg = action.payload
      const sameMarket = state.legs.findIndex((l) => l.marketId === leg.marketId)
      if (sameMarket >= 0) {
        state.legs[sameMarket] = leg
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

export const { addOrReplaceMarketLeg, removeLeg, clearSlip } =
  comboSlipSlice.actions

export default comboSlipSlice.reducer
