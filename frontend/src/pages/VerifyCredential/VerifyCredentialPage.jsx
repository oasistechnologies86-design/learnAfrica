import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Award, BadgeCheck, CheckCircle2, Fingerprint, LockKeyhole, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import { VerifySection } from './VerifySection';

function CertificatePreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-amber-300/10 blur-3xl" />
      <div className="relative rounded-[1.6rem] border border-white/15 bg-[#071b24] p-2 shadow-2xl shadow-emerald-950/30 transition-transform duration-700 hover:rotate-0 sm:rotate-[1.5deg]">
        <div className="relative overflow-hidden rounded-[1.2rem] border border-emerald-200/20 bg-gradient-to-br from-[#0b2830] via-[#0a202a] to-[#101a31] p-5 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(110,231,183,.35) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-emerald-200/10" />
          <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200"><Award className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-100/70">LearnAfrica</p><p className="mt-1 text-xs text-white/50">Digital credentials</p></div></div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-emerald-100"><ShieldCheck className="h-3.5 w-3.5" /> VERIFIABLE</div>
          </div>
          <div className="relative py-8 text-center sm:py-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-emerald-100/55">Certificate of achievement</p>
            <h2 className="mx-auto mt-4 max-w-sm font-serif text-3xl leading-tight text-white sm:text-4xl">A future built on <span className="italic text-emerald-200">knowledge.</span></h2>
            <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-white/55">A digital record of skills earned, effort invested, and progress made.</p>
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/35 bg-gradient-to-br from-amber-200/20 to-emerald-200/10 text-amber-100 shadow-lg shadow-black/20"><Award className="h-8 w-8" strokeWidth={1.3} /></div>
          </div>
          <div className="relative flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Credential status</p><p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-white/90"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Ready for verification</p></div>
            <div className="font-mono text-[10px] tracking-wider text-white/35">LA · DIGITAL TRUST</div>
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[48rem] bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.13),transparent_48%),radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.10),transparent_42%)]" />
      <section className="container mx-auto px-4 pb-12 pt-8 sm:pb-16 sm:pt-12 lg:pb-20">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur transition hover:border-primary/30 hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to LearnAfrica</Link>
        <div className="grid items-center gap-12 pt-10 sm:pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span> LearnAfrica trust portal</div>
            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Achievement, <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">verified.</span><span className="mt-2 block text-foreground/80">Confidence, unlocked.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">Check a LearnAfrica certificate or achievement badge using its unique credential ID. A simple, secure way for learners, employers, and institutions to confirm a learning milestone.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-sm font-bold">Open verification</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">No account or sign-in required.</p></div></div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"><ScanLine className="h-5 w-5" /></span><div><p className="text-sm font-bold">Clear results</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Check status and issued details.</p></div></div>
            </div>
            <div className="mt-7 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-4 w-4 text-emerald-500" /> Built to make learning achievements easier to trust.</div>
          </div>
          <CertificatePreview />
        </div>
      </section>
      <section className="relative border-y border-border/70 bg-muted/20 py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-7 max-w-2xl text-center"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Credential lookup</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Check a certificate in seconds</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Enter the ID printed on the certificate or open the verification link provided with it.</p></div>
          <VerifySection />
          <div className="mx-auto mt-7 flex max-w-3xl flex-col items-center justify-center gap-3 text-center text-xs leading-relaxed text-muted-foreground sm:flex-row"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Official LearnAfrica credential lookup</span><span className="hidden h-1 w-1 rounded-full bg-border sm:block" /><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" /> Only necessary credential details are shown</span><Link to="/courses" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Explore courses <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
        </div>
      </section>
    </div>
  );
}
