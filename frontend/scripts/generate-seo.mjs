/**
 * generate-seo.mjs — writes robots.txt and sitemap.xml from the environment.
 *
 * The site's own address is configuration, not code: changing domain, or
 * deploying a preview build, must never require editing these files. Run
 * automatically before `npm run build` (see package.json "prebuild").
 *
 * Resolution order:
 *   1. VITE_SITE_URL  (explicit, works locally and on any host)
 *   2. SITE_URL       (server-style alias)
 *   3. VERCEL_URL     (auto-provided by Vercel, incl. preview deployments)
 *
 * With none set, robots.txt is written without a Sitemap line and sitemap.xml
 * is skipped, so a local build still succeeds rather than emitting a sitemap
 * pointing at the wrong domain.
 */
import { writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');

function resolveSiteUrl() {
  const explicit = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;

  return '';
}

const siteUrl = resolveSiteUrl();

const ROBOTS_DISALLOW = ['/admin', '/dashboard', '/instructor', '/learn', '/payment'];

const robotsLines = ['User-agent: *', 'Allow: /'];
for (const path of ROBOTS_DISALLOW) robotsLines.push(`Disallow: ${path}`);
robotsLines.push('');
if (siteUrl) robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`);

writeFileSync(resolve(publicDir, 'robots.txt'), robotsLines.join('\n') + '\n', 'utf8');

if (!siteUrl) {
  // Remove any sitemap.xml left behind by a previous build; otherwise it would
  // linger in public/ and be copied into dist/, pointing at a stale domain.
  const stale = resolve(publicDir, 'sitemap.xml');
  if (existsSync(stale)) {
    rmSync(stale, { force: true });
    console.warn('[generate-seo] removed a stale sitemap.xml (VITE_SITE_URL is not set).');
  }
  console.warn(
    '[generate-seo] VITE_SITE_URL is not set — robots.txt written without a ' +
    'Sitemap line and sitemap.xml was not generated. Set VITE_SITE_URL in the ' +
    'deployment environment so search engines see the correct domain.',
  );
} else {
  const staticPaths = ['/', '/courses', '/instructors', '/blog', '/verify-credential'];
  const urls = staticPaths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n');
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n';
  writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`[generate-seo] robots.txt + sitemap.xml generated for ${siteUrl}`);
}
