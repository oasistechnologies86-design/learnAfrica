/**
 * AuthPanel — the coloured half of the auth card.
 *
 * One component, one config per step. The login screen invites a new visitor to
 * create an account; the sign-up screen invites an existing one to sign in; the
 * remaining steps (verify email, forgot/reset password, instructor sign-up)
 * carry copy that fits that step and a "back to sign in" action.
 *
 * The same component renders full-size inside the desktop card and compact
 * inside the phone banner, so the copy only lives in one place.
 */
import {
  User, UserPlus, LogIn, ArrowRight, ArrowLeft, BadgeCheck, IdCard,
  MailCheck, ShieldCheck, KeyRound, Lock, GraduationCap, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON = { compact: 'h-7 w-7', full: 'h-12 w-12' };
const BADGE = { compact: 'h-3 w-3', full: 'h-4 w-4' };

// Each step's copy and icons. `switchTo` is the view the panel button targets;
// login/signup swap in place, every other step returns to sign in.
const VARIANTS = {
  login: {
    Icon: User, BadgeTop: BadgeCheck, BadgeBottom: IdCard, switchTo: 'signup',
    eyebrow: 'Make it yours', title: 'New here?',
    subtitle: 'Create a workspace, save your projects, and keep every bright idea within reach.',
    cta: 'Create account', ctaIcon: 'right', footnote: 'Free to start · No card needed',
  },
  signup: {
    Icon: User, BadgeTop: LogIn, BadgeBottom: UserPlus, switchTo: 'login',
    eyebrow: 'Good to see you', title: 'Already have an account?',
    subtitle: 'Your projects are right where you left them. Sign in and pick up the thread.',
    cta: 'Back to sign in', ctaIcon: 'left', footnote: 'Secure access · Always in sync',
  },
  verify: {
    Icon: MailCheck, BadgeTop: ShieldCheck, BadgeBottom: BadgeCheck, switchTo: 'login',
    eyebrow: 'Almost there', title: 'Check your inbox',
    subtitle: 'Enter the 6-digit code we emailed you to activate your account.',
    cta: 'Back to sign in', ctaIcon: 'left', footnote: 'Codes expire in 15 minutes',
  },
  forgot: {
    Icon: KeyRound, BadgeTop: Mail, BadgeBottom: ShieldCheck, switchTo: 'login',
    eyebrow: 'Account recovery', title: 'Forgot your password?',
    subtitle: 'Enter your email and we will help you get back into your account securely.',
    cta: 'Back to sign in', ctaIcon: 'left', footnote: 'Takes less than a minute',
  },
  reset: {
    Icon: Lock, BadgeTop: ShieldCheck, BadgeBottom: KeyRound, switchTo: 'login',
    eyebrow: 'Account recovery', title: 'Set a new password',
    subtitle: 'Choose a strong password you have not used before to secure your account.',
    cta: 'Back to sign in', ctaIcon: 'left', footnote: 'Your reset link is single-use',
  },
  instructor: {
    Icon: GraduationCap, BadgeTop: UserPlus, BadgeBottom: BadgeCheck, switchTo: 'login',
    eyebrow: 'Teach on LearnAfrica', title: 'Share what you know',
    subtitle: 'Create expert-led courses and reach learners across Africa.',
    cta: 'Back to sign in', ctaIcon: 'left', footnote: 'Apply in a few minutes',
  },
  profile: {
    Icon: ShieldCheck, BadgeTop: BadgeCheck, BadgeBottom: GraduationCap, switchTo: 'dashboard',
    eyebrow: 'One last step', title: 'Finish your profile',
    subtitle: 'A few details keep LearnAfrica trusted for everyone.',
    cta: 'Go to dashboard', ctaIcon: 'right', footnote: 'You can update these later',
  },
};

export function AuthPanel({ variant, onSwitch, compact = false, className }) {
  const v = VARIANTS[variant] || VARIANTS.login;
  const { Icon, BadgeTop, BadgeBottom } = v;

  return (
    <div
      className={cn(
        'brand-panel relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center text-white',
        compact ? 'px-5 py-4' : 'px-8 py-10',
        className
      )}
    >
      {/* soft light so the gradient has no hard edges */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

      <div className={cn('relative flex flex-col items-center', compact && 'flex-row gap-4 text-left')}>
        {/* Glassy icon card with two overlapping corner badges */}
        <div className={cn('relative', compact ? 'mb-0 shrink-0' : 'mb-7')}>
          <div
            className={cn(
              'brand-panel-soft flex items-center justify-center rounded-3xl border border-white/20 shadow-lg backdrop-blur-sm',
              compact ? 'h-16 w-16 rounded-2xl' : 'h-28 w-28'
            )}
          >
            <Icon className={cn(compact ? ICON.compact : ICON.full, 'text-white')} strokeWidth={1.75} />
          </div>
          <span
            className={cn(
              'absolute flex items-center justify-center rounded-xl bg-white shadow-md',
              compact ? '-left-2 -top-2 h-6 w-6' : '-left-3 -top-3 h-9 w-9'
            )}
          >
            <BadgeTop className={cn(compact ? BADGE.compact : BADGE.full, 'text-primary')} />
          </span>
          <span
            className={cn(
              'absolute flex items-center justify-center rounded-xl bg-white shadow-md',
              compact ? '-bottom-2 -right-2 h-6 w-6' : '-bottom-3 -right-3 h-9 w-9'
            )}
          >
            <BadgeBottom className={cn(compact ? BADGE.compact : BADGE.full, 'text-primary')} />
          </span>
        </div>

        <div className={cn('flex flex-col items-center', compact && 'items-start')}>
          <p className={cn('font-bold uppercase tracking-[0.22em] text-white/70', compact ? 'text-[10px]' : 'text-[11px]')}>
            {v.eyebrow}
          </p>
          <h2 className={cn('mt-2 font-bold tracking-tight', compact ? 'text-lg' : 'mt-3 text-3xl')}>
            {v.title}
          </h2>
          {!compact && (
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">
              {v.subtitle}
            </p>
          )}

          <button
            type="button"
            onClick={() => onSwitch?.(v.switchTo)}
            className={cn(
              'inline-flex items-center gap-2 rounded-[10px] border border-white/60 font-semibold text-white transition-colors hover:bg-white/15',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              compact ? 'mt-3 px-4 py-2 text-xs' : 'mt-7 px-6 py-2.5 text-sm'
            )}
          >
            {v.ctaIcon === 'left' ? (
              <>
                <ArrowLeft className="h-4 w-4" /> {v.cta}
              </>
            ) : (
              <>
                {v.cta} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {!compact && (
            <p className="mt-4 text-[11px] text-white/65">{v.footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPanel;
