import { Snackbar, Alert, Button } from '@mui/material'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'

export const UpdatePrompt = (): React.JSX.Element | null => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)

      // Periodic update checks every 30 minutes
      if (r) {
        setInterval(() => {
          console.log('Checking for SW updates (periodic)...')
          r.update()
        }, 30 * 60 * 1000) // 30 minutes
      }
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error)
    },
  })

  // Check for updates when app comes to foreground
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (!document.hidden) {
        console.log('App visible - checking for updates...')
        navigator.serviceWorker?.getRegistration().then((reg) => {
          reg?.update()
        }).catch((err) => {
          console.error('Failed to check for updates:', err)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleUpdate = (): void => {
    updateServiceWorker(true)
  }

  const handleClose = (): void => {
    setNeedRefresh(false)
  }

  if (!needRefresh) {
    return null
  }

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity="info"
        variant="filled"
        action={
          <>
            <Button color="inherit" size="small" onClick={handleUpdate}>
              Update
            </Button>
            <Button color="inherit" size="small" onClick={handleClose}>
              Later
            </Button>
          </>
        }
      >
        New version available! Click Update to reload.
      </Alert>
    </Snackbar>
  )
}
