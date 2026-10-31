import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, XCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { useOnScreen } from '@/lib/useOnScreen';

// ── Verify Credential ─────────────────────────────────────────────────────
export function VerifySection() {
  const [credId,   setCredId]   = useState('');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [sectionRef, sectionVisible] = useOnScreen({ threshold: 0.2 });

  const runVerify = useCallback(async (raw) => {
    // Aggressive client-side normalization: strip ALL whitespace anywhere in the ID
    // (users often paste with tabs, newlines, or extra spaces). Uppercase for
    // case-insensitive match. Backend does the same and also tolerates hyphens
    // being dropped/added.
    const normalized = raw.replace(/\s+/g, '').toUpperCase();
    if (!normalized) return;
    setCredId(normalized);
    setLoading(true); setResult(null); setSearched(false);
    try {
      const res  = await fetch(`${API_BASE}/api/verify?id=${encodeURIComponent(normalized)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, message: 'Verification service unavailable.' });
    }
    setLoading(false); setSearched(true);
  }, []);

  const handleVerify = (e) => {
    e.preventDefault();
    runVerify(credId);
  };

  // A certificate/badge QR links here as /#verify-section?id=LA-CERT-... —
  // pre-fill the box and verify automatically so a scan lands on the result.
  // The listener also covers the case where the visitor is already on this
  // page and a link only changes the hash, which would otherwise not re-run
  // the effect (and would not scroll, because the fragment is not a plain id).
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
      // Let the section render, then bring it into view for a scanned link.
      setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [runVerify, sectionRef]);

  const fmt = (s) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); }
    catch { return s; }
  };

  return (
    <section id="verify-section" ref={sectionRef} className="scroll-mt-24 py-3 sm:py-5">
      <div className={cn(
        "container mx-auto max-w-3xl transition-all duration-700",
        sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Enter your credential ID</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Enter a certificate or badge ID to verify its authenticity.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-4 shadow-xl shadow-primary/5 backdrop-blur sm:p-7">\n        <form onSubmit={handleVerify} className="mb-0 flex flex-col gap-3 sm:flex-row">
          <input type="text" value={credId}
            onChange={e => { setCredId(e.target.value); setSearched(false); setResult(null); }}
            placeholder="e.g. LA-CERT-ABCD-1A2B3C"
            className="h-13 min-w-0 flex-1 rounded-xl border border-input bg-background/80 px-4 text-sm shadow-inner outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/10" />
          <Button type="submit" disabled={loading || !credId.trim()} className="h-13 shrink-0 gap-2 rounded-xl px-6 shadow-lg shadow-primary/15">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="hidden sm:inline">Verify</span>
          </Button>
        </form>

        {searched && result && (
          <div className={cn(
            'rounded-2xl border p-6 animate-in fade-in slide-in-from-bottom-2',
            result.valid ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'
          )}>
            {result.valid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-success">Valid {result.type === 'certificate' ? 'Certificate' : 'Badge'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{result.id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Holder</p>
                    <p className="font-semibold mt-0.5">{result.holder}</p>
                  </div>
                  {result.type === 'certificate' && (<>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Course</p>
                      <p className="font-semibold mt-0.5">{result.course}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Course Delivery</p>
                      <p className="font-semibold mt-0.5">{result.delivery || 'Instructor-led'}</p>
                    </div>
                  </>)}
                  {result.type === 'badge' && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Achievement</p>
                      <p className="font-semibold mt-0.5">{result.badge}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Issued</p>
                    <p className="font-semibold mt-0.5">{fmt(result.issued_at)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  This {result.type} was issued by LearnAfrica and is authentic.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-bold text-destructive">
                    {result.revoked ? 'Credential Revoked' : 'Credential Not Found'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {result.message || 'This ID does not match any issued certificate or badge.'}
                  </p>
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


