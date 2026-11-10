import React from 'react';

export default function CustomLessonFrame({ lesson, children, mode = 'student', onComplete, isCompleted = false, isSaving = false }) {
  const readingRef = React.useRef(null);
  const canComplete = mode === 'student' && typeof onComplete === 'function';

  const getScrollContainer = () => {
    const article = readingRef.current;
    if (!article) return null;
    const main = article.closest('main');
    if (main && main.scrollHeight > main.clientHeight) return main;
    return document.scrollingElement || document.documentElement;
  };

  // Move through the lesson in comfortable increments instead of jumping
  // straight to the completion panel.
  const advanceReading = () => {
    const container = getScrollContainer();
    if (!container) return;
    const isDocumentScroll = container === document.scrollingElement || container === document.documentElement;
    const currentTop = isDocumentScroll ? window.scrollY : container.scrollTop;
    const viewportHeight = container.clientHeight || window.innerHeight;
    const step = Math.min(420, Math.max(220, Math.round(viewportHeight * 0.48)));
    const nextTop = currentTop + step;
    if (isDocumentScroll) window.scrollTo({ top: nextTop, behavior: 'smooth' });
    else container.scrollTo({ top: nextTop, behavior: 'smooth' });
  };

  const heroTitle = lesson?.title || 'Explore, understand and apply what you learn.';

  return (
    <div className="custom-lesson-page" data-custom-lesson-mode={mode}>
      <section className="custom-lesson-hero" aria-label="Lesson introduction">
        <img className="custom-lesson-hero-photo" src="https://images.pexels.com/photos/5965650/pexels-photo-5965650.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt="A student studying outdoors on a laptop with a notebook beside her" loading="eager" />
        <div className="custom-lesson-hero-copy"><h1>{heroTitle}</h1></div>
      </section>
      <article ref={readingRef} className="custom-lesson-system" aria-label={lesson?.title || 'Custom lesson'}>
        {children}
        {canComplete && (
          <section className="custom-lesson-completion" aria-label="Complete this lesson">
            <p>You've reached the end of this lesson. Click below to mark it as complete and continue to your next lesson.</p>
            {isCompleted ? (
              <button type="button" className="is-completed" disabled aria-label="Lesson completed">FINISHED <span aria-hidden="true">✓</span></button>
            ) : (
              <button type="button" onClick={onComplete} disabled={isSaving}>{isSaving ? 'SAVING...' : 'MARK AS COMPLETE'}</button>
            )}
          </section>
        )}
        <div className="custom-lesson-content-end" aria-hidden="true" />
      </article>
      <div className="custom-lesson-sticky-action">
        <button type="button" onClick={advanceReading} aria-label="Scroll down through the lesson in small steps">
          <span className="custom-lesson-scroll-label">{mode === 'student' ? 'SCROLL DOWN AND MARK AS COMPLETE' : 'SCROLL THROUGH LESSON'}</span>
          <span className="custom-lesson-scroll-arrows" aria-hidden="true"><i>↓</i><i>↓</i></span>
        </button>
      </div>
    </div>
  );
}
