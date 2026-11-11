import { useState, useRef, useEffect } from 'react';
import {
  BookOpen, Layout, X, ChevronRight, Plus, GripVertical, Video,
  HelpCircle, Link as LinkIcon, Trash2, ChevronDown, ChevronUp,
  Award, Download, CheckCircle2, Circle, Upload, Loader2,
  FileText, File, Image as ImgIcon, Archive, Flag, Eye,
  Type, ToggleLeft, AlignLeft, Sparkles
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardContent } from '@/components/common/Card';
import { getCustomLesson, listCustomLessons } from '@/components/customLessons/registry';
import CustomLessonFrame from '@/components/customLessons/CustomLessonFrame';
import { Switch } from '@/components/common/Switch';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { TimePicker, formatDuration } from '@/components/common/TimePicker';
import { cn } from '@/lib/utils';
import { parseQuizImport } from '@/lib/quizImport';
import BoundedYouTubePlayer, { getYouTubeVideoId } from '@/components/common/BoundedYouTubePlayer';

// ── Video URL and optional playback-range editor ─────────────────────────
const parseVideoTimestamp = (value) => {
  const parts = String(value || '').trim().split(':').map(Number);
  if (!parts.length || parts.some(part => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 1) return Math.floor(parts[0]);
  if (parts.length === 2) return Math.floor(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.floor(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return null;
};

const formatVideoTimestamp = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getVideoPreviewUrl = (url, startSeconds = 0, endSeconds = 0) => {
  if (!url) return '';
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    const params = new URLSearchParams({ rel: '0' });
    if (startSeconds > 0) params.set('start', String(Math.floor(startSeconds)));
    if (endSeconds > 0) params.set('end', String(Math.floor(endSeconds)));
    return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop();
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
  } catch {}
  return url;
};

function VideoUrlInput({ item, onChanged }) {
  const currentUrl = item.videoUrl || '';
  const [editingRange, setEditingRange] = useState(false);
  const [draftStart, setDraftStart] = useState(formatVideoTimestamp(item.video_start_seconds));
  const [draftEnd, setDraftEnd] = useState(item.video_end_seconds ? formatVideoTimestamp(item.video_end_seconds) : '');
  const [rangeError, setRangeError] = useState('');
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);
  const handleCurrentTimeChange = (seconds, duration) => {
    if (Number.isFinite(seconds)) setPlayheadSeconds(Math.max(0, seconds));
    if (Number.isFinite(duration) && duration > 0) setVideoDurationSeconds(duration);
  };

  useEffect(() => {
    setDraftStart(formatVideoTimestamp(item.video_start_seconds));
    setDraftEnd(item.video_end_seconds ? formatVideoTimestamp(item.video_end_seconds) : '');
  }, [item.video_start_seconds, item.video_end_seconds]);

  const saveRange = () => {
    const start = parseVideoTimestamp(draftStart);
    const end = draftEnd.trim() ? parseVideoTimestamp(draftEnd) : 0;
    if (start === null || end === null) {
      setRangeError('Enter time as minutes:seconds or hours:minutes:seconds.');
      return;
    }
    if (end > 0 && end <= start) {
      setRangeError('The end time must be later than the start time.');
      return;
    }
    onChanged({ video_start_seconds: start, video_end_seconds: end });
    setRangeError('');
    setEditingRange(false);
  };

  const isYouTube = !!getYouTubeVideoId(currentUrl);
  const isVimeo = /vimeo\.com/i.test(currentUrl);
  const previewUrl = getVideoPreviewUrl(currentUrl, item.video_start_seconds, item.video_end_seconds);

  return (
    <div className="space-y-3">
      <div className="relative">
        <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={currentUrl}
          onChange={e => {
            onChanged({
              videoUrl: e.target.value,
              video_start_seconds: 0,
              video_end_seconds: 0,
            });
            setEditingRange(false);
            setRangeError('');
          }}
          className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          placeholder="https://youtube.com/watch?v=… or any video link"
        />
      </div>
      {currentUrl && (
        <div className="rounded-xl overflow-hidden border border-border bg-slate-950">
          {isYouTube ? (
            <div className="aspect-video">
              <BoundedYouTubePlayer
                url={currentUrl}
                startSeconds={editingRange ? 0 : item.video_start_seconds}
                endSeconds={editingRange ? 0 : item.video_end_seconds}
                onCurrentTimeChange={handleCurrentTimeChange}
                enforceRange={!editingRange}
                title="Video preview"
              />
            </div>
          ) : isVimeo ? (
            <div className="aspect-video">
              <iframe src={previewUrl} className="w-full h-full" allowFullScreen title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" />
            </div>
          ) : (
            <video key={`${currentUrl}-${item.video_start_seconds}-${item.video_end_seconds}`}
              src={currentUrl} controls className="w-full max-h-56" preload="metadata"
              onLoadedMetadata={e => {
                setVideoDurationSeconds(e.currentTarget.duration || 0);
                if (!editingRange && item.video_start_seconds > 0) e.currentTarget.currentTime = item.video_start_seconds;
              }}
              onTimeUpdate={e => {
                handleCurrentTimeChange(e.currentTarget.currentTime, e.currentTarget.duration);
                if (!editingRange && item.video_end_seconds > 0 && e.currentTarget.currentTime >= item.video_end_seconds) {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = item.video_end_seconds;
                }
              }}
              onSeeking={e => {
                if (!editingRange && e.currentTarget.currentTime < (item.video_start_seconds || 0)) e.currentTarget.currentTime = item.video_start_seconds || 0;
                if (!editingRange && item.video_end_seconds > 0 && e.currentTarget.currentTime > item.video_end_seconds) e.currentTarget.currentTime = item.video_end_seconds;
              }} />
          )}
        </div>
      )}
      {currentUrl && (
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">Video playback range</p>
              <p className="text-2xs text-muted-foreground">
                {isVimeo
                  ? 'Vimeo videos play in full. Optional range editing is available for YouTube and direct video files.'
                  : item.video_start_seconds || item.video_end_seconds
                    ? `Students see ${formatVideoTimestamp(item.video_start_seconds)} to ${item.video_end_seconds ? formatVideoTimestamp(item.video_end_seconds) : 'the end'}.`
                    : 'Full video selected. Students will watch from beginning to end.'}
              </p>
            </div>
            {!editingRange && !isVimeo && (
              <button type="button" onClick={() => setEditingRange(true)}
                className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                Edit video range
              </button>
            )}
          </div>
          {editingRange && !isVimeo && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1 text-xs font-medium">
                  Start time
                  <input value={draftStart} onChange={e => setDraftStart(e.target.value)}
                    placeholder="00:00" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  End time <span className="font-normal text-muted-foreground">(leave blank for video end)</span>
                  <input value={draftEnd} onChange={e => setDraftEnd(e.target.value)}
                    placeholder="Full video" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold">Video position: {formatVideoTimestamp(playheadSeconds)}</span>
                  <span className="text-muted-foreground">{videoDurationSeconds > 0 ? `of ${formatVideoTimestamp(videoDurationSeconds)}` : 'Play or move the video timeline to choose a point'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setDraftStart(formatVideoTimestamp(playheadSeconds)); setRangeError(''); }}
                    className="rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5">
                    Set start here
                  </button>
                  <button type="button" onClick={() => { setDraftEnd(formatVideoTimestamp(playheadSeconds)); setRangeError(''); }}
                    className="rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5">
                    Set end here
                  </button>
                </div>
              </div>
              <p className="text-2xs text-muted-foreground">Play the video or move its timeline, then use the buttons above. You can still type MM:SS or HH:MM:SS if needed. Leave the end time empty to play through to the end.</p>
              {rangeError && <p className="text-xs text-destructive">{rangeError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => {
                  setDraftStart(formatVideoTimestamp(item.video_start_seconds));
                  setDraftEnd(item.video_end_seconds ? formatVideoTimestamp(item.video_end_seconds) : '');
                  setRangeError('');
                  setEditingRange(false);
                }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Cancel</button>
                <button type="button" onClick={saveRange}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Save changes</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Course Resources Manager ────────────────────────────────────────────────
function CourseResourcesManager({ resources = [], onChange }) {
  const [urlInput,   setUrlInput]   = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const inputRef = useRef(null);

  const extToType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext))              return 'pdf';
    if (['doc','docx'].includes(ext))       return 'doc';
    if (['ppt','pptx'].includes(ext))       return 'ppt';
    if (['xls','xlsx','csv'].includes(ext)) return 'spreadsheet';
    if (['zip','rar','7z'].includes(ext))   return 'archive';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
    if (['mp4','mov','webm','avi'].includes(ext)) return 'video';
    return ext || 'file';
  };

  const fileIcon = (type) => {
    const cls = "h-4 w-4 shrink-0";
    if (type === 'pdf')        return <FileText className={`${cls} text-red-500`} />;
    if (type === 'doc')        return <FileText className={`${cls} text-blue-500`} />;
    if (type === 'image')      return <ImgIcon  className={`${cls} text-purple-500`} />;
    if (type === 'archive')    return <Archive  className={`${cls} text-yellow-500`} />;
    if (type === 'link')       return <LinkIcon className={`${cls} text-primary`} />;
    return <File className={`${cls} text-muted-foreground`} />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1048576)     return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  };

  const addFile = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large — max 50MB per resource');
      return;
    }
    const tmpId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const localBlob = URL.createObjectURL(file);
    const pendingEntry = {
      id: tmpId, title: file.name, url: localBlob,
      file_type: extToType(file.name),
      file_size: formatSize(file.size),
      _uploading: true,
    };
    const withPending = [...resources, pendingEntry];
    onChange(withPending);
    if (inputRef.current) inputRef.current.value = '';

    try {
      const fd = new FormData(); fd.append('file', file);
      const token = sessionStorage.getItem('auth_token');
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/upload/resource`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
      const updated = withPending.map(r =>
        r.id === tmpId ? { ...r, url: data.url, _uploading: false } : r
      );
      onChange(updated);
      URL.revokeObjectURL(localBlob);
    } catch (err) {
      console.error('Resource upload failed:', err);
      alert('Upload failed: ' + (err.message || 'try again'));
      onChange(withPending.filter(r => r.id !== tmpId));
    }
  };

  const addLink = () => {
    if (!titleInput.trim() || !urlInput.trim()) return;
    onChange([...resources, {
      id:        `tmp_${Date.now()}`,
      title:     titleInput.trim(),
      url:       urlInput.trim(),
      file_type: 'link',
      file_size: '',
    }]);
    setTitleInput(''); setUrlInput('');
  };

  const remove = (id) => onChange(resources.filter(r => r.id !== id));

  return (
    <div className="space-y-4">

      {/* Uploaded list */}
      {resources.length > 0 ? (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {fileIcon(r.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-3xs text-muted-foreground uppercase font-bold">{r.file_type}</span>
                  {r.file_size && <span className="text-2xs text-muted-foreground">· {r.file_size}</span>}
                  {r._uploading && <span className="text-2xs text-warning font-semibold animate-pulse">· uploading…</span>}
                  {r._pending && !r._uploading && <span className="text-2xs text-warning font-semibold">· pending save</span>}
                </div>
              </div>
              <button type="button" onClick={() => remove(r.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          No resources added yet. Upload files or add links below.
        </p>
      )}

      {/* Drop zone / file picker */}
      <input ref={inputRef} type="file" className="hidden"
        multiple
        onChange={e => { Array.from(e.target.files).forEach(addFile); }} />
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          Array.from(e.dataTransfer.files).forEach(addFile);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/20'
        )}>
        <Upload className={cn('h-6 w-6 transition-colors', dragOver ? 'text-primary' : 'text-muted-foreground')} />
        <div className="text-center">
          <p className="text-xs font-semibold">Click to upload or drag &amp; drop</p>
          <p className="text-2xs text-muted-foreground mt-0.5">PDF, DOC, ZIP, images… max 50MB each · multiple files ok</p>
        </div>
      </div>

      {/* Link adder */}
      <details className="group">
        <summary className="text-xs font-semibold text-primary cursor-pointer list-none flex items-center gap-1 hover:underline select-none">
          <LinkIcon className="h-3.5 w-3.5" /> Add an external link instead
        </summary>
        <div className="mt-3 p-3 bg-muted/20 rounded-xl border border-border space-y-2">
          <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
            placeholder="Resource title  e.g. Lecture Slides"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-2">
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
              placeholder="https://… or Google Drive link"
              onKeyDown={e => e.key === 'Enter' && addLink()}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary" />
            <button type="button" onClick={addLink}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors font-semibold">
              Add
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

// ── Question Type Selector ──────────────────────────────────────────────────
const Q_TYPES = [
  { value: 'mcq',        label: 'Single choice', icon: Type,       desc: 'Choose one answer' },
  { value: 'mcq_multi',  label: 'Choose many',   icon: CheckCircle2, desc: 'Choose all correct answers' },
  { value: 'true_false', label: 'True / False',  icon: ToggleLeft, desc: '2 options' },
  { value: 'fill_blank', label: 'Fill in Blank', icon: AlignLeft,  desc: 'Type the answer' },
];

function QuizEditor({ item, onUpdate }) {
  const questions = item.questions || [];

  const addQuestion = (qType = 'mcq') => {
    const base = { id: `q_${Date.now()}`, text: '', correctAnswer: qType === 'mcq_multi' ? [] : 0, question_type: qType };
    if (qType === 'mcq' || qType === 'mcq_multi') {
      return onUpdate({ questions: [...questions, { ...base, options: ['', '', '', ''] }] });
    }
    if (qType === 'true_false') return onUpdate({ questions: [...questions, { ...base, options: ['True', 'False'] }] });
    if (qType === 'fill_blank') return onUpdate({ questions: [...questions, { ...base, options: [''] }] });
  };

  const updateQ = (qId, data) =>
    onUpdate({ questions: questions.map(q => q.id === qId ? { ...q, ...data } : q) });

  const removeQ = (qId) =>
    onUpdate({ questions: questions.filter(q => q.id !== qId) });

  return (
    <div className="space-y-4">
      {questions.map((q, qIdx) => {
        const qType = q.question_type || 'mcq';
        return (
          <div key={q.id} className="rounded-xl border border-border bg-background overflow-hidden">
            {/* Question header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-3xs font-black text-primary uppercase">Q{qIdx + 1}</span>
                {/* Type selector */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {Q_TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => {
                        const opts = t.value === 'true_false' ? ['True','False']
                                   : t.value === 'fill_blank' ? ['']
                                   : ['','','',''];
                        updateQ(q.id, { question_type: t.value, options: opts, correctAnswer: t.value === 'mcq_multi' ? [] : 0 });
                      }}
                      className={cn(
                        'px-2.5 py-1 text-2xs font-bold transition-colors flex items-center gap-1',
                        qType === t.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      )}>
                      <t.icon className="h-3 w-3" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => removeQ(q.id)}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Question text */}
              <input value={q.text} onChange={e => updateQ(q.id, { text: e.target.value })}
                placeholder={qType === 'fill_blank'
                  ? 'e.g. The capital of Ghana is ___'
                  : 'Enter your question…'}
                className="w-full bg-muted/10 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />

              {/* ── MCQ options ── */}
              {(qType === 'mcq' || qType === 'mcq_multi') && (
                <div className="space-y-2">
                  <p className="text-3xs font-bold uppercase text-muted-foreground">
                    {qType === 'mcq_multi' ? 'Options — select every correct answer' : 'Options — select the one correct answer'}
                  </p>
                  {(q.options || ['','','','']).map((opt, oIdx) => {
                    const selectedCorrect = qType === 'mcq_multi'
                      ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : []).includes(oIdx)
                      : q.correctAnswer === oIdx;
                    return (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button type="button" aria-label={selectedCorrect ? 'Remove correct answer' : 'Mark as correct answer'}
                        onClick={() => updateQ(q.id, { correctAnswer: qType === 'mcq_multi'
                          ? (selectedCorrect ? (q.correctAnswer || []).filter(v => v !== oIdx) : [...(Array.isArray(q.correctAnswer) ? q.correctAnswer : []), oIdx])
                          : oIdx })}>
                        {selectedCorrect
                          ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                          : <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />}
                      </button>
                      <input value={opt}
                        onChange={e => {
                          const o = [...(q.options || [])];
                          o[oIdx] = e.target.value;
                          updateQ(q.id, { options: o });
                        }}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1 bg-muted/10 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    );
                  })}
                  {qType === 'mcq_multi' && (
                    <p className="text-2xs text-muted-foreground">Students will be told to select all correct answers. Mark at least two options as correct.</p>
                  )}
                </div>
              )}

              {/* ── True / False ── */}
              {qType === 'true_false' && (
                <div className="space-y-2">
                  <p className="text-3xs font-bold uppercase text-muted-foreground">
                    Click to mark correct answer
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((label, oIdx) => (
                      <button key={oIdx} type="button"
                        onClick={() => updateQ(q.id, { correctAnswer: oIdx, options: ['True','False'] })}
                        className={cn(
                          'py-3 rounded-xl border-2 text-sm font-bold transition-all',
                          q.correctAnswer === oIdx
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        )}>
                        {oIdx === 0 ? '✓ True' : '✗ False'}
                        {q.correctAnswer === oIdx && <span className="ml-2 text-2xs">(correct)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Fill in blank ── */}
              {qType === 'fill_blank' && (
                <div className="space-y-2">
                  <p className="text-3xs font-bold uppercase text-muted-foreground">
                    Correct answer (what student must type)
                  </p>
                  <input
                    value={(q.options || [''])[0]}
                    onChange={e => updateQ(q.id, { options: [e.target.value], correctAnswer: 0 })}
                    placeholder="e.g. Accra"
                    className="w-full bg-success/5 border border-success/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-success" />
                  <p className="text-2xs text-muted-foreground">
                    Students must type this exactly (not case-sensitive).
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add question buttons */}
      <div className="grid grid-cols-3 gap-2">
        {Q_TYPES.map(t => (
          <button key={t.value} type="button" onClick={() => addQuestion(t.value)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/20 text-xs font-semibold transition-all cursor-pointer text-muted-foreground">
            <t.icon className="h-4 w-4 text-primary" />
            <span>+ {t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


// ── Per-Lesson Resources Editor ───────────────────────────────────────────
function LessonResourcesEditor({ resources = [], onChange }) {
  const [titleInput, setTitleInput] = useState('');
  const [urlInput,   setUrlInput]   = useState('');
  const inputRef = useRef(null);

  const fileIcon = (type) => {
    if (type === 'pdf')  return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
    if (type === 'image') return <ImgIcon  className="h-4 w-4 text-blue-500 shrink-0" />;
    if (type === 'archive') return <Archive className="h-4 w-4 text-yellow-500 shrink-0" />;
    return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  const addLink = () => {
    if (!titleInput.trim() || !urlInput.trim()) return;
    onChange([...resources, {
      id: `tmp_${Date.now()}`, title: titleInput.trim(),
      url: urlInput.trim(), file_type: 'link',
    }]);
    setTitleInput(''); setUrlInput('');
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 50*1024*1024) { alert('Max 50MB'); return; }
    const tmpId = `tmp_${Date.now()}`;
    const localBlob = URL.createObjectURL(file);
    const ext = file.name.split('.').pop().toLowerCase();
    const pending = {
      id: tmpId, title: file.name,
      url: localBlob, file_type: ext, _uploading: true,
    };
    const withPending = [...resources, pending];
    onChange(withPending);
    if (inputRef.current) inputRef.current.value = '';

    try {
      const fd = new FormData(); fd.append('file', file);
      const token = sessionStorage.getItem('auth_token');
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/upload/resource`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
      onChange(withPending.map(r => r.id === tmpId
        ? { ...r, url: data.url, _uploading: false }
        : r));
      URL.revokeObjectURL(localBlob);
    } catch (err) {
      console.error('Resource upload failed:', err);
      alert('Upload failed: ' + (err.message || 'try again'));
      onChange(withPending.filter(r => r.id !== tmpId));
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />

      {resources.length > 0 && (
        <div className="space-y-1.5">
          {resources.map(r => (
            <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/60 group">
              {fileIcon(r.file_type)}
              <span className="text-xs flex-1 truncate">{r.title}</span>
              <button type="button" onClick={() => onChange(resources.filter(x => x.id !== r.id))}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/10 text-xs font-medium transition-all cursor-pointer text-muted-foreground">
        <Upload className="h-3.5 w-3.5" /> Upload file (PDF, DOC, ZIP…)
      </button>

      <div className="flex gap-2">
        <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
          placeholder="Link title"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" />
        <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
          placeholder="https://…"
          onKeyDown={e => e.key==='Enter' && addLink()}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" />
        <button type="button" onClick={addLink}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors shrink-0">
          Add
        </button>
      </div>
    </div>
  );
}

// ── Lesson Item Editor ──────────────────────────────────────────────────────
function CurriculumItemEditor({ item, index, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, hasResources = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPreview, setShowCustomPreview] = useState(false);
  const selectedCustomEntry = getCustomLesson(item.component_key || item.componentKey);
  const SelectedCustomComponent = selectedCustomEntry?.component;
  const customPreviewLesson = { ...item, component_key: item.component_key || item.componentKey };
  return (
    <div className={cn('rounded-xl border overflow-hidden shadow-sm transition-all',
      item.is_final ? 'border-warning/40 bg-warning/5' : 'border-border/50 bg-background')}>
      <div className="flex items-center gap-3 p-3 cursor-pointer select-none group"
        onClick={() => setIsOpen(!isOpen)}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 shrink-0" />
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center border text-2xs font-bold shrink-0',
          item.is_final
            ? 'bg-warning/20 border-warning/40 text-warning'
            : item.type === 'quiz'
            ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
            : item.type === 'text'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
            : item.type === 'custom'
            ? 'bg-purple-500/10 border-purple-500/20 text-purple-500'
            : 'bg-primary/10 border-primary/20 text-primary')}>
          {item.is_final ? <Flag className="h-3.5 w-3.5" />
           : item.type === 'quiz' ? <HelpCircle className="h-3.5 w-3.5" />
           : item.type === 'text' ? <FileText className="h-3.5 w-3.5" />
           : item.type === 'custom' ? <Sparkles className="h-3.5 w-3.5" />
           : <Video className="h-3.5 w-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">
              {item.title || (item.type === 'quiz' ? 'New Quiz' : item.type === 'custom' ? 'New Custom Page' : 'New Lesson')}
            </p>
            {item.is_final && (
              <span className="text-3xs font-bold bg-warning/20 text-warning px-1.5 py-0.5 rounded-full uppercase shrink-0">
                Final Examination
              </span>
            )}
          </div>
          <span className={cn('text-3xs font-black uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block',
            item.type === 'quiz'  ? 'bg-orange-500/10 text-orange-500'
            : item.type === 'custom' ? 'bg-purple-500/10 text-purple-500'
            : 'bg-primary/10 text-primary')}>
            {item.type === 'custom' ? 'custom page' : item.type}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={onMoveUp} disabled={isFirst} aria-label={`Move ${item.title || 'item'} up`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed"><ChevronUp className="h-4 w-4" /></button>
          <button type="button" onClick={onMoveDown} disabled={isLast} aria-label={`Move ${item.title || 'item'} down`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed"><ChevronDown className="h-4 w-4" /></button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this lesson?')) onRemove();
          }}
          className="p-2 rounded-lg bg-destructive/5 hover:bg-destructive/15 text-destructive/80 hover:text-destructive transition-colors shrink-0 border border-destructive/20"
          title="Delete this lesson"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {isOpen && (
        <div className="p-4 bg-muted/5 border-t border-border space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-3xs font-bold uppercase text-muted-foreground">Title</label>
            <input value={item.title || ''}
              onChange={e => onUpdate({ title: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder={item.type === 'quiz' ? 'Quiz title…' : 'Lesson title…'} />
          </div>

          {item.type === 'video' && (
            <>
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase text-muted-foreground">Video URL</label>
                <VideoUrlInput item={item} onChanged={onUpdate} />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Lesson Notes / Additional Content
                  <span className="font-normal normal-case text-muted-foreground/60">(rich text — formatting allowed)</span>
                </label>
                <RichTextEditor
                  value={item.text_content || item.textContent || item.content || ''}
                  onChange={html => onUpdate({ text_content: html })}
                  placeholder="Add supplementary notes, transcripts, code samples, or hyperlinks below the video. Use the toolbar for bold, italic, headings, lists, links…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs font-bold uppercase text-muted-foreground">Lesson Duration</label>
                <div className="flex justify-center sm:justify-start">
                  <TimePicker
                    value={Number(item.duration_seconds || 0)}
                    onChange={(secs) => onUpdate({
                      duration_seconds: secs,
                      duration: secs > 0 ? formatDuration(secs) : '',
                    })}
                  />
                </div>
                <p className="text-2xs text-muted-foreground">
                  {(item.duration_seconds || 0) > 0
                    ? `Approx ${formatDuration(item.duration_seconds)} of learning`
                    : 'Not set yet — pick hours / minutes above'}
                </p>
              </div>
              {hasResources && (
                <div className="space-y-1">
                  <label className="text-3xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Download className="h-3 w-3" /> Lesson Resources
                    <span className="font-normal normal-case text-muted-foreground/60">(files students can download)</span>
                  </label>
                  <LessonResourcesEditor
                    resources={item.resources || []}
                    onChange={res => onUpdate({ resources: res })}
                  />
                </div>
              )}
            </>
          )}

          {item.type === 'text' && (
            <>
              <div className="space-y-1.5">
                <label className="text-3xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Lesson Content
                  <span className="font-normal normal-case text-muted-foreground/60">(rich text — formatting allowed)</span>
                </label>
                <RichTextEditor
                  value={item.text_content || item.textContent || ''}
                  onChange={html => onUpdate({ text_content: html })}
                  placeholder="Write the lesson content here. Use the toolbar above for bold, italic, headings, lists, links, and alignment…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs font-bold uppercase text-muted-foreground">Estimated Reading Time</label>
                <div className="flex justify-center sm:justify-start">
                  <TimePicker
                    value={Number(item.duration_seconds || 0)}
                    onChange={(secs) => onUpdate({
                      duration_seconds: secs,
                      duration: secs > 0 ? formatDuration(secs) : '',
                    })}
                  />
                </div>
                <p className="text-2xs text-muted-foreground">
                  {(item.duration_seconds || 0) > 0
                    ? `Approx ${formatDuration(item.duration_seconds)} of reading`
                    : 'Not set yet — pick hours / minutes above'}
                </p>
              </div>
              {hasResources && (
                <div className="space-y-1">
                  <label className="text-3xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Download className="h-3 w-3" /> Lesson Resources
                  </label>
                  <LessonResourcesEditor
                    resources={item.resources || []}
                    onChange={res => onUpdate({ resources: res })}
                  />
                </div>
              )}
            </>
          )}

          {item.type === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Select component
                </label>
                <select
                  value={item.component_key || item.componentKey || ''}
                  onChange={e => onUpdate({ component_key: e.target.value, componentKey: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Pick a component —</option>
                  {listCustomLessons().map(entry => (
                    <option key={entry.key} value={entry.key}>{entry.label}</option>
                  ))}
                </select>
                <p className="text-2xs text-muted-foreground mt-1.5">
                  Select the custom page students will see. Preview it here before saving or publishing the course.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline"
                  disabled={!SelectedCustomComponent}
                  onClick={() => setShowCustomPreview(true)}
                  className="h-9 text-xs border-purple-500/30 text-purple-700 dark:text-purple-300">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview Custom Page
                </Button>
                {!SelectedCustomComponent && <span className="text-2xs text-muted-foreground">Choose a page first to preview it.</span>}
              </div>
              {showCustomPreview && SelectedCustomComponent && (
                <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm p-2 sm:p-5 flex items-center justify-center"
                  role="dialog" aria-modal="true" aria-label="Custom page instructor preview">
                  <div className="w-full h-full max-w-6xl bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">Custom Page Preview</p>
                        <p className="text-2xs text-muted-foreground truncate">{selectedCustomEntry?.label || item.title || 'Selected custom page'} · Student reading view</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowCustomPreview(false)} className="shrink-0">
                        <X className="h-4 w-4 mr-1" /> Close Preview
                      </Button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <CustomLessonFrame lesson={customPreviewLesson} mode="instructor">
                        <SelectedCustomComponent lesson={customPreviewLesson} student={{ id: 'instructor-preview', name: 'Instructor Preview', role: 'instructor' }} />
                      </CustomLessonFrame>
                    </div>
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                <p className="text-2xs text-purple-500 font-semibold">
                  ℹ Custom pages don't accept resources or content — the page IS the content.
                </p>
              </div>
            </div>
          )}

          {item.type === 'quiz' && (
            <>
              {/* Final exam toggle */}
              <div className={cn('flex items-center justify-between p-3 rounded-xl border transition-all',
                item.is_final ? 'bg-warning/10 border-warning/40' : 'bg-background border-border')}>
                <div className="flex items-center gap-2">
                  <Flag className={cn('h-4 w-4', item.is_final ? 'text-warning' : 'text-muted-foreground')} />
                  <div>
                    <p className="text-xs font-bold">Mark as Final Examination</p>
                    <p className="text-2xs text-muted-foreground">Only the final exam generates a certificate</p>
                  </div>
                </div>
                <Switch checked={!!item.is_final}
                  onChange={val => onUpdate({ is_final: val })} />
              </div>

              {/* Quiz countdown is separate from estimated lesson/course duration. */}
              <div className="p-3 rounded-xl border border-border bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">Quiz time limit</p>
                    <p className="text-2xs text-muted-foreground">
                      {item.quiz_timer_enabled && Number(item.quiz_duration_seconds) > 0
                        ? `Students must finish within ${formatDuration(item.quiz_duration_seconds)}.`
                        : 'Off — students can take as long as they need. Lesson duration does not start a quiz countdown.'}
                    </p>
                  </div>
                  <Switch checked={!!item.quiz_timer_enabled}
                    onChange={enabled => onUpdate({
                      quiz_timer_enabled: enabled,
                      quiz_duration_seconds: enabled ? (Number(item.quiz_duration_seconds) || 600) : 0,
                    })} />
                </div>
                {item.quiz_timer_enabled && (
                  <div className="flex justify-center">
                    <TimePicker value={Number(item.quiz_duration_seconds) || 600}
                      onChange={secs => onUpdate({ quiz_duration_seconds: secs })} />
                  </div>
                )}
              </div>

              {/* Optional attempt cap and instructor-defined paid retry price */}
              <div className="p-3 rounded-xl border border-border bg-background space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold">Limit quiz attempts</p>
                    <p className="text-2xs text-muted-foreground">
                      {item.attempts_enabled
                        ? 'Students have a fixed number of included attempts. You choose the fee for each extra attempt.'
                        : 'Off — students can retake this quiz without an attempt cap or extra-attempt fee.'}
                    </p>
                  </div>
                  <Switch checked={!!item.attempts_enabled}
                    onChange={enabled => onUpdate({
                      attempts_enabled: enabled,
                      max_attempts: enabled ? (Number(item.max_attempts) || (item.is_final ? 10 : 3)) : item.max_attempts,
                      extra_attempt_price: item.extra_attempt_price ?? '',
                    })} />
                </div>
                {item.attempts_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold">Included attempts</span>
                      <input type="number" min="1" max="50" step="1" inputMode="numeric"
                        value={item.max_attempts || (item.is_final ? 10 : 3)}
                        onChange={e => onUpdate({ max_attempts: Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)) })}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold">Price per extra attempt (GHS)</span>
                      <input type="number" min="0.01" max="100000" step="0.01" inputMode="decimal"
                        value={item.extra_attempt_price ?? ''}
                        onChange={e => onUpdate({ extra_attempt_price: e.target.value })}
                        placeholder="Enter your price"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                  </div>
                )}
                {item.attempts_enabled && (
                  <p className="text-2xs text-muted-foreground">
                    After the included attempts are used, students can pay the price you set here for one additional attempt. The attempt is credited only after payment is verified.
                  </p>
                )}
              </div>

              {/* Instructor-defined passing threshold */}
              <div className="p-3 rounded-xl border border-border bg-background space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs font-bold">Passing score (%)</span>
                  <span className="block text-2xs text-muted-foreground">Students must achieve this percentage to pass this assessment.</span>
                  <input type="number" min="1" max="100" step="1" inputMode="numeric"
                    value={item.pass_score ?? 70}
                    onChange={e => onUpdate({ pass_score: Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)) })}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </div>

              {/* Anti-cheat: question bank size, shuffling */}
              <div className="p-3 rounded-xl border border-border bg-background space-y-3">
                <div>
                  <p className="text-xs font-bold">Anti-cheat</p>
                  <p className="text-2xs text-muted-foreground">
                    Give each student a different paper. Off by default — leave it off and
                    the quiz behaves exactly as before.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium">Questions per attempt</p>
                    <p className="text-2xs text-muted-foreground">
                      {Number(item.questions_per_attempt || 0) > 0
                        ? `Serve ${item.questions_per_attempt} random question(s) from the bank.`
                        : 'Serve every question, in order.'}
                    </p>
                  </div>
                  <input
                    type="number" min="0" max={Math.max(1, (item.questions || []).length || 1)} inputMode="numeric"
                    value={item.questions_per_attempt ?? 0}
                    onChange={e => {
                      const n = Math.max(0, parseInt(e.target.value, 10) || 0);
                      onUpdate({ questions_per_attempt: n });
                    }}
                    className="w-20 h-10 px-3 rounded-lg border border-input bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium">Shuffle question order</p>
                    <p className="text-2xs text-muted-foreground">
                      Randomise the order questions are shown in.
                    </p>
                  </div>
                  <Switch
                    checked={!!item.shuffle_questions}
                    onChange={(val) => onUpdate({ shuffle_questions: val })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium">Shuffle answer choices</p>
                    <p className="text-2xs text-muted-foreground">
                      Randomise the order of each question's options, so shared answers
                      don't match another student's paper.
                    </p>
                  </div>
                  <Switch
                    checked={!!item.shuffle_options}
                    onChange={(val) => onUpdate({ shuffle_options: val })}
                  />
                </div>
              </div>

              {/* Quiz questions */}
              <QuizEditor item={item} onUpdate={onUpdate} />
            </>
          )}

          <div className="pt-2 flex flex-wrap justify-between gap-2">
            {item.type === 'quiz' && (
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const payload = { version: 1, quizzes: [{
                  title: item.title || 'Untitled Quiz', description: item.description || '', is_final: !!item.is_final,
                  settings: {
                    timer_enabled: !!item.quiz_timer_enabled, duration_seconds: Number(item.quiz_duration_seconds || 600),
                    attempts_enabled: !!item.attempts_enabled, max_attempts: Number(item.max_attempts || 0),
                    extra_attempt_price: Number(item.extra_attempt_price || 0), pass_score: Number(item.pass_score || 70),
                    questions_per_attempt: Number(item.questions_per_attempt || 0),
                    shuffle_questions: !!item.shuffle_questions, shuffle_options: !!item.shuffle_options
                  },
                  questions: (item.questions || []).map(q => {
                    const type = q.question_type || q.type || 'mcq';
                    const base = { type, text: q.text || '', options: q.options || [],
                      ...(q.marks != null ? { marks: q.marks } : {}),
                      ...(q.explanation ? { explanation: q.explanation } : {}) };
                    if (type === 'mcq_multi') return { ...base, correct_answers: Array.isArray(q.correctAnswer) ? q.correctAnswer : [] };
                    if (type === 'fill_blank') return { type, text: q.text || '', correct_answer: q.options?.[0] || q.correctAnswer || '' };
                    return { ...base, correct_answer: q.correctAnswer ?? 0 };
                  })
                }]};
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${(item.title || 'quiz').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'quiz'}.json`;
                document.body.appendChild(link); link.click(); link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1500);
              }}><Download className="h-3.5 w-3.5 mr-1.5" /> Export quiz JSON</Button>
            )}
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-xs text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-border bg-muted/5 p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 w-full">
        <p className="break-words text-[9px] font-bold uppercase leading-tight text-muted-foreground sm:text-3xs">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Perk Toggle ─────────────────────────────────────────────────────────────
function PerkToggle({ icon: Icon, label, description, checked, onChange, highlight }) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3.5 rounded-xl border transition-all',
      checked && highlight ? 'bg-primary/5 border-primary/30' : 'bg-background border-border'
    )}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-4 w-4', checked ? 'text-primary' : 'text-muted-foreground')} />
        <div>
          <p className={cn('text-xs font-bold uppercase', checked ? 'text-foreground' : 'text-muted-foreground')}>
            {label}
          </p>
          {description && <p className="text-2xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <Switch checked={!!checked} onChange={v => typeof onChange === 'function' && onChange(v)} />
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────
export function CurriculumSection({
  sections = [],
  coursePerks = { hasCertificate: false, lifetimeAccess: true, hasResources: false },
  updateCoursePerks = () => {},
  courseResources = [],
  updateCourseResources = () => {},
  addSection = () => {},
  addLesson = () => {},
  removeSection = () => {},
  updateSectionTitle = () => {},
  moveSection = () => {},
  importQuizzes = () => {},
  moveLesson = () => {},
  updateLesson = () => {},
  removeLesson = () => {},
  onBack = () => {},
  onNext = () => {},
}) {
  const perks = coursePerks || {};
  const [quizImportMessage, setQuizImportMessage] = useState('');
  const [importingQuizzes, setImportingQuizzes] = useState(false);
  const [selectedImportSectionId, setSelectedImportSectionId] = useState('');
  const quizImportInputRef = useRef(null);

  const handleQuizImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedImportSectionId || !sections.some(section => section.id === selectedImportSectionId)) {
      setQuizImportMessage('Please select the session where these quizzes should be added.');
      event.target.value = '';
      return;
    }
    setImportingQuizzes(true);
    setQuizImportMessage('');
    try {
      const payload = JSON.parse(await file.text());
      const imported = parseQuizImport(payload);
      importQuizzes(imported, selectedImportSectionId);
      setQuizImportMessage(`Successfully added ${imported.length} ${imported.length === 1 ? 'quiz' : 'quizzes'} to the curriculum. Save the course to apply the changes.`);
    } catch (error) {
      setQuizImportMessage(error.message || 'Could not import this JSON file.');
    } finally {
      setImportingQuizzes(false);
      event.target.value = '';
    }
  };

  const downloadQuizTemplate = () => {
    const template = {
      version: 1,
      quizzes: [{
        title: 'Example Quiz',
        settings: {
          timer_enabled: false,
          duration_seconds: 600,
          attempts_enabled: false,
          max_attempts: 0,
          extra_attempt_price: 0,
          pass_score: 70,
          questions_per_attempt: 0,
          shuffle_questions: false,
          shuffle_options: false
        },
        questions: [
          { type: 'single_choice', text: 'Which city is the capital of Ghana?', options: ['Accra', 'Kumasi', 'Tamale'], correct_answer: 0 },
          { type: 'multiple_answer', text: 'Select TWO correct answers.', options: ['Python', 'Java', 'Microsoft Word'], correct_answers: [0, 1] },
          { type: 'true_false', text: 'Accra is in Ghana.', correct_answer: true },
          { type: 'fill_blank', text: 'The capital of Ghana is ___', correct_answer: 'Accra' }
        ]
      }]
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'learnafrica-quiz-import-template.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const totalLessons = sections.reduce((a, s) => a + (s.lessons?.length || 0), 0);
  const videoCount   = sections.reduce((a, s) => a + (s.lessons?.filter(l => l.type === 'video').length || 0), 0);
  const hasExam = sections.some(s => s.lessons?.some(l => l.is_final));

  return (
    <div className="space-y-5 pb-20">
      {/* Stats */}
      <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={BookOpen} label="Lessons"  value={totalLessons} />
        <StatCard icon={Video}    label="Videos"   value={videoCount} />
        <StatCard icon={Layout}   label="Sections" value={sections.length} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold">Import quizzes from JSON</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add several quizzes and all their questions to this course in one upload.</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <select value={selectedImportSectionId} onChange={event => setSelectedImportSectionId(event.target.value)}
            disabled={importingQuizzes || sections.length === 0}
            aria-label="Choose destination session for imported quizzes"
            className="h-9 min-w-[190px] flex-1 rounded-lg border border-input bg-background px-3 text-xs sm:flex-none">
            <option value="">Choose destination session</option>
            {sections.map((section, index) => <option key={section.id} value={section.id}>{section.title?.trim() || `Session ${index + 1}`}</option>)}
          </select>
          <input ref={quizImportInputRef} type="file" accept="application/json,.json" className="hidden"
            onChange={handleQuizImport} />
          <Button type="button" variant="outline" size="sm" disabled={importingQuizzes || !selectedImportSectionId || sections.length === 0}
            onClick={() => quizImportInputRef.current?.click()}>
            {importingQuizzes ? 'Importing…' : 'Import JSON'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={downloadQuizTemplate}>
            Download template
          </Button>
        </div>
      </div>
      {quizImportMessage && (
        <p role="status" className={cn('rounded-lg border p-3 text-xs',
          quizImportMessage.startsWith('Successfully')
            ? 'border-success/30 bg-success/5 text-success'
            : 'border-destructive/30 bg-destructive/5 text-destructive')}>
          {quizImportMessage}
        </p>
      )}

      {/* Final exam warning */}
      {perks.hasCertificate && !hasExam && totalLessons > 0 && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning">
          <Flag className="h-4 w-4 shrink-0 mt-0.5" />
          <p><strong>Certificate perk is ON</strong> — add a Quiz lesson and toggle "Mark as Final Examination" so students can earn a certificate.</p>
        </div>
      )}

      {/* Sections */}
      {sections.map((section, index) => (
        <Card key={section.id} className="border-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/10 p-4 flex flex-row items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-3xs font-bold text-primary uppercase tracking-widest">Section {index + 1}</span>
              <input value={section.title || ''}
                onChange={e => updateSectionTitle(section.id, e.target.value)}
                className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0 w-full outline-none"
                placeholder="e.g. Module 1: Introduction" />
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="sm" disabled={index === 0}
                aria-label={`Move Section ${index + 1} up`}
                onClick={() => moveSection(section.id, -1)}
                className="h-8 w-8 p-0 text-muted-foreground disabled:opacity-30">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={index === sections.length - 1}
                aria-label={`Move Section ${index + 1} down`}
                onClick={() => moveSection(section.id, 1)}
                className="h-8 w-8 p-0 text-muted-foreground disabled:opacity-30">
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {(section.lessons || []).map((item, iIdx, items) => (
              <CurriculumItemEditor key={item.id} item={item} index={iIdx}
                onUpdate={data => updateLesson(section.id, item.id, data)}
                onRemove={() => removeLesson(section.id, item.id)}
                onMoveUp={() => moveLesson(section.id, item.id, -1)}
                onMoveDown={() => moveLesson(section.id, item.id, 1)}
                isFirst={iIdx === 0} isLast={iIdx === items.length - 1}
                hasResources={!!perks.hasResources} />
            ))}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => addLesson(section.id, 'video')}
                className="border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs h-10">
                <Plus className="h-3.5 w-3.5 mr-1.5 text-primary" /> Video Lesson
              </Button>
              <Button variant="outline" size="sm" onClick={() => addLesson(section.id, 'text')}
                className="border-dashed border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-xs h-10">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" /> Text Lesson
              </Button>
              <Button variant="outline" size="sm" onClick={() => addLesson(section.id, 'custom')}
                className="border-dashed border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-xs h-10">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-500" /> Custom Page
              </Button>
              <Button variant="outline" size="sm" onClick={() => addLesson(section.id, 'quiz')}
                className="border-dashed border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-xs h-10">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-orange-500" /> Quiz Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Section button */}
      <Button variant="outline" onClick={addSection}
        className="w-full h-12 border-2 border-dashed hover:border-primary/40 hover:bg-primary/5 text-xs font-bold uppercase">
        <Layout className="h-4 w-4 mr-2" /> Add New Section
      </Button>

      {/* ── Course Perks ── */}
      <Card className="overflow-hidden border-primary/20">
        <div className="p-4 bg-primary/5 border-b border-primary/10">
          <h3 className="text-sm font-bold">Course Perks</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Toggle on the perks this course offers to students.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <PerkToggle
            icon={Award}
            label="Certificate of Completion"
            description="Students earn a certificate after passing the final exam"
            checked={!!perks.hasCertificate}
            onChange={v => updateCoursePerks({ ...perks, hasCertificate: v })}
            highlight
          />
          <PerkToggle
            icon={BookOpen}
            label="Lifetime Access"
            description="Students keep access forever (toggle OFF for 1-year access)"
            checked={!!perks.lifetimeAccess}
            onChange={v => updateCoursePerks({ ...perks, lifetimeAccess: v })}
            highlight
          />
          <PerkToggle
            icon={Download}
            label="Downloadable Resources"
            description="Students can download the course resources you upload"
            checked={!!perks.hasResources}
            onChange={v => updateCoursePerks({ ...perks, hasResources: v })}
            highlight
          />
        </div>
      </Card>

      {/* Course-level downloadable resources */}
      <Card className="overflow-hidden border-border">
        <div className="p-4 border-b border-border bg-muted/10">
          <h3 className="text-sm font-bold">Course Resources</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Add downloadable files or useful external links that belong to the whole course.
          </p>
        </div>
        <div className="p-4">
          <CourseResourcesManager
            resources={courseResources}
            onChange={updateCourseResources}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-12 text-xs font-bold uppercase">
          ← Back to Basics
        </Button>
        <Button onClick={onNext} className="flex-1 h-12 text-xs font-bold uppercase tracking-widest">
          Next: Pricing <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
