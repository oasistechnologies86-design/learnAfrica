import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

/**
 * One consistent logout control, with a confirmation surface that shares the
 * public landing/authentication hero image and green LearnAfrica treatment.
 */
export default function LogoutButton({
  variant = 'menu',
  className,
  onLoggedOut,
  iconClassName,
  label,
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const doLogout = useCallback(async () => {
    setBusy(true);
    // Clear local credentials immediately; server logout remains best-effort.
    sessionStorage.removeItem('auth_token');
    setConfirming(false);
    onLoggedOut?.();
    try { await logout(); } catch {}
    // The public landing route already renders the same learner-photo hero.
    navigate('/', { replace: true });
    setBusy(false);
  }, [logout, navigate, onLoggedOut]);

  const base = 'flex items-center gap-3 font-semibold transition-all text-red-500';
  const styles = variant === 'solid'
    ? 'w-full h-11 justify-center rounded-xl bg-red-500/5 border border-red-500/10 text-3xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white'
    : variant === 'icon'
      ? 'h-10 w-10 justify-center rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white active:scale-95'
      : 'w-full rounded-xl px-4 py-3 text-sm hover:bg-red-500/10';

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={label || 'Logout'}
        title={label || 'Logout'}
        className={cn(base, styles, className)}
      >
        <LogOut className={cn(variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4', iconClassName)} strokeWidth={2.5} />
        {variant !== 'icon' && <span>{label || 'Logout'}</span>}
      </button>

      {confirming && createPortal(
        <div
          data-logout-confirm
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-4 animate-in fade-in duration-200"
          style={{ backgroundImage: "linear-gradient(90deg, rgba(2,6,23,.94), rgba(2,6,23,.72)), url('/hero-graduation-female.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
          onClick={() => !busy && setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="relative my-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/25 bg-white/95 p-6 text-slate-900 shadow-[0_30px_100px_-25px_rgba(0,0,0,.8)] backdrop-blur-2xl dark:bg-slate-950/95 dark:text-slate-100 sm:p-7 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/10">
                <LogOut className="h-7 w-7 text-red-500" />
              </div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-400">LearnAfrica account</p>
              <h2 id="logout-dialog-title" className="mb-2 text-xl font-bold">Log out?</h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                You'll be signed out of LearnAfrica on this device. You can sign back in any time.
              </p>
              <div className="flex w-full flex-col gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={doLogout}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-px hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
                >
                  {busy ? 'Logging out…' : 'Yes, log out'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white/80 font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Stay signed in
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
