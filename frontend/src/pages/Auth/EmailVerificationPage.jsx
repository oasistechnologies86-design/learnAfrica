import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { AuthCard } from '@/components/auth/AuthCard';
import { API_BASE } from '@/lib/api';
import { Mail, ArrowRight, RefreshCcw, LifeBuoy } from 'lucide-react';

function formatWait(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
  }
  return `0:${String(s).padStart(2, '0')}`;
}

/**
 * EmailVerificationPage — shown after signup when admin has enabled OTP mode.
 * Receives the email in navigation state, prompts user for the 6-digit code,
 * and calls /api/auth/verify-code. On success, saves the returned login token
 * and navigates to /dashboard.
 */
export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [supportEmail, setSupportEmail] = useState('support@learnafrica.com');
  const timerRef = useRef(null);

  // If someone navigates here directly without an email, send them back to signup
  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  // Support address — same value as the site footer.
  useEffect(() => {
    fetch(`${API_BASE}/api/site/footer`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.email) setSupportEmail(d.email); })
      .catch(() => {});
  }, []);

  // Resend countdown ticker.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown > 0]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    const clean = (code || '').replace(/\D/g, '');
    if (clean.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setError('You appear to be offline. Please check your internet and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: clean }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Verification failed. Please try again.');
      } else {
        // Save the token and go to dashboard
        if (data.token) {
          sessionStorage.setItem('auth_token', data.token);
          window.location.href = '/dashboard';
        } else {
          setInfo('Verified! You can now log in.');
          setTimeout(() => navigate('/login', { replace: true }), 1200);
        }
      }
    } catch (err) {
      setError('Could not reach the server. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(''); setInfo(''); setResending(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.retry_after) setCooldown(Math.floor(data.retry_after));
        setError(data.error || 'Failed to resend code.');
      } else {
        setCooldown(Math.floor(data.resend_cooldown ?? 60));
        setInfo('A new code has been sent to your email. The previous code no longer works.');
      }
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard view="verify" onSwitch={() => navigate('/login')}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.
            Enter it below to activate your account.
          </p>
          <p className="text-xs text-muted-foreground">
            The code is valid for 15 minutes. Check your spam folder if you don't see it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-semibold mb-1.5">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full h-14 px-4 rounded-xl border border-input bg-background text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm px-3 py-2">
              {info}
            </div>
          )}

          <Button type="submit" className="w-full h-12 rounded-xl gap-2" disabled={isLoading || code.length !== 6}>
            {isLoading ? 'Verifying…' : <>Verify email <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 disabled:opacity-60 disabled:no-underline disabled:cursor-default"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0
                ? `Resend in ${formatWait(cooldown)}`
                : (resending ? 'Sending…' : 'Resend code')}
            </button>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-2 pt-4 border-t border-border">
            <p>
              Need help? Contact support at{' '}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <LifeBuoy className="h-3 w-3" /> {supportEmail}
              </a>
            </p>
            <p>
              Wrong email? <Link to="/signup" className="text-primary hover:underline">Start over</Link>
            </p>
          </div>
        </form>
      </div>
    </AuthCard>
  );
}
