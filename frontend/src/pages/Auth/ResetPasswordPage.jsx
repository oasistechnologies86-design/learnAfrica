/**
 * ResetPasswordPage — completes a password reset from an emailed or
 * administrator-shared one-time link.
 *
 * The page validates the token on load, shows a clear message if it is
 * invalid/expired, and otherwise lets the user set a new password. The raw
 * token lives only in the URL; it is never stored, logged, or echoed back.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Input';
import { AuthCard } from '@/components/auth/AuthCard';
import { API_BASE } from '@/lib/api';

// Module-level so the card is not recreated on every render (see ForgotPasswordPage).
function AuthShell({ children }) {
  const navigate = useNavigate();
  return (
    <AuthCard view="reset" onSwitch={() => navigate('/login')}>{children}</AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supportEmail, setSupportEmail] = useState('support@learnafrica.com');

  useEffect(() => {
    fetch(`${API_BASE}/api/site/footer`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.email) setSupportEmail(d.email); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) { setChecking(false); setValid(false); setError('This reset link is missing its token.'); return; }
    fetch(`${API_BASE}/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        setValid(ok && data.valid);
        if (data.email) setAccountEmail(data.email);
        if (!ok) setError(data.error || 'This reset link is invalid or has expired.');
      })
      .catch(() => { setValid(false); setError('Could not verify the reset link. Please try again.'); })
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirm_password: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset the password.');
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (e2) {
      setError(e2.message || 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <AuthShell>
        <div className="py-10 text-center text-sm text-muted-foreground">Checking your reset link…</div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-muted-foreground text-sm">
            You can now sign in with your new password. Taking you to sign in…
          </p>
          <Link to="/login" className="inline-flex items-center justify-center text-sm text-primary hover:underline">
            Go to sign in now
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (!valid) {
    return (
      <AuthShell>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Link not valid</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Link to="/forgot-password" className="inline-flex items-center justify-center text-sm text-primary hover:underline">
            Request a new reset link
          </Link>
          <p className="text-xs text-muted-foreground">
            Need help? Contact support at{' '}
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <LifeBuoy className="h-3 w-3" /> {supportEmail}
            </a>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="text-muted-foreground text-sm">
            {accountEmail ? <>for <strong>{accountEmail}</strong></> : 'Choose a strong password you have not used before.'}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="password" type={show ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Create a password"
                className="w-full pl-10 pr-10 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <input id="confirm" type={show ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="Confirm your password"
              className="w-full px-4 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy ? 'Saving…' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

export default ResetPasswordPage;
