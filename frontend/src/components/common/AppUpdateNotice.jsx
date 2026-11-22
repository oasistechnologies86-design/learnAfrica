/* global __LEARN_AFRICA_BUILD_ID__ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Rocket, RefreshCw, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';

const BUILD_ID = typeof __LEARN_AFRICA_BUILD_ID__ !== 'undefined' ? __LEARN_AFRICA_BUILD_ID__ : 'development';

function UpdateArtwork({ compact = false }) {
  return (
    <div className={'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-100 ' + (compact ? 'min-h-[190px] rounded-2xl' : 'min-h-[230px] sm:min-h-[330px] sm:rounded-l-[2rem]')}>
      <div className="absolute -left-12 -top-16 h-52 w-52 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-lime-300/30 blur-3xl" />
      <div className="absolute h-40 w-40 rounded-full border border-emerald-300/50 sm:h-56 sm:w-56" />
      <div className="absolute h-32 w-32 rounded-full border border-dashed border-emerald-400/60 sm:h-44 sm:w-44" />
      <div className="absolute right-[17%] top-[18%] text-emerald-400"><Sparkles className="h-5 w-5" /></div>
      <div className="absolute bottom-[20%] left-[17%] text-lime-500"><Sparkles className="h-4 w-4" /></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/80 bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800 text-white shadow-[0_18px_50px_rgba(5,150,105,.35)] sm:h-32 sm:w-32 sm:rounded-[2.5rem]">
          <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1.6} />
          <span className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl border-4 border-white bg-lime-300 text-emerald-900 shadow-lg sm:h-14 sm:w-14">
            <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-5 rounded-full border border-emerald-200/80 bg-white/80 px-4 py-1.5 text-[10px] font-extrabold tracking-[.24em] text-emerald-800 shadow-sm">LEARNAFRICA</div>
      </div>
    </div>
  );
}

function UpdatePanel({ onRefresh, protectionMessage, preview = false }) {
  return (
    <div className="relative grid w-full overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_28px_90px_rgba(6,78,59,.22)] ring-1 ring-emerald-900/5 sm:grid-cols-[.82fr_1.18fr] sm:rounded-[2rem]">
      <UpdateArtwork />
      <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100"><Rocket className="h-3.5 w-3.5" /></span>
          NEW VERSION AVAILABLE
        </div>
        <h2 id="learnAfrica-update-title" className="max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-emerald-950 sm:text-3xl lg:text-[2.55rem]">A new LearnAfrica version is ready!</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">We’ve made improvements to give you a better and smoother learning experience.</p>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-900/15"><ShieldCheck className="h-5 w-5" /></span>
          <p className="text-xs font-semibold leading-5 text-emerald-900 sm:text-sm">Your account and saved course progress remain safe.</p>
        </div>
        {protectionMessage && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{protectionMessage}</p>}
        <button type="button" onClick={onRefresh} disabled={preview} className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-emerald-300/50 bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-800 px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(5,150,105,.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/70 disabled:cursor-default sm:text-base">
          <RefreshCw className="h-5 w-5" /> Refresh to Update <span aria-hidden="true" className="text-xl leading-none">›</span>
        </button>
      </div>
    </div>
  );
}

export function UpdateNoticePreview() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] bg-slate-200 p-3 sm:p-6">
      <div className="mb-3 flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Student experience preview
      </div>
      <UpdatePanel preview onRefresh={() => {}} />
      <p className="mt-3 text-center text-[10px] text-slate-500">Illustrative preview of the mandatory update screen.</p>
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
      } else if (field.value !== field.defaultValue) return true;
    }
  }
  return [...document.querySelectorAll('form [contenteditable="true"], [data-update-protected] [contenteditable="true"]')].some(node =>
    node.dataset.initialHtml !== undefined && node.innerHTML !== node.dataset.initialHtml
  );
}

export default function AppUpdateNotice() {
  const [available, setAvailable] = useState(false);
  const buttonRef = useRef(null);

  const revealWhenSafe = useCallback(() => {
    // Never cover an unsaved form/editor. The next scheduled version check
    // will display the mandatory screen once the current work is saved.
    if (!hasUnsavedChanges()) setAvailable(true);
  }, []);

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV || document.visibilityState === 'hidden' || !navigator.onLine) return;
    try {
      const response = await fetch('/version.json?check=' + Date.now(), { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const latest = await response.json();
      if (latest?.version && latest.version !== BUILD_ID) revealWhenSafe();
    } catch {
      // Version checks are optional and must never interrupt the app.
    }
  }, [revealWhenSafe]);

  useEffect(() => {
    checkVersion();
    const interval = window.setInterval(checkVersion, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkVersion(); };
    const onChunkLoadFailure = () => revealWhenSafe();
    window.addEventListener('online', checkVersion);
    window.addEventListener('learnafrica:update-available', onChunkLoadFailure);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', checkVersion);
      window.removeEventListener('learnafrica:update-available', onChunkLoadFailure);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkVersion, revealWhenSafe]);

  useEffect(() => {
    if (!available) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    buttonRef.current?.focus();
    const blockEscape = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); } };
    window.addEventListener('keydown', blockEscape, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', blockEscape, true);
    };
  }, [available]);

  const refresh = () => window.location.reload();
  if (!available) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-emerald-950/55 px-3 py-5 backdrop-blur-md sm:px-6 sm:py-8" role="presentation">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(52,211,153,.24),transparent_42%),radial-gradient(ellipse_at_85%_85%,rgba(163,230,53,.18),transparent_40%)]" />
      <div className="relative z-10 my-auto w-full max-w-5xl animate-in fade-in zoom-in-95 duration-300" role="dialog" aria-modal="true" aria-labelledby="learnAfrica-update-title" aria-describedby="learnAfrica-update-description">
        <UpdatePanel onRefresh={refresh} protectionMessage="" />
      </div>
    </div>
  );
}
