import { useEffect } from 'react';

/**
 * Displays the supplied LearnAfrica Loader Preview without redesigning its
 * artwork or animation. The route/Suspense lifecycle controls when this
 * component mounts and unmounts.
 */
export default function AfricaMapLoader() {
  useEffect(() => {
    document.documentElement.classList.add('la-lock');
    return () => document.documentElement.classList.remove('la-lock');
  }, []);

  return (
    <iframe
      className="la-preview-loader-frame"
      src="/learn-africa-loader.html"
      title="LearnAfrica loading"
      role="status"
      aria-live="polite"
      aria-label="Loading LearnAfrica"
      tabIndex={-1}
    />
  );
}
