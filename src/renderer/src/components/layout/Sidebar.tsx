import { useAppStore } from '@renderer/state/store'
import styles from './Sidebar.module.css'

function InboxIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <path d="M2 5h16M2 10h16M2 15h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function LibraryIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="11" height="11" fill={filled ? '#E06B3A' : 'none'}>
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7z"
        stroke={filled ? '#E06B3A' : 'currentColor'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Sidebar(): React.JSX.Element {
  const view = useAppStore((s) => s.view)
  const library = useAppStore((s) => s.library)
  const readStatus = useAppStore((s) => s.readStatus)
  const rootPath = useAppStore((s) => s.rootPath)
  const favorites = useAppStore((s) => s.favorites)
  const viewingSeriesName = useAppStore((s) => s.viewingSeriesName)
  const goToInbox = useAppStore((s) => s.goToInbox)
  const goToLibrary = useAppStore((s) => s.goToLibrary)
  const goToSeries = useAppStore((s) => s.goToSeries)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const pickFolder = useAppStore((s) => s.pickFolder)
  const clearLibrary = useAppStore((s) => s.clearLibrary)

  const totalUnread = library.reduce(
    (sum, ser) => sum + ser.issues.filter((i) => !readStatus[i.key]?.read).length,
    0
  )
  const favoriteSeries = library.filter((ser) => favorites[ser.name])

  const inboxActive = view === 'inbox' || view === 'reader'
  const libraryActive = view === 'library' || view === 'series'

  const handleClearLibrary = (): void => {
    const ok = window.confirm(
      'Clear your library? This removes the current folder, read progress, favorites, and imported cover art from Comics. Your comic files on disk are not affected.'
    )
    if (!ok) return
    clearLibrary()
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoRow}>
        <div className={styles.logoMark}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
            <rect x="3" y="2" width="10" height="14" rx="1.5" fill="white" opacity="0.95" />
            <rect x="4.5" y="5" width="7" height="1.2" rx="0.6" fill="#E06B3A" />
            <rect x="4.5" y="7.5" width="5" height="1.2" rx="0.6" fill="#E06B3A" />
            <rect x="13.5" y="3.5" width="3" height="11" rx="1" fill="white" opacity="0.35" />
          </svg>
        </div>
        <span className={styles.wordmark}>Comix</span>
      </div>

      <div className={styles.nav}>
        <div
          className={`${styles.navItem} ${inboxActive ? styles.navItemActive : ''}`}
          onClick={goToInbox}
        >
          <InboxIcon />
          <span style={{ flex: 1 }}>Inbox</span>
          {totalUnread > 0 && <span className={styles.badge}>{totalUnread}</span>}
        </div>
        <div
          className={`${styles.navItem} ${libraryActive ? styles.navItemActive : ''}`}
          onClick={goToLibrary}
        >
          <LibraryIcon />
          <span>Library</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.seriesList}>
        {library.length === 0 ? (
          <div className={styles.noLibraryHint}>
            Open a comics folder
            <br />
            to see your series here
          </div>
        ) : (
          <>
            <div className={styles.sectionLabel}>Favorites</div>
            {favoriteSeries.length === 0 && (
              <div className={styles.noLibraryHint}>
                Star a series in Library
                <br />
                to pin it here
              </div>
            )}
            {favoriteSeries.map((ser) => {
              const unread = ser.issues.filter((i) => !readStatus[i.key]?.read).length
              const active = view === 'series' && viewingSeriesName === ser.name
              return (
                <div
                  key={ser.name}
                  className={`${styles.seriesRow} ${active ? styles.seriesRowActive : ''}`}
                  onClick={() => goToSeries(ser.name)}
                >
                  <div className={styles.seriesDot} style={{ background: ser.color }} />
                  <span className={styles.seriesName}>{ser.name}</span>
                  {unread > 0 && <span className={styles.seriesUnread}>{unread}</span>}
                  <span
                    className={styles.seriesStar}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(ser.name)
                    }}
                  >
                    <StarIcon filled={!!favorites[ser.name]} />
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className={styles.folderRow}>
        <div className={styles.folderBtn} onClick={pickFolder}>
          <span className={styles.folderEmoji}>📂</span>
          <span>{rootPath ? 'Change Folder' : 'Open Folder'}</span>
        </div>
        {rootPath && (
          <div className={styles.clearLibraryBtn} onClick={handleClearLibrary}>
            Clear Library
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
