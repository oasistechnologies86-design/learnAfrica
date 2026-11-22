import { useCallback, useEffect, useRef, useState } from 'react';

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Manrope:wght@500;700&display=swap");

.la-root{
  --bg:#03050c; --card:#0a0f20; --text:#f4f7ff; --muted:#a3aed6; --line:rgba(255,255,255,.14);
  --a:#ffb627; --b:#2fe02f; --btntext:#04101c;
  color-scheme:dark;
  position:fixed; inset:0; z-index:9999; overflow-x:hidden; overflow-y:auto;
  background:transparent; color:var(--text);
  font-family:"Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;
  display:grid; place-items:center;
  padding:20px;
  padding-top:calc(20px + env(safe-area-inset-top,0px));
  padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));
}
/* Frosted-glass veil for the live update notice: keep the page visible
   underneath while softly diffusing it. The admin preview remains untouched. */
.la-root:not(.la-preview){
  /* Keep the surrounding page fully visible: blur it without adding a dark tint. */
  background:transparent;
  -webkit-backdrop-filter:blur(8px) saturate(115%);
  backdrop-filter:blur(8px) saturate(115%);
}

.la-root, .la-root *{box-sizing:border-box}

/* In-admin demonstration: keep the same card design, but render it inside
   the preview panel instead of covering the entire admin page. */
.la-root.la-preview{
  position:relative; inset:auto; z-index:auto;
  min-height:0; overflow:visible; padding:0;
  display:flex; align-items:center; justify-content:center;
  background:transparent;
}

.la-card{position:relative;width:min(440px,100%);background:var(--card);border-radius:28px;padding:clamp(24px,5vw,36px);text-align:center;isolation:isolate}
/* animated neon border */
.la-card::before{content:"";position:absolute;inset:-2px;border-radius:34px;z-index:-1;
  background:conic-gradient(from var(--ang,0deg),var(--a),var(--b),transparent 40%,var(--a));animation:la-turn 5s linear infinite}
.la-card::after{content:"";position:absolute;inset:0;border-radius:32px;background:var(--card);z-index:-1}
@property --ang{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes la-turn{to{--ang:360deg}}

.la-logo{position:relative;width:clamp(96px,22vw,120px);aspect-ratio:1;margin:0 auto clamp(16px,4vw,22px)}
.la-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--b);border-right-color:var(--b);animation:la-spin 2.6s linear infinite}
.la-ring.la-r2{inset:12px;border-top-color:var(--a);border-right-color:var(--a);animation-duration:4s;animation-direction:reverse}
.la-logo svg{position:absolute;inset:20px;width:calc(100% - 40px);height:calc(100% - 40px);animation:la-pulse 2.4s ease-in-out infinite}
.la-arrow{animation:la-rise 1.6s ease-in-out infinite}
@keyframes la-spin{to{transform:rotate(360deg)}}
@keyframes la-pulse{50%{transform:scale(1.08)}}
@keyframes la-rise{0%{transform:translateY(8px);opacity:.2}50%{opacity:1}100%{transform:translateY(-8px);opacity:.2}}

