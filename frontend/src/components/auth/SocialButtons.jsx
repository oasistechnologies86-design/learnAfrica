/**
 * SocialButtons — the Google sign-in control.
 *
 * The visible button is ours (outlined, official inline-SVG mark, one-word
 * label). A real Google button is rendered invisibly on top of it, so a tap
 * always lands on Google's own control and opens the account chooser. This is
 * reliable on mobile, where One Tap `prompt()` often does nothing.
 *
 * The flow needs a client id (VITE_GOOGLE_CLIENT_ID). With no id we render a
 * plain button that explains sign-in is not set up rather than failing silently.
 *
 * Apple is intentionally not offered: there is no Apple provider in the app or
 * backend, so a button could never do anything but apologise.
 */
import { useEffect, useRef, useState } from 'react';
import { GoogleMark } from './BrandIcons';
import { cn } from '@/lib/utils';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;

function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

const visualBtn = cn(
  'relative flex h-12 w-full items-center justify-center gap-2',
  'rounded-[10px] border border-input bg-card',
  'text-[13px] font-medium text-foreground/80',
  'transition-[transform,background-color,border-color] duration-200',
  'hover:bg-muted hover:border-foreground/25 hover:-translate-y-px',
  'active:translate-y-0 active:scale-[0.99]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
);

export function SocialButtons({ onGoogle, googleClientId, disabled = false, className }) {
  const host = useRef(null);
  const [notice, setNotice] = useState('');

  const googleConfigured = Boolean(googleClientId);

  useEffect(() => {
    if (!googleConfigured) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !host.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) onGoogle?.(response.credential);
          },
        });
        host.current.innerHTML = '';
        window.google.accounts.id.renderButton(host.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 400,
        });
      })
      .catch(() => setNotice('Google sign-in could not load. Please try again.'));
    return () => { cancelled = true; };
  }, [googleClientId, googleConfigured, onGoogle]);

  return (
    <div className={cn('w-full', className)}>
      {googleConfigured ? (
        <div className="relative w-full" role="group" aria-label="Sign in with Google">
          {/* Visual layer — what the user sees. */}
          <div className={cn(visualBtn, disabled && 'opacity-60')} aria-hidden="true">
            <GoogleMark size={16} />
            <span>Google</span>
          </div>
          {/* Real Google control, invisible, covering the visual layer so the tap
              always reaches it. */}
          <div
            ref={host}
            className={cn(
              'absolute inset-0 z-10 overflow-hidden opacity-0',
              disabled && 'pointer-events-none',
              '[&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full'
            )}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNotice('Google sign-in is not set up yet.')}
          className={cn(visualBtn, disabled && 'opacity-60 pointer-events-none')}
          aria-label="Continue with Google"
        >
          <GoogleMark size={16} />
          <span>Google</span>
        </button>
      )}

      <p aria-live="polite" className={cn('mt-2 text-center text-xs text-muted-foreground', !notice && 'sr-only')}>
        {notice}
      </p>
    </div>
  );
}

export default SocialButtons;
