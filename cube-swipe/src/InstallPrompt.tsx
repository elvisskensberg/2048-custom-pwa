import { useState, useEffect } from 'react';
import { trackEvent } from './analytics';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Guard against environments without matchMedia (like tests)
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Initialize installed state based on platform detection
    if (isStandalone || isIOSStandalone) {
      // Use a microtask to avoid setting state during render
      Promise.resolve().then(() => setIsInstalled(true));
      return;
    }

    // Capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      trackEvent('InstallPrompt_Available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Check if this is iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        setShowIOSInstructions(true);
        trackEvent('InstallPrompt_IOSInstructionsShown');
      } else {
        trackEvent('InstallPrompt_NotAvailable', { userAgent: navigator.userAgent });
      }
      return;
    }

    trackEvent('InstallPrompt_Clicked');

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    trackEvent('InstallPrompt_UserChoice', { outcome });

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cube Swipe 2048',
          text: 'Check out this awesome 3D 2048 game!',
          url: window.location.href,
        });
        trackEvent('Share_Success');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          trackEvent('Share_Failed', { error: (error as Error).message });
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
        trackEvent('Share_CopiedToClipboard');
      } catch {
        trackEvent('Share_ClipboardFailed');
      }
    }
  };

  if (isInstalled) {
    return null; // Don't show buttons if app is already installed
  }

  return (
    <div className="install-prompt">
      <div className="install-buttons">
        {(deferredPrompt || /iPad|iPhone|iPod/.test(navigator.userAgent)) && (
          <button
            className="install-button"
            onClick={handleInstallClick}
            title="Install this app"
          >
            <span className="button-icon">⬇️</span>
            Install App
          </button>
        )}

        <button
          className="share-button"
          onClick={handleShareClick}
          title="Share this app"
        >
          <span className="button-icon">🔗</span>
          Share
        </button>
      </div>

      {showIOSInstructions && (
        <div className="ios-instructions-overlay" onClick={() => setShowIOSInstructions(false)}>
          <div className="ios-instructions" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setShowIOSInstructions(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3>Install on iOS</h3>
            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <p>Tap the <strong>Share</strong> button <span className="ios-icon">□↑</span> at the bottom of Safari</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <p>Scroll down and tap <strong>"Add to Home Screen"</strong> <span className="ios-icon">➕</span></p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <p>Tap <strong>"Add"</strong> in the top right corner</p>
              </div>
            </div>
            <p className="instruction-note">
              The app will appear on your home screen like a native app!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
