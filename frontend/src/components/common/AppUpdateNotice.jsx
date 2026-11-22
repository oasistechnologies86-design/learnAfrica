import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

const BUILD_ID = typeof __LEARN_AFRICA_BUILD_ID__ !== 'undefined'
  ? __LEARN_AFRICA_BUILD_ID__
  : 'development';

function BrandMark() {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-900 shadow-[0_10px_35px_rgba(13,148,136,.24)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(94,234,212,.32),transparent_48%)]" />
      <svg viewBox="0 0 48 48" className="relative h-9 w-9" role="img" aria-label="LearnAfrica">
        <defs>
          <linearGradient id="la-update-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#99F6E4" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <path d="M7 12.5c6.5-2.1 12.2-.9 17 3.2v22c-4.8-4.1-10.5-5.3-17-3.2z" fill="none" stroke="url(#la-update-mark)" strokeWidth="2.7" strokeLinejoin="round" />
        <path d="M41 12.5c-6.5-2.1-12.2-.9-17 3.2v22c4.8-4.1 10.5-5.3 17-3.2z" fill="none" stroke="url(#la-update-mark)" strokeWidth="2.7" strokeLinejoin="round" />
        <path d="M13 19h5M13 24h5M30 19h5M30 24h5" stroke="#CCFBF1" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m24 5 1.5 3.5L29 10l-3.5 1.5L24 15l-1.5-3.5L19 10l3.5-1.5z" fill="#A7F3D0" />
      </svg>
      <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-teal-300 shadow-[0_0_14px_rgba(94,234,212,.8)]" />
    </div>
  );
}

export function UpdateNoticePreview() {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white shadow-2xl sm:p-5">
      <div className="flex items-start gap-3">
        <BrandMark />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-base font-bold tracking-tight">New version available</p>
          <p className="mt-1 text-sm text-slate-300">A new LearnAfrica version is ready.</p>
        </div>
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,.8)]" />
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-300" />
        <p className="text-xs text-slate-300">Your account and saved course progress remain safe.</p>
      </div>
      <button type="button" disabled className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-950/30">
        <RefreshCw className="h-4 w-4" />
        Refresh to update
      </button>
      <p className="mt-3 text-center text-[10px] font-semibold tracking-[.18em] text-slate-500">LEARNAFRICA</p>
    </div>
  );
}

function hasUnsavedChanges() {
  const scopes = document.querySelectorAll('form, [data-update-protected]');
  for (const scope of scopes) {
    const fields = scope.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]), textarea, select');
    for (const field of fields) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (field.checked !== field.defaultChecked) return true;
      } else if (field.tagName === 'SELECT') {
        if ([...field.options].some(option => option.selected !== option.defaultSelected)) return true;
      } else if (field.value !== field.defaultValue) {
        return true;
      }
    }
  }
  return [...document.querySelectorAll('form [contenteditable="true"], [data-update-protected] [contenteditable="true"]')].some(node =>
    node.dataset.initialHtml !== undefined && node.innerHTML !== node.dataset.initialHtml
  );
}

export default function AppUpdateNotice() {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [protectionMessage, setProtectionMessage] = useState('');

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV || document.visibilityState === 'hidden' || !navigator.onLine) return;
    setChecking(true);
    try {
      const response = await fetch('/version.json?check=' + Date.now(), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const latest = await response.json();
      if (latest?.version && latest.version !== BUILD_ID) setAvailable(true);
    } catch {
      // A version check is optional; network failures must never block the app.
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkVersion();
    const interval = window.setInterval(checkVersion, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkVersion(); };
    const onChunkLoadFailure = () => setAvailable(true);
    window.addEventListener('online', checkVersion);
    window.addEventListener('learnafrica:update-available', onChunkLoadFailure);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', checkVersion);
      window.removeEventListener('learnafrica:update-available', onChunkLoadFailure);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkVersion]);

  const refresh = () => {
    if (hasUnsavedChanges()) {
      setProtectionMessage('Please save your current changes before updating.');
      return;
    }
    setProtectionMessage('');
    window.location.reload();
  };

  if (!available) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[120] w-[calc(100vw-2rem)] max-w-sm animate-in slide-in-from-bottom-3 fade-in duration-300 sm:bottom-6 sm:right-6" role="status" aria-live="polite">
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 p-4 text-white shadow-[0_18px_70px_rgba(2,6,23,.42)] ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <BrandMark />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-base font-bold tracking-tight">New version available</p>
            <p className="mt-1 text-sm text-slate-300">A new LearnAfrica version is ready.</p>
          </div>
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,.8)]" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-300" />
          <p className="text-xs text-slate-300">Your account and saved course progress remain safe.</p>
        </div>
        {protectionMessage && (
          <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            {protectionMessage}
          </p>
        )}
        <button type="button" onClick={refresh} disabled={checking}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-950/30 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-70">
          <RefreshCw className="h-4 w-4" />
          Refresh to update
        </button>
        <p className="mt-3 text-center text-[10px] font-semibold tracking-[.18em] text-slate-500">LEARNAFRICA</p>
      </div>
    </div>
  );
}
