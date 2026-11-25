import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { ArrowRightLeft, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, History } from 'lucide-react';

const api = async (path, options = {}) => {
  const token = sessionStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const when = value => value ? new Date(value).toLocaleString() : '—';
const statusClass = status => status === 'approved' || status === 'accepted'
  ? 'bg-success/10 text-success' : status === 'rejected' || status === 'declined'
    ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground';

export default function CourseTransfersPage() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const [data, setData] = useState({ courses: [], recipients: [], incoming: [], outgoing: [] });
  const [adminRequests, setAdminRequests] = useState([]);
  const [transferHistory, setTransferHistory] = useState({});
  const [courseId, setCourseId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [earningsAction, setEarningsAction] = useState('keep_original');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const own = await api('/api/instructor/course-transfers');
      setData(own);
      if (isAdmin) {
        const admin = await api('/api/admin/course-transfers?status=all');
        setAdminRequests(admin.requests || []);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const run = async (key, path, body, success) => {
    setBusy(key); setMessage(null);
    try {
      const result = await api(path, { method: 'POST', body: JSON.stringify(body || {}) });
      setMessage({ type: 'success', text: result.message || success });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally { setBusy(''); }
  };

  const toggleHistory = async courseId => {
    if (transferHistory[courseId]) {
      setTransferHistory(previous => ({ ...previous, [courseId]: null }));
      return;
    }
    try {
      const result = await api(`/api/admin/course-transfers/${courseId}/history`);
      setTransferHistory(previous => ({ ...previous, [courseId]: result.history || [] }));
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const submit = event => {
    event.preventDefault();
    run('submit', '/api/instructor/course-transfers', { course_id: courseId, recipient_id: recipientId, reason },
      'Transfer request submitted.');
    setReason('');
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Course Ownership Transfers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Transfer a course without moving students or rebuilding its learning history.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      {message && <div className={`rounded-lg border p-3 text-sm ${message.type === 'success' ? 'border-success/30 bg-success/5 text-success' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>{message.text}</div>}

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <h2 className="font-semibold">Request a transfer</h2>
          <p className="text-sm text-muted-foreground">The recipient must accept first. Admin then reviews and approves the final ownership change.</p>
          {!data.courses.length ? <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">There are no courses owned by this account to transfer.</p> : (
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm"><span className="font-medium">Course</span>
                <select required value={courseId} onChange={e => setCourseId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Choose a course</option>{data.courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm"><span className="font-medium">New owner</span>
                <select required value={recipientId} onChange={e => setRecipientId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Choose an approved instructor or Admin</option>{data.recipients.map(person => <option key={person.id} value={person.id}>{person.name} · {person.role === 'instructor' ? 'Instructor' : 'Admin'}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm sm:col-span-2"><span className="font-medium">Reason for transfer</span>
                <textarea required minLength={8} value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background p-3" placeholder="Explain why this course should be transferred." />
              </label>
              <div className="sm:col-span-2"><Button type="submit" disabled={!courseId || !recipientId || reason.trim().length < 8 || !!busy}><ArrowRightLeft className="mr-2 h-4 w-4" />{busy === 'submit' ? 'Sending…' : 'Send transfer request'}</Button></div>
            </form>
          )}
        </CardContent>
      </Card>

      {data.incoming?.length > 0 && <section className="space-y-3"><h2 className="font-semibold">Requests waiting for your response</h2>
        {data.incoming.map(item => <Card key={item.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">{item.course_title}</p><p className="text-sm text-muted-foreground">From {item.from_instructor_name || 'Instructor'} · {when(item.requested_at)}</p><p className="mt-1 text-sm">{item.reason}</p></div>
          <div className="flex gap-2"><Button size="sm" disabled={!!busy} onClick={() => run(item.id, `/api/instructor/course-transfers/${item.id}/respond`, { decision: 'accept' })}><CheckCircle2 className="mr-1 h-4 w-4" />Accept</Button><Button size="sm" variant="outline" disabled={!!busy} onClick={() => run(item.id, `/api/instructor/course-transfers/${item.id}/respond`, { decision: 'decline' })}><XCircle className="mr-1 h-4 w-4" />Decline</Button></div>
        </CardContent></Card>)}
      </section>}

      {data.outgoing?.length > 0 && <section className="space-y-3"><h2 className="font-semibold">Your transfer requests</h2>
        {data.outgoing.map(item => <Card key={item.id}><CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">{item.course_title}</p><p className="text-sm text-muted-foreground">Recipient: {item.to_instructor_name || 'Unavailable'} · {when(item.requested_at)}</p><p className="mt-1 text-sm text-muted-foreground">{item.reason}</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(item.admin_status === 'approved' ? 'approved' : item.admin_status === 'rejected' ? 'rejected' : item.recipient_status)}`}>{item.admin_status === 'pending' ? (item.recipient_status === 'accepted' ? 'Awaiting Admin' : item.recipient_status) : item.admin_status}</span>{item.admin_status === 'pending' && item.recipient_status === 'pending' && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run(item.id, `/api/instructor/course-transfers/${item.id}/cancel`)}>Cancel request</Button>}</div>
        </CardContent></Card>)}
      </section>}

      {isAdmin && <section className="space-y-3"><div><h2 className="font-semibold">Admin review</h2><p className="text-sm text-muted-foreground">Only recipient-accepted requests can be approved. Existing certificates and completed payouts remain historical records.</p></div>
        {!adminRequests.length ? <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No transfer requests found.</p> : adminRequests.map(item => <Card key={item.id}><CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.course_title}</p><p className="text-sm text-muted-foreground">{item.from_instructor_name} <span className="px-1">→</span> {item.to_instructor_name}</p><p className="mt-1 text-sm">{item.reason}</p><p className="mt-1 text-xs text-muted-foreground">Requested {when(item.requested_at)} · Recipient: {item.recipient_status}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(item.admin_status)}`}>{item.admin_status}</span></div>
          {item.admin_status === 'pending' && item.recipient_status === 'accepted' && <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="space-y-1 text-xs"><span className="font-semibold">Unpaid course earnings</span><select value={earningsAction} onChange={e => setEarningsAction(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="keep_original">Keep with original instructor (recommended)</option><option value="reassign_unpaid">Reassign unpaid course earnings to new owner</option></select></label>
            <label className="space-y-1 text-xs"><span className="font-semibold">Admin note (optional)</span><input value={note} onChange={e => setNote(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Reason or audit note" /></label>
            <div className="flex gap-2"><Button size="sm" disabled={!!busy} onClick={() => run(item.id, `/api/admin/course-transfers/${item.id}/decision`, { decision: 'approve', unpaid_earnings_action: earningsAction, note })}>Approve transfer</Button><Button size="sm" variant="destructive" disabled={!!busy} onClick={() => run(item.id, `/api/admin/course-transfers/${item.id}/decision`, { decision: 'reject', note })}>Reject</Button></div>
          </div>}
          {item.admin_status === 'pending' && item.recipient_status !== 'accepted' && <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Waiting for the selected recipient to accept or decline. Admin may reject the request at this stage.</p><Button size="sm" variant="destructive" disabled={!!busy} onClick={() => run(item.id, `/api/admin/course-transfers/${item.id}/decision`, { decision: 'reject', note })}>Reject request</Button></div>}
          <div><button type="button" onClick={() => toggleHistory(item.course_id)} className="text-xs font-semibold text-primary hover:underline"> {transferHistory[item.course_id] ? 'Hide ownership history' : 'View ownership history'}</button>
            {Array.isArray(transferHistory[item.course_id]) && <div className="mt-2 space-y-1 rounded-lg bg-muted/40 p-3">{transferHistory[item.course_id].length ? transferHistory[item.course_id].map(event => <p key={event.id} className="text-xs text-muted-foreground">{event.from_instructor_name} → {event.to_instructor_name} · {when(event.created_at)} · Unpaid earnings: {event.unpaid_earnings_action || 'keep original'}</p>) : <p className="text-xs text-muted-foreground">No completed transfer history yet.</p>}</div>}
          </div>
        </CardContent></Card>)}
      </section>}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground"><History className="mt-0.5 h-4 w-4 shrink-0" /><p>Course ID, enrolled students, lesson and quiz records, attempts, grades, reviews, progress, live-session RSVPs and issued certificates are retained. Previously issued certificates keep the instructor name shown when issued; future certificates use the new owner. Historical transactions and paid payouts stay with the original instructor unless Admin explicitly reassigns eligible unpaid course earnings.</p></div>
    </div>
  );
}
