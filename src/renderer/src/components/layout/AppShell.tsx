import { useAppStore } from '@renderer/state/store'
import Sidebar from './Sidebar'
import MainContent from './MainContent'
import ReaderScreen from '@renderer/components/screens/ReaderScreen'
import LoadingOverlay from '@renderer/components/ui/LoadingOverlay'
import styles from './AppShell.module.css'

function AppShell(): React.JSX.Element {
  const view = useAppStore((s) => s.view)
  const isScanning = useAppStore((s) => s.isScanning)

  if (view === 'reader') {
    return <ReaderScreen />
  }

  return (
    <div className={styles.root}>
      <Sidebar />
      <MainContent />
      {isScanning && <LoadingOverlay message="Scanning library…" />}
    </div>
  )
}

export default AppShell
