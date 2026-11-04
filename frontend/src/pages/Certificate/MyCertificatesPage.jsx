import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, CalendarDays, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
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
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your achievements</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">My Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and download certificates you have earned from completed courses.</p>
        </div>
        <Button variant="outline" onClick={loadCertificates} disabled={loading} className="gap-2 self-start">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your certificates...
        </div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={loadCertificates}>Try again</Button>
        </CardContent></Card>
      ) : certificates.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">No certificates yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            When you complete a course that offers a certificate and pass its Final Examination, your certificate will appear here.
          </p>
          <Link to="/dashboard" className="mt-5">
            <Button>Go to my dashboard</Button>
          </Link>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.certificateId} className="overflow-hidden">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold leading-snug">{certificate.courseName}</h2>
                    <p className="mt-1 break-all text-xs text-muted-foreground">Certificate ID: {certificate.certificateId}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Issued {formatDate(certificate.issuedAt)}
                </div>
                <div className="mt-5">
                  <Link to={`/certificate/${encodeURIComponent(certificate.courseId)}`}>
                    <Button className="w-full gap-2">
                      <BookOpen className="h-4 w-4" /> View and download certificate
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
