import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, MoreHorizontal, Trash2, Edit2, Check, X, Heart, Reply,
  ChevronDown, ChevronUp, MessageSquare, Send,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';

// ── Community Discussion — TikTok-style ──────────────────────────────────
const COLORS = ['bg-primary','bg-accent','bg-purple-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-indigo-500'];
function avatarColor(name) {
  let h = 0; for (let i=0;i<(name||'U').length;i++) h+=name.charCodeAt(i);
  return COLORS[h%COLORS.length];
}
function timeAgo(s) {
  const sec = Math.floor((Date.now()-new Date(s))/1000);
  if(sec<60) return 'just now';
  if(sec<3600) return `${Math.floor(sec/60)}m`;
  if(sec<86400) return `${Math.floor(sec/3600)}h`;
  if(sec<604800) return `${Math.floor(sec/86400)}d`;
  return new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}
function canEdit(createdAt) {
  return Date.now()-new Date(createdAt)<24*60*60*1000;
}

// Single comment card (recursive for replies)
function CommentCard({ comment, user, isAuthenticated, onDelete, onEdit, onLike, onReply, depth=0 }) {
  const [showReplies,  setShowReplies]  = useState(depth===0 && (comment.reply_count||0)>0);
  const [replying,     setReplying]     = useState(false);
  const [replyText,    setReplyText]    = useState('');
  const [editing,      setEditing]      = useState(false);
  const [editText,     setEditText]     = useState(comment.content);
  const [likes,        setLikes]        = useState(comment.likes_count||0);
  const [liked,        setLiked]        = useState(comment.liked_by_me||false);
  const [saving,       setSaving]       = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [postingReply, setPostingReply] = useState(false);
  const menuRef   = useRef(null);
  const replyRef  = useRef(null);

  const isOwner = user?.id === comment.user_id;
  const isAdmin = ['admin','superadmin'].includes(user?.role);
  const editAllowed = isOwner && canEdit(comment.created_at);

  useEffect(() => {
    const h = (e) => { if(menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    setLikes(comment.likes_count||0);
    setLiked(comment.liked_by_me||false);
  }, [comment.likes_count, comment.liked_by_me]);

  const handleLike = async () => {
    if(!isAuthenticated) return;
    const prev = liked;
    setLiked(!liked); setLikes(l=>liked?l-1:l+1);
    try { await onLike(comment.id); }
    catch { setLiked(prev); setLikes(l=>prev?l+1:l-1); }
  };

  const handleEdit = async () => {
    if(!editText.trim()) return;
    setSaving(true);
    try { await onEdit(comment.id, editText.trim()); setEditing(false); }
    catch(e) { alert(e.message); }
    setSaving(false);
  };

  const handleReply = async () => {
    if(!replyText.trim()) return;
    setPostingReply(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText(''); setReplying(false); setShowReplies(true);
    } catch(e) { alert(e.message); }
    setPostingReply(false);
  };

  return (
    <div className={cn('flex gap-2.5 sm:gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-200',
      depth>0 && 'ml-8 sm:ml-10 mt-2 relative before:absolute before:left-[-16px] before:top-0 before:h-full before:w-px before:bg-border/50')}>
      {/* Avatar */}
      <div className={cn('h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5',
        avatarColor(comment.user_name))}>
        {(comment.user_name||'U')[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5 relative">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="font-semibold text-xs text-foreground">{comment.user_name}</span>
              {comment.edited_at && (
                <span className="text-[9px] text-muted-foreground italic">(edited)</span>
              )}
              <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
            </div>
            {/* Menu */}
            {(isOwner||isAdmin) && (
              <div className="relative shrink-0" ref={menuRef}>
                <button onClick={()=>setShowMenu(s=>!s)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted transition-all">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 z-50 w-36 rounded-xl bg-card border border-border shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                    {editAllowed && (
                      <button onClick={()=>{setEditing(true);setShowMenu(false);}}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-foreground">
                        <Edit2 className="h-3.5 w-3.5 text-primary" /> Edit
                      </button>
                    )}
                    {(isOwner||isAdmin) && (
                      <button onClick={()=>{onDelete(comment.id);setShowMenu(false);}}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content or Edit */}
          {editing ? (
            <div className="space-y-2">
              <textarea value={editText} onChange={e=>setEditText(e.target.value)}
                maxLength={500} rows={2}
                className="w-full text-sm bg-muted/30 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary resize-none border border-border" />
              <div className="flex gap-2">
                <button onClick={handleEdit} disabled={saving}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:bg-primary/90 transition-colors">
                  {saving?<Loader2 className="h-3 w-3 animate-spin"/>:<Check className="h-3 w-3"/>} Save
                </button>
                <button onClick={()=>{setEditing(false);setEditText(comment.content);}}
                  className="flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs hover:bg-muted/80 transition-colors">
                  <X className="h-3 w-3"/> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed break-words">{comment.content}</p>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-4 mt-1.5 ml-1">
          {/* Like */}
          <button onClick={handleLike}
            className={cn('flex items-center gap-1 text-xs font-semibold transition-all active:scale-90',
              liked?'text-rose-500':'text-muted-foreground hover:text-rose-500',
              !isAuthenticated&&'opacity-50 cursor-default')}>
            <Heart className={cn('h-3.5 w-3.5 transition-all', liked&&'fill-rose-500 scale-110')} />
            {likes>0&&<span>{likes}</span>}
          </button>

          {/* Reply */}
          {isAuthenticated && depth===0 && (
            <button onClick={()=>{setReplying(r=>!r);setTimeout(()=>replyRef.current?.focus(),50);}}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
              <Reply className="h-3.5 w-3.5" /> Reply
            </button>
          )}

          {/* Show/hide replies */}
          {(comment.replies||[]).length>0 && (
            <button onClick={()=>setShowReplies(s=>!s)}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              {showReplies?<ChevronUp className="h-3 w-3"/>:<ChevronDown className="h-3 w-3"/>}
              {showReplies?'Hide':'View'} {(comment.replies||[]).length} {(comment.replies||[]).length===1?'reply':'replies'}
            </button>
          )}
        </div>

        {/* Reply composer */}
        {replying && (
          <div className="flex gap-2 mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0',
              avatarColor(user?.name))}>
              {(user?.name||'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input ref={replyRef} value={replyText}
                onChange={e=>setReplyText(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleReply();}}}
                placeholder={`Reply to ${comment.user_name}…`}
                maxLength={300}
                className="flex-1 h-8 rounded-full border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={handleReply} disabled={postingReply||!replyText.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0">
                {postingReply?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && (comment.replies||[]).length>0 && (
          <div className="mt-2 space-y-2">
            {(comment.replies||[]).map(reply=>(
              <CommentCard key={reply.id} comment={reply} user={user}
                isAuthenticated={isAuthenticated}
                onDelete={onDelete} onEdit={onEdit} onLike={onLike}
                onReply={onReply} depth={depth+1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentsSection({ user, isAuthenticated }) {
  const [comments,    setComments]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [text,        setText]       = useState('');
  const [posting,     setPosting]    = useState(false);
  const [error,       setError]      = useState('');
  const textareaRef   = useRef(null);
  const { socket }    = useAuth?.() || {};

  const token = () => sessionStorage.getItem('auth_token');
  const headers = (json=true) => ({
    ...(json?{'Content-Type':'application/json'}:{}),
    ...(token()?{Authorization:`Bearer ${token()}`}:{})
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/homepage/comments`, { headers: headers(false) });
      const d = await r.json();
      setComments(d.comments||[]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  // Real-time SocketIO listeners
  useEffect(() => {
    const s = window.__learnafricaSocket;
    if (!s) return;
    const onNew = (comment) => {
      if (!comment.parent_id) {
        // Dedupe: skip if a comment with this id is already in the list
        // (the poster added it optimistically after their POST)
        setComments(prev => prev.some(c => c.id === comment.id) ? prev : [comment, ...prev]);
      } else {
        setComments(prev => prev.map(c =>
          c.id === comment.parent_id
            ? {
                ...c,
                replies: (c.replies || []).some(r => r.id === comment.id)
                  ? c.replies
                  : [...(c.replies||[]), comment],
                reply_count: (c.reply_count||0)+1
              }
            : c
        ));
      }
    };
    const onEdit = (updated) => {
      setComments(prev => prev.map(c => {
        if(c.id===updated.id) return {...c, content:updated.content, edited_at:updated.edited_at};
        return {...c, replies:(c.replies||[]).map(r=>r.id===updated.id?{...r,content:updated.content,edited_at:updated.edited_at}:r)};
      }));
    };
    const onDelete = ({id}) => {
      setComments(prev => prev
        .filter(c=>c.id!==id)
        .map(c=>({...c, replies:(c.replies||[]).filter(r=>r.id!==id)}))
      );
    };
    const onLike = ({id, likes_count}) => {
      setComments(prev => prev.map(c => {
        if(c.id===id) return {...c, likes_count};
        return {...c, replies:(c.replies||[]).map(r=>r.id===id?{...r,likes_count}:r)};
      }));
    };
    s.on('new_homepage_comment', onNew);
    s.on('edit_homepage_comment', onEdit);
    s.on('delete_homepage_comment', onDelete);
    s.on('like_homepage_comment', onLike);
    return () => {
      s.off('new_homepage_comment', onNew);
      s.off('edit_homepage_comment', onEdit);
      s.off('delete_homepage_comment', onDelete);
      s.off('like_homepage_comment', onLike);
    };
  }, []);

  const post = async (e) => {
    e.preventDefault();
    if(!text.trim()) return;
    setPosting(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/homepage/comments`,  {
        method:'POST', headers:headers(),
        body: JSON.stringify({content:text.trim()})
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error||'Failed');
      // Dedupe: only add if this comment isn't already in the list
      // (the socket 'new_homepage_comment' event may have already added it)
      setComments(prev => prev.some(c => c.id === d.comment.id) ? prev : [d.comment, ...prev]);
      setText('');
      if(textareaRef.current) textareaRef.current.style.height='auto';
    } catch(e){ setError(e.message); }
    setPosting(false);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/api/homepage/comments/${id}`, {method:'DELETE',headers:headers(false)});
      setComments(prev=>prev
        .filter(c=>c.id!==id)
        .map(c=>({...c,replies:(c.replies||[]).filter(r=>r.id!==id)}))
      );
    } catch {}
  };

  const handleEdit = async (id, content) => {
    const r = await fetch(`${API_BASE}/api/homepage/comments/${id}`, {
      method:'PUT', headers:headers(),
      body:JSON.stringify({content})
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||'Failed');
    setComments(prev=>prev.map(c=>{
      if(c.id===id) return {...c,content:d.comment.content,edited_at:d.comment.edited_at};
      return {...c,replies:(c.replies||[]).map(rp=>rp.id===id?{...rp,content:d.comment.content,edited_at:d.comment.edited_at}:rp)};
    }));
  };

  const handleLike = async (id) => {
    const r = await fetch(`${API_BASE}/api/homepage/comments/${id}/like`, {method:'POST',headers:headers(false)});
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||'Failed');
    setComments(prev=>prev.map(c=>{
      if(c.id===id) return {...c,likes_count:d.likes_count,liked_by_me:d.liked};
      return {...c,replies:(c.replies||[]).map(rp=>rp.id===id?{...rp,likes_count:d.likes_count,liked_by_me:d.liked}:rp)};
    }));
  };

  const handleReply = async (parentId, content) => {
    const r = await fetch(`${API_BASE}/api/homepage/comments`, {
      method:'POST', headers:headers(),
      body:JSON.stringify({content, parent_id:parentId})
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||'Failed');
    // Dedupe: only add if this reply isn't already there (socket may have delivered it first)
    setComments(prev=>prev.map(c=> {
      if (c.id !== parentId) return c;
      if ((c.replies || []).some(r => r.id === d.comment.id)) return c;
      return {...c, replies:[...(c.replies||[]),d.comment], reply_count:(c.reply_count||0)+1};
    }));
  };

  const grow = (e) => {
    setText(e.target.value);
    e.target.style.height='auto';
    e.target.style.height=Math.min(e.target.scrollHeight,140)+'px';
  };

  const totalCount = comments.reduce((a,c)=>a+1+(c.replies||[]).length,0);

  return (
    <section id="comments-section" className="py-14 sm:py-20 bg-muted/10 border-t border-border">
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-3">
            <MessageSquare className="h-4 w-4" /> Community Discussion
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Join the Conversation</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Share your thoughts and connect with fellow learners.
          </p>
        </div>

        {/* Composer */}
        {isAuthenticated ? (
          <form onSubmit={post} className="mb-6">
            <div className="flex gap-2.5 items-start">
              <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                avatarColor(user?.name))}>
                {(user?.name||'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 rounded-2xl border border-input bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                <textarea ref={textareaRef} value={text} onChange={grow}
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0]||'learner'}?`}
                  maxLength={500} rows={1}
                  className="w-full px-4 pt-3 pb-1 text-sm bg-transparent resize-none outline-none placeholder:text-muted-foreground/60" />
                <div className="flex items-center justify-between px-4 pb-3 pt-1">
                  <span className={cn('text-[10px]',text.length>450?'text-warning font-medium':'text-muted-foreground')}>
                    {text.length}/500
                  </span>
                  <div className="flex items-center gap-2">
                    {error&&<p className="text-xs text-destructive">{error}</p>}
                    <Button type="submit" size="sm" disabled={posting||!text.trim()}
                      className="gap-1.5 rounded-full h-8 px-4">
                      {posting?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Send className="h-3.5 w-3.5"/>}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-5 rounded-2xl bg-card border border-border text-center shadow-sm">
            <MessageSquare className="h-8 w-8 text-primary/50 mx-auto mb-2" />
            <p className="font-semibold text-sm text-foreground mb-1">Join the discussion</p>
            <p className="text-muted-foreground text-xs mb-4">Log in to comment, reply, and like.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/login"><Button size="sm" variant="outline">Log In</Button></Link>
              <Link to="/signup"><Button size="sm">Sign Up Free</Button></Link>
            </div>
          </div>
        )}

        {/* Count */}
        {!loading && totalCount>0 && (
          <p className="text-xs text-muted-foreground font-medium mb-4 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {totalCount} comment{totalCount!==1?'s':''}
          </p>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
          </div>
        ) : comments.length===0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border/50">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="font-medium text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scroll-smooth"
               style={{ scrollbarWidth: 'thin' }}>
            {comments.map(c=>(
              <CommentCard key={c.id} comment={c} user={user}
                isAuthenticated={isAuthenticated}
                onDelete={handleDelete} onEdit={handleEdit}
                onLike={handleLike} onReply={handleReply}
                depth={0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


