import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CommentsSection } from './CommunitySection';

const communityValues = [
  { icon: MessageCircle, title: 'Ask questions', text: 'Get help, share what you are learning, and hear how others approach a challenge.' },
  { icon: UsersRound, title: 'Share what works', text: 'Pass on useful resources, ideas, and lessons from your own experience.' },
  { icon: ShieldCheck, title: 'Keep it respectful', text: 'Help make the space welcoming, useful, and safe for everyone.' },
];

const communityImages = [
  { src: '/hero-community.jpg', alt: 'LearnAfrica learners connecting and learning together' },
  { src: '/student1.jpg', alt: 'A student learning on LearnAfrica' },
  { src: '/student2.jpg', alt: 'A learner studying' },
  { src: '/student3.jpg', alt: 'A student taking part in learning' },
  { src: '/student4.jpg', alt: 'A learner building new skills' },
  { src: '/student5.jpg', alt: 'A student developing their knowledge' },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % communityImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="grid items-center gap-7 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div className="max-w-xl py-2">
              <p className="text-sm font-semibold text-primary">LearnAfrica community</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Learning is better when we share it.</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Meet other learners, ask questions, share your progress, and help someone else move forward.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#community-discussion" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Join the discussion <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/courses" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold transition hover:bg-muted">
                  <BookOpen className="h-4 w-4" /> Browse courses
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{isAuthenticated ? 'You are signed in and can take part in the discussion.' : 'You can read discussions without signing in.'}</p>
            </div>
            <div className="relative aspect-[1.35] min-h-[220px] overflow-hidden rounded-xl bg-muted sm:min-h-[300px]" aria-label="LearnAfrica learner photographs">
              {communityImages.map((item, index) => (
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
                {communityImages.map((item, index) => (
                  <span key={item.src} className={`h-1.5 rounded-full transition-all ${activeImage === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold tracking-tight">A community for sharing what you learn</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ask for help, share useful resources, and encourage other learners. Sign in or create an account to post, reply, and like discussions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {communityValues.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-semibold text-primary">Community discussion</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">What is everyone talking about?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Read the latest posts or add your own question, idea, or learning update.</p>
        </div>
      </section>
      <div id="community-discussion" className="scroll-mt-24 border-t border-border">
        <CommentsSection user={user} isAuthenticated={isAuthenticated} />
      </div>
    </main>
  );
}
