import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Award, Play, ArrowRight, Star, Sparkles,
  Zap, Target, MessageSquare,
  ShieldCheck, Search, Quote, ChevronLeft, ChevronRight,
  LayoutDashboard, PlusCircle, BarChart2, Receipt, Trophy, Wallet, Ticket, Settings, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { courseThumbnail } from '@/lib/courseThumbnail';
import { useOnScreen, useCountUp } from '@/lib/useOnScreen';
import { HowItWorksSection } from './HowItWorksSection';

// ── Mini course card for landing ──────────────────────────────────────────
const CourseCard = ({ course }) => (
  <Card className="overflow-hidden transition-shadow duration-300 group flex flex-col h-full bg-card hover:shadow-lg cursor-pointer">
    <Link to={`/courses/${course.id}`}>
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img src={courseThumbnail(course)} alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {course.is_free && (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-success text-white px-2 py-0.5 rounded-full">Free</span>
        )}
      </div>
    </Link>
    <div className="p-4 flex flex-col flex-1">
      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{course.category}</p>
      <Link to={`/courses/${course.id}`}>
        <h3 className="font-bold text-sm line-clamp-2 hover:text-primary transition-colors">{course.title}</h3>
      </Link>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{course.description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-warning text-warning" />
          {course.rating || '4.8'}
        </div>
        <div className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrollments || 0}</div>
        <span className="font-bold text-foreground">{course.is_free ? 'Free' : `$${course.price}`}</span>
      </div>
    </div>
  </Card>
);

// ── Testimonials Carousel ─────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "LearnAfrica transformed my career. The courses are well-structured and the instructors are amazing. I went from zero coding knowledge to landing my dream job in just 6 months!",
    name:  "Adaeze Nwankwo",
    role:  "Software Developer",
    company: "TechAfrica Inc.",
    initial: "A",
    rating: 5,
    color: "from-primary to-primary/70",
  },
  {
    quote: "The Python for Data Science course was exactly what I needed. The hands-on projects and real-world examples made learning so much easier and more enjoyable than I expected.",
    name:  "Kofi Asante",
    role:  "Data Analyst",
    company: "DataHub Ghana",
    initial: "K",
    rating: 5,
    color: "from-accent to-accent/70",
  },
  {
    quote: "I love how the platform makes learning accessible and engaging. The UI/UX course helped me transition from graphic design to product design seamlessly.",
    name:  "Fatou Mbaye",
    role:  "UX Designer",
    company: "DesignLab Senegal",
    initial: "F",
    rating: 5,
    color: "from-purple-500 to-purple-400",
  },
  {
    quote: "The Cybersecurity course gave me the confidence to switch careers. The structured curriculum and real-world scenarios prepared me for everything I face at work today.",
    name:  "Emeka Okafor",
    role:  "Security Analyst",
    company: "NetGuard Lagos",
    initial: "E",
    rating: 5,
    color: "from-emerald-500 to-emerald-400",
  },
  {
    quote: "As a working mother, I needed flexible learning. LearnAfrica let me study at my own pace and I earned my Digital Marketing certificate without disrupting my family life.",
    name:  "Amina Diallo",
    role:  "Digital Marketing Lead",
    company: "BrandKinetics Dakar",
    initial: "A",
    rating: 5,
    color: "from-rose-500 to-rose-400",
  },
];

