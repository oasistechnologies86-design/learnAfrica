import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChevronLeft, ArrowRight } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { setSeo } from '@/lib/seo';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

function tagsOf(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : value.split(','); }
  catch { return value.split(','); }
}
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = '';
  const flush = () => { if (paragraph.length) { output.push('<p>' + paragraph.join('<br>') + '</p>'); paragraph = []; } };
  const closeList = () => { if (listType) { output.push('</' + listType + '>'); listType = ''; } };
  const inline = raw => escapeHtml(raw).replace(/\x60([^\x60]+)\x60/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  for (const line of lines) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (!line.trim()) { flush(); closeList(); continue; }
    if (heading) { flush(); closeList(); const level = heading[1].length; output.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>'); continue; }
    if (bullet || numbered) { flush(); const next = bullet ? 'ul' : 'ol'; if (listType !== next) { closeList(); output.push('<' + next + '>'); listType = next; } output.push('<li>' + inline((bullet || numbered)[1]) + '</li>'); continue; }
    if (quote) { flush(); closeList(); output.push('<blockquote><p>' + inline(quote[1]) + '</p></blockquote>'); continue; }
    closeList(); paragraph.push(inline(line));
  }
  flush(); closeList();
  return output.join('\n');
}
function bodyHtml(body) {
  const raw = body || '';
  return sanitizeHtml(/<[a-z][\s\S]*>/i.test(raw) ? raw : markdownToHtml(raw));
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(API_BASE + '/api/blog/' + encodeURIComponent(slug));
        if (!response.ok) throw new Error(response.status === 404 ? 'Post not found' : 'Failed to load post');
        const data = await response.json();
        if (!active) return;
        const current = data.post;
        setPost(current);
        setCoverFailed(false);
        setSeo({
          title: current.seo_title || current.title,
          description: current.seo_description || current.excerpt || undefined,
          path: '/blog/' + current.slug,
          image: current.og_image || current.cover,
          imageAlt: current.cover_alt || current.title,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org', '@type': 'BlogPosting',
            headline: current.title, description: current.seo_description || current.excerpt || undefined,
            image: current.og_image || current.cover || undefined,
            author: current.author_name ? { '@type': 'Person', name: current.author_name } : undefined,
            datePublished: current.created_at || undefined,
            mainEntityOfPage: window.location.origin + '/blog/' + current.slug,
          },
        });
        try {
          const listResponse = await fetch(API_BASE + '/api/blog');
          if (listResponse.ok) {
            const listData = await listResponse.json();
            const currentTags = tagsOf(current.tags).map(tag => String(tag).toLowerCase());
            const matches = (listData.posts || []).filter(item => item.slug !== current.slug && ((current.category && item.category === current.category) || tagsOf(item.tags).some(tag => currentTags.includes(String(tag).toLowerCase()))));
            if (active) setRelated(matches.slice(0, 3));
          }
        } catch { /* Related content is optional. */ }
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, [slug]);

  if (isLoading) return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading article…</div>;
  if (error || !post) return <div className="container mx-auto max-w-3xl px-4 py-24 text-center"><p className="text-lg font-semibold">{error || 'Post not found'}</p><Link to="/blog" className="mt-4 inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"><ChevronLeft className="h-4 w-4" /> Back to blog</Link></div>;
  const tags = tagsOf(post.tags);
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link to="/blog" className="mb-7 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ChevronLeft className="h-4 w-4" /> Back to blog</Link>
        <header className="mb-7">{post.category && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">{post.category}</p>}<h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>{post.excerpt && <p className="mt-4 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>}<p className="mt-4 text-sm text-muted-foreground">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}{post.author_name ? ' · ' + post.author_name : ''}</p>{tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{String(tag).trim()}</span>)}</div>}</header>
        {post.cover && !coverFailed && <img src={post.cover} alt={post.cover_alt || post.title} onError={() => setCoverFailed(true)} className="mb-8 max-h-[520px] w-full rounded-2xl bg-muted object-cover" />}
        <div className="blog-article-content prose prose-lg dark:prose-invert max-w-none break-words leading-8" dangerouslySetInnerHTML={{ __html: bodyHtml(post.body) }} />
      </article>
      {related.length > 0 && <section className="mx-auto mt-14 max-w-5xl border-t border-border pt-8"><h2 className="mb-5 text-xl font-bold">Related articles</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{related.map(item => <Link key={item.id} to={'/blog/' + item.slug} className="group rounded-xl border border-border p-4 hover:shadow-md"><p className="text-xs font-semibold text-primary">{item.category || 'LearnAfrica'}</p><h3 className="mt-2 font-semibold leading-snug group-hover:text-primary">{item.title}</h3>{item.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>}<span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Read more <ArrowRight className="h-3.5 w-3.5" /></span></Link>)}</div></section>}
    </main>
  );
}
