/**
 * Dynamic same-host sitemap endpoint for Google Search Console.
 *
 * Vercel exposes this file as /api/sitemap.xml. It fetches the backend's
 * database-backed sitemap but returns a small valid fallback if the backend
 * is asleep or temporarily unavailable. Never include authenticated/private
 * routes in this sitemap.
 */
const DEFAULT_SITE_URL = 'https://learn-africa-five.vercel.app';
const DEFAULT_BACKEND_URL = 'https://learnafrica-backend-fdhb.onrender.com';

function normalizeBase(value) {
  return String(value || '').trim().replace(/\/+$/, '').replace(/\/api$/i, '');
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fallbackSitemap(siteUrl) {
  const urls = ['/', '/courses', '/instructors', '/blog'];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((path) => '  <url><loc>' + xmlEscape(siteUrl + path) + '</loc></url>\n').join('') +
    '</urlset>';
}

export default async function handler(req, res) {
  const siteUrl = String(process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL)
    .trim().replace(/\/+$/, '');
  const backendBase = normalizeBase(
    process.env.BACKEND_URL || process.env.VITE_API_URL || DEFAULT_BACKEND_URL
  );

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(
      backendBase + '/api/sitemap.xml?base=' + encodeURIComponent(siteUrl),
      { method: 'GET', headers: { Accept: 'application/xml' }, signal: controller.signal }
    );
    if (!upstream.ok) throw new Error('Backend sitemap returned HTTP ' + upstream.status);
    const xml = await upstream.text();
    if (!xml.includes('<urlset') || !xml.includes('<loc>' + siteUrl + '/</loc>')) {
      throw new Error('Backend sitemap did not contain the expected public site URL');
    }
    res.setHeader('X-Sitemap-Mode', 'dynamic');
    return res.status(200).send(xml);
  } catch (error) {
    // Keep the core public pages discoverable during a backend outage.
    res.setHeader('X-Sitemap-Mode', 'fallback');
    return res.status(200).send(fallbackSitemap(siteUrl));
  } finally {
    clearTimeout(timeout);
  }
}
