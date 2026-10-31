import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, HeartHandshake, MessageCircle, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { CommentsSection } from './CommunitySection';

const communityValues = [
  { icon: MessageCircle, title: 'Ask and share', text: 'Ask thoughtful questions, share what you are learning, and exchange practical advice.' },
  { icon: HeartHandshake, title: 'Help each other grow', text: 'Offer encouragement, useful feedback, and support to fellow learners.' },
  { icon: ShieldCheck, title: 'Keep it respectful', text: 'Be kind, stay on topic, and help make the space welcoming for everyone.' },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
      <section className="container mx-auto px-4 pt-10 sm:pt-14 pb-8 sm:pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
              <UsersRound className="h-4 w-4" /> The LearnAfrica Community
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight">
              Learn together. <span className="text-primary">Grow together.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              A place for African learners to exchange ideas, ask questions, celebrate progress, and help each other turn new skills into real opportunities.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#community-discussion" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                Join the conversation <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/courses">
                <Button variant="outline" className="h-11 gap-2"><BookOpen className="h-4 w-4" /> Explore courses</Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Welcome{user?.name ? `, ${user.name.split(/\\s+/)[0]}` : ''} — your next useful conversation starts here.</p>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 sm:p-7 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UsersRound className="h-6 w-6" /></div>
                <div><p className="font-bold">A community built on progress</p><p className="text-sm text-muted-foreground">Curiosity is welcome here</p></div>
              </div>
              <div className="space-y-4 py-5">
                {[
                  { icon: Sparkles, title: 'Share a breakthrough', text: 'Tell others what finally clicked for you.' },
                  { icon: MessageCircle, title: 'Ask a good question', text: 'Get unstuck by learning with others.' },
                  { icon: HeartHandshake, title: 'Encourage a learner', text: 'A helpful reply can make someone’s day.' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><Icon className="h-4 w-4" /></span>
                    <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <p className="text-sm font-semibold">Community promise</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Share knowledge generously. Respect different experiences. Keep personal information private.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-muted/20 py-8 sm:py-10">
        <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-3">
          {communityValues.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <div id="community-discussion" className="scroll-mt-24">
        <CommentsSection user={user} isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
