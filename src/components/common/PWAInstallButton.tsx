import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../lib/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0'
            : 'inline-flex items-center gap-2 rounded-xl bg-[#10213B] hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0'
        }
        title="Install JOBSETU App on your device"
      >
        <Download className="w-3.5 h-3.5 text-[#36C5F0]" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#10213B] text-[#36C5F0] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="pwa-install-title" className="text-sm font-bold text-slate-900 dark:text-white">
                    Install JOBSETU Web App
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fast home-screen access across India
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close install instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">Install on iPhone or iPad:</p>
                  <p>1. Tap the <strong>Share</strong> icon in your Safari toolbar.</p>
                  <p>2. Scroll down and select <strong>Add to Home Screen</strong>.</p>
                  <p>3. Tap <strong>Add</strong> in the top-right corner.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">Install on Android or Desktop:</p>
                  <p>1. Click the <strong>Install</strong> icon in your browser address bar, or open the browser menu (⋮).</p>
                  <p>2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Only safe public shell assets are cached for fast loading. Private messages, resumes, and verification documents are never stored in shared public caches.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#267BE8] hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Public shell active. Reconnect to sync applications or messages.</span>
    </div>
  );
};
