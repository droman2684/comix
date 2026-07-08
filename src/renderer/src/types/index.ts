// UI-only types that never cross the IPC boundary — nav/view state, filters.
// Domain types (Series, Issue, ReadStatus, LastRead) live in @shared/types.

export type View = 'welcome' | 'inbox' | 'library' | 'series' | 'reader'
export type InboxFilter = 'unread' | 'all'