.la-h1{font-family:"Unbounded",system-ui,sans-serif;font-weight:800;font-size:clamp(23px,6vw,32px);line-height:1.08;letter-spacing:-.02em;margin:0 0 clamp(14px,3vw,22px);
  background:linear-gradient(100deg,#ffb627,#2fe02f);-webkit-background-clip:text;background-clip:text;color:transparent}
.la-lead{font-size:clamp(15px,3.4vw,16px);font-weight:700;line-height:1.5;margin:0 auto 12px;max-width:30ch}
.la-safe{font-size:clamp(13px,3vw,14px);color:var(--muted);line-height:1.5;margin:0 auto clamp(20px,4vw,24px);max-width:34ch}

.la-btn{position:relative;width:100%;border:0;border-radius:20px;padding:clamp(14px,3.5vw,16px);font:800 clamp(15px,3.6vw,16px) "Manrope",system-ui,sans-serif;color:var(--btntext);cursor:pointer;overflow:hidden;
  background:linear-gradient(100deg,#ffb627,#2fe02f);transition:transform .2s,box-shadow .2s;box-shadow:0 14px 40px -12px #2fe02f}
.la-btn:hover{transform:translateY(-3px);box-shadow:0 20px 48px -12px var(--b)}
.la-btn:active{transform:scale(.98)}
.la-btn:focus-visible{outline:3px solid var(--text);outline-offset:4px}
.la-bar{position:absolute;inset:0;background:rgba(255,255,255,.4);transform:scaleX(0);transform-origin:left}
.la-btn.la-go .la-bar{animation:la-fill 2s ease-in-out forwards}
@keyframes la-fill{to{transform:scaleX(1)}}
.la-btn span{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:12px}
.la-dot{display:none;width:18px;height:18px;border-radius:50%;border:3px solid rgba(4,16,28,.3);border-top-color:#04101c;animation:la-spin .8s linear infinite}
.la-btn.la-go .la-dot{display:inline-block}

.la-chip{display:inline-flex;align-items:center;gap:10px;border:1.5px solid var(--line);border-radius:99px;padding:8px 16px;font-size:clamp(12px,3vw,14px);font-weight:700;color:var(--text);margin:0 0 clamp(16px,3.5vw,22px)}
.la-pip{width:9px;height:9px;border-radius:50%;background:var(--b);box-shadow:0 0 12px var(--b);animation:la-blink 1.3s ease-in-out infinite}
@keyframes la-blink{50%{opacity:.25}}
.la-btn:not(.la-go){animation:la-call 1.8s ease-out infinite}
@keyframes la-call{0%{box-shadow:0 0 0 0 rgba(47,224,47,.55)}80%,100%{box-shadow:0 0 0 22px rgba(47,224,47,0)}}
.la-tap{width:20px;height:20px;animation:la-press 1.3s ease-in-out infinite}
.la-btn.la-go .la-tap{display:none}
@keyframes la-press{0%,100%{transform:translate(0,0)}45%{transform:translate(-3px,-3px)}60%{transform:translate(2px,2px) scale(.9)}}
.la-req{margin:18px 0 0;font-size:clamp(12px,3vw,14px);color:var(--muted)}
@media (prefers-reduced-motion: reduce){.la-root *,.la-root *::before,.la-root *::after{animation:none!important;transition:none!important}}
`;

function LearnAfricaUpdate({ onUpdate, buttonRef, preview = false }) {
  const [updating, setUpdating] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = () => {
    // The admin preview is a visual demonstration, never an update action.
    if (preview || updating) return;
    setUpdating(true);
    timer.current = window.setTimeout(() => {
      try {
        if (onUpdate) onUpdate();
        else window.location.reload();
      } catch {
        setUpdating(false);
      }
    }, 2100);
  };

  return (
    <div className={"la-root" + (preview ? " la-preview" : "")}>
      <style>{CSS}</style>
      <main
        className="la-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="la-title"
        aria-describedby="la-desc"
      >
        <div className="la-logo" aria-hidden="true">
          <div className="la-ring" />
          <div className="la-ring la-r2" />
          <svg viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="la-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffb627" />
                <stop offset="1" stopColor="#2fe02f" />
              </linearGradient>
            </defs>
            <g
              className="la-arrow"
              stroke="url(#la-g)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M50 78V26" />
              <path d="M28 48l22-22 22 22" />
            </g>
          </svg>
        </div>

        <div className="la-chip">
          <i className="la-pip" />
          New Update available
        </div>

        <h1 className="la-h1" id="la-title">
          A new LearnAfrica version is ready!
        </h1>
        <p className="la-lead" id="la-desc">
          We’ve made improvements to give you a better and smoother learning experience.
        </p>
        <p className="la-safe">Your account and saved course progress remain safe.</p>

        <button
          ref={buttonRef}
          type="button"
          className={"la-btn" + (updating ? " la-go" : "")}
          onClick={handleClick}
          disabled={updating}
        >
          <div className="la-bar" />
          <span>
            <svg className="la-tap" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 3l14 7.5-6 1.8-2.2 6.2z" />
            </svg>
            <i className="la-dot" />
            <b>{updating ? "Updating…" : "Click here to Refresh & Update"}</b>
          </span>
        </button>

        <p className="la-req">This update is required to continue learning.</p>
      </main>
    </div>
  );
}

export function UpdateNoticePreview() {
  return <LearnAfricaUpdate preview onUpdate={() => {}} />;
}

function hasUnsavedChanges() {
  const scopes = document.querySelectorAll('form, [data-update-protected]');
  for (const scope of scopes) {
    const fields = scope.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]), textarea, select');
    for (const field of fields) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (field.checked !== field.defaultChecked) return true;
      } else if (field.tagName === 'SELECT') {
        if ([...field.options].some(option => option.selected !== option.defaultSelected)) return true;
      } else if (field.value !== field.defaultValue) return true;
    }
  }
  return [...document.querySelectorAll('form [contenteditable="true"], [data-update-protected] [contenteditable="true"]')].some(node =>
    node.dataset.initialHtml !== undefined && node.innerHTML !== node.dataset.initialHtml
  );
}

export default function AppUpdateNotice() {
  const [available, setAvailable] = useState(false);
  const [remoteNotice, setRemoteNotice] = useState('');
  const buttonRef = useRef(null);

  const revealWhenSafe = useCallback(() => {
    // Keep the existing protection: never cover an unsaved form/editor.
    if (!hasUnsavedChanges()) setAvailable(true);
  }, []);

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV || document.visibilityState === 'hidden' || !navigator.onLine) return;
    try {
      const response = await fetch('/version.json?check=' + Date.now(), { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const latest = await response.json();
      if (latest?.version && latest.version !== BUILD_ID) {
        // The notice itself is fetched from the latest deployment, not rendered
        // from this older tab's bundled React component.
        const noticeResponse = await fetch('/update-notice.html?check=' + encodeURIComponent(latest.version) + '-' + Date.now(), {
          cache: 'no-store',
          headers: { Accept: 'text/html' },
        });
        if (noticeResponse.ok) {
          const markup = await noticeResponse.text();
          if (markup.includes('LEARNAFRICA_UPDATE_REFRESH') && markup.includes('la-card')) {
            setRemoteNotice(markup);
          }
        }
        revealWhenSafe();
      }
    } catch {
      // Version checks are optional and must never interrupt the app.
    }
  }, [revealWhenSafe]);

  useEffect(() => {
    checkVersion();
    const interval = window.setInterval(checkVersion, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkVersion(); };
    const onChunkLoadFailure = () => revealWhenSafe();
    window.addEventListener('online', checkVersion);
    window.addEventListener('learnafrica:chunk-load-failed', onChunkLoadFailure);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', checkVersion);
      window.removeEventListener('learnafrica:chunk-load-failed', onChunkLoadFailure);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkVersion, revealWhenSafe]);

  useEffect(() => {
    if (!available) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    buttonRef.current?.focus();
    const blockEscape = event => {
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        document.getElementById('la-remote-update-button')?.focus();
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', blockEscape, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', blockEscape, true);
    };
  }, [available]);

  // Mount the latest notice directly in the app document. An iframe creates a
  // separate browsing surface, so its backdrop cannot reliably blur the page
  // behind it. A parent-document overlay lets backdrop-filter see the actual
  // LearnAfrica page while keeping the remotely fetched card markup current.
  useEffect(() => {
    if (!available || !remoteNotice) return undefined;
    let host;
    let style;
    try {
      const parsed = new DOMParser().parseFromString(remoteNotice, 'text/html');
      const sourceStyle = parsed.querySelector('style');
      const sourceRoot = parsed.querySelector('.la-root');
      if (!sourceStyle || !sourceRoot) return undefined;

      style = document.createElement('style');
      style.setAttribute('data-la-remote-notice', 'styles');
      style.textContent = sourceStyle.textContent
        .replace(/html,body\\s*\\{[^}]*\\}/gi, '')
        .replace(/\\*\\s*\\{[^}]*\\}/g, '')
        + '\\n.la-root:not(.la-preview){background:transparent!important;-webkit-backdrop-filter:blur(8px) saturate(115%);backdrop-filter:blur(8px) saturate(115%)}';
      document.head.appendChild(style);

      host = document.createElement('div');
      host.className = 'la-root la-remote-root';
      host.id = 'la-remote-update-host';
      for (const child of [...sourceRoot.childNodes]) {
        if (child.nodeName !== 'SCRIPT') host.appendChild(document.importNode(child, true));
      }
      document.body.appendChild(host);

      const button = host.querySelector('#update');
      if (button) {
        button.id = 'la-remote-update-button';
        button.addEventListener('click', () => {
          if (button.disabled) return;
          button.disabled = true;
          button.classList.add('go');
          const label = button.querySelector('b');
          if (label) label.textContent = 'Updating…';
          window.setTimeout(() => window.location.reload(), 2100);
        });
        button.focus();
      }
    } catch {
      // If remote markup cannot be mounted, the bundled notice remains available.
    }
    return () => {
      host?.remove();
      style?.remove();
    };
  }, [available, remoteNotice]);

  if (!available) return null;
  if (remoteNotice) return null;
  return <LearnAfricaUpdate onUpdate={() => window.location.reload()} buttonRef={buttonRef} />;
}

const BUILD_ID = typeof __LEARN_AFRICA_BUILD_ID__ !== 'undefined' ? __LEARN_AFRICA_BUILD_ID__ : 'development';
