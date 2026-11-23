import { useState, useEffect } from 'react';
import { BrandedSelect } from '@/components/common/BrandedSelect';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { cn } from '@/lib/utils';
import {
  BookOpen, Users, DollarSign, Star, TrendingUp, Award,
  ChevronDown, ChevronUp, Play, CheckCircle2, Loader2,
  BookMarked, Target, GraduationCap, Info, Search
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { API_BASE } from '@/lib/api';
import { formatPrice } from '@/lib/money';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const api = async (endpoint, opts = {}) => {
  const token = sessionStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Earnings Card ─────────────────────────────────────────────────────────────
// Human-readable destination for a saved payout method.
export function payoutDestinationLabel(method, details) {
  if (!method || !details) return '';
  if (method === 'momo') {
    const p = details.provider || 'Mobile Money';
    const n = details.phone || '';
    return n ? `${p} ${n}` : p;
  }
  if (method === 'bank') {
    const b = details.bank_name || 'Bank';
    const n = details.account_number || '';
    return n ? `${b} · ${n}` : b;
  }
  return '';
}

function EarningsCard({ stats, onChanged }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [summary, setSummary]   = useState(null);
  const [busy,    setBusy]      = useState(false);
  const [msg,     setMsg]       = useState(null);
  const [payoutMethod, setPayoutMethod] = useState(null);
  const [feePolicy, setFeePolicy] = useState(null);
  const grossRevenue   = stats?.gross_revenue   || 0;
  const myEarnings     = stats?.total_earnings  || 0;
  const platformShare  = stats?.platform_share  || 0;
  // Split percentages come from the saved admin config. If it isn't configured
  // we show a dash rather than silently presenting a 50/50 that nobody chose.
  const splitConfigured = stats?.split_configured !== false && stats?.instructor_share_pct != null;
  const instructorPct  = splitConfigured ? Number(stats.instructor_share_pct) : null;
  const platformPct    = splitConfigured ? Number(stats.platform_share_pct ?? stats.admin_share_pct) : null;
  const instructorPctLabel = instructorPct == null ? '—' : instructorPct;
  const platformPctLabel   = platformPct   == null ? '—' : platformPct;

  const loadSummary = () => {
    api('/api/instructor/payouts/summary')
      .then(setSummary)
      .catch(() => {});
  };
  useEffect(() => { loadSummary(); }, []);
  useEffect(() => {
    api('/api/instructor/paystack-fee-policy').then(setFeePolicy).catch(() => setFeePolicy(null));
  }, []);
  useEffect(() => {
    api('/api/users/me/payment-method')
      .then(d => setPayoutMethod(d?.configured ? d : null))
      .catch(() => {});
  }, []);

  const available = summary?.available ?? 0;
  const requested = summary?.requested ?? 0;
  const paidOut   = summary?.total_paid ?? 0;
  const hasOpen   = (summary?.requests || []).some(r => r.status === 'requested');
  // Admins own the platform and keep 100% of their own course revenue
  // directly, so payouts never apply to them. The backend enforces this too.
  const isAdmin   = !!summary?.is_admin;

  const requestPayout = async () => {
    const dest = payoutDestinationLabel(payoutMethod?.method, payoutMethod?.details);
    const lines = [
      `Request payment of ${formatPrice(available)}?`,
      dest ? `\nWe will send it to: ${dest}` : '',
      '\nMoney will arrive within 24 hours.',
    ].filter(Boolean).join('\n');
    if (!(await window.LearnAfricaDialog.confirm(lines))) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api('/api/instructor/payouts/request', { method: 'POST' });
      setMsg({ type: 'success', text: r.message || 'Request received.' });
      loadSummary();
      onChanged?.();
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Could not request payment.' });
    } finally { setBusy(false); }
  };

  const statusStyles = {
    requested: 'bg-warning/10 text-warning border-warning/30',
    sent:      'bg-success/10 text-success border-success/30',
    rejected:  'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">My Earnings</p>
            <p className="text-2xl font-bold">{formatPrice(myEarnings)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Breakdown</span>
          {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Payout state */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/40 p-2.5">
          <p className="text-3xs uppercase tracking-wider font-bold text-muted-foreground">Available</p>
          <p className="text-sm font-bold mt-0.5 tabular-nums">{formatPrice(available)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-2.5">
          <p className="text-3xs uppercase tracking-wider font-bold text-muted-foreground">Requested</p>
          <p className="text-sm font-bold mt-0.5 tabular-nums">{formatPrice(requested)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-2.5">
          <p className="text-3xs uppercase tracking-wider font-bold text-muted-foreground">Paid out</p>
          <p className="text-sm font-bold mt-0.5 tabular-nums">{formatPrice(paidOut)}</p>
        </div>
      </div>

      {msg && (
        <div className={cn('p-2.5 rounded-lg text-xs flex items-center gap-2',
          msg.type === 'success' ? 'bg-success/10 text-success border border-success/30'
                                 : 'bg-destructive/10 text-destructive border border-destructive/30')}>
          {msg.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
          <span>{msg.text}</span>
        </div>
      )}

      {isAdmin ? (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            You are an admin. Revenue from your own courses is received directly,
            so payout requests do not apply to your account.
          </p>
        </div>
      ) : (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={requestPayout}
          disabled={busy || hasOpen || available < 1}
          className={cn(
            'h-10 px-5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2',
            (busy || hasOpen || available < 1)
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-success text-success-foreground hover:bg-success/90'
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
          {hasOpen ? 'Payment in progress' : 'Request payment'}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-2xs text-muted-foreground">
            We send payouts to your saved method within 24 hours.
          </p>
          {payoutDestinationLabel(payoutMethod?.method, payoutMethod?.details) ? (
            <p className="text-2xs text-foreground mt-0.5 truncate">
              Send to: <span className="font-semibold">{payoutDestinationLabel(payoutMethod?.method, payoutMethod?.details)}</span>
            </p>
          ) : (
            <p className="text-2xs text-warning mt-0.5">
              No payout method saved yet — add one on your Profile.
            </p>
          )}
        </div>
      </div>
      )}

      {/* Request history */}
      {(summary?.requests || []).length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-3xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Payment requests</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {summary.requests.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-bold tabular-nums">{formatPrice(r.amount)}</span>
                  <span className="text-muted-foreground ml-2">
                    {String(r.requested_at || '').slice(0, 10)}
                  </span>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full border text-3xs font-bold uppercase',
                  statusStyles[r.status] || 'bg-muted text-muted-foreground border-border')}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBreakdown && (
        <div className="border-t border-border pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Gross Revenue (all sales)</span>
            <span className="font-semibold text-foreground">{formatPrice(grossRevenue)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Paystack fee</span>
            <span className="font-medium">−{formatPrice(stats?.paystack_fees || 0)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">
            Calculated by LearnAfrica using the fee policy saved for each transaction
            {Number(stats?.paystack_fee_unverified_count || 0) > 0 ? ` · ${stats.paystack_fee_unverified_count} calculated from the saved fee policy` : ''}
          </p>
          {feePolicy && (
            <div className="flex justify-between text-muted-foreground">
              <span>Configured fee rate ({feePolicy.source === 'instructor_override' ? 'instructor override' : 'platform default'})</span>
              <span className="font-medium">{Number(feePolicy.rate_pct || 0).toFixed(2)}% · from {feePolicy.effective_from || '—'}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Revenue after Paystack fee</span>
            <span className="font-semibold text-foreground">{formatPrice(stats?.net_after_paystack ?? grossRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-success font-medium">Your share ({instructorPctLabel}%)</span>
            <span className="font-bold text-success">{formatPrice(myEarnings)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform share ({platformPctLabel}%)</span>
            <span className="font-medium">{formatPrice(platformShare)}</span>
          </div>
          {/* visual bar */}
          <div className="flex rounded-full overflow-hidden h-2 mt-1">
            <div className="bg-success transition-all" style={{width:`${instructorPct || 0}%`}} />
            <div className="bg-muted transition-all" style={{width:`${platformPct || 0}%`}} />
          </div>
          <p className="text-2xs text-muted-foreground">Your current split applies to new sales. Earlier transactions keep the amounts recorded when they were created.</p>
        </div>
      )}
    </div>
  );
}

// ── Guide Video Player ────────────────────────────────────────────────────────
function GuideVideoPlayer({ url, title }) {
  // Detect YouTube
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const getEmbedUrl = (raw) => {
    try {
      if (raw.includes('youtube.com/watch')) {
        const id = new URL(raw).searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : raw;
      }
      if (raw.includes('youtu.be/')) {
        const id = raw.split('/').pop().split('?')[0];
        return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
      }
    } catch {}
    return raw;
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-slate-950 shadow-md">
      {isYouTube ? (
        <div className="relative" style={{paddingBottom: '56.25%'}}>
          <iframe
            src={getEmbedUrl(url)}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        // Local file or direct video URL
        <video
          src={url}
          controls
          controlsList="nodownload"
          preload="metadata"
          className="w-full max-h-[360px] bg-slate-950"
          style={{display:'block'}}
        >
          <p className="p-4 text-sm text-muted-foreground">
            Your browser does not support this video format.
            <a href={url} target="_blank" rel="noreferrer" className="text-primary ml-1 underline">
              Open video
            </a>
          </p>
        </video>
      )}
    </div>
  );
}

// ── Guide Section ─────────────────────────────────────────────────────────────
function InstructorGuide() {
  const [steps, setSteps]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api('/api/instructor-guide')
      .then(d => {
        const list = d.steps || [];
        setSteps(list);
        if (list.length) setExpandedId(list[0].id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
    </div>
  );
  // Show a friendly card when there are no steps yet
  if (!steps.length) {
    return (
      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-5 w-5 text-primary" />
            Instructor Quick-Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {error
              ? 'Could not load the guide right now. Please try again later.'
              : 'No guide has been published yet. Check back soon!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-5 w-5 text-primary" />
          Instructor Quick-Start Guide
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Follow these steps to publish your first course. Click any step to expand it.
        </p>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border">
        {steps.map((step, index) => {
          const isOpen = expandedId === step.id;
          const hasVideo = !!step.video_url;

          return (
            <div key={step.id} className={cn(isOpen && 'bg-primary/[0.015]')}>
              {/* ── Header row ── */}
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : step.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors group"
              >
                {/* Number circle */}
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-all duration-200',
                  isOpen
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'bg-background border-border text-muted-foreground group-hover:border-primary/50'
                )}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold text-sm transition-colors',
                    isOpen ? 'text-primary' : 'text-foreground'
                  )}>
                    {step.title}
                  </p>
                  {!isOpen && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">
                      {step.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasVideo && !isOpen && (
                    <span className="hidden sm:flex items-center gap-1 text-2xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Play className="h-2.5 w-2.5 fill-primary" /> Video
                    </span>
                  )}
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* ── Expanded body ── */}
              {isOpen && (
                <div className="px-5 pb-6 space-y-5 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-sm text-foreground/80 leading-relaxed">{step.description}</p>

                  {hasVideo ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Play className="h-3 w-3" /> Tutorial Video
                      </p>
                      <GuideVideoPlayer url={step.video_url} title={step.title} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-dashed border-border/60">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Play className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">No video for this step yet</p>
                        <p className="text-2xs text-muted-foreground/60 mt-0.5">The admin will upload a tutorial video soon.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export function InstructorDashboard() {
  const { user } = useAuth();
  const isAdminViewer = ['admin', 'superadmin'].includes(user?.role);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentConfigured, setPaymentConfigured] = useState(true); // assume true until proven otherwise
  const [myStudents, setMyStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourse, setStudentCourse] = useState('all');
  const [studentProgress, setStudentProgress] = useState('all');
  const [studentPayment, setStudentPayment] = useState('all');
  const [studentEnrollment, setStudentEnrollment] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const [saleTransactions, setSaleTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('all');
  const [transactionPage, setTransactionPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const TRANSACTIONS_PER_PAGE = 10;

  const getInitials = n => n ? n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) : '??';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await api('/api/instructor/stats');
        setStats(data);
      } catch {
        setStats({ total_courses:0, total_students:0, total_earnings:0, average_rating:0,
          gross_revenue:0, platform_share:0, instructor_share_pct:null, platform_share_pct:null,
          split_configured:false,
          monthly_enrollments:[], course_performance:[], recent_students:[] });
      }
      setLoading(false);
    };
    fetchStats();
    api('/api/instructor/students')
      .then(data => { setMyStudents(data.students || []); setStudentsError(''); })
      .catch(error => { setMyStudents([]); setStudentsError(error.message || 'Could not load your students.'); })
      .finally(() => setStudentsLoading(false));
    // Check payment-method configuration
    api('/api/users/me/payment-method')
      .then(d => setPaymentConfigured(!!d?.configured))
      .catch(() => { /* silent */ });
  }, []);

  useEffect(() => {
    const instructorId = user?.id || user?.user_id;
    if (!instructorId || isAdminViewer) {
      setTransactionsLoading(false);
      return;
    }
    let active = true;
    setTransactionsLoading(true);
    api('/api/transactions')
      .then(data => {
        if (!active) return;
        const ownSales = (data.transactions || []).filter(tx =>
          tx.instructor_id === instructorId &&
          ['purchase', 'quiz_extra_attempt'].includes(String(tx.type || '').toLowerCase())
        );
        setSaleTransactions(ownSales);
        setTransactionsError('');
      })
      .catch(error => {
        if (!active) return;
        setSaleTransactions([]);
        setTransactionsError(error.message || 'Could not load transaction history.');
      })
      .finally(() => { if (active) setTransactionsLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.user_id, isAdminViewer]);

  const refreshStats = () => {
    api('/api/instructor/stats').then(setStats).catch(() => {});
  };

  // Pending/rejected screens are now handled by InstructorLayout at the route level.
  // This component only renders for approved instructors and admins.

  const totalPages = Math.ceil((stats?.recent_students?.length || 0) / ITEMS_PER_PAGE);
  const paginatedStudents = (stats?.recent_students || []).slice(
    (currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE
  );

  const chartData = (stats?.monthly_enrollments || []).map(m => ({
    month: m.month?.slice(5) || m.month,
    enrollments: m.count
  }));

  const studentCourses = [...new Map(myStudents.map(student => [
    student.course_id, { id: student.course_id, title: student.course_title },
  ])).values()];
  const filteredMyStudents = myStudents.filter(student => {
    const query = studentSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      student.name, student.email, student.phone, student.course_title,
    ].some(value => String(value || '').toLowerCase().includes(query));
    const matchesCourse = studentCourse === 'all' || student.course_id === studentCourse;
    const matchesProgress = studentProgress === 'all' || student.progress_status === studentProgress;
    const matchesPayment = studentPayment === 'all' || student.payment_status === studentPayment;
    const matchesEnrollment = studentEnrollment === 'all' || student.enrollment_status === studentEnrollment;
    return matchesSearch && matchesCourse && matchesProgress && matchesPayment && matchesEnrollment;
  });
  const studentTotalPages = Math.max(1, Math.ceil(filteredMyStudents.length / ITEMS_PER_PAGE));
  const paginatedMyStudents = filteredMyStudents.slice(
    (studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE
  );
  const filteredTransactions = saleTransactions.filter(tx => {
    const query = transactionSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      tx.course_title, tx.user_name, tx.user_email, tx.receipt_id, tx.type,
    ].some(value => String(value || '').toLowerCase().includes(query));
    const matchesStatus = transactionStatus === 'all' || String(tx.status || '').toLowerCase() === transactionStatus;
    return matchesSearch && matchesStatus;
  });
  const transactionTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE));
  const paginatedTransactions = filteredTransactions.slice(
    (transactionPage - 1) * TRANSACTIONS_PER_PAGE,
    transactionPage * TRANSACTIONS_PER_PAGE
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Banner: payment method not yet configured */}
      {!paymentConfigured && user?.role === 'instructor' && (
        <div className="p-4 rounded-xl border-2 border-warning/40 bg-warning/10 flex flex-col sm:flex-row sm:items-center gap-3">
          <Info className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Complete your payout setup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add your mobile money or bank details on your profile so we can send your earnings.
            </p>
          </div>
          <a href="/profile"
            className="px-4 py-2 rounded-lg bg-warning text-warning-foreground text-xs font-bold hover:bg-warning/90 transition-colors text-center whitespace-nowrap">
            Add payout method
          </a>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome, {user?.name?.split(' ')[0] || 'Instructor'}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Here's how your courses are performing.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Total Courses"   value={stats?.total_courses  || 0} icon={BookOpen} />
        <StatsCard title="Total Students"  value={(stats?.total_students|| 0).toLocaleString()} icon={Users} />
        <StatsCard title="Avg Rating"      value={stats?.average_rating || '—'} icon={Star} />
        <StatsCard title="Completion Rate" value={`${stats?.completion_rate || 0}%`} icon={Award} />
      </div>

      {/* Earnings card — full width, shows breakdown */}
      {!isAdminViewer && (loading ? null : <EarningsCard stats={stats} onChanged={refreshStats} />)}

      {/* Monthly enrollments chart */}
      {chartData.length > 0 && (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Monthly Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top:5,right:5,bottom:5,left:-20}}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{fontSize:11}} stroke="hsl(var(--border))" />
                  <YAxis tick={{fontSize:11}} stroke="hsl(var(--border))" />
                  <Tooltip contentStyle={{background:'hsl(var(--background))',border:'1px solid hsl(var(--border))',borderRadius:'8px',fontSize:12}} />
                  <Area type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" fill="url(#enrollGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course performance */}
      {(stats?.course_performance || []).length > 0 && (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 font-medium text-muted-foreground">Course</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Students</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Completion</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Paystack fees</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">After fees</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Your share</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Platform share</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {stats.course_performance.map((c, i) => (
                  <tr key={c.id || i} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-medium max-w-[180px] truncate">{c.title}</td>
                    <td className="p-3 text-center">{c.students}</td>
                    <td className="p-3 text-center">{c.completion_rate}%</td>
                    {!isAdminViewer && <>
                      <td className="p-3 text-right tabular-nums">{formatPrice(c.gross_revenue || 0)}</td>
                      <td className="p-3 text-right tabular-nums">{formatPrice(c.paystack_fees || 0)}</td>
                      <td className="p-3 text-right tabular-nums">{formatPrice(c.net_after_paystack || 0)}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">{formatPrice(c.instructor_earnings || 0)}</td>
                      <td className="p-3 text-right tabular-nums">{formatPrice(c.platform_earnings || 0)}</td>
                    </>}
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />{c.rating || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Sales transaction history is for the instructor account, not Admin review. */}
      {!isAdminViewer && <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Course Payment Transactions
          </CardTitle>
          <p className="text-xs text-muted-foreground">Sales and paid extra-attempt transactions for your courses.</p>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={transactionSearch}
              onChange={e => { setTransactionSearch(e.target.value); setTransactionPage(1); }}
              placeholder="Search course, student or receipt"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
            <BrandedSelect value={transactionStatus}
              onChange={e => { setTransactionStatus(e.target.value); setTransactionPage(1); }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All transaction statuses</option>
              <option value="success">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </BrandedSelect>
          </div>
          {transactionsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary/50" /></div>
          ) : transactionsError ? (
            <p className="py-6 text-center text-sm text-destructive">{transactionsError}</p>
          ) : paginatedTransactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Date / Receipt</th>
                    <th className="py-2 pr-3">Student / Course</th>
                    <th className="py-2 pr-3 text-right">Gross</th>
                    <th className="py-2 pr-3 text-right">Paystack fee</th>
                    <th className="py-2 pr-3 text-right">Your share</th>
                    <th className="py-2 pr-3 text-right">Platform share</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx, index) => {
                    const actualFee = Number(tx.paystack_fee || 0);
                    const calculatedFee = Number(tx.paystack_fee_estimate || 0);
                    const fee = actualFee > 0
                      ? formatPrice(actualFee)
                      : calculatedFee > 0
                        ? `${formatPrice(calculatedFee)} (calculated)`
                        : '—';
                    const status = String(tx.status || 'unknown').toLowerCase();
                    return (
                      <tr key={tx.id || tx.receipt_id || index} className="border-b border-border/40">
                        <td className="py-3 pr-3">
                          <p className="whitespace-nowrap text-xs">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}</p>
                          <p className="max-w-[140px] truncate text-2xs text-muted-foreground">{tx.receipt_id || tx.id || '—'}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="max-w-[180px] truncate font-medium">{tx.user_name || tx.user_email || 'Student'}</p>
                          <p className="max-w-[180px] truncate text-xs text-muted-foreground">{tx.course_title || (tx.type === 'quiz_extra_attempt' ? 'Extra quiz attempt' : 'Course')}</p>
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums">{formatPrice(tx.amount || 0)}</td>
                        <td className="py-3 pr-3 text-right text-xs tabular-nums">{fee}</td>
                        <td className="py-3 pr-3 text-right font-semibold tabular-nums">{formatPrice(tx.instructor_share || 0)}</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{formatPrice(tx.platform_share || 0)}</td>
                        <td className="py-3 text-right">
                          <span className={cn('rounded-full px-2 py-1 text-2xs font-semibold',
                            ['success','completed','paid'].includes(status) ? 'bg-success/10 text-success' :
                            status === 'pending' ? 'bg-warning/10 text-warning' :
                            ['failed','cancelled','refunded','reversed'].includes(status) ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground')}>
                            {status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {saleTransactions.length ? 'No transactions match your search or status filter.' : 'No course payment transactions are available yet.'}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">{filteredTransactions.length} transaction(s)</p>
            {filteredTransactions.length > TRANSACTIONS_PER_PAGE && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                  disabled={transactionPage <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
                <span className="text-xs text-muted-foreground">Page {transactionPage} of {transactionTotalPages}</span>
                <button type="button" onClick={() => setTransactionPage(p => Math.min(transactionTotalPages, p + 1))}
                  disabled={transactionPage >= transactionTotalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>}

      {/* Recent students */}
      {(stats?.recent_students || []).length > 0 && (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paginatedStudents.map((s, i) => (
              <div key={s.id || i} className="flex items-center gap-4 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/20">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {getInitials(s.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.course}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-primary">{s.progress}%</p>
                  <p className="text-2xs text-muted-foreground">progress</p>
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
                <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
                  className="px-3 py-1 rounded text-xs border border-border disabled:opacity-40 hover:bg-muted transition-colors">←</button>
                <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                  className="px-3 py-1 rounded text-xs border border-border disabled:opacity-40 hover:bg-muted transition-colors">→</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full student directory, restricted by the backend to this instructor's courses */}
      <Card id="my-students" className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            My Students
          </CardTitle>
          <p className="text-xs text-muted-foreground">Students enrolled in your courses.</p>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentPage(1); }}
                placeholder="Search name, email, phone or course"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm" />
            </div>
            <BrandedSelect value={studentCourse} onChange={e => { setStudentCourse(e.target.value); setStudentPage(1); }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All my courses</option>
              {studentCourses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
            </BrandedSelect>
            <BrandedSelect value={studentProgress} onChange={e => { setStudentProgress(e.target.value); setStudentPage(1); }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All progress</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </BrandedSelect>
            <BrandedSelect value={studentPayment} onChange={e => { setStudentPayment(e.target.value); setStudentPage(1); }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="not_required">Not required</option>
              <option value="no_payment">No payment record</option>
            </BrandedSelect>
            <BrandedSelect value={studentEnrollment} onChange={e => { setStudentEnrollment(e.target.value); setStudentPage(1); }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">All enrolments</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </BrandedSelect>
          </div>
          {studentsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary/50" /></div>
          ) : studentsError ? (
            <p className="py-6 text-center text-sm text-destructive">{studentsError}</p>
          ) : filteredMyStudents.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Student</th><th className="py-2 pr-3">Course</th>
                  <th className="py-2 pr-3">Certificate</th><th className="py-2 pr-3">Enrolled</th><th className="py-2 pr-3 text-right">Progress</th>
                  <th className="py-2 pr-3 text-right">Payment</th><th className="py-2 text-right">Status</th>
                </tr></thead>
                <tbody>
                  {paginatedMyStudents.map((student, index) => (
                    <tr key={student.student_id + ':' + student.course_id + ':' + index} className="border-b border-border/40">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{student.name || 'Student'}</p>
                        <p className="text-xs text-muted-foreground">{student.email || '—'}{student.phone ? ' · ' + student.phone : ''}</p>
                      </td>
                      <td className="py-3 pr-3">{student.course_title}</td>
                      <td className="py-3 pr-3">
                        {student.certificate_id ? (
                          <div className="space-y-0.5">
                            <span className={cn('text-xs font-semibold', student.certificate_revoked_at ? 'text-destructive' : 'text-success')}>
                              {student.certificate_revoked_at ? 'Revoked' : 'Issued'}
                            </span>
                            <p className="max-w-36 break-all font-mono text-[10px] text-muted-foreground">{student.certificate_id}</p>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Not issued</span>}
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">{student.enrolled_at ? String(student.enrolled_at).slice(0, 10) : '—'}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{student.progress}%</td>
                      <td className="py-3 pr-3 text-right">
                        <span className={cn('rounded-full px-2 py-1 text-2xs font-semibold',
                          ['success','completed','paid'].includes(student.payment_status) ? 'bg-success/10 text-success' :
                          student.payment_status === 'pending' ? 'bg-warning/10 text-warning' :
                          ['failed','cancelled','refunded','reversed'].includes(student.payment_status) ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground')}>
                          {student.payment_status === 'not_required' ? 'Not required' :
                            student.payment_status === 'no_payment' ? 'No record' :
                            student.payment_status === 'success' ? 'Paid' : (student.payment_status || 'Unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={cn('rounded-full px-2 py-1 text-2xs font-semibold',
                          student.enrollment_status === 'expired' ? 'bg-destructive/10 text-destructive' :
                          student.completed ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                          {student.enrollment_status === 'expired' ? 'Expired' : student.completed ? 'Completed' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {myStudents.length ? 'No students match your search.' : 'No students are enrolled in your courses yet.'}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{filteredMyStudents.length} enrolment record(s)</p>
            {filteredMyStudents.length > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                  disabled={studentPage <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
                <span className="text-xs text-muted-foreground">Page {studentPage} of {studentTotalPages}</span>
                <button type="button" onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                  disabled={studentPage >= studentTotalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Instructor Guide ── */}
      <InstructorGuide />
    </div>
  );
}
