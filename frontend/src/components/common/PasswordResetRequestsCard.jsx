/**
 * Admin password-reset request centre with independent handling tabs,
 * per-tab search/date/status filters, and Ghana-time timestamps.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, RefreshCw, Loader2, Copy, Check, Mail, Link2, XCircle, Search, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { BrandedSelect } from '@/components/common/BrandedSelect';
import { API } from '@/lib/adminApi';

const TABS = [
  { id: 'all', label: 'All Requests' },
  { id: 'gmail', label: 'Gmail Sent' },
  { id: 'manual', label: 'Manual' },
  { id: 'fallback', label: 'Manual Fallback' },
];

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

function parseResetTimestamp(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value !== 'string') return null;
  let normalized = value.trim();
  if (!normalized) return null;
  normalized = normalized.replace(' ', 'T');
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) normalized += 'Z';
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

function fmt(value) {
  const date = parseResetTimestamp(value);
  if (!date) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra',
  }).format(date);
}

function dateInputValue(value) {
  const date = parseResetTimestamp(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Accra', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const RESET_SLA_HOURS = 24;
function dueBy(value) {
  const created = parseResetTimestamp(value);
  return created ? new Date(created.getTime() + RESET_SLA_HOURS * 3600 * 1000) : null;
}

function matchesTab(row, tab) {
  const method = row.effective_handling_method || row.handling_method || (
    row.status === 'manual_fallback' ? 'manual_fallback' :
    ['email_sent', 'link_sent'].includes(row.status) ? 'automatic_email' :
    ['pending', 'link_generated'].includes(row.status) ? 'manual_mode' : 'legacy_unknown'
  );
  if (tab === 'gmail') return row.status === 'email_sent';
  if (tab === 'manual') return method === 'manual_mode';
  if (tab === 'fallback') return method === 'manual_fallback' || row.status === 'manual_fallback';
  return true;
}

export default function PasswordResetRequestsCard({ onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const [links, setLinks] = useState({});
  const [copied, setCopied] = useState('');
  const [msg, setMsg] = useState(null);
  const [emailOn, setEmailOn] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    API('/api/admin/password-reset-requests?status=all')
      .then(data => setRequests(Array.isArray(data.requests) ? data.requests : []))
      .catch(error => setMsg({ type: 'error', text: error.message || 'Could not load password-reset requests.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { onChanged?.(); }, [requests, onChanged]);
  useEffect(() => {
    API('/api/auth/password-reset-mode')
      .then(data => setEmailOn(data.email_enabled === true))
      .catch(() => setEmailOn(false));
  }, []);

  const counts = useMemo(() => ({
    all: requests.length,
    gmail: requests.filter(row => matchesTab(row, 'gmail')).length,
    manual: requests.filter(row => matchesTab(row, 'manual')).length,
    fallback: requests.filter(row => matchesTab(row, 'fallback')).length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter(row => {
      if (!matchesTab(row, activeTab)) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      const haystack = `${row.student_name || ''} ${row.email || ''}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      const day = dateInputValue(row.created_at_iso || row.created_at);
      if (fromDate && (!day || day < fromDate)) return false;
      if (toDate && (!day || day > toDate)) return false;
      return true;
    }).sort((a, b) => {
      const at = parseResetTimestamp(a.created_at_iso || a.created_at)?.getTime() || 0;
      const bt = parseResetTimestamp(b.created_at_iso || b.created_at)?.getTime() || 0;
      return bt - at;
    });
  }, [requests, activeTab, statusFilter, search, fromDate, toDate]);

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(visibleRequests.length / PAGE_SIZE));
  const pageRows = visibleRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [activeTab, statusFilter, search, fromDate, toDate]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const generate = async rid => {
    setBusy(rid); setMsg(null);
    try {
      const data = await API(`/api/admin/password-reset-requests/${rid}/generate-link`, { method: 'POST' });
      setLinks(previous => ({ ...previous, [rid]: data.link }));
      setMsg({ type: 'success', text: `Link generated. It expires in ${data.expires_hours || 12} hours.` });
      load();
    } catch (error) { setMsg({ type: 'error', text: error.message }); }
    finally { setBusy(''); }
  };

  const copy = async (rid, link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(rid);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setMsg({ type: 'error', text: 'Could not copy. Select the link and copy it manually.' });
    }
  };

  const emailIt = async (rid, link) => {
    setBusy(rid); setMsg(null);
    try {
      const data = await API(`/api/admin/password-reset-requests/${rid}/email-link`, {
        method: 'POST', body: JSON.stringify({ link }),
      });
      setLinks(previous => { const next = { ...previous }; delete next[rid]; return next; });
      setMsg({ type: 'success', text: data.message });
      load();
    } catch (error) { setMsg({ type: 'error', text: error.message }); }
    finally { setBusy(''); }
  };

  const dismiss = async rid => {
    setBusy(rid); setMsg(null);
    try {
      await API(`/api/admin/password-reset-requests/${rid}/dismiss`, { method: 'POST' });
      setMsg({ type: 'success', text: 'Request dismissed.' });
      load();
    } catch (error) { setMsg({ type: 'error', text: error.message }); }
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
              Track automatic email delivery, admin-configured Manual Mode and automatic delivery failures.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={load} className="gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pt-3 pb-1" role="tablist" aria-label="Password reset request categories">
          {TABS.map(tab => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${activeTab === tab.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}>
              {tab.label} <span className="ml-1 opacity-75">({counts[tab.id]})</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 mb-4">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={event => setSearch(event.target.value)}
              placeholder="Search student or email"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm" />
          </label>
          <BrandedSelect value={statusFilter} onChange={event => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="manual_fallback">Manual Fallback</option>
            <option value="link_generated">Link Generated</option>
            <option value="link_sent">Link Sent (older)</option>
            <option value="email_sent">Email Sent</option>
            <option value="completed">Completed</option>
            <option value="dismissed">Dismissed</option>
          </BrandedSelect>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input aria-label="From date" type="date" value={fromDate} max={toDate || undefined}
              onChange={event => setFromDate(event.target.value)} className="h-10 min-w-0 w-full bg-transparent text-sm" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input aria-label="To date" type="date" value={toDate} min={fromDate || undefined}
              onChange={event => setToDate(event.target.value)} className="h-10 min-w-0 w-full bg-transparent text-sm" />
          </label>
        </div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{visibleRequests.length} matching request{visibleRequests.length === 1 ? '' : 's'}</p>
          {(search || statusFilter !== 'all' || fromDate || toDate) && (
            <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">Clear filters</button>
          )}
        </div>
        {msg && (
          <p className={`text-xs mb-3 ${msg.type === 'error' ? 'text-destructive' : 'text-success'}`}>{msg.text}</p>
        )}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : visibleRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No requests match this tab and its filters.</p>
        ) : (
          <div className="space-y-3">
            {pageRows.map(row => {
              const created = row.created_at_iso || row.created_at;
              const sent = row.email_sent_at_iso || row.email_sent_at;
              const generated = row.link_generated_at_iso || row.link_generated_at;
              const lastAction = row.last_action_at_iso || row.last_action_at;
              const due = dueBy(created);
              const isOpen = !['completed', 'dismissed'].includes(row.status);
              return (
                <div key={row.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{row.student_name || row.email}</p>
                      <p className="text-xs text-muted-foreground break-all">{row.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{row.reason || 'Forgot Password'} · Requested {fmt(created)}</p>
                      {sent && <p className="text-xs text-success mt-0.5">Email sent {fmt(sent)}</p>}
                      {generated && <p className="text-xs text-muted-foreground mt-0.5">Link generated {fmt(generated)}</p>}
                      {lastAction && <p className="text-xs text-muted-foreground mt-0.5">Last admin/system action {fmt(lastAction)}</p>}
                      {isOpen && due && (
                        <p className={`text-xs mt-1 ${due < new Date() ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {due < new Date() ? `Overdue — was due ${fmt(due.toISOString())}` : `Send by ${fmt(due.toISOString())}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={STATUS_STYLES[row.status] || STATUS_STYLES.dismissed}>
                        {STATUS_LABELS[row.status] || String(row.status || 'Unknown').replace(/_/g, ' ')}
                      </Badge>
                      {row.effective_handling_method === 'manual_mode' && <Badge className="bg-sky-500/10 text-sky-700 border-sky-500/20">Manual Mode</Badge>}
                      {row.effective_handling_method === 'manual_fallback' && <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">Automatic failure</Badge>}
                    </div>
                  </div>
                  {row.delivery_error && (
                    <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-xs text-destructive break-words">
                      <strong>Email delivery error:</strong> {row.delivery_error}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isOpen && (
                      <Button size="sm" onClick={() => generate(row.id)} disabled={busy === row.id} className="gap-1.5">
                        {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                        Generate Password Reset Link
                      </Button>
                    )}
                    {links[row.id] && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => copy(row.id, links[row.id])} className="gap-1.5">
                          {copied === row.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === row.id ? 'Copied' : 'Copy link'}
                        </Button>
                        {emailOn && (
                          <Button size="sm" variant="outline" onClick={() => emailIt(row.id, links[row.id])}
                            disabled={busy === row.id} className="gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> Email link
                          </Button>
                        )}
                      </>
                    )}
                    {isOpen && (
                      <Button size="sm" variant="outline" onClick={() => dismiss(row.id)}
                        disabled={busy === row.id} className="gap-1.5 text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" /> Dismiss
                      </Button>
                    )}
                  </div>
                  {links[row.id] && (
                    <input readOnly value={links[row.id]} onFocus={event => event.target.select()}
                      className="mt-2 w-full rounded-lg border border-border bg-muted/40 p-2 text-xs" />
                  )}
                </div>
              );
            })}
            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Page {page} of {pageCount}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1}
                    onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={page >= pageCount}
                    onClick={() => setPage(value => Math.min(pageCount, value + 1))}>Next</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
