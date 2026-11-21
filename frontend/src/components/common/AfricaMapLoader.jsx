import Logo from './Logo';

/**
 * Full-screen route fallback. The enlarged green spinner remains the visual
 * anchor while the LearnAfrica logo travels around it; the label stays below.
 */
export default function AfricaMapLoader() {
  return (
    <div className="la-africa-loader" role="status" aria-live="polite" aria-label="Loading LearnAfrica">
      <div className="la-africa-loader__visual" aria-hidden="true">
        <div className="la-africa-loader__orbit">
          <div className="la-africa-loader__satellite">
            <Logo size={42} />
          </div>
        </div>
        <div className="la-africa-loader__spinner">
          <span className="la-africa-loader__spinner-core" />
        </div>
      </div>
      <span className="la-africa-loader__label">Still loading…</span>
      <span className="sr-only">LearnAfrica is loading the next screen.</span>
    </div>
  );
}
