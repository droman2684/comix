import { useAppStore } from '@renderer/state/store'
import styles from './WelcomeScreen.module.css'

function basename(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function WelcomeScreen(): React.JSX.Element {
  const rootPath = useAppStore((s) => s.rootPath)
  const scanError = useAppStore((s) => s.scanError)
  const pickFolder = useAppStore((s) => s.pickFolder)
  const reopenLibrary = useAppStore((s) => s.reopenLibrary)
  const loadDemoLibrary = useAppStore((s) => s.loadDemoLibrary)

  const hasPrevious = Boolean(rootPath)
  const previousName = rootPath ? basename(rootPath) : ''

  const heading = hasPrevious ? 'Reopen Your Library' : 'Open Your Comics Library'
  const subtext = hasPrevious
    ? `Previous library: ${previousName}`
    : 'Select a folder containing series subfolders with .cbz files'
  const primaryLabel = hasPrevious ? `Open ${previousName} →` : 'Open Comics Folder →'

  const handlePrimary = (): void => {
    if (hasPrevious && rootPath) reopenLibrary(rootPath)
    else pickFolder()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path
              d="M4 4c0-1.1.9-2 2-2h8l6 6v12c0 1.1-.9 2-2 2H6a2 2 0 01-2-2V4z"
              opacity="0.95"
            />
            <path d="M14 2l6 6h-6V2z" opacity="0.55" />
            <rect x="7" y="12" width="10" height="1.4" rx="0.7" fill="#E06B3A" />
            <rect x="7" y="15" width="7" height="1.4" rx="0.7" fill="#E06B3A" />
          </svg>
        </div>

        <div>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.subtext}>{subtext}</p>
        </div>

        {scanError && <p className={styles.error}>{scanError}</p>}

        <button className={styles.primaryBtn} onClick={handlePrimary}>
          {primaryLabel}
        </button>
        <button className={styles.demoBtn} onClick={loadDemoLibrary}>
          Try Demo →
        </button>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span> CBZ (ZIP-based) files fully supported
          </div>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span> Tracks read status and progress
            automatically
          </div>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span> Remembers your library across launches
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