function TestimonialsSection() {
  const [current,   setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const [paused,    setPaused]    = useState(false);
  const timerRef = useRef(null);

  // Separate, small auto-advancing strip of real community photos. Kept
  // deliberately independent from the named quote carousel below so no
  // photo is ever implied to belong to a specific named testimonial-giver.
  const COMMUNITY_PHOTOS = ['/carousel-collab.jpg', '/carousel-library.webp', '/carousel-lab.webp'];
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhotoIdx(i => (i + 1) % COMMUNITY_PHOTOS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const go = useCallback((idx, dir) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 350);
  }, [animating]);

  const next = useCallback(() => go((current + 1) % TESTIMONIALS.length, 'next'), [current, go]);
  const prev = useCallback(() => go((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length, 'prev'), [current, go]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, paused]);

  const t = TESTIMONIALS[current];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-4 py-1.5 text-sm font-semibold text-warning mb-4">
            <Star className="h-4 w-4 fill-warning" /> Learner Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">What Our Learners Say</h2>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">
            Join thousands of satisfied learners transforming their careers.
          </p>
        </div>

        {/* Real community photos — a separate visual strip, intentionally
            not attached to any single named quote below. */}
        <div className="max-w-md mx-auto mb-12 sm:mb-16 rounded-2xl overflow-hidden shadow-lg aspect-[16/9] relative">
          {COMMUNITY_PHOTOS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="Real students learning with LearnAfrica"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: i === photoIdx ? 1 : 0 }}
            />
          ))}
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}>

          {/* Card */}
          <div style={{
            opacity: animating ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}>
            <Card className="relative p-8 sm:p-12 overflow-hidden border-2 border-border/60 bg-card shadow-xl">
              {/* Decorative gradient blob */}
              <div className={cn(
                'absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-10 bg-gradient-to-br',
                t.color
              )} />
              <div className={cn(
                'absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-3xl opacity-10 bg-gradient-to-br',
                t.color
              )} />

              {/* Quote icon */}
              <div className={cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-gradient-to-br text-white',
                t.color
              )}>
                <Quote className="h-6 w-6" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-lg sm:text-xl text-foreground font-medium leading-relaxed mb-8 relative z-10">
                "{t.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 bg-gradient-to-br',
                  t.color
                )}>
                  {t.initial}
                </div>
                <div>
                  <p className="font-bold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role} at <span className="text-primary font-medium">{t.company}</span></p>
                </div>
              </div>
            </Card>
          </div>

          {/* Prev / Next arrows */}
          <button onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background border-2 border-border shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all z-10">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background border-2 border-border shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all z-10">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => go(i, i > current ? 'next' : 'prev')}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'bg-primary w-8 h-2.5'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5 h-2.5'
              )} />
          ))}
        </div>


      </div>
    </section>
  );
}

// ── Static data ────────────────────────────────────────────────────────────
const features = [
  { icon: BookOpen, title: 'Expert-Led Courses',  description: 'Learn from industry professionals with real-world experience.' },
  { icon: Zap,      title: 'Learn at Your Pace',  description: 'Access courses anytime, anywhere on any device.' },
  { icon: Target,   title: 'Practical Projects',  description: 'Build real projects that strengthen your portfolio.' },
  { icon: Award,    title: 'Earn Certificates',   description: 'Get recognised certificates upon course completion.' },
];

