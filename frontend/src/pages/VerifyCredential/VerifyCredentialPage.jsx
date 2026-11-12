import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { VerifySection } from './VerifySection';

const credentialImages = [
  { src: '/carousel-collab.jpg', alt: 'Learners collaborating during a course' },
  { src: '/carousel-lab.webp', alt: 'Practical learning in a computer lab' },
  { src: '/carousel-library.webp', alt: 'Independent study and research' },
  { src: '/feature-student.jpg', alt: 'A student learning new skills' },
  { src: '/tech-skills.jpg', alt: 'Technology skills training' },
];

export default function VerifyCredentialPage() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % credentialImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

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
            <div className="relative aspect-[1.35] min-h-[220px] overflow-hidden rounded-xl bg-muted sm:min-h-[300px]" aria-label="LearnAfrica course and student photographs">
              {credentialImages.map((item, index) => (
                <img
                  key={item.src}
                  src={item.src}
                  alt={item.alt}
                  aria-hidden={activeImage !== index}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${activeImage === index ? 'opacity-100' : 'opacity-0'}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {credentialImages.map((item, index) => (
                  <span key={item.src} className={`h-1.5 rounded-full transition-all ${activeImage === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
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
