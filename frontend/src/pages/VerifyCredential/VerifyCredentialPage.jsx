import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Award, CheckCircle2, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { VerifySection } from './VerifySection';

const credentialImages = [
  { src: '/carousel-collab.jpg', alt: 'Learners collaborating during a course', className: 'col-span-2 row-span-2' },
  { src: '/carousel-lab.webp', alt: 'Practical learning in a computer lab', className: '' },
  { src: '/carousel-library.webp', alt: 'Independent study and research', className: '' },
  { src: '/feature-student.jpg', alt: 'Student learning new skills', className: '' },
  { src: '/tech-skills.jpg', alt: 'Technology skills training', className: '' },
];

export default function VerifyCredentialPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 py-7 sm:py-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to LearnAfrica
          </Link>
          <div className="grid items-center gap-8 py-8 sm:py-12 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">Certificate verification</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Check a LearnAfrica certificate</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Enter the certificate or achievement badge ID to confirm that it was issued by LearnAfrica.
                You do not need an account to check a credential.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" /> No sign-in required</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Results from our records</span>
              </div>
            </div>
            <div className="grid aspect-[1.35] grid-cols-4 grid-rows-3 gap-2 sm:gap-3" aria-label="LearnAfrica course and student photographs">
              {credentialImages.map((item, index) => (
                <div key={item.src} className={`relative min-h-0 overflow-hidden rounded-xl bg-muted shadow-sm ${item.className}`}>
                  <img src={item.src} alt={item.alt} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading={index < 3 ? 'eager' : 'lazy'} />
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold">What you will need</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Use the ID printed on the certificate or included in its verification link.</p>
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Example ID</p>
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 font-mono text-sm">LA-CERT-ABCD-123456</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Verify a credential</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the ID below. We will check it against LearnAfrica's issued credential records.</p>
        </div>
        <VerifySection />
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 text-center text-xs text-muted-foreground sm:flex-row">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Official LearnAfrica verification</span>
          <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
          <span>Only relevant credential details are displayed</span>
          <Link to="/courses" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Browse courses <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>
    </main>
  );
}