// ── Stats section with count-up animation ────────────────────────────────
function AnimatedStatsSection({ stats }) {
  const [ref, visible] = useOnScreen({ threshold: 0.3 });
  return (
    <section ref={ref} className="py-12 border-y border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <AnimatedStat key={s.label} stat={s} active={visible} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedStat({ stat, active, delay }) {
  // Try to extract a numeric portion so we can count up. Strip commas.
  const raw = String(stat.value).replace(/,/g, '');
  const numMatch = raw.match(/^([\d.]+)/);
  const target = numMatch ? parseFloat(numMatch[1]) : 0;
  const suffix = numMatch ? raw.slice(numMatch[1].length) : raw;
  const count = useCountUp(target, active, 1600);
  // Non-numeric values ("Free", "Verifiable") are shown as-is.
  const display = !numMatch
    ? raw
    : Number.isInteger(target) ? Math.round(count).toLocaleString() : count.toFixed(1);

  return (
    <div
      className={cn(
        'text-center transition-all duration-700 ease-out',
        active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
        {display}{numMatch ? suffix : ''}
      </p>
      <p className="text-sm text-muted-foreground">{stat.label}</p>
    </div>
  );
}

// ── Features section with scroll reveal + hover-lift ────────────────────
function AnimatedFeaturesSection({ features }) {
  const [ref, visible] = useOnScreen({ threshold: 0.15 });
  return (
    <section ref={ref} className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Real photo — a genuine campus moment, replacing what used to
              be a plain centered heading with nothing visual beside it. */}
          <div
            className={cn(
              'transition-all duration-700 order-2 lg:order-1',
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
            )}
          >
            <img
              src="/feature-student.jpg"
              alt="A LearnAfrica student on campus"
              loading="lazy"
              className="rounded-2xl shadow-xl w-full h-auto object-cover aspect-[4/3]"
            />
          </div>

          <div className="order-1 lg:order-2">
            <div
              className={cn(
                'max-w-xl transition-all duration-700 mb-8',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Why LearnAfrica</p>
              <h2 className="text-3xl font-bold tracking-tight">Built for how Africa learns</h2>
              <p className="mt-3 text-muted-foreground">
                Practical, mobile-first and made by people who understand the context.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <Card
                  key={f.title}
                  className={cn(
                    'p-6 border-border/60 transition-all',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  )}
                  style={{
                    transitionDuration: '700ms',
                    transitionDelay: `${100 + i * 120}ms`,
                  }}
                >
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main LandingPage ────────────────────────────────────────────────────────
function heroFor(user, isAuthenticated) {
  if (!isAuthenticated) {
    return {
      badge: 'Built in Ghana, for learners across Africa',
      title: <>Learn skills that open doors, <span className="text-primary">right here in Africa</span></>,
      text: 'Practical courses from people who understand your world. Learn on your phone at your own pace, earn a certificate anyone can verify, and grow with a community that cheers you on.',
      primary: { to: '/signup', label: 'Get Started Free' },
      secondary: [
        { to: '/courses', label: 'Browse Courses', icon: Play },
        { to: '/login', label: 'Login' },
      ],
    };
  }
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'friend';
  const title = <>Welcome back, <span className="text-primary">{firstName}</span></>;
  const badge = `${greeting}! Great to see you again`;
  const role = user?.role;

  if (['admin', 'superadmin'].includes(role)) {
    return {
      badge, title,
      text: 'Thanks for keeping LearnAfrica running. Review applications, look after courses and keep an eye on how learners are doing.',
      primary: { to: '/admin', label: 'Open Admin Panel' },
      secondary: [{ to: '/instructor/courses', label: 'Manage Courses' }],
      actions: [
        { to: '/admin', label: 'Admin Panel', desc: 'Users, applications & stats', icon: LayoutDashboard },
        { to: '/instructor/courses', label: 'Manage Courses', desc: 'Create and edit courses', icon: BookOpen },
        { to: '/receipts', label: 'Receipts', desc: 'Payment history', icon: Receipt },
        { to: '/settings', label: 'Settings', desc: 'Account preferences', icon: Settings },
      ],
    };
  }
  if (role === 'instructor' && ['pending', 'rejected'].includes(user?.instructor_status)) {
    return {
      badge, title,
      text: "Your instructor application is with our team. Make sure your payout method is saved on your Profile; we'll let you know as soon as you're approved.",
      primary: { to: '/instructor', label: 'View Application Status' },
      secondary: [{ to: '/profile', label: 'Add Payout Method' }],
      actions: [
        { to: '/instructor', label: 'Application Status', desc: 'See where things stand', icon: LayoutDashboard },
        { to: '/profile', label: 'Payout Method', desc: 'Required before approval', icon: Wallet },
        { to: '/settings', label: 'Settings', desc: 'Account preferences', icon: Settings },
      ],
    };
  }
  if (role === 'instructor') {
    return {
      badge, title,
      text: 'Your students are learning from you right now. See how your courses are doing, or share something new today.',
      primary: { to: '/instructor', label: 'Go to My Dashboard' },
      secondary: [{ to: '/instructor/courses/create', label: 'Create a Course', icon: PlusCircle }],
      actions: [
        { to: '/instructor/courses', label: 'My Courses', desc: 'Edit and publish', icon: BookOpen },
        { to: '/instructor/analytics', label: 'Analytics', desc: 'Students & progress', icon: BarChart2 },
        { to: '/instructor/coupons', label: 'Coupons', desc: 'Discounts for students', icon: Ticket },
        { to: '/instructor/receipts', label: 'Earnings', desc: 'Receipts & payouts', icon: Wallet },
      ],
    };
  }
  return {
    badge, title,
    text: 'Pick up where you left off, or discover something new to learn today. Every lesson brings you closer to your goal.',
    primary: { to: '/dashboard', label: 'Continue Learning' },
    secondary: [{ to: '/courses', label: 'Explore Courses', icon: Play }],
    actions: [
      { to: '/dashboard', label: 'My Learning', desc: 'Your courses & progress', icon: LayoutDashboard },
      { to: '/courses', label: 'Explore Courses', desc: 'Find your next skill', icon: Search },
      { to: '/dashboard/leaderboard', label: 'Leaderboard', desc: 'See how you rank', icon: Trophy },
      { to: '/receipts', label: 'Receipts', desc: 'Your purchases', icon: Receipt },
    ],
  };
}

function QuickActions({ actions }) {
  return (
    <section className="py-10 border-b border-border bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-semibold mb-4">Jump back in</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {actions.map(({ to, label, desc, icon: Icon }) => (
            <Link key={label} to={to}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 hover-lift transition-colors hover:border-primary/40">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold group-hover:text-primary">{label}</span>
                <span className="block text-xs text-muted-foreground leading-snug">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const { user, courses, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Backwards compatibility for credential QR codes created before the
  // dedicated verification route existed.
  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#verify-section')) return;
    const id = new URLSearchParams(hash.split('?')[1] || '').get('id');
    navigate(`/verify-credential${id ? `?id=${encodeURIComponent(id)}` : ''}`, { replace: true });
  }, [navigate]);

  // Live counters for the stats strip. Falls back to sensible defaults while
  // loading, and hides the strip entirely if the admin disabled it.
  const [homeStats, setHomeStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/homepage/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setHomeStats(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Course browsing is for visitors and students only.
  const canBrowse = !isAuthenticated || user?.role === 'student';
  const hero = heroFor(user, isAuthenticated);
  const displayCourses = canBrowse ? courses.filter(c => !c.isEnrolled).slice(0, 3) : [];
  const statsOn = homeStats?.enabled !== false;
  // Admin-set marketing numbers (fall back to the real course count while loading).
  const statCourseCount = statsOn ? (homeStats?.courses ?? courses.length) : courses.length;
  const stats = [
    { value: `${statCourseCount}+`,          label: 'Courses'      },
    { value: `${homeStats?.students ?? 0}+`, label: 'Students'     },
    { value: `${homeStats?.instructors ?? 0}+`, label: 'Instructors' },
    { value: 'Verifiable',                   label: 'Certificates' },
  ];

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 via-background to-background">
        {/* Decorative gradient blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* ── Text column ── */}
            <div className={cn(!isAuthenticated ? 'max-w-xl' : 'max-w-2xl')}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" /> {hero.badge}
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {hero.text}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={hero.primary.to}>
                  <Button size="lg" className="gap-2">{hero.primary.label} <ArrowRight className="h-5 w-5" /></Button>
                </Link>
                {hero.secondary.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to}>
                    <Button variant="outline" size="lg" className="gap-2 bg-background/70">{Icon && <Icon className="h-5 w-5" />}{label}</Button>
                  </Link>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {['/student1.jpg','/student2.jpg','/student3.jpg','/student4.jpg','/student5.jpg'].map((src, i) => (
                    <img key={i} src={src} alt="" loading="lazy"
                      className="h-10 w-10 rounded-full border-2 border-background object-cover" />
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
                  <p className="text-sm text-muted-foreground">Trusted by learners across Africa</p>
                </div>
              </div>
            </div>

            {/* ── Visual column ── */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/60 aspect-[4/3]">
                  <img
                    src={isAuthenticated ? '/hero-community.jpg' : '/tech-skills.jpg'}
                    alt={isAuthenticated
                      ? 'The LearnAfrica community learning together'
                      : 'A LearnAfrica student building real technical skills'}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Floating: live learners */}
                <div className="absolute -left-3 sm:-left-6 bottom-6 flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">{statCourseCount}+ courses</p>
                    <p className="text-xs text-muted-foreground mt-1">across Africa</p>
                  </div>
                </div>

                {/* Floating: verifiable certificate */}
                <div className="absolute -right-2 sm:-right-5 top-6 flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                    <ShieldCheck className="h-5 w-5 text-success" />
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">Verifiable</p>
                    <p className="text-xs text-muted-foreground mt-1">certificates</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {hero.actions && <QuickActions actions={hero.actions} />}

      {/* ── How It Works — sits directly under the hero so the journey reads
             as one continuous story ── */}
      {canBrowse && <HowItWorksSection isAuthenticated={isAuthenticated} />}

      {/* ── Stats ── */}
      {statsOn && <AnimatedStatsSection stats={stats} />}

      {/* ── Features ── */}
      <AnimatedFeaturesSection features={features} />

      {/* ── Popular Courses ── */}
      {displayCourses.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Start learning</p>
                <h2 className="text-3xl font-bold tracking-tight">Popular Courses</h2>
                <p className="text-muted-foreground mt-2">Pick a course and begin today.</p>
              </div>
              <Link to="/courses">
                <Button variant="outline">View All <ArrowRight className="h-4 w-4 ml-2" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayCourses.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials Carousel ── */}
      <TestimonialsSection />

      {/* Futuristic credential trust + community feature cards */}
      <section className="relative isolate overflow-hidden border-y border-border/70 bg-muted/30 py-10 text-foreground sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,.10) 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-7 max-w-2xl text-center sm:mb-9">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Beyond the classroom</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Skills deserve to be seen. <span className="text-primary">People deserve to connect.</span></h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Verify a learning milestone with confidence, then find your people and keep growing together.</p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
            <article className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 transition duration-500 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[0.03] sm:p-5">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full border border-primary/10 transition-transform duration-700 group-hover:scale-125" />
              <div className="relative grid items-center gap-4 sm:grid-cols-[1fr_0.8fr]">
                <div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-primary/75">Credential trust portal</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">A certificate that speaks for itself.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Let employers and institutions check the authenticity of LearnAfrica certificates and badges. No account needed.</p>
                  <Link to="/verify-credential" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">Verify a certificate <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </div>
                <div className="relative mx-auto w-full max-w-[195px] rotate-2 rounded-xl border border-primary/20 bg-gradient-to-br from-muted via-card to-background p-2 shadow-2xl shadow-black/30 transition-transform duration-500 group-hover:rotate-0">
                  <div className="rounded-lg border border-primary/15 px-3 py-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Award className="h-6 w-6" /></div>
                    <p className="mt-3 text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground">LearnAfrica</p>
                    <p className="mt-2 font-serif text-lg leading-tight text-foreground">Certificate of <span className="italic text-primary">achievement</span></p>
                    <div className="mx-auto my-3 h-px w-14 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                    <div className="flex items-center justify-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2 py-1.5 text-[8px] font-bold text-primary"><ShieldCheck className="h-3 w-3" /> PUBLIC VERIFICATION</div>
                    <p className="mt-3 font-mono text-[8px] tracking-widest text-muted-foreground/70">LEARN · BUILD · GROW</p>
                  </div>
                </div>
              </div>
            </article>
            <article className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 transition duration-500 hover:-translate-y-1 hover:border-primary/30 sm:p-5">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-primary/[0.05] blur-2xl transition-transform duration-700 group-hover:scale-125" />
              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Users className="h-5 w-5" /></span>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-primary/75">The LearnAfrica network</p>
                <h3 className="mt-2 max-w-lg text-xl font-bold tracking-tight sm:text-2xl">Your next breakthrough could start with a conversation.</h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Ask questions, share progress, and connect with learners across Africa in a dedicated member community.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <span className="rounded-xl border border-border bg-muted/60 p-2.5 text-xs text-muted-foreground"><MessageSquare className="mb-2 h-4 w-4 text-primary" /> Ask & share</span>
                  <span className="rounded-xl border border-border bg-muted/60 p-3 text-xs text-muted-foreground"><Users className="mb-2 h-4 w-4 text-primary" /> Learn together</span>
                  <span className="rounded-xl border border-border bg-muted/60 p-3 text-xs text-muted-foreground"><Sparkles className="mb-2 h-4 w-4 text-primary" /> Grow skills</span>
                </div>
                <Link to="/community" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15">{isAuthenticated ? 'Open the Community' : 'Sign in to join the Community'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                <p className="mt-3 text-[11px] text-muted-foreground">Community participation requires an account.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Teach on LearnAfrica (shows the current instructor fee) ── */}
      {!isAuthenticated && <InstructorCTASection />}

      {/* ── CTA (last section on the page) ── */}
      {!isAuthenticated && <AnimatedFinalCTA />}

    </div>
  );
}

// ── "Become an instructor" CTA — reflects the admin's free/paid setting ────
function InstructorCTASection() {
  const [ref, visible] = useOnScreen({ threshold: 0.2 });
  const [reg, setReg] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/instructor-registration`)
      .then(r => r.json())
      .then(setReg)
      .catch(() => {});
  }, []);
  const isFree = reg?.is_free !== false;
  return (
    <section ref={ref} className="py-16 sm:py-20 border-t border-border">
      <div className={cn('container mx-auto px-4 transition-opacity duration-700', visible ? 'opacity-100' : 'opacity-0')}>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Teach on LearnAfrica</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Share your knowledge with Africa</h2>
            <p className="text-muted-foreground mb-6">
              Create courses, reach learners across the continent, and earn from your expertise.
              {' '}
              {reg && (isFree
                ? 'Instructor registration is completely free.'
                : `Instructor registration is ${reg.currency || 'GHS'} ${Number(reg.fee || 0).toFixed(2)} — a one-time fee.`)}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/signup/instructor-info">
                <Button size="lg">
                  Become an instructor <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: GraduationCap, label: 'Create courses', desc: 'Build lessons, quizzes and resources' },
              { icon: Wallet, label: 'Earn money', desc: 'Get paid for every enrolment' },
              { icon: Users, label: 'Reach students', desc: 'Across Ghana and beyond' },
              { icon: Award, label: 'Get recognised', desc: 'Build your teaching profile' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="p-4">
                <Icon className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA with animated background flourishes ─────────────────────────
function AnimatedFinalCTA() {
  const [ref, visible] = useOnScreen({ threshold: 0.2 });
  return (
    <section ref={ref} className="py-20">
      <div className="container mx-auto px-4">
        <Card className={cn(
          "relative overflow-hidden bg-primary p-12 text-center transition-opacity duration-700",
          visible ? 'opacity-100' : 'opacity-0'
        )}>
          <div className="relative">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to Start Learning?</h2>
            <p className="text-primary-foreground/80 mb-8">Join our growing community of African learners today.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/signup"><Button size="lg" variant="secondary">Create Free Account</Button></Link>
              <Link to="/courses"><Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-colors">Explore Courses</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
