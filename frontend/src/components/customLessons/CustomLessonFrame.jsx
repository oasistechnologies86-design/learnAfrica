/**
 * Shared presentation frame used by instructor preview and student lessons.
 * Subject-specific components keep their own teaching content and activities.
 */
export default function CustomLessonFrame({ lesson, children, mode = 'student' }) {
  return (
    <article className="custom-lesson-system w-full min-w-0" data-custom-lesson-mode={mode} aria-label={lesson?.title || 'Custom lesson'}>
      {children}
    </article>
  );
}
