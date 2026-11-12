import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, XCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { useOnScreen } from '@/lib/useOnScreen';

export function VerifySection() {
  const [credId, setCredId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sectionRef] = useOnScreen({ threshold: 0.2 });

  const runVerify = useCallback(async (raw) => {
    const normalized = raw.replace(/\\s+/g, '').toUpperCase();
    if (!normalized) return;
    setCredId(normalized);
    setLoading(true);
    setResult(null);
    setSearched(false);
    try {
      const res = await fetch(`${API_BASE}/api/verify?id=${encodeURIComponent(normalized)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, message: 'Verification service unavailable.' });
    }
    setLoading(false);
    setSearched(true);
  }, []);

  const handleVerify = (e) => {
    e.preventDefault();
    runVerify(credId);
  };

  useEffect(() => {
    const readId = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('id')
        || new URLSearchParams(window.location.hash.split('?')[1] || '').get('id');
    };
    const apply = () => {
      const prefill = readId();
      if (!prefill) return;
      runVerify(prefill);
      setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [runVerify, sectionRef]);

  const fmt = (s) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return s; }
  };

  return (
    <section id="verify-section" ref={sectionRef} className="scroll-mt-24 py-3 sm:py-5">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Verify your certificate or badge</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Enter the ID printed on your LearnAfrica certificate or achievement badge.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8 lg:p-10">
          <form onSubmit={handleVerify} className="space-y-4">
            <label htmlFor="credential-id" className="block text-base font-semibold">Your certificate or badge ID</label>
            <input
              id="credential-id"
              type="text"
              value={credId}
              onChange={e => { setCredId(e.target.value); setSearched(false); setResult(null); }}
              placeholder="Enter your credential ID here"
              autoComplete="off"
              className="h-16 w-full rounded-xl border-2 border-input bg-background px-5 text-lg outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:h-[72px] sm:px-6 sm:text-xl"
            />
            <Button type="submit" disabled={loading || !credId.trim()} className="h-14 w-full gap-2 rounded-xl px-8 text-base font-semibold sm:h-16 sm:text-lg">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {loading ? 'Checking credential...' : 'Verify credential'}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 sm:p-5">
            <p className="text-sm font-semibold">Example format only</p>
            <p className="mt-1 text-sm text-muted-foreground">This is just an example to show how an ID may look. Do not enter this sample unless it is the ID printed on your own credential.</p>
            <p className="mt-3 inline-block rounded-md bg-background px-3 py-2 font-mono text-sm text-muted-foreground">LA-CERT-ABCD-123456</p>
          </div>

          {searched && result && (
            <div className={cn(
              'mt-6 rounded-2xl border p-5 animate-in fade-in slide-in-from-bottom-2',
              result.valid ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'
            )}>
              {result.valid ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-success">Valid {result.type === 'certificate' ? 'Certificate' : 'Badge'}</p>
                      <p className="font-mono text-xs text-muted-foreground">{result.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 border-t border-border/50 pt-3 sm:grid-cols-2">
                    <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Holder</p><p className="mt-0.5 font-semibold">{result.holder}</p></div>
                    {result.type === 'certificate' && <>
                      <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Course</p><p className="mt-0.5 font-semibold">{result.course}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Course Delivery</p><p className="mt-0.5 font-semibold">{result.delivery || 'Instructor-led'}</p></div>
                    </>}
                    {result.type === 'badge' && <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Achievement</p><p className="mt-0.5 font-semibold">{result.badge}</p></div>}
                    <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Issued</p><p className="mt-0.5 font-semibold">{fmt(result.issued_at)}</p></div>
                  </div>
                  <p className="pt-1 text-xs text-muted-foreground">This {result.type} was issued by LearnAfrica and is authentic.</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-bold text-destructive">{result.revoked ? 'Credential Revoked' : 'Credential Not Found'}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{result.message || 'This ID does not match any issued certificate or badge.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
