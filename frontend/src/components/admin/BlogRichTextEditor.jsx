import { useEffect, useRef, useState } from 'react';

const tools = [
  ['Bold', 'bold', 'B'], ['Italic', 'italic', 'I'], ['Underline', 'underline', 'U'],
  ['Align left', 'justifyLeft', 'Left'], ['Align centre', 'justifyCenter', 'Centre'],
  ['Align right', 'justifyRight', 'Right'], ['Justify text', 'justifyFull', 'Justify'],
  ['Bulleted list', 'insertUnorderedList', '• List'], ['Numbered list', 'insertOrderedList', '1. List'],
  ['Undo', 'undo', '↶'], ['Redo', 'redo', '↷'],
];

export default function BlogRichTextEditor({ value = '', onChange }) {
  const editor = useRef(null);
  const range = useRef(null);
  const [panel, setPanel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  useEffect(() => {
    if (editor.current && document.activeElement !== editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value || '';
  }, [value]);
  const remember = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount) range.current = selection.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    const selection = window.getSelection();
    if (selection && range.current) { selection.removeAllRanges(); selection.addRange(range.current); }
  };
  const command = (name, arg) => {
    editor.current?.focus();
    document.execCommand(name, false, arg || null);
    onChange?.(editor.current?.innerHTML || '');
  };
  const insertImage = event => {
    event.preventDefault();
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
    restore();
    const src = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const alt = imageAlt.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    document.execCommand('insertHTML', false, '<p><img src="' + src + '" alt="' + alt + '"></p><p><br></p>');
    onChange?.(editor.current?.innerHTML || '');
    setImageUrl(''); setImageAlt(''); setPanel('');
  };
  const insertLink = event => {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
    restore();
    document.execCommand('createLink', false, url);
    onChange?.(editor.current?.innerHTML || '');
    setLinkUrl(''); setPanel('');
  };
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2">
        {tools.map(([label, name, text]) => <button key={label} type="button" title={label} aria-label={label} onMouseDown={event => event.preventDefault()} onClick={() => command(name)} className="h-9 rounded-md border border-border bg-background px-2 text-xs hover:bg-muted">{text}</button>)}
        <select aria-label="Text style" defaultValue="P" onMouseDown={remember} onChange={event => command('formatBlock', event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs"><option value="P">Paragraph</option><option value="H1">Heading 1</option><option value="H2">Heading 2</option><option value="H3">Heading 3</option><option value="H4">Heading 4</option></select>
        <button type="button" onMouseDown={event => { event.preventDefault(); remember(); }} onClick={() => setPanel(panel === 'link' ? '' : 'link')} className="h-9 rounded-md border border-border bg-background px-2 text-xs">Add link</button>
        <button type="button" onMouseDown={event => { event.preventDefault(); remember(); }} onClick={() => setPanel(panel === 'image' ? '' : 'image')} className="h-9 rounded-md border border-border bg-background px-2 text-xs">Insert image</button>
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('formatBlock', 'BLOCKQUOTE')} className="h-9 rounded-md border border-border bg-background px-2 text-xs">Quote</button>
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command('removeFormat')} className="h-9 rounded-md border border-border bg-background px-2 text-xs">Clear format</button>
      </div>
      {panel === 'image' && <form onSubmit={insertImage} className="grid grid-cols-1 gap-2 border-b border-border p-3 sm:grid-cols-[1fr_1fr_auto]"><input required aria-label="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (https://…)" className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm" /><input required aria-label="Image alt text" value={imageAlt} onChange={e => setImageAlt(e.target.value)} placeholder="Descriptive alt text" className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Insert image</button></form>}
      {panel === 'link' && <form onSubmit={insertLink} className="flex flex-wrap gap-2 border-b border-border p-3"><input required aria-label="Link URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Apply to selected text</button></form>}
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Article body editor" aria-multiline="true" onInput={() => onChange?.(editor.current?.innerHTML || '')} onBlur={() => onChange?.(editor.current?.innerHTML || '')} className="min-h-[320px] max-h-[680px] overflow-y-auto bg-background px-4 py-4 text-sm leading-7 outline-none [&_h1]:my-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:max-h-[480px] [&_img]:rounded-lg [&_img]:object-contain" />
      <p className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Select text before adding a link. Add alt text to every image. Formatting is saved with the article.</p>
    </div>
  );
}
