import { Snackbar, Alert, Button } from '@mui/material'
import { useRegisterSW } from 'virtual:pwa-register/react'

export const UpdatePrompt = (): React.JSX.Element | null => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error)
    },
  })

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
