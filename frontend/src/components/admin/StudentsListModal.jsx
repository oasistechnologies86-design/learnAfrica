import { useEffect, useState } from 'react';
import { BrandedSelect } from '@/components/common/BrandedSelect';
import { X, Search, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { formatPrice } from '@/lib/money';

const paymentLabel = value => ({
  not_required: 'Not required',
  no_payment: 'No payment record',
  success: 'Paid',
  completed: 'Paid',
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  cancelled: 'Cancelled',
  abandoned: 'Abandoned',
  refunded: 'Refunded',
  reversed: 'Reversed',
}[String(value || '').toLowerCase()] || String(value || 'Unknown').replace(/_/g, ' '));

const badgeClass = value => {
  const status = String(value || '').toLowerCase();
  if (['success', 'completed', 'paid', 'completed'].includes(status)) return 'bg-success/10 text-success';
  if (['pending', 'in_progress', 'active'].includes(status)) return 'bg-warning/10 text-warning';
  if (['failed', 'cancelled', 'abandoned', 'refunded', 'reversed', 'expired'].includes(status)) return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
};

export default function StudentsListModal({ endpoint, title = 'Students', subtitle, summary, onClose }) {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [progress, setProgress] = useState('all');
  const [payment, setPayment] = useState('all');
  const [enrollment, setEnrollment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: '10',
          search: appliedSearch,
          progress,
          payment,
          enrollment,
        });
        const token = sessionStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}${endpoint}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load students.');
        if (!active) return;
        setRows(data.students || []);
        setCount(Number(data.count || 0));
        setTotalPages(Math.max(1, Number(data.total_pages || 1)));
      } catch (e) {
        if (active) setError(e.message || 'Could not load students.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [endpoint, page, appliedSearch, progress, payment, enrollment]);

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const summaryCards = [
    ['Gross revenue', summary?.gross_revenue],
    ['Paystack fees', summary?.paystack_fees],
    ['After Paystack', summary?.net_after_paystack],
    ['Instructor earnings', summary?.instructor_earnings],
    ['Platform share', summary?.platform_earnings],
    ['Students', summary?.student_count ?? summary?.total_students],
  ].filter(([, value]) => value !== undefined && value !== null);

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-background/80 p-3 pt-8 backdrop-blur-sm sm:p-6 sm:pt-12"
      role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-6xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0 text-primary" />
              <h2 className="truncate text-lg font-bold sm:text-xl">{title}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle || 'Review enrolments, progress and payment status.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close student list"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {summaryCards.length > 0 && (
          <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-6">
            {summaryCards.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="mt-1 truncate text-base font-bold tabular-nums">
                  {label === 'Students' ? Number(value || 0).toLocaleString() : formatPrice(value || 0)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <form className="flex gap-2 sm:col-span-2 lg:col-span-1" onSubmit={event => {
              event.preventDefault();
              setAppliedSearch(search.trim());
              setPage(1);
            }}>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={event => setSearch(event.target.value)}
                  placeholder="Search student or course"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
              </div>
              <button type="submit" className="rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">Search</button>
            </form>
            <BrandedSelect value={progress} onChange={event => updateFilter(setProgress, event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All progress</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </BrandedSelect>
            <BrandedSelect value={payment} onChange={event => updateFilter(setPayment, event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="not_required">Not required (free)</option>
              <option value="no_payment">No payment record</option>
            </BrandedSelect>
            <BrandedSelect value={enrollment} onChange={event => updateFilter(setEnrollment, event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All enrolments</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </BrandedSelect>
          </div>

          {loading ? (
            <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading students
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">{error}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-semibold">No students found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing the search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">Student</th>
                    <th className="p-3 font-semibold">Course</th>
                    <th className="p-3 font-semibold">Enrolled</th>
                    <th className="p-3 font-semibold">Progress</th>
                    <th className="p-3 font-semibold">Payment</th>
                    <th className="p-3 font-semibold">Enrolment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student, index) => (
                    <tr key={`${student.student_id}:${student.course_id}:${index}`} className="border-t border-border/60">
                      <td className="p-3">
                        <p className="font-semibold">{student.name || 'Student'}</p>
                        <p className="text-xs text-muted-foreground">{student.email || '—'}{student.phone ? ` · ${student.phone}` : ''}</p>
                      </td>
                      <td className="max-w-[220px] p-3">{student.course_title || '—'}</td>
                      <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">{student.enrolled_at ? String(student.enrolled_at).slice(0, 10) : '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, Number(student.progress || 0)))}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{Number(student.progress || 0)}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badgeClass(student.payment_status)}`}>
                          {paymentLabel(student.payment_status)}
                        </span>
                        {student.payment_amount != null && (
                          <p className="mt-1 text-xs text-muted-foreground">{formatPrice(student.payment_amount)}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badgeClass(student.enrollment_status)}`}>
                          {student.enrollment_status === 'expired' ? 'Expired' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">{count.toLocaleString()} enrolment record(s)</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-20 text-center text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))}
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
