import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/auth/Field';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { useAuth } from '@/context/AuthContext';
import { safeInternalPath } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/**
 * The login form. Behaviour is unchanged from the original page: same
 * validation, same error translation, same redirects, same Google flow. Only
 * the presentation and the sliding card are new.
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, sessionError, clearSessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  // Only same-origin paths are honoured; anything else falls through to the
  // role-based default below (null keeps the "no returnUrl" branch intact).
  const returnUrl = safeInternalPath(new URLSearchParams(location.search).get('returnUrl'), null);

  // If the session ended because the account was suspended, explain it here
  // rather than dropping the user on the login screen with no reason.
  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
      clearSessionError();
    }
  }, [sessionError, clearSessionError]);

  const handleGoogle = async (credential) => {
    setError('');
    setIsLoading(true);
    try {
      const u = await loginWithGoogle(credential);
      if (returnUrl) navigate(returnUrl);
      else navigate(u?.role === 'instructor' ? '/instructor' : '/dashboard');
    } catch (err) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }
    if (!email.includes('@') || email.length < 5) {
      setError('That doesn\'t look like a valid email address.');
      return;
    }

    // Check offline BEFORE trying to hit the server
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const u = await login({ email, password });
      if (returnUrl) {
        navigate(returnUrl);
      } else if (u?.requires_registration_payment) {
        // Pending instructor who still owes the registration fee → checkout.
        navigate('/instructor/registration-payment');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Translate technical errors into friendly user messages
      const raw = String(err?.message || err || '').toLowerCase();

      // Account-status outcomes first: these are known states, not network
      // failures, and must never be mislabelled as "incorrect password".
      if (raw.includes('suspended')) {
        setError('Your account has been suspended. Please contact support for assistance.');
      } else if (raw.includes('no account found') || raw.includes('account_not_found')
          || raw.includes('account could not be found')) {
        setError('No account found with that email address. Please check the spelling or create an account.');
      } else if (raw.includes('failed to fetch') || raw.includes('networkerror')
          || raw.includes('network request failed') || raw.includes('load failed')) {
        setError('Could not connect to the server. Please check your internet and try again.');
      } else if (raw.includes('401') || raw.includes('invalid') || raw.includes('incorrect')
          || raw.includes('wrong') || raw.includes('credentials') || raw.includes('unauthorized')
          || raw.includes('password') || raw.includes('not found') || raw.includes('no user')) {
        setError('Incorrect email or password. Please try again.');
      } else if (raw.includes('locked') || raw.includes('too many') || raw.includes('rate')) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (raw.includes('500') || raw.includes('server error')) {
        setError('The server ran into a problem. Please try again in a few seconds.');
      } else if (raw.includes('timeout') || raw.includes('timed out')) {
        setError('The server took too long to respond. Please try again.');
      } else if (raw) {
        // Show original message if it's short and readable
        setError(err.message.length < 120 ? err.message : 'Login failed. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const form = (
    <div className="w-full space-y-6">
      {/* Brand lockup (desktop shows it here; the phone card shows its own) */}
      <div className="hidden items-center gap-2 lg:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
          <Lock className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold">
          Learn<span className="text-primary">Africa</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Your workspace awaits</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue to your account.</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          autoComplete="email"
        />

        <Field
          id="password"
          label="Password"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-[10px] bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-primary-foreground',
            'shadow-[0_10px_24px_-10px_var(--primary)] transition-all duration-200',
            'hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-60 sm:h-11'
          )}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      <SocialButtons
        googleClientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}
        onGoogle={handleGoogle}
        disabled={isLoading}
      />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );

  return (
    <AuthCard view="login" onSwitch={() => navigate('/signup')}>
      {form}
    </AuthCard>
  );
}
