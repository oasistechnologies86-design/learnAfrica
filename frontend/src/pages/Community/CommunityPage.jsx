import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, BookOpen, Compass, HeartHandshake, MessageCircle, ShieldCheck, Sparkles, UsersRound, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { CommentsSection } from './CommunitySection';

const communityValues = [
  { icon: MessageCircle, number: '01', title: 'Ideas into action', text: 'Ask questions, share discoveries, and turn learning roadblocks into breakthroughs.' },
  { icon: HeartHandshake, number: '02', title: 'Progress together', text: 'Find encouragement from people building skills and chasing goals alongside you.' },
  { icon: ShieldCheck, number: '03', title: 'A space with respect', text: 'Be curious, be generous, and help keep conversations useful and welcoming.' },
];
const quickPrompts = [
  { icon: Sparkles, label: 'Share a breakthrough', detail: 'What clicked for you today?' },
  { icon: MessageCircle, label: 'Ask the community', detail: 'Get another perspective.' },
  { icon: Zap, label: 'Keep your momentum', detail: 'Small steps create real progress.' },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52rem] bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.13),transparent_45%),radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_42%)]" />
      <section className="container mx-auto px-4 pb-9 pt-7 sm:pb-12 sm:pt-9 lg:pb-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-7">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span> LearnAfrica · People-powered learning</div>
            <h1 className="mt-6 text-3xl font-black leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-5xl">Your next big idea starts <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent">together.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">Connect with learners across Africa. Trade ideas, ask the questions that move you forward, and celebrate the skills you are building one conversation at a time.</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="#community-discussion" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl">Enter the conversation <ArrowRight className="h-4 w-4" /></a><Link to="/courses"><Button variant="outline" className="h-10 gap-2 rounded-xl border-border/80 bg-background/60 px-4"><BookOpen className="h-4 w-4" /> Explore courses</Button></Link></div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Member space</span><span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4 text-primary" /> Learn from one another</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-primary/15 via-primary/5 to-muted/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-4 shadow-xl shadow-primary/10 backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary"><UsersRound className="h-6 w-6" /></div><div><p className="font-bold">The learning network</p><p className="mt-1 text-xs text-muted-foreground">Good questions create momentum</p></div></div><div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary">Connected</div></div>
              <div className="space-y-2.5 py-4">{quickPrompts.map(({ icon: Icon, label, detail }, i) => (<div key={label} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 transition hover:border-primary/30 hover:bg-primary/[0.03]"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary transition group-hover:scale-105"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="flex h-7 w-7 items-center justify-center rounded-full border border-border font-mono text-xs text-muted-foreground">0{i + 1}</span></div>))}</div>
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-3.5"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Your next step</p><p className="mt-2 text-base font-bold tracking-tight">Show up curious. Leave a little wiser.</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">You bring your experience. The community brings fresh perspectives.</p></div>
            </div>
            <div className="relative mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur"><Compass className="h-3.5 w-3.5 text-primary" /> A community for the journey, not just the destination</div>
          </div>
        </div>
      </section>
      <section className="border-y border-border/70 bg-muted/20 py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">How we grow</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Make every conversation count.</h2></div><p className="max-w-md text-sm leading-relaxed text-muted-foreground">A good community is built by all of us, one thoughtful question and helpful reply at a time.</p></div>
          <div className="grid gap-4 md:grid-cols-3">{communityValues.map(({ icon: Icon, number, title, text }) => (<article key={number} className="group rounded-2xl border border-border/80 bg-card/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-5"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><span className="font-mono text-xs text-muted-foreground/60">{number}</span></div><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>))}</div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 sm:py-14"><div className="mx-auto flex max-w-3xl flex-col items-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><ArrowDown className="h-5 w-5" /></div><h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">The floor is yours.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Jump into the latest discussions, share what you know, and make room for someone else's next breakthrough.</p></div></section>
      <div id="community-discussion" className="scroll-mt-24 border-t border-border/70"><CommentsSection user={user} isAuthenticated={isAuthenticated} /></div>
    </div>
  );
}
