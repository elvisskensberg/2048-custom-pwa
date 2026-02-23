import { useState, useEffect } from 'react'
import { Chip } from '@mui/material'
import CloudOffIcon from '@mui/icons-material/CloudOff'

/**
 * Displays a small chip at the bottom of the screen when the user goes offline.
 * Automatically hides when connectivity is restored.
 */
export function OfflineIndicator(): React.JSX.Element | null {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = (): void => setIsOffline(true)
    const goOnline = (): void => setIsOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <Chip
      icon={<CloudOffIcon />}
      label="Offline — game progress saved locally"
      color="warning"
      variant="filled"
      size="small"
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        boxShadow: 2,
      }}
    />
  )
}
