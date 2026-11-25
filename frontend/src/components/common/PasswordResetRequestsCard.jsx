/**
 * PasswordResetRequestsCard — admin review of forgot-password requests.
 *
 * Lists every request (email, reason, date/time, status) and, per request, lets
 * an administrator generate a one-time reset link, copy it, optionally email it
 * (only when outgoing email is on), or dismiss it. The raw link is shown once
 * and can be copied; it is never stored or logged.
 */
import { BrandedSelect } from '@/components/common/BrandedSelect';
import { useCallback, useEffect, useState } from 'react';
import { KeyRound, RefreshCw, Loader2, Copy, Check, Mail, Link2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { API } from '@/lib/adminApi';

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  manual_fallback: 'bg-orange-500/10 text-orange-700 border-orange-500/25',
  link_generated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  link_sent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  email_sent: 'bg-success/10 text-success border-success/20',
  completed: 'bg-success/10 text-success border-success/20',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS = {
  pending: 'Pending', manual_fallback: 'Manual Fallback',
  link_generated: 'Link Generated', link_sent: 'Link Sent',
  email_sent: 'Email Sent', completed: 'Completed', dismissed: 'Dismissed',
};

function parseResetTimestamp(ts) {
  if (ts == null || ts === '') return null;
  if (ts instanceof Date) return Number.isFinite(ts.getTime()) ? ts : null;
  if (typeof ts === 'number') {
    const date = new Date(ts);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof ts !== 'string') return null;
  const value = ts.trim();
  if (!value) return null;
  // Preserve explicit UTC offsets; treat database timestamps without a zone as UTC.
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasZone ? normalized : `${normalized}Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function fmt(ts) {
  const date = parseResetTimestamp(ts);
  return date ? date.toLocaleString() : (ts == null || ts === '' ? '—' : 'Date unavailable');
}

// The promised turnaround for a manual reset request. Shown so an admin can see
// at a glance which requests are close to (or past) their 24-hour window.
const RESET_SLA_HOURS = 24;
function dueBy(ts) {
  const created = parseResetTimestamp(ts);
  if (!created) return null;
  const due = new Date(created.getTime() + RESET_SLA_HOURS * 3600 * 1000);
  return Number.isFinite(due.getTime()) ? due : null;
}

export default function PasswordResetRequestsCard({ onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [links, setLinks] = useState({});   // request_id -> link
  const [copied, setCopied] = useState('');
  const [msg, setMsg] = useState(null);
  const [emailOn, setEmailOn] = useState(true);  // hide "Email link" when email sending is off

  const load = useCallback(() => {
    setLoading(true);
    API(`/api/admin/password-reset-requests?status=${filter}`)
      .then(d => setRequests(d.requests || []))
      .catch(e => setMsg({ type: 'error', text: e.message }))
      .finally(() => setLoading(false));
  }, [filter]);

  // Let the parent refresh the tab badge when a request is resolved.
  useEffect(() => { onChanged?.(); }, [requests, onChanged]);

  useEffect(() => { load(); }, [load]);

  // Manual reset mode can still use the configured sender after an admin
  // generates a link. Check the master email switch, not the reset policy.
  useEffect(() => {
    API('/api/auth/password-reset-mode')
      .then(d => setEmailOn(d.email_enabled === true))
      .catch(() => setEmailOn(false));
  }, []);

  const generate = async (rid) => {
    setBusy(rid); setMsg(null);
    try {
      const d = await API(`/api/admin/password-reset-requests/${rid}/generate-link`, { method: 'POST' });
      setLinks(prev => ({ ...prev, [rid]: d.link }));
      setMsg({ type: 'success', text: `Link generated. It expires in ${d.expires_hours || 12} hours.` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(''); }
  };

  const copy = async (rid, link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(rid);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setMsg({ type: 'error', text: 'Could not copy. Select the link and copy it manually.' });
    }
  };

  const emailIt = async (rid, link) => {
    setBusy(rid); setMsg(null);
    try {
      const d = await API(`/api/admin/password-reset-requests/${rid}/email-link`, {
        method: 'POST', body: JSON.stringify({ link }),
      });
      setLinks(prev => { const next = { ...prev }; delete next[rid]; return next; });
      setMsg({ type: 'success', text: d.message });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(''); }
  };

  const dismiss = async (rid) => {
    setBusy(rid); setMsg(null);
    try {
      await API(`/api/admin/password-reset-requests/${rid}/dismiss`, { method: 'POST' });
      setMsg({ type: 'success', text: 'Request dismissed.' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(''); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Forgot Password Requests
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Users who asked for help. Generate a one-time link and share it, or email it
              when outgoing email is on.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BrandedSelect value={filter} onChange={e => setFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="manual_fallback">Manual Fallback</option>
              <option value="link_generated">Link Generated</option>
              <option value="email_sent">Email Sent</option>
              <option value="completed">Completed</option>
              <option value="dismissed">Dismissed</option>
            </BrandedSelect>
            <Button size="sm" variant="outline" onClick={load} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {msg && (
          <p className={`text-xs mb-3 ${msg.type === 'error' ? 'text-destructive' : 'text-success'}`}>{msg.text}</p>
        )}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.reason || 'Forgot Password'} · {fmt(r.created_at)}
                    </p>
                    {(r.status === 'pending' || r.status === 'manual_fallback' || r.status === 'link_generated' || r.status === 'link_sent') && dueBy(r.created_at) && (
                      <p className={`text-xs mt-0.5 ${dueBy(r.created_at) < new Date() ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {dueBy(r.created_at) < new Date()
                          ? `Overdue — was due ${fmt(dueBy(r.created_at).toISOString())}`
                          : `Send by ${fmt(dueBy(r.created_at).toISOString())}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={STATUS_STYLES[r.status] || STATUS_STYLES.dismissed}>
                      {STATUS_LABELS[r.status] || r.status.replace(/_/g, ' ')}
                    </Badge>
                    {r.status === 'manual_fallback' && r.has_active_link && (
                      <Badge className={STATUS_STYLES.link_generated}>Link Generated</Badge>
                    )}
                  </div>
                </div>

                {r.delivery_error && (
                  <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-xs text-destructive break-words">
                    <strong>Email delivery error:</strong> {r.delivery_error}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== 'completed' && r.status !== 'dismissed' && (
                    <Button size="sm" onClick={() => generate(r.id)} disabled={busy === r.id} className="gap-1.5">
                    {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                    Generate Password Reset Link
                    </Button>
                  )}
                  {links[r.id] && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => copy(r.id, links[r.id])} className="gap-1.5">
                        {copied === r.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === r.id ? 'Copied' : 'Copy link'}
                      </Button>
                      {emailOn && (
                        <Button size="sm" variant="outline" onClick={() => emailIt(r.id, links[r.id])}
                          disabled={busy === r.id} className="gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> Email link
                        </Button>
                      )}
                    </>
                  )}
                  {r.status !== 'completed' && r.status !== 'dismissed' && (
                    <Button size="sm" variant="outline" onClick={() => dismiss(r.id)}
                      disabled={busy === r.id} className="gap-1.5 text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5" /> Dismiss
                    </Button>
                  )}
                </div>

                {links[r.id] && (
                  <input readOnly value={links[r.id]} onFocus={e => e.target.select()}
                    className="mt-2 w-full rounded-lg border border-border bg-muted/40 p-2 text-xs" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
