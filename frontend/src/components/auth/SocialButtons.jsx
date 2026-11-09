/**
 * Learn Africa's themed Google sign-in control.
 *
 * The Google Identity Services button is rendered once per mounted control.
 * We deliberately do not rebuild its iframe on focus, visibility, or resize:
 * doing so can cause the white/blank flash users reported after returning
 * from Google's account chooser.
 */
import { useEffect, useRef, useState } from 'react';
import { GoogleMark } from './BrandIcons';
import { cn } from '@/lib/utils';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;
let activeGoogleHandler = null;
let initializedClientId = null;

function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  // Reuse a script another part of the app may already have requested.
  const existingScript = document.querySelector(`script[src="${GSI_SRC}"]`);
  if (existingScript) {
    scriptPromise = new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
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
  const [buttonReady, setButtonReady] = useState(false);
  const googleConfigured = Boolean(googleClientId);

  useEffect(() => {
    onGoogleRef.current = onGoogle;
  }, [onGoogle]);

  useEffect(() => {
    if (!googleConfigured) return undefined;

    let cancelled = false;
    let buttonObserver = null;
    const handler = (credential) => onGoogleRef.current?.(credential);
    activeGoogleHandler = handler;

    loadGsi()
      .then(() => {
        if (cancelled || !host.current || !window.google?.accounts?.id) return;

        // GIS should be initialized once per client ID. Its callback forwards
        // to the currently mounted LoginPage rather than a stale closure.
        if (initializedClientId !== googleClientId) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false,
            callback: (response) => {
              if (response?.credential) activeGoogleHandler?.(response.credential);
            },
          });
          initializedClientId = googleClientId;
        }

        // React StrictMode can run an effect setup/cleanup/setup cycle.
        // Keep an already-rendered Google iframe instead of replacing it.
        if (!host.current.querySelector('iframe')) {
          const availableWidth = host.current.clientWidth || 320;
          window.google.accounts.id.renderButton(host.current, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: Math.max(200, Math.min(400, Math.floor(availableWidth))),
          });
        }

        const revealAfterGoogleFrameLoads = () => {
          const frame = host.current?.querySelector('iframe');
          if (!frame) return false;
          // Reveal the real button only after its embedded Google UI has
          // finished loading, keeping the branded loading surface in place
          // instead of exposing a temporarily empty iframe.
          if (frame.dataset.learnAfricaLoaded === 'true') {
            setButtonReady(true);
          } else {
            frame.addEventListener('load', () => {
              frame.dataset.learnAfricaLoaded = 'true';
              setButtonReady(true);
            }, { once: true });
          }
          return true;
        };

        if (!revealAfterGoogleFrameLoads()) {
          buttonObserver = new MutationObserver(() => {
            if (revealAfterGoogleFrameLoads()) {
              buttonObserver?.disconnect();
              buttonObserver = null;
            }
          });
          buttonObserver.observe(host.current, { childList: true, subtree: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setButtonReady(true);
          setNotice('Google sign-in could not load. Please refresh the page and try again.');
        }
      });

    return () => {
      cancelled = true;
      buttonObserver?.disconnect();
      if (activeGoogleHandler === handler) activeGoogleHandler = null;
    };
  }, [googleClientId, googleConfigured]);

  return (
    <div className={cn('w-full', className)}>
      {googleConfigured ? (
        <div
          className={cn(
            'relative isolate w-full overflow-hidden rounded-2xl border border-primary/20',
            'bg-gradient-to-br from-primary/[0.08] via-card to-accent/[0.08]',
            'p-2 shadow-[0_14px_34px_-26px_var(--primary)]',
            'transition-colors duration-300',
            disabled && 'pointer-events-none opacity-60'
          )}
          aria-label="Sign in with Google"
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="relative flex min-h-[58px] w-full items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-background/80 px-1 shadow-sm backdrop-blur-sm">
            {!buttonReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-full bg-[#1a73e8] text-sm font-semibold text-white shadow-sm">
                <GoogleMark size={19} />
                <span>Preparing secure sign-in…</span>
              </div>
            )}
            <div
              ref={host}
              className={cn(
                'flex min-h-[48px] w-full items-center justify-center',
                '[&>div]:!mx-auto [&_iframe]:!max-w-full',
                !buttonReady && 'opacity-0'
              )}
            />
          </div>
          <p className="mt-2 text-center text-[10px] font-medium tracking-[0.12em] text-muted-foreground">
            SECURE ACCESS · POWERED BY GOOGLE
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setNotice('Google sign-in is not set up yet.')}
          className={cn(
            'flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-primary/20',
            'bg-gradient-to-r from-primary/[0.08] via-card to-accent/[0.08]',
            'text-sm font-semibold text-foreground shadow-sm transition-all duration-200',
            'hover:border-primary/40 hover:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            disabled && 'pointer-events-none opacity-60'
          )}
          aria-label="Continue with Google"
        >
          <GoogleMark size={19} />
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
