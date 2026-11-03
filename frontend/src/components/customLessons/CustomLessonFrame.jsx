import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * One calm, book-like reading frame shared by student lessons and instructor preview.
 * The floating reading cue stays visible until the reader reaches the end.
 */
export default function CustomLessonFrame({ lesson, children, mode = 'student' }) {
  const [showScrollCue, setShowScrollCue] = useState(false);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const remaining = root.scrollHeight - (window.scrollY + window.innerHeight);
      setShowScrollCue(root.scrollHeight > window.innerHeight + 180 && remaining > 150);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [lesson?.id]);

  const scrollFurther = () => window.scrollBy({ top: Math.max(420, window.innerHeight * 0.72), behavior: 'smooth' });

  return (
    <>
      <article className="custom-lesson-system w-full min-w-0" data-custom-lesson-mode={mode} aria-label={lesson?.title || 'Custom lesson'}>
        {children}
      </article>
      {showScrollCue && (
        <button
          type="button"
          className="custom-lesson-scroll-hint"
          onClick={scrollFurther}
          aria-label="Scroll down to continue reading"
        >
          <ChevronDown aria-hidden="true" />
          <span>Scroll down to continue reading</span>
        </button>
      )}
    </>
  );
}
