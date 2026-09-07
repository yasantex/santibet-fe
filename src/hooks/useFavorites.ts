import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../utils/hooks'
import { removeFavorite, toggleFavorite } from '../redux/favoritesSlice'
import { showSuccessToast } from '../utils/toastUtils'
import type { UiMarket } from '../types/market.types'

export const useFavorites = () => {
  const items = useAppSelector((state) => state.favorites.items)
  const dispatch = useAppDispatch()

  const isFavorite = useCallback(
    (id: string) => items.some((m) => m.id === id),
    [items],
  )

  const toggle = useCallback(
    (market: UiMarket) => {
      const wasSaved = items.some((m) => m.id === market.id)
      dispatch(toggleFavorite(market))
      showSuccessToast(
        wasSaved ? 'Removed from favorites' : 'Added to favorites',
      )
    },
    [items, dispatch],
  )

  const remove = useCallback(
    (id: string) => {
      dispatch(removeFavorite(id))
      showSuccessToast('Removed from favorites')
    },
    [dispatch],
  )

  return { favorites: items, isFavorite, toggle, remove }
}
