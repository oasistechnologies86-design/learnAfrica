import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, LockKeyhole, SearchCheck, ShieldCheck } from 'lucide-react';
import { VerifySection } from './VerifySection';

export default function VerifyCredentialPage() {
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
      <section className="container mx-auto px-4 pt-10 sm:pt-14 pb-6 sm:pb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to LearnAfrica
        </Link>
        <div className="mx-auto max-w-4xl text-center pt-8 sm:pt-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-background shadow-lg shadow-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">Trust · Achievement · Opportunity</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Proof of learning <span className="text-primary">you can trust.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            Confirm a LearnAfrica certificate or achievement badge in seconds. No account is required, so employers and institutions can verify a credential directly.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2"><BadgeCheck className="h-4 w-4 text-primary" /> Official credential lookup</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2"><LockKeyhole className="h-4 w-4 text-primary" /> No sign-in needed</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2"><SearchCheck className="h-4 w-4 text-primary" /> Clear verification result</span>
          </div>
        </div>
      </section>
      <div className="pb-10 sm:pb-16">
        <VerifySection />
      </div>
    </div>
  );
}
