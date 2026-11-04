/**
 * InstructorPreviewPage — full course+lesson preview for instructors.
 * Uses dedicated /api/instructor/courses/:id/preview endpoints.
 * No enrollment, no payments, no progress saved, no certificates.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, Play, FileText,
  MessageSquare, BookOpen, Clock, Menu, X, FolderOpen,
  ExternalLink, Download, File, ArrowUpRight, HelpCircle,
  Loader2, AlertTriangle, Eye, Lock
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { RichTextViewer } from '@/components/common/RichTextEditor';
import { getCustomLesson } from '@/components/customLessons/registry';
import CustomLessonFrame from '@/components/customLessons/CustomLessonFrame';
import { cn } from '@/lib/utils';
import { API_BASE, parseErr } from '@/lib/api';
import { formatPrice } from '@/lib/money';
import { formatDuration } from '@/components/common/TimePicker';
import { QuizQuestion } from '@/components/quiz/QuizQuestion';

// ── helpers ───────────────────────────────────────────────────────────────
const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('/').pop().split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('/').pop().split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return url.startsWith('http') ? url : null;
};

const authedFetch = (url) => {
  const token = sessionStorage.getItem('auth_token');
  return fetch(`${API_BASE}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
};

// ── Preview Banner ────────────────────────────────────────────────────────
function PreviewBanner({ courseTitle, isPaid, price }) {
  return (
    <div className="w-full bg-amber-500 text-amber-950 text-xs font-bold px-4 py-2.5 flex items-center justify-center gap-2 shadow-md">
      <Eye className="h-3.5 w-3.5 shrink-0" />
      <span className="text-center">
        INSTRUCTOR PREVIEW
        {isPaid && price > 0
          ? ` — This is a paid course (${formatPrice(price)}). Students see a payment flow here. No charges are made in preview.`
          : ' — You are viewing this course as a student would. No progress or certificates are recorded.'}
      </span>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function PreviewSidebar({ sections, allLessons, activeLessonId, courseId, courseTitle, onSelect, onClose }) {
  const [openSections, setOpenSections] = useState(() => {
    const s = new Set();
    sections.forEach(sec => {
      if ((sec.lessons || []).some(l => String(l.id) === String(activeLessonId)))
        s.add(sec.id);
    });
    if (s.size === 0 && sections.length > 0) s.add(sections[0].id);
    return s;
  });

  useEffect(() => {
    sections.forEach(sec => {
      if ((sec.lessons || []).some(l => String(l.id) === String(activeLessonId)))
        setOpenSections(prev => new Set([...prev, sec.id]));
    });
  }, [activeLessonId, sections]);

  const toggle = (id) => setOpenSections(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b lg:hidden">
        <h3 className="font-bold tracking-tight">Course Content</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-background/70 p-3">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center"><Eye className="h-5 w-5 text-primary" /></div>
          <div className="min-w-0"><p className="text-xs font-bold truncate">{courseTitle || 'Course Preview'}</p><p className="text-2xs text-muted-foreground">{allLessons.length} course items · student view</p></div>
        </div>
        <h3 className="font-black text-3xs uppercase tracking-[0.2em] px-2 hidden lg:block text-muted-foreground">
          Lessons Plan
        </h3>
        {sections.map(sec => {
          const secLessons = sec.lessons || [];
          const isOpen = openSections.has(sec.id);
          return (
            <div key={sec.id}>
              <button onClick={() => toggle(sec.id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors text-left">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-xs font-bold text-foreground truncate">{sec.title}</span>
                <span className="text-2xs text-muted-foreground">{secLessons.length}</span>
                <ChevronRight className={cn('h-3 w-3 text-muted-foreground/60 shrink-0 transition-transform', isOpen && 'rotate-90')} />
              </button>
              {isOpen && secLessons.map((l, idx) => {
                const gIdx     = allLessons.findIndex(x => String(x.id) === String(l.id));
                const isCurrent = String(l.id) === String(activeLessonId);
                const isQuiz   = l.type === 'quiz';
                return (
                  <button key={l.id}
                    onClick={() => { onSelect(l.id); onClose?.(); }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3 text-sm transition-all group w-full text-left ml-4',
                      isCurrent ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-accent'
                    )}>
                    <div className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full shrink-0 text-xs font-black transition-colors',
                      isCurrent ? 'bg-white text-primary' : 'bg-muted group-hover:bg-background'
                    )}>
                      {isQuiz ? <HelpCircle className="h-3.5 w-3.5" /> : gIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold tracking-tight leading-tight">{l.title}</p>
                      <p className={cn('text-2xs mt-0.5 font-medium opacity-70',
                        isCurrent ? 'text-primary-foreground' : 'text-muted-foreground')}>
                        {isQuiz ? (l.is_final ? 'Final Examination' : 'Lesson Test') : l.duration || ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Preview Quiz ─────────────────────────────────────────────────────────────
// Uses instructor-only read access to the answer key. All interaction remains
// in local component state; no student attempt, payment, score or progress is written.
function PreviewQuiz({ courseId, lessonId, isFinal = false }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = sessionStorage.getItem('auth_token');
    fetch(`${API_BASE}/api/instructor/courses/${courseId}/lessons/${lessonId}/quiz-preview`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Could not load assessment preview');
        return data.quiz;
      })
      .then(data => { if (!cancelled) setQuiz(data || null); })
      .catch(() => { if (!cancelled) setQuiz(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, lessonId]);

  const passScore = Number(quiz?.pass_score ?? 70);
  const submitPreview = useCallback(() => {
    if (!quiz?.questions?.length) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      const answer = answers[i];
      if (q.question_type === 'fill_blank') {
        if (String(answer || '').trim().toLowerCase() === String(q.correct_answer || '').trim().toLowerCase()) correct++;
      } else if (Number(answer) === Number(q.correct_answer)) {
        correct++;
      }
    });
    setScore(Math.round((correct / quiz.questions.length) * 100));
    setSubmitted(true);
  }, [quiz, answers]);

  // A preview timer mirrors the student's configured countdown, but remains
  // entirely local. It creates no attempt session and writes no score.
  useEffect(() => {
    if (!showQuestions || submitted || timeLeft === null) return;
    if (timeLeft <= 0) {
      submitPreview();
      return;
    }
    const timer = setInterval(() => setTimeLeft(value => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [showQuestions, submitted, timeLeft, submitPreview]);

  const formatPreviewTime = seconds => {
    if (seconds === null) return 'No time limit';
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>;
  if (!quiz?.questions?.length) return (
    <div className="p-6 rounded-xl border border-border bg-muted/20 text-center">
      <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">No questions have been added to this {isFinal ? 'Final Examination' : 'Lesson Test'} yet.</p>
    </div>
  );

  const q = quiz.questions[current];
  const opts = Array.isArray(q.options) ? q.options : [];
  const assessmentName = isFinal ? 'Final Examination' : 'Lesson Test';

  if (!showQuestions) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <Eye className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          Instructor Preview — these are the saved assessment rules. Student-specific remaining attempts are shown to each enrolled student.
        </p>
      </div>
      <Card className="p-4 sm:p-5">
        <h3 className="font-bold text-sm mb-3">{assessmentName} information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">Questions in this preview</p>
            <p className="text-base font-bold">{quiz.questions.length}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">Time allowed</p>
            <p className="text-sm font-bold">{quiz.timer_enabled && Number(quiz.duration_seconds) > 0 ? formatDuration(Number(quiz.duration_seconds)) : 'No time limit'}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">Attempts configured</p>
            <p className="text-sm font-bold">{quiz.attempts_enabled && Number(quiz.max_attempts) > 0 ? `${Number(quiz.max_attempts)} included attempts` : 'Unlimited attempts'}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">Passing score</p>
            <p className="text-sm font-bold">{passScore}%</p>
          </div>
          {quiz.attempts_enabled && Number(quiz.extra_attempt_price) > 0 && (
            <div className="rounded-lg bg-muted/60 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Extra attempt fee</p>
              <p className="text-sm font-bold">GHS {Number(quiz.extra_attempt_price).toFixed(2)}</p>
            </div>
          )}
        </div>
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          This preview uses the configured question selection and shuffling. Starting it will not create a real attempt, start a student timer, or save a score.
        </div>
        {isFinal && (
          <div className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Course attempt allowance</p>
            <p>The first time a student passes this Final Examination, the attempt limits for quizzes in this course reset to the original included-attempt amounts set by the instructor. Previous attempts and payment receipts remain in history.</p>
          </div>
        )}
        <Button className="w-full mt-5" onClick={() => setConfirmStart(true)}>Start {assessmentName} Preview</Button>
      </Card>
      {confirmStart && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-2">Start {assessmentName} preview?</h3>
            <p className="text-sm text-muted-foreground mb-5">This is a safe instructor preview. No student attempt or timer will be started and no records will be changed.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmStart(false)}>Go Back</Button>
              <Button className="flex-1" onClick={() => {
                setConfirmStart(false);
                setTimeLeft(quiz.timer_enabled && Number(quiz.duration_seconds) > 0 ? Number(quiz.duration_seconds) : null);
                setShowQuestions(true);
              }}>Yes, Start Preview</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <Eye className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          Preview Mode — this {assessmentName} is for instructor review only. Nothing is saved and no student progress is changed.
        </p>
      </div>
      {!submitted ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Question {current + 1} of {quiz.questions.length} · {assessmentName}</span>
            <span className={cn("rounded-md bg-muted px-2 py-1 font-semibold tabular-nums", timeLeft !== null && timeLeft < 60 && "text-destructive bg-destructive/10")}>
              {formatPreviewTime(timeLeft)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {quiz.questions.map((_, index) => (
              <button key={index} type="button" onClick={() => setCurrent(index)}
                className={cn("h-8 w-8 rounded-lg border text-xs font-bold transition-colors",
                  current === index ? "bg-primary text-primary-foreground border-primary" :
                  answers[index] !== undefined && answers[index] !== "" ? "bg-success/10 text-success border-success/30" :
                  "bg-card border-border")}>
                {index + 1}
              </button>
            ))}
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <QuizQuestion
              question={{ ...q, question: q.question_text || q.question || q.text }}
              questionNumber={current + 1}
              totalQuestions={quiz.questions.length}
              selectedAnswer={answers[current]}
              onSelectAnswer={value => setAnswers(previous => ({ ...previous, [current]: value }))}
            />
          </div>
          <div className="flex gap-3">
            {current > 0 && <Button variant="outline" onClick={() => setCurrent(v => v - 1)} className="flex-1">← Previous</Button>}
            {current < quiz.questions.length - 1 ? (
              <Button onClick={() => setCurrent(v => v + 1)} className="flex-1" disabled={answers[current] === undefined || answers[current] === ''}>Next →</Button>
            ) : (
              <Button onClick={submitPreview} className="flex-1" disabled={Object.keys(answers).length < quiz.questions.length || quiz.questions.some((question, i) => answers[i] === undefined || answers[i] === '')}>
                Submit {assessmentName} Preview
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className={cn('inline-flex h-20 w-20 items-center justify-center rounded-full mx-auto', score >= passScore ? 'bg-success/10' : 'bg-destructive/10')}>
            <span className="text-2xl font-bold">{score}%</span>
          </div>
          <p className="font-bold text-lg">{score >= passScore ? `${assessmentName} would be passed` : `${assessmentName} would not be passed`}</p>
          <p className="text-sm text-muted-foreground">The configured passing score is {passScore}%. This is a preview result only; it does not affect course completion or certificate eligibility.</p>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">Preview only — no score, attempt, payment or progress was saved.</div>
          <Button variant="outline" onClick={() => { setSubmitted(false); setAnswers({}); setCurrent(0); setScore(null); setTimeLeft(null); setShowQuestions(false); }}>Retake Preview</Button>
        </div>
      )}
    </div>
  );
}

// ── Main Preview Page ─────────────────────────────────────────────────────
export function PreviewCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Admins reach preview from the admin area, so send them back there.
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const backTo  = isAdmin ? '/admin' : '/instructor/courses';
  const backLabel = isAdmin ? 'Back to Admin' : 'Back to Courses';

  const [course,       setCourse]       = useState(null);
  const [allLessons,   setAllLessons]   = useState([]);
  const [sections,     setSections]     = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeTab,    setActiveTab]    = useState('content');
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [lessonLoading,setLessonLoading]= useState(false);
  const [error,        setError]        = useState(null);

  // ⚠ Defined BEFORE the useEffect below — the effect calls this on mount.
  const loadLesson = useCallback(async (lessonId, cid) => {
    setLessonLoading(true); setActiveTab('content');
    try {
      const r = await authedFetch(`/api/instructor/courses/${cid || courseId}/lessons/${lessonId}/preview`);
      if (!r.ok) throw new Error(await parseErr(r, 'Lesson not found'));
      const data = await r.json();
      setActiveLesson(data.lesson);
    } catch (e) { console.error(e); }
    setLessonLoading(false); setLoading(false);
  }, [courseId]);

  // Load course structure via preview API
  useEffect(() => {
    setLoading(true);
    authedFetch(`/api/instructor/courses/${courseId}/preview`)
      .then(async r => {
        if (!r.ok) throw new Error(await parseErr(r, 'Course not found'));
        return r.json();
      })
      .then(data => {
        const c = data.course;
        setCourse(c);
        const secs = c.sections || [];
        setSections(secs);
        const flat = secs.flatMap(s => s.lessons || []);
        setAllLessons(flat);
        // Auto-load first lesson
        if (flat.length > 0) loadLesson(flat[0].id, courseId);
        else setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [courseId, loadLesson]);

  const currentIndex = useMemo(
    () => allLessons.findIndex(l => String(l.id) === String(activeLesson?.id)),
    [allLessons, activeLesson]
  );
  const prevLesson = currentIndex > 0                      ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Preview Unavailable</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    </div>
  );

  const isPaid = course && !course.is_free && course.price > 0;
  const embedUrl = activeLesson ? (activeLesson.videoUrl || activeLesson.video_url || '') : '';
  const isIframe = embedUrl && (embedUrl.includes('youtube.com/embed') || embedUrl.includes('youtu.be') || embedUrl.includes('vimeo.com'));
  const embedSrc = (() => {
    if (!embedUrl) return null;
    try {
      if (embedUrl.includes('youtube.com/watch')) {
        const id = new URL(embedUrl).searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (embedUrl.includes('youtu.be/')) return `https://www.youtube.com/embed/${embedUrl.split('/').pop().split('?')[0]}`;
      if (embedUrl.includes('vimeo.com/')) return `https://player.vimeo.com/video/${embedUrl.split('/').pop().split('?')[0]}`;
    } catch {}
    return embedUrl.startsWith('http') ? embedUrl : null;
  })();
  const resources = activeLesson?.resources || [];
  const navBtnClass = "h-11 px-3 sm:px-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 shrink-0";

  return (
    <div className="flex flex-col bg-background font-sans antialiased text-foreground">

      {/* Preview banner */}
      <PreviewBanner courseTitle={course?.title} isPaid={isPaid} price={course?.price} />

      {/* Header */}
      <header className="sticky top-8 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}
              className="gap-2 text-muted-foreground hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
            <div className="hidden md:block h-4 w-px bg-border" />
            <p className="hidden md:block text-sm font-semibold truncate max-w-xs">{course?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {allLessons.length > 0 && (
              <span className="text-xs font-bold tabular-nums text-muted-foreground bg-muted px-2 py-1 rounded">
                {currentIndex + 1} / {allLessons.length}
              </span>
            )}
            <div className="hidden lg:flex items-center gap-1.5">
              {prevLesson
                ? <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => loadLesson(prevLesson.id)}><ChevronLeft className="h-4 w-4" /></Button>
                : <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>}
              {nextLesson
                ? <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => loadLesson(nextLesson.id)}><ChevronRight className="h-4 w-4" /></Button>
                : <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSidebar(true)}
              className="lg:hidden h-9 w-9 p-0">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto outline-none px-4 sm:px-6 lg:px-8 py-6">

          {/* Custom page lesson — plug in a pre-built React component */}
          {activeLesson?.type === 'custom' ? (() => {
            const registryEntry = getCustomLesson(activeLesson.component_key || activeLesson.componentKey);
            if (registryEntry?.component) {
              const Component = registryEntry.component;
              // Instructors preview as if they were a sample student
              const mockStudent = { id: 'preview', name: 'Sample Student', email: 'preview@example.com', avatar: '' };
              return (
                <div className="w-full">
                  <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <span className="font-bold">Preview mode:</span>
                    <span>Custom page rendered with sample student data. Real students see their own name and email.</span>
                  </div>
                  <CustomLessonFrame lesson={activeLesson} mode="preview">
                    <Component student={mockStudent} lesson={activeLesson} />
                    <section className="custom-lesson-finish mt-10 border-t border-border pt-8 text-center">
                      <div className="mb-4 flex justify-center"><div className="custom-lesson-down-cue" aria-hidden="true"><ChevronRight className="h-7 w-7 rotate-90" /></div></div>
                      <p className="text-base font-bold text-foreground">You’ve reached the end of this lesson</p>
                      <p className="mt-1 text-sm text-muted-foreground">You have reached the end of the lesson content. Preview does not record lesson completion.</p>
                    </section>
                  </CustomLessonFrame>
                </div>
              );
            }
            return (
              <Card className="p-6 border-warning/40 bg-warning/5">
                <p className="text-sm font-semibold text-warning">
                  Custom component not selected or not registered.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick a component from the registry when editing this lesson.
                </p>
              </Card>
            );
          })() :

          /* Video or Text-only lesson */
          activeLesson?.type === 'text' || (!embedSrc && activeLesson?.text_content) ? (
            <Card className="w-full bg-gradient-to-br from-card to-muted/20 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Lesson Content</span>
              </div>
              <RichTextViewer
                html={activeLesson?.text_content || activeLesson?.textContent || ''}
                className="max-h-[600px]"
              />
            </Card>
          ) : embedSrc && (
            <>
              <div className="aspect-video w-full bg-slate-950 relative shadow-inner rounded-2xl overflow-hidden">
                {(embedSrc.includes('youtube.com/embed') || embedSrc.includes('vimeo.com')) ? (
                  <iframe src={embedSrc} className="w-full h-full" allowFullScreen
                    title={activeLesson?.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" />
                ) : (
                  <video controls className="w-full h-full object-cover" preload="metadata">
                    <source src={embedSrc} type="video/mp4" />
                  </video>
                )}
              </div>
              {(activeLesson?.text_content || activeLesson?.textContent) && (
                <Card className="w-full mt-6 bg-gradient-to-br from-card to-muted/20 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Lesson Notes</span>
                  </div>
                  <RichTextViewer
                    html={activeLesson?.text_content || activeLesson?.textContent || ''}
                  />
                </Card>
              )}
            </>
          )}

          {lessonLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            </div>
          ) : activeLesson && activeLesson.type !== 'custom' ? (
            <div className="max-w-4xl mx-auto py-8">

              {/* Lesson meta */}
              <div className="mb-10">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {activeLesson.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{activeLesson.duration}</span>
                    </div>
                  )}
                  {activeLesson.type === 'quiz' && (
                    <span className="flex items-center gap-1.5 text-primary">
                      <HelpCircle className="h-3.5 w-3.5" /> {activeLesson.is_final ? 'Final Exam' : 'Test'}
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-3">{activeLesson.title}</h1>
                {activeLesson.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{activeLesson.description}</p>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-border mb-8">
                <div className="flex items-center gap-4 sm:gap-10 overflow-x-auto pb-px">
                  {['content','resources','notes','discussion'].map(id => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={cn(
                        'flex items-center gap-2 pb-4 text-sm font-bold transition-all whitespace-nowrap capitalize border-b-2 tracking-wide shrink-0',
                        activeTab === id
                          ? 'border-primary text-primary translate-y-[1px]'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}>
                      {id === 'content'   && <FileText   className="h-4 w-4 shrink-0" />}
                      {id === 'resources' && <FolderOpen className="h-4 w-4 shrink-0" />}
                      {id === 'notes'     && <BookOpen   className="h-4 w-4 shrink-0" />}
                      {id === 'discussion' && <MessageSquare className="h-4 w-4 shrink-0" />}
                      <span>{id}</span>
                      {id === 'resources' && resources.length > 0 && (
                        <span className="ml-0.5 bg-primary/15 text-primary text-3xs font-black w-4 h-4 rounded-full flex items-center justify-center">
                          {resources.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="min-h-[300px]">

                {activeTab === 'content' && (
                  <div>
                    {activeLesson.content ? (
                      <div className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeLesson.content) }} />
                    ) : (
                      <p className="text-muted-foreground italic text-sm">
                        {activeLesson.type === 'quiz'
                          ? 'No additional lesson content is attached to this assessment.'
                          : 'No written content for this lesson.'}
                      </p>
                    )}
                    {activeLesson.type === 'quiz' && (
                      <PreviewQuiz courseId={courseId} lessonId={activeLesson.id} isFinal={!!activeLesson.is_final} />
                    )}
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold mb-4">Lesson Resources</h3>
                    {resources.length > 0 ? resources.map((r, i) => (
                      <div key={r.id || i} onClick={() => window.open(r.url, '_blank')}
                        className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border hover:border-primary/50 hover:bg-card transition-all group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <File className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{r.title}</p>
                            <p className="text-3xs text-muted-foreground uppercase tracking-widest">{r.type || r.file_type}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    )) : (
                      <div className="text-center py-10 border border-dashed border-border rounded-xl">
                        <Download className="h-8 w-8 mx-auto text-muted-foreground/20 mb-3" />
                        <p className="text-muted-foreground text-sm">No resources for this lesson.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'discussion' && (
                  <Card className="p-6 border-dashed bg-muted/30">
                    <div className="flex items-center gap-2 mb-3"><MessageSquare className="h-5 w-5 text-primary" /><p className="font-semibold">Course discussion</p></div>
                    <p className="text-sm text-muted-foreground">Students can view and participate in lesson discussions when enrolled. Discussion posts and replies are disabled in instructor preview so no real student discussion records can be changed.</p>
                  </Card>
                )}

                {activeTab === 'notes' && (
                  <Card className="p-6 border-dashed bg-muted/30">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                      <Eye className="h-5 w-5 text-amber-500" />
                      <p className="text-sm font-semibold">Preview Mode — Notes are not saved</p>
                    </div>
                    <textarea disabled
                      placeholder="In preview mode, notes are not saved. Students can take notes here when enrolled."
                      className="w-full min-h-[180px] rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm resize-none text-muted-foreground cursor-not-allowed" />
                  </Card>
                )}
              </div>

              {/* Navigation footer */}
              <div className="mt-16 pt-8 border-t border-border">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex justify-start">
                    {prevLesson && (
                      <Button variant="outline" className={navBtnClass} onClick={() => loadLesson(prevLesson.id)}>
                        <ChevronLeft className="h-5 w-5" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                    )}
                  </div>
                  {/* Centre — preview mode message instead of Mark Complete */}
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
                      <Eye className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-3xs font-black uppercase tracking-tighter text-amber-600">Preview Mode</span>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-end">
                    {nextLesson && (
                      <Button variant="outline" className={navBtnClass} onClick={() => loadLesson(nextLesson.id)}>
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : activeLesson ? null : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <BookOpen className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="font-semibold text-muted-foreground">No lessons in this course yet.</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate(`/instructor/courses/edit/${courseId}`)}>
                Add Lessons
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className={cn(
          'fixed inset-y-0 right-0 z-40 lg:z-30 w-full sm:w-80 border-l border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        )}>
          <div className="flex flex-col h-full shadow-2xl lg:shadow-none">
            <PreviewSidebar
              sections={sections}
              allLessons={allLessons}
              courseTitle={course?.title}
              activeLessonId={activeLesson?.id}
              courseId={courseId}
              onSelect={(id) => loadLesson(id)}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        </aside>
        {showSidebar && (
          <div className="fixed inset-0 z-10 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)} />
        )}
      </div>
    </div>
  );
}
