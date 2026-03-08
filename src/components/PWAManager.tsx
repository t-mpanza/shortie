import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { useState, useEffect } from 'react';

/** Offline banner — slides down from the top when connection drops */
function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — showing cached data</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Update toast — appears at bottom when new version is available */
function UpdateToast({
  needsUpdate,
  applyUpdate,
  dismissUpdate,
}: {
  needsUpdate: boolean;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}) {
  return (
    <AnimatePresence>
      {needsUpdate && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-xl p-2 flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Update available</p>
              <p className="text-xs text-gray-500 mt-0.5">
                A new version of Shortie is ready. Refresh to get the latest features.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={applyUpdate}
                  className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Update now
                </button>
                <button
                  onClick={dismissUpdate}
                  className="text-gray-500 text-xs font-medium px-3 py-2 hover:text-gray-700 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Install prompt — a gentle bottom sheet nudge on mobile */
function InstallPrompt({
  canInstall,
  promptInstall,
}: {
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!canInstall || dismissed) return;

    // Check if user has previously dismissed (don't nag)
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
        return;
      }
    }

    // Show after a short delay so it doesn't feel aggressive
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall, dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    await promptInstall();
    setShow(false);
  };

  if (!canInstall || dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-5 text-white"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-blue-200 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 rounded-xl p-2.5">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base">Install Shortie</p>
              <p className="text-blue-100 text-xs">Quick access from your home screen</p>
            </div>
          </div>
          <p className="text-blue-100 text-xs mb-4 leading-relaxed">
            Install the app for faster loading, offline access to cached data, and a full-screen experience.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-blue-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-50 active:scale-95 transition-all"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-200 text-sm font-medium px-4 py-2.5 hover:text-white transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * PWAManager — drop this once in your layout.
 * It renders all PWA UI: offline banner, install prompt, and update toast.
 */
export function PWAManager() {
  const { canInstall, isInstalled, isOnline, needsUpdate, promptInstall, applyUpdate, dismissUpdate } =
    usePWA();

  return (
    <>
      <OfflineBanner isOnline={isOnline} />
      <UpdateToast
        needsUpdate={needsUpdate}
        applyUpdate={applyUpdate}
        dismissUpdate={dismissUpdate}
      />
      {!isInstalled && (
        <InstallPrompt canInstall={canInstall} promptInstall={promptInstall} />
      )}
    </>
  );
}
