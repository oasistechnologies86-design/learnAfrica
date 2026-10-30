/**
 * HowItWorksSection — the landing "How it works" card.
 *
 * A single wide card split into a content half and a coloured panel half. The
 * panel stays fixed on the right; moving between steps gently cross-fades the
 * contents in place (no sliding). Steps can be driven by the buttons, the
 * progress dots, the arrow keys, a swipe, or autoplay.
 *
 * Autoplay stops for good the moment the visitor hovers, touches or clicks,
 * and only runs while the section is on screen. Reduced motion gets no fade
 * and no autoplay.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, BookOpen, Play, Award, ArrowRight, ArrowLeft, Check, Sparkles, IdCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/useMediaQuery';

const STEPS = [
  {
    icon: User,
    eyebrow: 'Getting started',
    tagline: 'Your account, ready in seconds',
    title: 'Create your account',
    description: 'Sign up free in seconds. No card, no waiting — just your name and an email to begin.',
    points: ['Free to join', 'No card required', 'Pick up on any device'],
  },
  {
    icon: BookOpen,
    eyebrow: 'Pick your path',
    tagline: 'Hundreds of courses to choose from',
    title: 'Choose your course',
    description: 'Browse by subject, level or instructor, and filter for free or paid — whatever fits your goal.',
    points: ['Expert-led courses', 'Free and paid options', 'Filter by what matters'],
  },
  {
    icon: Play,
    eyebrow: 'Learn your way',
    tagline: 'Study on your own schedule',
    title: 'Learn at your own pace',
    description: 'Watch lessons, join the discussion and take quizzes whenever it suits you, on any device.',
    points: ['Video lessons', 'Quizzes and discussions', 'Learn when it suits you'],
  },
  {
    icon: Award,
    eyebrow: 'Get certified',
    tagline: 'Prove what you have learned',
    title: 'Take quizzes and earn your certificate',
    description: 'Pass the final exam and download a certificate you can verify, share and be proud of.',
    points: ['Verifiable certificate', 'Share with employers', 'Yours for life'],
  },
];

const AUTOPLAY_MS = 6500;

export function HowItWorksSection({ isAuthenticated }) {
  const [sectionRef, setSectionRef] = useState(null);
  const [visible, setVisible] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const cardRef = useRef(null);
  const [step, setStep] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [autoStopped, setAutoStopped] = useState(false);
  const touchStart = useRef(null);

  const count = STEPS.length;
  const current = STEPS[step];
  const fade = !reduce && 'fade-in-soft';

  // Live visibility — unlike a one-shot observer, this turns false again when
  // the section scrolls away, which is what pauses autoplay.
  useEffect(() => {
    if (!sectionRef) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setVisible(e.isIntersecting)),
      { threshold: 0.25 }
    );
    io.observe(sectionRef);
    return () => io.disconnect();
  }, [sectionRef]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  const goTo = useCallback((next) => {
    setStep((prev) => {
      const target = Math.max(0, Math.min(count - 1, next));
      return target === prev ? prev : target;
    });
  }, [count]);

  const next = useCallback(() => goTo(step + 1), [goTo, step]);
  const prev = useCallback(() => goTo(step - 1), [goTo, step]);

  // Autoplay: advance every few seconds while on screen, until the visitor
  // interacts. Loops back to the first step after the last one.
  useEffect(() => {
    if (reduce || autoStopped || !visible) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduce, autoStopped, visible, count]);

  const stopAuto = useCallback(() => setAutoStopped(true), []);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stopAuto(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stopAuto(); prev(); }
  };

  const onTouchStart = (e) => {
    stopAuto();
    touchStart.current = e.changedTouches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    const startX = touchStart.current;
    touchStart.current = null;
    if (startX == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? startX) - startX;
    if (Math.abs(dx) < 45) return;
    if (dx < 0) next(); else prev();
  };

  const panel = useMemo(() => (
    <div className="brand-panel relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 text-center text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

      {/* Oversized step number, watermark style */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none font-black leading-none text-white/15 text-[9rem] lg:text-[12rem]"
      >
        {String(step + 1).padStart(2, '0')}
      </span>

      <div className="relative flex flex-col items-center">
        <div className="relative mb-6">
          <div className="brand-panel-soft flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 shadow-lg backdrop-blur-sm">
            <current.icon className="h-11 w-11 text-white" strokeWidth={1.75} />
          </div>
          <span className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-md">
            <IdCard className="h-3.5 w-3.5 text-primary" />
          </span>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
          {current.eyebrow}
        </p>
        <p className="mt-2 max-w-[16rem] text-base font-semibold">
          {current.tagline}
        </p>
      </div>
    </div>
  ), [step, current]);

  const content = (
    <div className="flex h-full flex-col">
      <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        Step {step + 1} of {count}
      </span>

      <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {current.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {current.description}
      </p>

      <ul className="mt-5 space-y-2.5">
        {current.points.map((point) => (
          <li key={point} className="flex items-center gap-2.5 text-sm text-foreground/85">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {step < count - 1 ? (
          <button
            type="button"
            onClick={() => { stopAuto(); next(); }}
            className={cn(
              'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary px-6 text-sm font-bold text-primary-foreground sm:h-11',
              'shadow-[0_10px_24px_-10px_var(--primary)] transition-all duration-200',
              'hover:-translate-y-px hover:brightness-110 active:translate-y-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            Next step <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to={isAuthenticated ? '/courses' : '/signup'}
            onClick={stopAuto}
            className={cn(
              'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary px-6 text-sm font-bold text-primary-foreground sm:h-11',
              'shadow-[0_10px_24px_-10px_var(--primary)] transition-all duration-200',
              'hover:-translate-y-px hover:brightness-110 active:translate-y-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            {isAuthenticated ? 'Browse courses' : 'Get started'} <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {step > 0 && (
          <button
            type="button"
            onClick={() => { stopAuto(); prev(); }}
            className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
        )}
      </div>
    </div>
  );

  const progress = (
    <div className="mt-6 flex items-center gap-3">
      <div className="flex items-center gap-2" role="tablist" aria-label="How it works steps">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === step}
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => { stopAuto(); goTo(i); }}
            className={cn(
              'h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              i === step ? 'w-7 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
      <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(step / (count - 1)) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <section ref={setSectionRef} className="border-b border-border py-16 sm:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Start learning in 4 simple steps
          </h2>
          <p className="mt-3 text-muted-foreground">
            From signing up to earning your certificate, it only takes a few minutes.
          </p>
        </div>

        {/* Desktop: split card (rendered only on desktop so nothing duplicates) */}
        {isDesktop && (
        <div
          ref={cardRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={stopAuto}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onFocus={stopAuto}
          className="split-card relative mx-auto max-w-5xl overflow-hidden rounded-[20px] bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10 h-[520px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Content half — fixed on the left; gentle fade per step. */}
          <div
            role="tabpanel"
            className="absolute inset-y-0 left-0 z-20 flex w-1/2 flex-col justify-center bg-card px-10 py-10 xl:px-12"
          >
            <div key={`c-${step}`} className={cn('h-full', fade)}>
              {content}
            </div>
          </div>

          {/* Green panel — fixed on the right; gentle fade per step. */}
          <div className="absolute inset-y-0 right-0 z-10 w-1/2">
            <div key={step} className={cn('h-full', fade)}>
              {panel}
            </div>
          </div>
        </div>
        )}

        {/* Phones / tablets: panel on top, content below */}
        {!isDesktop && (
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="mx-auto max-w-md overflow-hidden rounded-[20px] bg-card shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10"
        >
          <div key={`p-${step}`} className={cn('h-40 sm:h-44', fade)}>
            {panel}
          </div>
          <div className="p-5 sm:p-7">
            <div key={`mc-${step}`} className={cn('min-h-[20rem]', fade)}>
              {content}
            </div>
            {progress}
          </div>
        </div>
        )}

        {/* Desktop progress dots sit under the card */}
        {isDesktop && <div className="mx-auto mt-6 max-w-5xl">{progress}</div>}
      </div>
    </section>
  );
}

export default HowItWorksSection;
