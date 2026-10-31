/**
 * siteUrl.js — the one place the public site's own address is defined.
 *
 * Certificate and badge documents point to the dedicated public /verify-credential page.
 * That domain used to be hardcoded in three separate components, so changing
 * it (or pointing a preview/staging build elsewhere) meant editing them all.
 * Set VITE_SITE_URL at build time to override; the production value is the
 * default so existing deployments are unaffected.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://learn-africa-five.vercel.app'
).replace(/\/+$/, '');

/** Public verification URL, optionally pre-filling a credential id. */
export function verifyUrl(credentialId) {
  const base = `${SITE_URL}/verify-credential`;
  return credentialId ? `${base}?id=${encodeURIComponent(credentialId)}` : base;
}

/** Short, human-readable host (no scheme) for printing on a document. */
export function siteHost() {
  return SITE_URL.replace(/^https?:\/\//, '');
}
