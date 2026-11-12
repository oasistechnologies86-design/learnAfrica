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
        <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">LearnAfrica community</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Learning is better when we share it.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Meet other learners, ask questions, share your progress, and help someone else move forward.
                Join the discussion and take part in the learning happening across LearnAfrica.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#community-discussion" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                  Join the discussion <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/courses"><Button variant="outline" className="h-11 gap-2 rounded-lg"><BookOpen className="h-4 w-4" /> Browse courses</Button></Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{isAuthenticated ? 'You are signed in and can take part in the discussion.' : 'Sign in or create a free account to post, reply, and like comments.'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></div>
                <div><h2 className="font-semibold">A place to learn together</h2><p className="mt-1 text-xs text-muted-foreground">A few ways to get involved</p></div>
              </div>
              <div className="divide-y divide-border">
                {communityValues.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-3 py-4 last:pb-0">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>
                  </div>
                ))}
              </div>
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
