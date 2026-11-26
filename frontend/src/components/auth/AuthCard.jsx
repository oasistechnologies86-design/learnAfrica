/**
 * Shared authentication shell.
 * Uses the exact public landing-page hero image so login, signup and every
 * recovery/verification step feel like part of the same LearnAfrica experience.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';

export function AuthCard({ children }) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduce(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return (
    <main className="relative isolate flex min-h-screen items-start justify-center overflow-x-hidden bg-slate-950 px-3 py-4 sm:px-6 sm:py-6 lg:items-center">
      {/* Keep the authentication backdrop identical to the public landing hero. */}
      <img
        src="/hero-graduation-female.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="fixed inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/25" />

      <div className="relative z-10 flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col sm:min-h-[calc(100vh-3rem)]">
        <header className="mb-5 flex items-center justify-between sm:mb-7">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to LearnAfrica</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <div className="rounded-xl border border-white/20 bg-black/20 p-1 text-white backdrop-blur-md [&_button]:text-white [&_button:hover]:bg-white/15">
            <ThemeToggle compact />
          </div>
        </header>

        <div className="flex flex-1 items-start justify-center pb-4 lg:items-center">
          <section
            aria-label="LearnAfrica account access"
            className={cn(
              'w-full max-w-2xl overflow-hidden rounded-3xl border border-white/25 bg-white/95 p-5 text-slate-900 shadow-[0_30px_100px_-30px_rgba(0,0,0,0.75)] backdrop-blur-2xl dark:bg-slate-950/95 dark:text-slate-100 sm:p-7 lg:p-9',
              !reduce && 'animate-in fade-in slide-in-from-bottom-2 duration-500'
            )}
          >
            {children}
          </section>
        </div>

        <footer className="py-2 text-center text-xs font-medium text-white/75">
          Secure learning. Real progress. Built for Africa.
        </footer>
      </div>
    </main>
  );
}

export default AuthCard;
