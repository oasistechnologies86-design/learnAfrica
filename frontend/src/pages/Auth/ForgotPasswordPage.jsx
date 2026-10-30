/**
 * ForgotPasswordPage — password recovery.
 *
 * Two modes, chosen by the admin's Password reset setting:
 *   - 'email'  : the normal self-service form. The user enters their email and
 *                the system emails them a reset link straight away.
 *   - 'manual' : a small modal (mini-tab) with a dropdown, an email field and
 *                a Send button. The request is recorded for an administrator,
 *                who sends the link within the stated SLA (24 hours).
 *
 * The response is always worded the same way so the page never reveals whether
 * an account exists for the address.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronDown, Send, LifeBuoy, LifeBuoy as Support } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { AuthCard } from '@/components/auth/AuthCard';
import { API_BASE } from '@/lib/api';

const REASONS = [
  { value: 'Forgot Password',      label: 'Forgot Password' },
  { value: 'Lost access to email', label: 'Lost access to my email' },
  { value: 'Other account issue',  label: 'Other account issue' },
];

function formatWait(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
  }
  return `0:${String(s).padStart(2, '0')}`;
}

// Module-level so the card is NOT recreated on each render. Defining it inside
// the page made every countdown tick remount the whole card (visible blink).
function AuthShell({ children }) {
  const navigate = useNavigate();
  return (
    <AuthCard view="forgot" onSwitch={() => navigate('/login')}>{children}</AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Forgot Password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState(null); // 'email' | 'manual' | null = unknown
  const [slaHours, setSlaHours] = useState(24);
  const [expiresHours, setExpiresHours] = useState(1);
  const [supportEmail, setSupportEmail] = useState('support@learnafrica.com');
  const [modalOpen, setModalOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);   // seconds left before resend
  const [lastResult, setLastResult] = useState(null); // 'sent' | 'failed'
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/password-reset-mode`)
      .then(r => r.json())
      .then(d => {
        // Prefer the explicit mode; fall back to the legacy email_enabled flag
        // so an older backend can never force the manual screen while email is
        // switched on.
        const m = d.mode || (d.email_enabled ? 'email' : 'manual');
        setMode(m === 'manual' ? 'manual' : 'email');
        if (d.sla_hours) setSlaHours(d.sla_hours);
      })
      .catch(() => setMode('manual'));
    // Support address shown to users — same value as the site footer.
    fetch(`${API_BASE}/api/site/footer`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.email) setSupportEmail(d.email); })
      .catch(() => {});
  }, []);

  // Countdown ticker for the resend timer.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown > 0]);  // eslint-disable-line react-hooks/exhaustive-deps

  const startCooldown = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    setCooldown(s);
  };

  const validate = () => {
    if (!email) { setError('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return false; }
    setError(''); return true;
  };

  const submitRequest = async (chosenReason) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason: chosenReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Rate-limited (or cooldown): show how long to wait, don't fake success.
        if (data.retry_after) {
          startCooldown(data.retry_after);
          throw new Error(data.error || 'Please wait before requesting another link.');
        }
        throw new Error(data.error || 'Something went wrong');
      }
      setMessage(data.message || '');
      if (data.expires_hours) setExpiresHours(data.expires_hours);
      setLastResult(data.email_sent ? 'sent' : 'queued');
      // Begin the resend timer (server tells us the cooldown length).
      startCooldown(data.resend_cooldown ?? 60);
      setSent(true);
      setModalOpen(false);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    submitRequest('Forgot Password');
  };

  const supportLine = (
    <p className="text-xs text-muted-foreground">
      Need help? Contact support at{' '}
      <a href={`mailto:${supportEmail}`} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
        <Support className="h-3 w-3" /> {supportEmail}
      </a>
    </p>
  );


  if (sent) {
    const sentOk = lastResult === 'sent';
    return (
      <AuthShell>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">
            {mode === 'email' ? 'Check your inbox' : 'Request received'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {message || (mode === 'email'
              ? <span>If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly. Check your spam folder if you don't see it.</span>
              : <span>Your request for <strong>{email}</strong> has been recorded. An administrator will send your password reset link <strong>within {slaHours} hours</strong>. If it doesn't arrive, please contact support.</span>)}
          </p>
          {mode === 'email' && sentOk && (
            <p className="text-xs text-muted-foreground">
              The link is valid for <strong>{expiresHours} {expiresHours === 1 ? 'hour' : 'hours'}</strong>.
              Requesting a new link replaces the old one.
            </p>
          )}

          {mode === 'email' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11"
                disabled={isLoading || cooldown > 0}
                onClick={() => submitRequest('Forgot Password')}
              >
                {cooldown > 0
                  ? `You can request another in ${formatWait(cooldown)}`
                  : (isLoading ? 'Sending…' : 'Send another link')}
              </Button>
              {cooldown > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  A new link will replace the one just sent.
                </p>
              )}
            </div>
          )}

          {supportLine}
        </div>
      </AuthShell>
    );
  }

  const emailField = (
    <div className="space-y-2">
      <Label htmlFor="email">Email address</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full pl-10 pr-4 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  // Unknown yet: avoid flashing the wrong UI.
  if (mode === null) {
    return (
      <AuthShell>
        <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
      </AuthShell>
    );
  }

  // ── Email mode: normal self-service form ──────────────────────────────────
  if (mode === 'email') {
    return (
      <AuthShell>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Forgot password?</h1>
            <p className="text-muted-foreground text-sm">Enter your email and we'll send a reset link.</p>
          </div>
          <form onSubmit={handleAutoSubmit} className="space-y-4">
            {emailField}
            <Button type="submit" className="w-full h-11" disabled={isLoading || cooldown > 0}>
              {cooldown > 0
                ? `Try again in ${formatWait(cooldown)}`
                : (isLoading ? 'Sending…' : 'Send Reset Link')}
            </Button>
          </form>
          {supportLine}
        </div>
      </AuthShell>
    );
  }

  // ── Email OFF: manual request modal ───────────────────────────────────────
  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="text-muted-foreground text-sm">
            Automatic reset emails are turned off. Send a request and an administrator
            will send you a reset link within {slaHours} hours.
          </p>
        </div>
        <Button className="w-full h-11 gap-2" onClick={() => { setError(''); setModalOpen(true); }}>
          <LifeBuoy className="h-4 w-4" /> Request a password reset
        </Button>
        {supportLine}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Request a password reset</h2>
              <p className="text-xs text-muted-foreground">
                Choose what you need, enter your registered email, and send.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">What do you need?</Label>
              <div className="relative">
                <select id="reason" value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {emailField}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" disabled={isLoading}
                onClick={() => { if (validate()) submitRequest(reason); }}>
                {isLoading ? 'Sending…' : <><Send className="h-4 w-4" /> Send</>}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthShell>
  );
}

export default ForgotPasswordPage;
