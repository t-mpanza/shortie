import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  /** Whether the app can be installed (install prompt is available) */
  canInstall: boolean;
  /** Whether the app is already installed as PWA */
  isInstalled: boolean;
  /** Whether the device is online */
  isOnline: boolean;
  /** Whether a new service worker version is waiting to activate */
  needsUpdate: boolean;
  /** Whether the SW registration is ready */
  isReady: boolean;
  /** Trigger the native browser install prompt */
  promptInstall: () => Promise<boolean>;
  /** Accept the update and reload the page */
  applyUpdate: () => void;
  /** Dismiss the update notification */
  dismissUpdate: () => void;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

// Capture the event early, even before React mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWA(): PWAState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // ── Online/Offline tracking ──
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Install prompt tracking ──
  useEffect(() => {
    // Check if already captured before mount
    if (deferredInstallPrompt) {
      setCanInstall(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Listen for install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredInstallPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // ── Service Worker registration with update detection ──
  useEffect(() => {
    async function registerSW() {
      if (!('serviceWorker' in navigator)) return;

      try {
        // Import the virtual module from vite-plugin-pwa
        const { registerSW } = await import('virtual:pwa-register');

        registerSW({
          immediate: true,
          onRegisteredSW(swUrl, registration) {
            if (registration) {
              setSwRegistration(registration);
              setIsReady(true);

              // Check for updates periodically (every 60 minutes)
              const intervalId = setInterval(async () => {
                if (!(!registration.installing && navigator)) return;
                if ('connection' in navigator && !navigator.onLine) return;

                try {
                  const resp = await fetch(swUrl, {
                    cache: 'no-store',
                    headers: { 'cache-control': 'no-cache' },
                  });
                  if (resp?.status === 200) {
                    await registration.update();
                  }
                } catch {
                  // Silently fail — we're probably offline
                }
              }, 60 * 60 * 1000);

              return () => clearInterval(intervalId);
            }
          },
          onNeedRefresh() {
            setNeedsUpdate(true);
          },
          onOfflineReady() {
            setIsReady(true);
            console.log('📦 App ready to work offline');
          },
        });
      } catch (e) {
        console.warn('SW registration failed:', e);
      }
    }

    registerSW();
  }, []);

  // ── Actions ──
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredInstallPrompt) return false;
    try {
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
      deferredInstallPrompt = null;
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setNeedsUpdate(false);
    // Reload after a small delay to let the new SW take over
    setTimeout(() => window.location.reload(), 300);
  }, [swRegistration]);

  const dismissUpdate = useCallback(() => {
    setNeedsUpdate(false);
  }, []);

  return {
    canInstall,
    isInstalled,
    isOnline,
    needsUpdate,
    isReady,
    promptInstall,
    applyUpdate,
    dismissUpdate,
  };
}
