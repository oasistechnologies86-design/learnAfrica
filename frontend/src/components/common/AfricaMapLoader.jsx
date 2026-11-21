/**
 * Simple full-screen route fallback with a compact circular spinner and
 * the loading message kept directly underneath it.
 */
export default function AfricaMapLoader() {
  return (
    <div className="la-africa-loader" role="status" aria-live="polite" aria-label="Loading LearnAfrica">
      <span className="la-africa-loader__spinner" aria-hidden="true" />
      <span className="la-africa-loader__label">Still loading…</span>
      <span className="sr-only">LearnAfrica is loading the next screen.</span>
    </div>
  );
}
