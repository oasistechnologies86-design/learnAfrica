import { useCallback, useEffect, useRef, useState } from 'react';

export default function CustomLessonFrame({ lesson, children, mode = 'student', onComplete, isCompleted = false, isSaving = false }) {
  const heroRef = useRef(null);
  const artRef = useRef(null);
  const readingRef = useRef(null);

  const [atLessonEnd, setAtLessonEnd] = useState(false);
  const scrollContainerRef = useRef(null);
  const canComplete = mode === 'student' && typeof onComplete === 'function';

  const getScrollContainer = useCallback(() => {
    const article = readingRef.current;
    if (!article) return null;
    const main = article.closest('main');
    if (main && main.scrollHeight > main.clientHeight) return main;
    return document.scrollingElement || document.documentElement;
  }, []);

  const updateEndState = useCallback(() => {
    const container = getScrollContainer();
    if (!container) return;
    const atEnd = container.scrollTop + container.clientHeight >= container.scrollHeight - 48;
    setAtLessonEnd(atEnd);
  }, [getScrollContainer]);

  useEffect(() => {
    const container = getScrollContainer();
    if (!container) return undefined;
    scrollContainerRef.current = container;
    const handleScroll = () => updateEndState();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleScroll)
      : null;
    if (readingRef.current && observer) observer.observe(readingRef.current);
    handleScroll();
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      observer?.disconnect();
    };
  }, [getScrollContainer, updateEndState, children]);

  const advanceReading = () => {
    const container = scrollContainerRef.current || getScrollContainer();
    if (!container) return;
    const step = Math.max(260, Math.round(container.clientHeight * 0.68));
    const maxScroll = container.scrollHeight - container.clientHeight;
    const nextTop = Math.min(maxScroll, container.scrollTop + step);
    if (container === document.scrollingElement || container === document.documentElement) {
      window.scrollTo({ top: nextTop, behavior: 'smooth' });
    } else {
      container.scrollTo({ top: nextTop, behavior: 'smooth' });
    }
  };

  const handlePointerMove = (event) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || !heroRef.current || !artRef.current) return;
    const bounds = heroRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    artRef.current.style.setProperty('--move-x', `${x * 13}px`);
    artRef.current.style.setProperty('--move-y', `${y * 10}px`);
    artRef.current.style.setProperty('--tilt-y', `${x * 7}deg`);
    artRef.current.style.setProperty('--tilt-x', `${-y * 5}deg`);
  };

  const resetPointer = () => {
    if (!artRef.current) return;
    ['--move-x', '--move-y', '--tilt-x', '--tilt-y'].forEach((property) => artRef.current.style.setProperty(property, '0'));
  };

  const heroTitle = lesson?.title || 'Explore, understand and apply what you learn.';
  // The course section is already identified in the course navigation. The hero
  // therefore uses only the active lesson's own title.

  return (
    <div className="custom-lesson-page" data-custom-lesson-mode={mode}>
      <section
        ref={heroRef}
        className="custom-lesson-hero"
        aria-label="Animated lesson introduction"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        <div className="custom-lesson-stars" aria-hidden="true" />
        <div className="custom-lesson-hero-copy">
          <h1>{heroTitle}</h1>
        </div>
        <svg ref={artRef} className="custom-lesson-hero-art" viewBox="0 0 560 285" role="img" aria-label="A glowing green planet surrounded by orbiting technology icons">
          <defs>
            <radialGradient id="lessonPlanet" cx="35%" cy="28%" r="75%">
              <stop offset="0" stopColor="#a9ffd0" /><stop offset=".32" stopColor="#36d981" />
              <stop offset=".72" stopColor="#087a49" /><stop offset="1" stopColor="#023b2b" />
            </radialGradient>
            <linearGradient id="lessonRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d9ffe8" stopOpacity=".1" />
              <stop offset=".48" stopColor="#8dffc0" stopOpacity=".9" />
              <stop offset="1" stopColor="#d9ffe8" stopOpacity=".12" />
            </linearGradient>
            <filter id="lessonGlow"><feGaussianBlur stdDeviation="7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g fill="none" stroke="url(#lessonRing)" strokeWidth="1.5" opacity=".85">
            <ellipse cx="315" cy="139" rx="218" ry="78" transform="rotate(-17 315 139)" strokeDasharray="5 8" />
            <ellipse cx="315" cy="139" rx="185" ry="112" transform="rotate(25 315 139)" opacity=".55" />
            <ellipse cx="315" cy="139" rx="145" ry="58" transform="rotate(-35 315 139)" opacity=".5" />
          </g>
          <g fill="#d9ffe8" filter="url(#lessonGlow)">
            <circle cx="105" cy="48" r="2.5" /><circle cx="472" cy="42" r="2" />
            <circle cx="495" cy="213" r="2.8" /><circle cx="177" cy="238" r="1.8" />
            <circle cx="390" cy="26" r="1.5" /><circle cx="65" cy="175" r="1.5" />
          </g>
          <g filter="url(#lessonGlow)">
            <circle cx="315" cy="139" r="76" fill="#40e58c" opacity=".13" />
            <circle cx="315" cy="139" r="61" fill="url(#lessonPlanet)" stroke="#baffd2" strokeWidth="2" />
            <path d="M272 115 Q300 93 330 111 T360 109 M263 145 Q295 126 325 143 T365 137 M282 177 Q311 159 346 173" fill="none" stroke="#c5ffda" strokeOpacity=".38" strokeWidth="5" strokeLinecap="round" />
            <path d="M291 129 Q315 106 339 129 M298 139 Q315 124 332 139 M307 149 Q315 143 323 149" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="315" cy="157" r="3.5" fill="#fff" />
            <text x="315" y="180" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">LEARN</text>
          </g>
          <g>
            <g><circle cx="119" cy="83" r="25" fill="#eafff1" stroke="#9bffc0" strokeWidth="2" /><path d="M106 83 L119 71 L132 83 V97 H122 V87 H116 V97 H106Z" fill="#087442" /></g>
            <g><circle cx="493" cy="91" r="25" fill="#eafff1" stroke="#9bffc0" strokeWidth="2" /><rect x="485" y="75" width="16" height="30" rx="3" fill="#087442" /><circle cx="493" cy="99" r="1.7" fill="#fff" /></g>
            <g><circle cx="148" cy="208" r="25" fill="#eafff1" stroke="#9bffc0" strokeWidth="2" /><path d="M134 211 H162 L158 219 H138Z M139 199 H157 V211 H139Z" fill="#087442" /></g>
            <g><circle cx="451" cy="211" r="25" fill="#eafff1" stroke="#9bffc0" strokeWidth="2" /><path d="M439 218 V199 H463 V218 M435 218 H467 M444 199 V191 H450 V199 M454 199 V187 H459 V199" fill="none" stroke="#087442" strokeWidth="3" strokeLinejoin="round" /></g>
          </g>
        </svg>
        <div className="custom-lesson-hero-hint">Move your cursor to explore</div>
      </section>

      <article ref={readingRef} className="custom-lesson-system" aria-label={lesson?.title || 'Custom lesson'}>
        {children}
        <div className="custom-lesson-content-end" aria-hidden="true" />
      </article>
      <div className="custom-lesson-sticky-action">
        {isCompleted ? (
          <button type="button" disabled aria-label="Lesson completed">
            <span>COMPLETED</span>
            <span aria-hidden="true">✓</span>
          </button>
        ) : canComplete && atLessonEnd ? (
          <button type="button" onClick={onComplete} disabled={isSaving}>
            <span>{isSaving ? 'SAVING...' : 'MARK AS COMPLETE'}</span>
            <span aria-hidden="true">✓</span>
          </button>
        ) : (
          <button type="button" onClick={advanceReading}>
            <span>{mode === 'student' ? 'SCROLL DOWN & MARK AS COMPLETE' : 'SCROLL THROUGH LESSON'}</span>
            <span aria-hidden="true">↓</span>
          </button>
        )}
      </div>
    </div>
  );
}
