import { useEffect, useState } from 'react'
import { useAppStore } from '@renderer/state/store'
import { runWithConcurrency } from '@renderer/utils/pool'
import type { Series } from '@shared/types'
import styles from './LibraryScreen.module.css'

const AUTO_COVER_CONCURRENCY = 6

function StarIcon({ filled }: { filled: boolean }): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill={filled ? '#E06B3A' : 'none'}>
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7z"
        stroke={filled ? '#E06B3A' : 'currentColor'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FavoriteStarButton({
  seriesName,
  variant
}: {
  seriesName: string
  variant: 'card' | 'list'
}): React.JSX.Element {
  const isFavorite = useAppStore((s) => !!s.favorites[seriesName])
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)

  return (
    <button
      className={variant === 'card' ? styles.starBtn : styles.listStarBtn}
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(seriesName)
      }}
      title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
    >
      <StarIcon filled={isFavorite} />
    </button>
  )
}

function LibraryCard({ series }: { series: Series }): React.JSX.Element {
  const readStatus = useAppStore((s) => s.readStatus)
  const cover = useAppStore((s) => s.covers[series.issues[0]?.key ?? ''])
  const goToSeries = useAppStore((s) => s.goToSeries)

  const total = series.issues.length
  const read = series.issues.filter((i) => readStatus[i.key]?.read).length
  const pct = total ? Math.round((read / total) * 100) : 0

  return (
    <div className={styles.card} onClick={() => goToSeries(series.name)}>
      <div
        className={styles.cover}
        style={{ backgroundColor: series.color, backgroundImage: cover ? `url(${cover})` : 'none' }}
      >
        {!cover && <div className={styles.titleOverlay}>{series.name}</div>}
        <FavoriteStarButton seriesName={series.name} variant="card" />
        <div className={styles.issueBadge}>{total}</div>
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{series.name}</div>
        <div className={styles.readLabel}>
          {read} of {total} read
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function LibraryListRow({ series }: { series: Series }): React.JSX.Element {
  const readStatus = useAppStore((s) => s.readStatus)
  const cover = useAppStore((s) => s.covers[series.issues[0]?.key ?? ''])
  const goToSeries = useAppStore((s) => s.goToSeries)

  const total = series.issues.length
  const read = series.issues.filter((i) => readStatus[i.key]?.read).length
  const pct = total ? Math.round((read / total) * 100) : 0

  return (
    <div className={styles.listRow} onClick={() => goToSeries(series.name)}>
      <div
        className={styles.listThumb}
        style={{ backgroundColor: series.color, backgroundImage: cover ? `url(${cover})` : 'none' }}
      >
        {!cover && <div className={styles.listThumbNum}>{total}</div>}
      </div>
      <div className={styles.listInfo}>
        <div className={styles.name}>{series.name}</div>
        <div className={styles.readLabel}>
          {read} of {total} read
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <FavoriteStarButton seriesName={series.name} variant="list" />
    </div>
  )
}

function LibraryScreen(): React.JSX.Element {
  const library = useAppStore((s) => s.library)
  const loadIssueCoverIfNeeded = useAppStore((s) => s.loadIssueCoverIfNeeded)
  const libraryViewMode = useAppStore((s) => s.libraryViewMode)
  const setLibraryViewMode = useAppStore((s) => s.setLibraryViewMode)
  const [query, setQuery] = useState('')

  // Every series card shows its first issue's cover automatically — a single
  // cheap cover read per series, throttled so 200+ series don't all hit the
  // main process at once. Per-issue covers (the rest of a series) are opt-in
  // via the "Import Cover Art" button in the Series view.
  useEffect(() => {
    const withFirstIssue = library.filter((series) => series.issues[0])
    runWithConcurrency(withFirstIssue, AUTO_COVER_CONCURRENCY, (series) =>
      loadIssueCoverIfNeeded(series, series.issues[0])
    )
  }, [library, loadIssueCoverIfNeeded])

  const trimmedQuery = query.trim().toLowerCase()
  const filtered = trimmedQuery
    ? library.filter((series) => series.name.toLowerCase().includes(trimmedQuery))
    : library

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Library</h1>
        <span className={styles.subtitle}>
          {trimmedQuery ? `${filtered.length} of ${library.length} series` : `${library.length} series`}
        </span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search series…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.viewToggle}>
          <div
            className={styles.viewToggleOption}
            style={{
              background: libraryViewMode === 'grid' ? '#1a1917' : 'transparent',
              color: libraryViewMode === 'grid' ? '#f0ede8' : '#7a7872'
            }}
            onClick={() => setLibraryViewMode('grid')}
          >
            Grid
          </div>
          <div
            className={styles.viewToggleOption}
            style={{
              background: libraryViewMode === 'list' ? '#1a1917' : 'transparent',
              color: libraryViewMode === 'list' ? '#f0ede8' : '#7a7872'
            }}
            onClick={() => setLibraryViewMode('list')}
          >
            List
          </div>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className={styles.emptySearch}>No series match “{query.trim()}”</div>
      ) : libraryViewMode === 'grid' ? (
        <div className={styles.grid}>
          {filtered.map((series) => (
            <LibraryCard key={series.name} series={series} />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((series) => (
            <LibraryListRow key={series.name} series={series} />
          ))}
        </div>
      )}
    </div>
  )
}

export default LibraryScreen
