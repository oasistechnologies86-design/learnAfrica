/**
 * AuthCard — the login / sign-up card.
 *
 * One wide card split into two equal halves. The coloured panel always sits on
 * the LEFT and the active form on the RIGHT; switching between sign in and sign
 * up cross-fades the contents in place (no sliding). On phones the halves stack:
 * a compact banner on top, the form below.
 *
 * The card is presentation only. It owns the fade and focus management; the
 * pages own their forms and all their behaviour.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { cn } from '@/lib/utils';

export function AuthCard({ view, onSwitch, children }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  // The panel tells us which view it wants to switch to; the page decides what
  // that means (swap in place for login/signup, navigate for the other steps).
  const switchTo = (next) => {
    if (!next || next === view) return;
    onSwitch?.(next);
  };

  const panel = (
    <AuthPanel variant={view} onSwitch={switchTo} />
  );
  const compactPanel = (
    <AuthPanel compact variant={view} onSwitch={switchTo} />
  );
  const fade = !reduce && 'fade-in-soft';

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        {/* Top bar: back to home + theme toggle */}
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 -ml-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <ThemeToggle compact />
        </div>

        {/* Top-aligned on phones (no dead space above the card); centred on
            large screens where the split card has a fixed height. */}
        <div className="flex flex-1 items-start justify-center lg:items-center">
          <div className="w-full max-w-5xl">
            {/* One layout at a time — rendering both would duplicate ids and
                put two copies of every control in the accessibility tree. */}
            {isDesktop ? (
              <div className="relative overflow-hidden rounded-[20px] bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10 lg:h-[640px]">
                {/* Green panel — fixed on the left; content cross-fades. */}
                <div className="absolute inset-y-0 left-0 z-10 w-1/2">
                  <div key={view} className={cn('h-full', fade)}>
                    {panel}
                  </div>
                </div>

                {/* Form half — fixed on the right; content cross-fades. */}
                <div className="absolute inset-y-0 right-0 z-20 w-1/2 overflow-y-auto bg-card px-10 py-10 xl:px-14">
                  <div className="flex min-h-full flex-col justify-center">
                    <div key={`form-${view}`} className={fade}>{children}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-md">
                <div className="overflow-hidden rounded-[20px] bg-card shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10">
                  <div key={`banner-${view}`} className={cn('h-32 sm:h-36', fade)}>
                    {compactPanel}
                  </div>
                  <div className="p-5 sm:p-7">
                    <div key={`form-${view}`} className={fade}>{children}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthCard;
