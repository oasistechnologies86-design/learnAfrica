import { useEffect, useRef, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, AlignJustify, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Undo2, Redo2, Link2, ImagePlus, Eraser, ClipboardPaste, FileText, Plus, Minus } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

const buttonClass = 'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 text-xs font-medium text-slate-700 transition hover:border-slate-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';
const selectClass = 'h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none';
const FONT_SIZES = ['10pt','11pt','12pt','14pt','16pt','18pt','20pt','24pt','28pt','36pt'];

function ToolButton({ label, children, onClick, active = false }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} onMouseDown={e => e.preventDefault()} onClick={onClick} className={buttonClass + (active ? ' border-emerald-200 bg-emerald-50 text-emerald-800' : '')}>{children}</button>;
}
function Group({ title, children }) {
  return <div className="flex min-w-fit flex-col items-center gap-1 px-2 py-1"><div className="flex min-h-9 flex-wrap items-center justify-center gap-0.5">{children}</div><span className="text-[10px] font-medium tracking-wide text-slate-400">{title}</span></div>;
}

export default function BlogRichTextEditor({ value = '', onChange }) {
  const editor = useRef(null), savedRange = useRef(null);
  const [tab, setTab] = useState('Home'), [panel, setPanel] = useState('');
  const [imageUrl, setImageUrl] = useState(''), [imageAlt, setImageAlt] = useState(''), [linkUrl, setLinkUrl] = useState('');
  const [fontSize, setFontSize] = useState('16pt'), [fontFamily, setFontFamily] = useState('Arial'), [lineSpacing, setLineSpacing] = useState('1.6');
  const [formats, setFormats] = useState({});

  useEffect(() => {
    if (!editor.current || document.activeElement === editor.current) return;
    if (editor.current.innerHTML !== value) editor.current.innerHTML = value || '';
    editor.current.dataset.initialHtml = value || '';
  }, [value]);

  const remember = () => {
    const s = window.getSelection();
    if (s?.rangeCount && editor.current?.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    const s = window.getSelection();
    if (s && savedRange.current && editor.current) {
      editor.current.focus();
      try { s.removeAllRanges(); s.addRange(savedRange.current); } catch { savedRange.current = null; }
    }
  };
  const publish = () => { if (editor.current) onChange?.(editor.current.innerHTML || ''); };
  const syncFormats = () => {
    const s = window.getSelection();
    if (!s?.anchorNode || !editor.current?.contains(s.anchorNode)) return;
    const next = {};
    ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList'].forEach(k => {
      try { next[k] = document.queryCommandState(k); } catch { next[k] = false; }
    });
    setFormats(next); remember();
  };
  const command = (name, arg) => {
    restore();
    try { document.execCommand('styleWithCSS', false, true); document.execCommand(name, false, arg ?? null); } catch {}
    publish(); syncFormats();
  };
  const applyFontSize = size => {
    restore();
    const s = window.getSelection();
    if (!s?.rangeCount || s.isCollapsed) return;
    const span = document.createElement('span'); span.style.fontSize = size;
    try {
      span.append(s.getRangeAt(0).extractContents());
      s.getRangeAt(0).insertNode(span);
      const r = document.createRange(); r.selectNodeContents(span); s.removeAllRanges(); s.addRange(r); savedRange.current = r.cloneRange();
    } catch { document.execCommand('fontSize', false, '4'); }
    setFontSize(size); publish();
  };
  const insertImage = e => {
    e.preventDefault(); const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
    restore();
    const img = '<img src="' + url.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;') + '" alt="' + imageAlt.trim().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;') + '" style="max-width:100%;height:auto">';
    document.execCommand('insertHTML', false, '<p>' + img + '</p><p><br></p>');
    publish(); setImageUrl(''); setImageAlt(''); setPanel('');
  };
  const insertLink = e => {
    e.preventDefault(); const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
    command('createLink', url); setLinkUrl(''); setPanel('');
  };
  const handlePaste = e => {
    e.preventDefault();
    const clipboard = e.clipboardData;
    const rawHtml = clipboard?.getData('text/html');
    const plain = clipboard?.getData('text/plain') || '';
    let html = rawHtml || plain.split(/\r?\n/).map(line => '<p>' + line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>').join('');
    html = sanitizeHtml(html);
    const template = document.createElement('template'); template.innerHTML = html;
    template.content.querySelectorAll('*').forEach(node => { node.removeAttribute('class'); node.removeAttribute('id'); node.removeAttribute('contenteditable'); });
    const s = window.getSelection();
    if (!s?.rangeCount || !editor.current?.contains(s.anchorNode)) {
      editor.current?.focus(); const r = document.createRange(); r.selectNodeContents(editor.current); r.collapse(false); s?.removeAllRanges(); s?.addRange(r);
    }
    if (!s?.rangeCount) return;
    const r = s.getRangeAt(0); r.deleteContents(); r.insertNode(template.content);
    // A fresh plain paragraph is the explicit formatting boundary after paste.
    const clean = document.createElement('p'); clean.append(document.createElement('br'));
    let anchor = r.startContainer;
    if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentElement;
    const pastedBlock = anchor?.closest?.('p,div,li,h1,h2,h3,h4,h5,h6,blockquote');
    if (pastedBlock && editor.current.contains(pastedBlock)) pastedBlock.after(clean); else editor.current.append(clean);
    const caret = document.createRange(); caret.setStart(clean, 0); caret.collapse(true);
    s.removeAllRanges(); s.addRange(caret); savedRange.current = caret.cloneRange();
    publish(); syncFormats();
  };
  const changeSpacing = size => {
    restore(); let node = window.getSelection()?.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = node?.closest?.('p,h1,h2,h3,h4,li,blockquote');
    if (block && editor.current?.contains(block)) block.style.lineHeight = size;
    setLineSpacing(size); publish();
  };
  const tabs = ['Home','Insert','Layout','Review'];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[#f4f7f5]">
        <div className="flex items-center gap-1 border-b border-slate-200 px-3 pt-2">
          <div className="mr-3 flex items-center gap-2 pb-2 text-sm font-bold text-emerald-800"><FileText className="h-4 w-4" /> Article editor</div>
          {tabs.map(item => <button key={item} type="button" onClick={() => { remember(); setTab(item); setPanel(''); }} className={'rounded-t-md px-4 py-2 text-xs font-semibold transition ' + (tab === item ? 'border border-b-white border-slate-200 bg-white text-emerald-800' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800')}>{item}</button>)}
        </div>
        {tab === 'Home' && <div className="flex flex-wrap items-stretch divide-x divide-slate-200 px-2 py-1">
          <Group title="Clipboard"><ToolButton label="Paste from clipboard" onClick={() => editor.current?.focus()}><ClipboardPaste className="h-4 w-4" /></ToolButton><ToolButton label="Clear formatting" onClick={() => command('removeFormat')}><Eraser className="h-4 w-4" /></ToolButton></Group>
          <Group title="Font">
            <select aria-label="Font family" value={fontFamily} onMouseDown={remember} onChange={e => { setFontFamily(e.target.value); command('fontName',e.target.value); }} className={selectClass}>{['Arial','Georgia','Times New Roman','Verdana','Tahoma','Trebuchet MS'].map(f => <option key={f}>{f}</option>)}</select>
            <select aria-label="Font size" value={fontSize} onMouseDown={remember} onChange={e => applyFontSize(e.target.value)} className={selectClass}>{FONT_SIZES.map(s => <option key={s}>{s}</option>)}</select>
            <ToolButton label="Bold" active={formats.bold} onClick={() => command('bold')}><Bold className="h-4 w-4" /></ToolButton><ToolButton label="Italic" active={formats.italic} onClick={() => command('italic')}><Italic className="h-4 w-4" /></ToolButton><ToolButton label="Underline" active={formats.underline} onClick={() => command('underline')}><Underline className="h-4 w-4" /></ToolButton><ToolButton label="Strikethrough" active={formats.strikeThrough} onClick={() => command('strikeThrough')}><Strikethrough className="h-4 w-4" /></ToolButton>
            <label className="flex h-9 items-center gap-1 px-2 text-[10px] text-slate-500">A<input aria-label="Text colour" type="color" defaultValue="#202938" onMouseDown={remember} onChange={e => command('foreColor',e.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" /></label><label className="flex h-9 items-center gap-1 px-2 text-[10px] text-slate-500">▰<input aria-label="Highlight colour" type="color" defaultValue="#fff1a8" onMouseDown={remember} onChange={e => command('hiliteColor',e.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
          </Group>
          <Group title="Paragraph"><ToolButton label="Align left" onClick={() => command('justifyLeft')}><AlignLeft className="h-4 w-4" /></ToolButton><ToolButton label="Centre" onClick={() => command('justifyCenter')}><AlignCenter className="h-4 w-4" /></ToolButton><ToolButton label="Align right" onClick={() => command('justifyRight')}><AlignRight className="h-4 w-4" /></ToolButton><ToolButton label="Justify" onClick={() => command('justifyFull')}><AlignJustify className="h-4 w-4" /></ToolButton><ToolButton label="Bulleted list" active={formats.insertUnorderedList} onClick={() => command('insertUnorderedList')}><List className="h-4 w-4" /></ToolButton><ToolButton label="Numbered list" active={formats.insertOrderedList} onClick={() => command('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolButton><select aria-label="Paragraph style" defaultValue="P" onMouseDown={remember} onChange={e => command('formatBlock',e.target.value)} className={selectClass}><option value="P">Normal</option><option value="H1">Heading 1</option><option value="H2">Heading 2</option><option value="H3">Heading 3</option><option value="BLOCKQUOTE">Quote</option></select></Group>
          <Group title="Editing"><ToolButton label="Undo" onClick={() => command('undo')}><Undo2 className="h-4 w-4" /></ToolButton><ToolButton label="Redo" onClick={() => command('redo')}><Redo2 className="h-4 w-4" /></ToolButton></Group>
        </div>}
        {tab === 'Insert' && <div className="flex flex-wrap items-stretch divide-x divide-slate-200 px-2 py-1"><Group title="Links and media"><ToolButton label="Insert link" onClick={() => setPanel(panel === 'link' ? '' : 'link')}><Link2 className="h-4 w-4" /> Link</ToolButton><ToolButton label="Insert image" onClick={() => setPanel(panel === 'image' ? '' : 'image')}><ImagePlus className="h-4 w-4" /> Image</ToolButton></Group></div>}
        {tab === 'Layout' && <div className="flex flex-wrap items-stretch divide-x divide-slate-200 px-2 py-1"><Group title="Paragraph spacing"><label className="flex items-center gap-2 px-2 text-xs text-slate-600">Line spacing<select aria-label="Line spacing" value={lineSpacing} onMouseDown={remember} onChange={e => changeSpacing(e.target.value)} className={selectClass}><option value="1.4">Compact</option><option value="1.6">Comfortable</option><option value="1.75">Relaxed</option><option value="2">Wide</option></select></label><ToolButton label="Increase indent" onClick={() => command('indent')}><Plus className="h-4 w-4" /> Indent</ToolButton><ToolButton label="Decrease indent" onClick={() => command('outdent')}><Minus className="h-4 w-4" /> Outdent</ToolButton></Group></div>}
        {tab === 'Review' && <div className="flex flex-wrap items-center px-3 py-3 text-xs text-slate-500">Review your formatting, then use Preview article to check the finished page before publishing.</div>}
      </div>
      {panel === 'image' && <form onSubmit={insertImage} className="grid grid-cols-1 gap-2 border-b border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"><input required aria-label="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (https://…)" className="h-9 min-w-0 rounded-md border border-slate-200 px-3 text-sm" /><input required aria-label="Image alt text" value={imageAlt} onChange={e => setImageAlt(e.target.value)} placeholder="Descriptive alt text" className="h-9 min-w-0 rounded-md border border-slate-200 px-3 text-sm" /><button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Insert image</button></form>}
      {panel === 'link' && <form onSubmit={insertLink} className="flex flex-wrap gap-2 border-b border-slate-200 bg-white p-3"><input required aria-label="Link URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm" /><button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Apply to selected text</button></form>}
      <div className="bg-[#eef2ef] p-3 sm:p-5"><div className="mx-auto max-w-[900px] overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,.08)]">
        <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Article body editor" aria-multiline="true" onInput={() => { publish(); syncFormats(); }} onKeyUp={syncFormats} onMouseUp={syncFormats} onPaste={handlePaste} onBlur={publish} className="min-h-[480px] max-h-[900px] overflow-y-auto bg-white px-6 py-8 text-base leading-7 text-slate-800 outline-none sm:px-12 sm:py-12 [&_h1]:my-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:max-h-[480px] [&_img]:rounded-lg [&_img]:object-contain" />
      </div><p className="mx-auto mt-2 max-w-[900px] text-[11px] text-slate-500">Word-style editing ribbon. Paste keeps supported formatting and places your next typing in a fresh normal paragraph.</p></div>
    </div>
  );
}
