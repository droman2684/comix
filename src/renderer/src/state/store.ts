import { create } from 'zustand'
import { createNavSlice, type NavSlice } from './slices/navSlice'
import { createLibrarySlice, type LibrarySlice } from './slices/librarySlice'
import { createReadStatusSlice, type ReadStatusSlice } from './slices/readStatusSlice'
import { createReaderSlice, type ReaderSlice } from './slices/readerSlice'
import { createCoversSlice, type CoversSlice } from './slices/coversSlice'
import { createFavoritesSlice, type FavoritesSlice } from './slices/favoritesSlice'

export type AppState = NavSlice &
  LibrarySlice &
  ReadStatusSlice &
  ReaderSlice &
  CoversSlice &
  FavoritesSlice

export const useAppStore = create<AppState>()((...a) => ({
  ...createNavSlice(...a),
  ...createLibrarySlice(...a),
  ...createReadStatusSlice(...a),
  ...createReaderSlice(...a),
  ...createCoversSlice(...a),
  ...createFavoritesSlice(...a)
}))
