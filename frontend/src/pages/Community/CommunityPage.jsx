import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { CommentsSection } from './CommunitySection';

const communityValues = [
  { icon: MessageCircle, title: 'Ask questions', text: 'Get help, share what you are learning, and hear how others approach a challenge.' },
  { icon: UsersRound, title: 'Share what works', text: 'Pass on useful resources, ideas, and lessons from your own experience.' },
  { icon: ShieldCheck, title: 'Keep it respectful', text: 'Help make the space welcoming, useful, and safe for everyone.' },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="relative mb-8 min-h-[230px] overflow-hidden rounded-2xl bg-muted sm:min-h-[320px]">
            <img
              src="https://rwesck.knust.edu.gh/sites/rwesck.knust.edu.gh/files/2023-02/rwesck-about-image.png"
              alt="Students in Ghana working together around a laptop"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
            <div className="relative flex min-h-[230px] max-w-2xl flex-col justify-end p-5 text-white sm:min-h-[320px] sm:p-9">
              <p className="text-sm font-semibold text-white/85">LearnAfrica community</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Learning is better when we share it.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base sm:leading-7">
                Meet other learners, ask questions, share your progress, and help someone else move forward.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#community-discussion" className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-white/90">
                  Join the discussion <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/courses" className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/70 bg-black/20 px-5 text-sm font-semibold text-white transition hover:bg-black/35">
                  <BookOpen className="h-4 w-4" /> Browse courses
                </Link>
              </div>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold tracking-tight">A community for sharing what you learn</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ask for help, share useful resources, and encourage other learners. Sign in or create an account to post, reply, and like discussions.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{isAuthenticated ? 'You are signed in and can take part in the discussion.' : 'You can read discussions without signing in.'}</p>
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
