/**
 * siteUrl.js — the one place the public site's own address is defined.
 *
 * The address comes from the environment (VITE_SITE_URL), so changing domain or
 * deploying a preview/staging build never needs a code edit. When the variable
 * is not set we fall back to the host actually serving the page, so the site is
 * always self-consistent instead of pointing at a hardcoded domain.
 */
const CONFIGURED_SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/+$/, '');

function currentOrigin() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return '';
}

/** The site's own base URL, resolved at call time (env first, live host second). */
export function getSiteUrl() {
  return CONFIGURED_SITE_URL || currentOrigin();
}

/** Public verification URL, optionally pre-filling a credential id. */
export function verifyUrl(credentialId) {
  const base = `${getSiteUrl()}/verify-credential`;
  return credentialId ? `${base}?id=${encodeURIComponent(credentialId)}` : base;
}

/** Short, human-readable host (no scheme) for printing on a document. */
export function siteHost() {
  return getSiteUrl().replace(/^https?:\/\//, '');
}
