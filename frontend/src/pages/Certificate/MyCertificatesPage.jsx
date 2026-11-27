import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarDays, Loader2, RefreshCw, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { API_BASE } from '@/lib/api';

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/my-certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load your certificates.');
      setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
    } catch (err) {
      setError(err.message || 'Could not load your certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCertificates(); }, [loadCertificates]);

  const formatDate = (value) => {
    if (!value) return 'Date not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value).slice(0, 10)
      : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-1 pb-10 sm:px-0">
      {/* Match the dashboard's compact heading, typography and action treatment. */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">Your achievements</p>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl">My Certificates</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              View and download certificates you have earned from completed courses.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadCertificates}
            disabled={loading}
            className="min-h-10 gap-2 self-start rounded-lg text-xs font-semibold sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="h-px bg-border" />
      </section>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading your certificates...
        </div>
      ) : error ? (
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={loadCertificates} className="rounded-lg">Try again</Button>
          </CardContent>
        </Card>
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Award className="h-8 w-8" />
          </span>
          <h2 className="mt-3 text-sm font-bold text-foreground">No certificates earned yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            When you complete a course that offers a certificate and pass its Final Examination, your certificate will appear here.
          </p>
          <Link to="/dashboard" className="mt-5 inline-flex">
            <Button className="rounded-lg">Go to my dashboard</Button>
          </Link>
        </div>
      ) : (
        <section aria-label="Earned certificates" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-foreground sm:text-base">Earned Certificates</h2>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary dark:bg-[#263A30] dark:text-[#C4E4C7]">
              {certificates.length} earned
            </span>
          </div>
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <article
                key={certificate.certificateId}
                className="flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-100 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-5 sm:p-5 dark:border-[#665B43] dark:bg-[#202A32]"
              >
                <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center sm:gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-600 dark:border-[#9B8452] dark:bg-[#34372F] dark:text-[#E0BD72] sm:h-16 sm:w-16">
                    <Award className="h-8 w-8" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-bold leading-snug text-foreground sm:text-[15px]">
                      {certificate.courseName}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {certificate.category || 'Course completion'}
                    </p>
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Certificate ID:</span>{' '}
                      <span className="font-mono">{certificate.certificateId}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>Issued {formatDate(certificate.issuedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full shrink-0 sm:w-auto sm:pl-2">
                  <Link
                    to={`/certificate/${encodeURIComponent(certificate.courseId)}`}
                    className="block w-full sm:w-auto"
                  >
                    <Button className="h-11 w-full gap-2 rounded-xl px-4 text-xs font-semibold sm:w-auto">
                      <BookOpen className="h-4 w-4" />
                      View and download certificate
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
