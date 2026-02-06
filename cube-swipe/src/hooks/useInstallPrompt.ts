import { useState, useEffect } from 'react'
import { trackEvent } from '../analytics'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UseInstallPromptReturn {
  isAppInstalled: boolean
  handleInstall: () => Promise<void>
  handleShare: () => Promise<void>
}

export const useInstallPrompt = (): UseInstallPromptReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true

      if (isStandalone || isIOSStandalone) {
        Promise.resolve().then(() => setIsAppInstalled(true))
        return
      }
    } catch {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      trackEvent('InstallPrompt_Available')
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      if (isIOS) {
        trackEvent('InstallPrompt_IOSInstructionsShown')
        alert('To install: tap the Share button in Safari, then "Add to Home Screen".')
      } else {
        trackEvent('InstallPrompt_NotAvailable', { userAgent: navigator.userAgent })
        alert('Please use your browser\'s install option to add this app to your home screen.')
      }
      return
    }

    trackEvent('InstallPrompt_Clicked')
    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice
    trackEvent('InstallPrompt_UserChoice', { outcome })

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsAppInstalled(true)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cube Swipe 2048',
          text: 'Check out this awesome 2048 game!',
          url: window.location.href,
        })
        trackEvent('Share_Success')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          trackEvent('Share_Failed', { error: (error as Error).message })
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
        trackEvent('Share_CopiedToClipboard')
      } catch {
        trackEvent('Share_ClipboardFailed')
      }
    }
  }

  return { isAppInstalled, handleInstall, handleShare }
}
