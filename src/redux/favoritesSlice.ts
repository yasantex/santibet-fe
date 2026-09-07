import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UiMarket } from '../types/market.types'

export interface FavoriteMarket extends UiMarket {
  savedAt: number
}

export interface FavoritesState {
  items: FavoriteMarket[]
}

const initialState: FavoritesState = {
  items: [],
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<UiMarket>) => {
      if (state.items.some((m) => m.id === action.payload.id)) return
      state.items.unshift({ ...action.payload, savedAt: Date.now() })
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((m) => m.id !== action.payload)
    },
    toggleFavorite: (state, action: PayloadAction<UiMarket>) => {
      const idx = state.items.findIndex((m) => m.id === action.payload.id)
      if (idx >= 0) {
        state.items.splice(idx, 1)
      } else {
        state.items.unshift({ ...action.payload, savedAt: Date.now() })
      }
    },
  },
})

export const { addFavorite, removeFavorite, toggleFavorite } =
  favoritesSlice.actions

export default favoritesSlice.reducer
