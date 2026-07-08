import type { StateCreator } from 'zustand'
import type { View, InboxFilter } from '@renderer/types'
import type { LibraryViewMode, IssueViewMode } from '@shared/types'
import type { AppState } from '../store'

export interface NavSlice {
  view: View
  prevView: View
  viewingSeriesName: string | null // series shown in the Series View
  inboxFilter: InboxFilter
  libraryViewMode: LibraryViewMode
  seriesViewMode: IssueViewMode
  goToInbox: () => void
  goToLibrary: () => void
  goToSeries: (seriesName: string) => void
  goToWelcome: () => void
  setInboxFilter: (filter: InboxFilter) => void
  setLibraryViewMode: (mode: LibraryViewMode) => void
  setSeriesViewMode: (mode: IssueViewMode) => void
}

export const createNavSlice: StateCreator<AppState, [], [], NavSlice> = (set, get) => ({
  view: 'welcome',
  prevView: 'welcome',
  viewingSeriesName: null,
  inboxFilter: 'unread',
  libraryViewMode: 'grid',
  seriesViewMode: 'list',

  goToInbox: () => set({ view: 'inbox' }),
  goToLibrary: () => set({ view: 'library' }),
  goToSeries: (seriesName) => {
    set({ view: 'series', viewingSeriesName: seriesName })
    const series = get().library.find((s) => s.name === seriesName)
    if (!series) return

    // A series previously fully imported gets silently re-fetched from the
    // on-disk cover cache (fast, no archive decompression) so the user never
    // has to re-click "Import Cover Art". Otherwise just the first issue's
    // cover loads, matching the Library card's lazy default.
    if (get().importedSeriesNames[seriesName]) {
      get().importSeriesCovers(series)
    } else if (series.issues[0]) {
      get().loadIssueCoverIfNeeded(series, series.issues[0])
    }
  },
  goToWelcome: () => set({ view: 'welcome' }),

  setInboxFilter: (filter) => set({ inboxFilter: filter }),

  setLibraryViewMode: (mode) => {
    set({ libraryViewMode: mode })
    window.api.state.saveLibraryViewMode(mode)
  },

  setSeriesViewMode: (mode) => {
    set({ seriesViewMode: mode })
    window.api.state.saveSeriesViewMode(mode)
  }
})
