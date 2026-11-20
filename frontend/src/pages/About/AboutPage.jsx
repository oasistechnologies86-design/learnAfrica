import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/common/Button';

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About LearnAfrica</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Learning that moves you forward</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          LearnAfrica is an online learning platform where students can discover courses, learn from instructors, complete assessments and track their progress.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          The platform brings course learning, assessments, achievements and certificates together in one place, helping learners follow their progress as they build new knowledge and skills.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/courses"><Button className="gap-2">Explore Courses <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/"><Button variant="outline" className="gap-2"><BookOpen className="h-4 w-4" /> Back to Home</Button></Link>
        </div>
      </div>
    </main>
  );
}
