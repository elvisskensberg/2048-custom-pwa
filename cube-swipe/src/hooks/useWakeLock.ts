import { useEffect, useRef, useCallback } from 'react'

/**
 * Keeps the screen awake while the component is mounted.
 * Automatically re-acquires the lock when the page becomes visible again
 * (required by the Screen Wake Lock spec — locks are released on visibility change).
 *
 * Gracefully degrades on unsupported browsers (no-op).
 */
export function useWakeLock(enabled: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestLock = useCallback(async (): Promise<void> => {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // Lock request can fail if the page is hidden or permission denied — safe to ignore
    }
  }, [])

  const releaseLock = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
      } catch {
        // Already released — safe to ignore
      }
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      releaseLock()
      return
    }

    requestLock()

    // Re-acquire when the page becomes visible (spec requirement)
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseLock()
    }
  }, [enabled, requestLock, releaseLock])
}
