/**
 * Google sign-in control.
 *
 * Use Google's real, visible Identity Services button. Keep the rendered
 * button mounted while the user opens or dismisses the account chooser;
 * repeatedly replacing its iframe can cause a visible blank flash.
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
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function SocialButtons({ onGoogle, googleClientId, disabled = false, className }) {
  const host = useRef(null);
  const onGoogleRef = useRef(onGoogle);
  const [notice, setNotice] = useState('');

  const googleConfigured = Boolean(googleClientId);

  useEffect(() => {
    onGoogleRef.current = onGoogle;
  }, [onGoogle]);

  useEffect(() => {
    if (!googleConfigured) return undefined;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !host.current || !window.google?.accounts?.id) return;
      const availableWidth = host.current.clientWidth || 320;
      host.current.replaceChildren();
      window.google.accounts.id.renderButton(host.current, {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.max(200, Math.min(400, Math.floor(availableWidth))),
      });
    };

    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) onGoogleRef.current?.(response.credential);
          },
        });
        renderGoogleButton();
      })
      .catch(() => {
        if (!cancelled) setNotice('Google sign-in could not load. Please refresh the page and try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleConfigured]);

  return (
    <div className={cn('w-full', className)}>
      {googleConfigured ? (
        <div
          className={cn(
            'flex min-h-12 w-full items-center justify-center overflow-hidden rounded-[10px]',
            'bg-transparent transition-opacity duration-200',
            disabled && 'pointer-events-none opacity-60'
          )}
          aria-label="Sign in with Google"
        >
          <div
            ref={host}
            className="flex min-h-12 w-full items-center justify-center [&>div]:!mx-auto [&_iframe]:!max-w-full"
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setNotice('Google sign-in is not set up yet.')}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-[10px]',
            'border border-input bg-card text-[13px] font-medium text-foreground/80',
            'transition-[transform,background-color,border-color] duration-200',
            'hover:-translate-y-px hover:border-foreground/25 hover:bg-muted',
            'active:translate-y-0 active:scale-[0.99]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            disabled && 'pointer-events-none opacity-60'
          )}
          aria-label="Continue with Google"
        >
          <GoogleMark size={16} />
          <span>Continue with Google</span>
        </button>
      )}

      <p aria-live="polite" className={cn('mt-2 text-center text-xs text-muted-foreground', !notice && 'sr-only')}>
        {notice}
      </p>
    </div>
  );
}

export default SocialButtons;
