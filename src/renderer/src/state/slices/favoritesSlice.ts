import type { StateCreator } from 'zustand'
import type { Favorites } from '@shared/types'
import type { AppState } from '../store'

export interface FavoritesSlice {
  favorites: Favorites
  hydrateFavorites: (favorites: Favorites) => void
  toggleFavorite: (seriesName: string) => void
}

export const createFavoritesSlice: StateCreator<AppState, [], [], FavoritesSlice> = (
  set,
  get
) => ({
  favorites: {},

  hydrateFavorites: (favorites) => set({ favorites }),

  toggleFavorite: (seriesName) => {
    const current = get().favorites
    const next = { ...current }
    if (next[seriesName]) delete next[seriesName]
    else next[seriesName] = true
    set({ favorites: next })
    window.api.state.toggleFavorite(seriesName)
  }
})
