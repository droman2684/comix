import type { StateCreator } from 'zustand'
import type { Series, Issue, ReadStatusEntry, LastRead } from '@shared/types'
import { DEMO_PREFIX, demoIssuePages } from '@renderer/utils/demoData'
import type { AppState } from '../store'

export interface ReaderSlice {
  pages: string[]
  currentPage: number
  doublePageMode: boolean
  currentSeries: Series | null
  currentIssue: Issue | null
  readerLoading: boolean
  openIssue: (series: Series, issue: Issue) => Promise<void>
  closeReader: () => void
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  toggleDoublePage: () => void
  markCurrentRead: () => void
}

export const createReaderSlice: StateCreator<AppState, [], [], ReaderSlice> = (set, get) => ({
  pages: [],
  currentPage: 0,
  doublePageMode: false,
  currentSeries: null,
  currentIssue: null,
  readerLoading: false,

  openIssue: async (series, issue) => {
    set({ readerLoading: true, prevView: get().view })

    let pages: string[]
    try {
      if (issue.key.startsWith(DEMO_PREFIX)) {
        pages = demoIssuePages(series.name, issue, series.color)
      } else {
        const rootPath = get().rootPath
        if (!rootPath) {
          set({ readerLoading: false })
          return
        }
        pages = await window.api.cbz.readPages(rootPath, series.name, issue.name)
      }
    } catch (err) {
      console.error('Failed to open issue:', err)
      window.alert('Error loading issue.')
      set({ readerLoading: false })
      return
    }

    if (pages.length === 0) {
      window.alert('No readable pages found in this issue.')
      set({ readerLoading: false })
      return
    }

    const saved = get().readStatus[issue.key]
    const startPage = saved && !saved.read && saved.page ? saved.page : 0
    const entry: ReadStatusEntry = {
      ...saved,
      page: startPage,
      total: pages.length,
      read: saved?.read ?? false
    }
    const lastRead: LastRead = {
      issueKey: issue.key,
      seriesName: series.name,
      issueName: issue.displayName,
      page: startPage,
      total: pages.length
    }

    set((state) => ({
      view: 'reader',
      currentSeries: series,
      currentIssue: issue,
      pages,
      currentPage: startPage,
      readerLoading: false,
      readStatus: { ...state.readStatus, [issue.key]: entry },
      lastRead
    }))
    window.api.state.saveReadStatus(issue.key, entry)
    window.api.state.saveLastRead(lastRead)

    if (!get().covers[issue.key] && pages[0]) {
      get().setCover(issue.key, pages[0])
    }
  },

  closeReader: () => {
    set((state) => ({ view: state.prevView || 'inbox', pages: [], currentPage: 0 }))
  },

  nextPage: () => {
    const step = get().doublePageMode ? 2 : 1
    get().goToPage(get().currentPage + step)
  },

  prevPage: () => {
    const step = get().doublePageMode ? 2 : 1
    get().goToPage(get().currentPage - step)
  },

  // Clamps to valid range, auto-marks the issue read once the last page (or
  // last spread, in double-page mode) is reached, and persists both the
  // read-status entry and lastRead on every turn.
  goToPage: (n) => {
    const state = get()
    const { pages, currentIssue, currentSeries, doublePageMode, readStatus, lastRead } = state
    if (!currentIssue) return

    const total = pages.length
    const step = doublePageMode ? 2 : 1
    const newPage = Math.max(0, Math.min(n, total - 1))
    const isLast = newPage >= total - step
    const key = currentIssue.key
    const cur = readStatus[key] ?? { read: false, page: 0, total }
    const entry: ReadStatusEntry = { ...cur, page: newPage, total, read: cur.read || isLast }
    const newLastRead: LastRead = lastRead
      ? { ...lastRead, page: newPage }
      : {
          issueKey: key,
          seriesName: currentSeries?.name ?? '',
          issueName: currentIssue.displayName,
          page: newPage,
          total
        }

    set((s) => ({
      currentPage: newPage,
      readStatus: { ...s.readStatus, [key]: entry },
      lastRead: newLastRead
    }))
    window.api.state.saveReadStatus(key, entry)
    window.api.state.saveLastRead(newLastRead)
  },

  toggleDoublePage: () => set((state) => ({ doublePageMode: !state.doublePageMode })),

  markCurrentRead: () => {
    const currentIssue = get().currentIssue
    if (!currentIssue) return
    get().markRead(currentIssue.key)
  }
})
