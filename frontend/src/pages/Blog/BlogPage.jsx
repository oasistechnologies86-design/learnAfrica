import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Newspaper, Search, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { API_BASE } from '@/lib/api';
import { setSeo } from '@/lib/seo';
import { getBlogImageCandidates } from '@/lib/blogImageUrl';

function BlogImage({ src, alt, className, loading = 'lazy' }) {
  const [fallbackState, setFallbackState] = useState({ src: '', index: 0, failed: false });
  const candidates = getBlogImageCandidates(src);
  const candidateIndex = fallbackState.src === src ? fallbackState.index : 0;
  const failed = fallbackState.src === src && fallbackState.failed;
  if (!src || failed) return <div className={className + ' flex items-center justify-center bg-muted'}><Newspaper className="h-10 w-10 text-muted-foreground/50" /></div>;
  return <img src={candidates[candidateIndex] || src} alt={alt || ''} className={className} loading={loading}
    onError={() => setFallbackState(candidateIndex < candidates.length - 1
      ? { src, index: candidateIndex + 1, failed: false }
      : { src, index: candidateIndex, failed: true })} />;
}

function tagsOf(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : value.split(','); }
  catch { return value.split(','); }
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    setSeo({ title: 'Blog', description: 'Articles, guides and updates from LearnAfrica.', path: '/blog', jsonLd: { '@context': 'https://schema.org', '@type': 'Blog', name: 'LearnAfrica Blog' } });
    let active = true;
    (async () => {
      try {
        const response = await fetch(API_BASE + '/api/blog');
        if (!response.ok) throw new Error('We could not load the blog right now.');
        const data = await response.json();
        if (active) setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (e) { if (active) setError(e.message || 'We could not load the blog right now.'); }
      finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['All', ...new Set(posts.map(post => post.category).filter(Boolean))], [posts]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter(post => {
      const matchesCategory = category === 'All' || post.category === category;
      const searchable = [post.title, post.excerpt, post.author_name, post.category, ...tagsOf(post.tags)].join(' ').toLowerCase();
      return matchesCategory && (!term || searchable.includes(term));
    });
  }, [posts, search, category]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const featured = visible[0];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-10"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">LearnAfrica Journal</p><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl"><Newspaper className="h-8 w-8 text-primary" /> Blog and insights</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Practical guides, learning resources and ideas to help you keep growing.</p></header>
      <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search articles, topics or tags…" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
        <select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }} aria-label="Filter by category" className="h-11 rounded-xl border border-input bg-background px-3 text-sm">{categories.map(item => <option key={item} value={item}>{item === 'All' ? 'All categories' : item}</option>)}</select>
      </div>
      {isLoading ? <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading posts…</div> : error ? <div role="alert" className="rounded-xl border border-border p-6 text-sm">{error} Please refresh the page to try again.</div> : filtered.length === 0 ? <div className="rounded-xl border border-dashed border-border px-5 py-16 text-center"><p className="font-semibold">No articles found</p><p className="mt-1 text-sm text-muted-foreground">Try another search or category.</p></div> : (
        <>
          {page === 1 && featured && <Link to={'/blog/' + featured.slug} className="group mb-7 grid overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg md:grid-cols-[1.1fr_0.9fr]">
            {featured.cover ? <BlogImage src={featured.cover} alt={featured.cover_alt || featured.title} className="h-56 w-full bg-muted object-cover md:h-full md:min-h-[300px]" loading="eager" /> : <div className="flex min-h-48 items-center justify-center bg-muted"><Newspaper className="h-12 w-12 text-muted-foreground/50" /></div>}
            <div className="flex flex-col justify-center p-6 sm:p-8"><span className="text-xs font-semibold uppercase tracking-wider text-primary">{featured.category || 'Featured article'}</span><h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{featured.title}</h2>{featured.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{featured.excerpt}</p>}<p className="mt-4 text-xs text-muted-foreground">{featured.created_at ? new Date(featured.created_at).toLocaleDateString() : ''}{featured.author_name ? ' · ' + featured.author_name : ''}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div>
          </Link>}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{(page === 1 ? visible.slice(1) : visible).map(post => <Link key={post.id} to={'/blog/' + post.slug} className="group block"><Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">{post.cover ? <BlogImage src={post.cover} alt={post.cover_alt || post.title} className="h-48 w-full bg-muted object-cover" loading="lazy" /> : <div className="flex h-48 items-center justify-center bg-muted"><Newspaper className="h-10 w-10 text-muted-foreground/50" /></div>}<CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{post.category || 'LearnAfrica'}</p><h2 className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary">{post.title}</h2>{post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>}<p className="mt-4 text-xs text-muted-foreground">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}{post.author_name ? ' · ' + post.author_name : ''}</p><div className="mt-3 flex flex-wrap gap-1.5">{tagsOf(post.tags).slice(0, 3).map(tag => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{String(tag).trim()}</span>)}</div></CardContent></Card></Link>)}</div>
          {pageCount > 1 && <nav aria-label="Blog pages" className="mt-9 flex items-center justify-center gap-3"><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Next</button></nav>}
        </>
      )}
    </main>
  );
}
