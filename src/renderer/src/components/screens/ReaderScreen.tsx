import { useEffect } from 'react'
import { useAppStore } from '@renderer/state/store'
import styles from './ReaderScreen.module.css'

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function ReaderScreen(): React.JSX.Element | null {
  const pages = useAppStore((s) => s.pages)
  const currentPage = useAppStore((s) => s.currentPage)
  const doublePageMode = useAppStore((s) => s.doublePageMode)
  const currentSeries = useAppStore((s) => s.currentSeries)
  const currentIssue = useAppStore((s) => s.currentIssue)
  const isRead = useAppStore((s) => (currentIssue ? s.readStatus[currentIssue.key]?.read : false))
  const closeReader = useAppStore((s) => s.closeReader)
  const nextPage = useAppStore((s) => s.nextPage)
  const prevPage = useAppStore((s) => s.prevPage)
  const toggleDoublePage = useAppStore((s) => s.toggleDoublePage)
  const markCurrentRead = useAppStore((s) => s.markCurrentRead)

  // Keyboard shortcuts are only live while the Reader is actually mounted,
  // which happens to naturally satisfy the "only when view === 'reader'"
  // guard the design prototype implements with a manual state check.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextPage()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevPage()
      } else if (e.key === 'Escape') {
        closeReader()
      } else if (e.key === 'd') {
        toggleDoublePage()
      } else if (e.key === 'f') {
        toggleFullscreen()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [nextPage, prevPage, closeReader, toggleDoublePage])

  if (!currentIssue || !currentSeries) return null

  const total = pages.length
  const p1 = pages[currentPage]
  const p2 = doublePageMode ? pages[currentPage + 1] : null
  const isFirst = currentPage === 0
  const step = doublePageMode ? 2 : 1
  const isLast = currentPage >= total - step
  const pct = total > 1 ? (currentPage / (total - 1)) * 100 : 100
  const pageCounter = `${currentPage + 1}${doublePageMode && p2 ? '–' + (currentPage + 2) : ''} / ${total}`

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={closeReader}>
          ← Back
        </button>
        <div className={styles.titleArea}>
          <span className={styles.seriesName}>{currentSeries.name} — </span>
          <span className={styles.issueName}>{currentIssue.displayName}</span>
        </div>
        <span className={styles.pageCounter}>{pageCounter}</span>
        {!isRead && (
          <button className={styles.markReadBtn} onClick={markCurrentRead}>
            ✓ Mark Read
          </button>
        )}
        <button
          className={styles.pageModeBtn}
          style={{
            background: doublePageMode ? 'var(--accent-orange)' : 'transparent',
            color: doublePageMode ? '#fff' : 'var(--sidebar-text)',
            borderColor: doublePageMode ? 'var(--accent-orange)' : 'var(--reader-border)'
          }}
          onClick={toggleDoublePage}
        >
          {doublePageMode ? '2-page' : '1-page'}
        </button>
        <button className={styles.fullscreenBtn} onClick={toggleFullscreen}>
          ⛶
        </button>
      </div>

      <div className={styles.pageArea}>
        <div
          className={styles.leftZone}
          style={{ cursor: isFirst ? 'default' : 'w-resize' }}
          onClick={() => !isFirst && prevPage()}
        />
        <div
          className={styles.rightZone}
          style={{ cursor: isLast ? 'default' : 'e-resize' }}
          onClick={() => !isLast && nextPage()}
        />
        {p1 && (
          <div className={styles.pages}>
            <img src={p1} className={styles.pageImg} style={{ maxWidth: p2 ? '50%' : '100%' }} />
            {p2 && <img src={p2} className={styles.pageImg} style={{ maxWidth: '50%' }} />}
          </div>
        )}
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default ReaderScreen
