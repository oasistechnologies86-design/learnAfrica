import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Award, BadgeCheck, CheckCircle2, Fingerprint, LockKeyhole, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import { VerifySection } from './VerifySection';

function CertificatePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-primary/15 via-primary/5 to-muted/20 blur-3xl" />
      <div className="relative rounded-[1.6rem] border border-border bg-card p-1.5 shadow-2xl shadow-emerald-950/30 transition-transform duration-700 hover:rotate-0 sm:rotate-[1.5deg]">
        <div className="relative overflow-hidden rounded-[1.2rem] border border-primary/20 bg-gradient-to-br from-card via-background to-muted p-4 sm:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,.12) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-primary/10" />
          <div className="relative flex items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Award className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/80">LearnAfrica</p><p className="mt-1 text-xs text-muted-foreground">Digital credentials</p></div></div>
            <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-primary"><ShieldCheck className="h-3.5 w-3.5" /> VERIFIABLE</div>
          </div>
          <div className="relative py-6 text-center sm:py-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-muted-foreground">Certificate of achievement</p>
            <h2 className="mx-auto mt-4 max-w-sm font-serif text-2xl leading-tight text-foreground sm:text-3xl">A future built on <span className="italic text-primary">knowledge.</span></h2>
            <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-foreground/55">A digital record of skills earned, effort invested, and progress made.</p>
            <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-lg shadow-primary/5"><Award className="h-8 w-8" strokeWidth={1.3} /></div>
          </div>
          <div className="relative flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40">Credential status</p><p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground/90"><CheckCircle2 className="h-4 w-4 text-primary" /> Ready for verification</p></div>
            <div className="font-mono text-[10px] tracking-wider text-foreground/35">LA · DIGITAL TRUST</div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background/85 px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-xl"><Fingerprint className="h-4 w-4 text-primary" /> Preview concept · not an issued certificate</div>
    </div>
  );
}

export default function VerifyCredentialPage() {
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[48rem] bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.13),transparent_48%),radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_42%)]" />
      <section className="container mx-auto max-w-7xl px-4 pb-9 pt-6 sm:pb-12 sm:pt-8 lg:pb-14">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur transition hover:border-primary/30 hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to LearnAfrica</Link>
        <div className="grid items-center gap-8 pt-7 sm:pt-9 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span> LearnAfrica trust portal</div>
            <h1 className="mt-6 text-3xl font-black leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-5xl">Achievement, <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent">verified.</span><span className="mt-2 block text-foreground/80">Confidence, unlocked.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">Check a LearnAfrica certificate or achievement badge using its unique credential ID. A simple, secure way for learners, employers, and institutions to confirm a learning milestone.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 backdrop-blur"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-sm font-bold">Open verification</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">No account or sign-in required.</p></div></div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ScanLine className="h-5 w-5" /></span><div><p className="text-sm font-bold">Clear results</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Check status and issued details.</p></div></div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-4 w-4 text-emerald-500" /> Built to make learning achievements easier to trust.</div>
          </div>
          <CertificatePreview />
        </div>
      </section>
      <section className="relative border-y border-border/70 bg-muted/20 py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-7 max-w-2xl text-center"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Credential lookup</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Check a certificate in seconds</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Enter the ID printed on the certificate or open the verification link provided with it.</p></div>
          <VerifySection />
          <div className="mx-auto mt-7 flex max-w-3xl flex-col items-center justify-center gap-3 text-center text-xs leading-relaxed text-muted-foreground sm:flex-row"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Official LearnAfrica credential lookup</span><span className="hidden h-1 w-1 rounded-full bg-border sm:block" /><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" /> Only necessary credential details are shown</span><Link to="/courses" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Explore courses <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
        </div>
      </section>
    </div>
  );
}
