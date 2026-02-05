// usePWAInstallTracking.ts
import { useEffect } from 'react';
import { trackEvent } from './analytics';

/**
 * Hook to track PWA installation events
 */
export const usePWAInstallTracking = () => {
  useEffect(() => {
    // Track when install prompt is shown
    const handleBeforeInstallPrompt = () => {
      trackEvent('PWA_InstallPromptShown', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    };

    // Track when app is installed
    const handleAppInstalled = () => {
      const isStandalone = typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;

      trackEvent('PWA_AppInstalled', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        standalone: isStandalone,
      });
    };

    // Track when app is launched as PWA
    const trackPWALaunch = () => {
      // Guard against environments without matchMedia (like tests)
      if (typeof window.matchMedia !== 'function') {
        return;
      }

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone || isIOSStandalone) {
        trackEvent('PWA_LaunchedAsApp', {
          timestamp: new Date().toISOString(),
          displayMode: isStandalone ? 'standalone' : 'ios-standalone',
          platform: navigator.platform,
        });
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed and launched
    trackPWALaunch();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
};
