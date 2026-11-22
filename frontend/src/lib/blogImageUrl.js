export function getBlogImageCandidates(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const isDrive = host === 'drive.google.com' || host.endsWith('.drive.google.com') || host === 'docs.google.com';
    if (!isDrive) return [raw];
    let id = '';
    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i) || url.pathname.match(/\/d\/([^/]+)/i);
    if (pathMatch) id = pathMatch[1];
    if (!id) id = url.searchParams.get('id') || '';
    if (!id || !/^[a-zA-Z0-9_-]{10,}$/.test(id)) return [raw];
    return [
      'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1600',
      'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(id),
    ];
  } catch { return [raw]; }
}

export function normalizeBlogImageUrl(value) {
  return getBlogImageCandidates(value)[0] || '';
}
