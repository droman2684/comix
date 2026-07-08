import styles from './LoadingOverlay.module.css'

function LoadingOverlay({ message }: { message: string }): React.JSX.Element {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={`${styles.spinner} spin`} />
        <div className={styles.message}>{message}</div>
      </div>
    </div>
  )
}

export default LoadingOverlay
