import { useEffect, useRef, useState } from 'react';

const buttonClass = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-background px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const selectClass = 'h-9 rounded-lg border border-border bg-background px-2 text-xs';

const tools = [
  { label: 'Bold', command: 'bold', text: 'B', className: 'font-bold' },
  { label: 'Italic', command: 'italic', text: 'I', className: 'italic' },
  { label: 'Underline', command: 'underline', text: 'U', className: 'underline' },
  { label: 'Strikethrough', command: 'strikeThrough', text: 'S', className: 'line-through' },
  { label: 'Align left', command: 'justifyLeft', text: 'Left' },
  { label: 'Align centre', command: 'justifyCenter', text: 'Centre' },
  { label: 'Align right', command: 'justifyRight', text: 'Right' },
  { label: 'Justify text', command: 'justifyFull', text: 'Justify' },
  { label: 'Bulleted list', command: 'insertUnorderedList', text: '• List' },
  { label: 'Numbered list', command: 'insertOrderedList', text: '1. List' },
  { label: 'Quote', command: 'formatBlock', value: 'BLOCKQUOTE', text: 'Quote' },
  { label: 'Undo', command: 'undo', text: '↶' },
  { label: 'Redo', command: 'redo', text: '↷' },
];

const FONT_SIZES = [
  ['Small', '2', '13px'],
  ['Normal', '3', '16px'],
  ['Large', '4', '19px'],
  ['Larger', '5', '24px'],
  ['Heading', '6', '30px'],
  ['Display', '7', '36px'],
];

export default function BlogRichTextEditor({ value = '', onChange }) {
  const editor = useRef(null);
  const range = useRef(null);
  const [panel, setPanel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fontSize, setFontSize] = useState('3');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [lineSpacing, setLineSpacing] = useState('1.75');

  useEffect(() => {
    if (!editor.current || document.activeElement === editor.current) return;
    if (editor.current.innerHTML !== value) editor.current.innerHTML = value || '';
    // Keep the saved baseline unchanged while the user is actively typing.
    editor.current.dataset.initialHtml = value || '';
  }, [value]);

  const remember = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount && editor.current?.contains(selection.anchorNode)) {
      range.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restore = () => {
    const selection = window.getSelection();
    if (selection && range.current) {
      editor.current?.focus();
      selection.removeAllRanges();
      selection.addRange(range.current);
    }
  };

  const publishChange = () => {
    if (editor.current) onChange?.(editor.current.innerHTML || '');
  };

  const command = (name, arg) => {
    editor.current?.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(name, false, arg ?? null);
    publishChange();
  };

  const applyFontSize = value => {
    restore();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, value);
    const px = FONT_SIZES.find(item => item[1] === value)?.[2] || '16px';
    editor.current?.querySelectorAll('font[size="' + value + '"]').forEach(node => {
      const span = document.createElement('span');
      span.style.fontSize = px;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    setFontSize(value);
    publishChange();
  };

  const applyColour = (commandName, colour) => {
    restore();
    command(commandName, colour);
  };

  const insertImage = event => {
    event.preventDefault();
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
    restore();
    const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const safeAlt = imageAlt.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    document.execCommand('insertHTML', false, '<p><img src="' + safeUrl + '" alt="' + safeAlt + '"></p><p><br></p>');
    publishChange();
    setImageUrl('');
    setImageAlt('');
    setPanel('');
  };

  const insertLink = event => {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
    restore();
    document.execCommand('createLink', false, url);
    publishChange();
    setLinkUrl('');
    setPanel('');
  };

  const changeLineSpacing = value => {
    restore();
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = node?.closest?.('p,h1,h2,h3,h4,li,blockquote');
    if (block && editor.current?.contains(block)) block.style.lineHeight = value;
    setLineSpacing(value);
    publishChange();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="space-y-2 border-b border-border bg-muted/30 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {tools.map(tool => (
            <button key={tool.label} type="button" title={tool.label} aria-label={tool.label}
              onMouseDown={event => event.preventDefault()}
              onClick={() => command(tool.command, tool.value)}
              className={buttonClass + (tool.className ? ' ' + tool.className : '')}>
              {tool.text}
            </button>
          ))}
          <select aria-label="Paragraph style" defaultValue="P" onMouseDown={remember}
            onChange={event => command('formatBlock', event.target.value)} className={selectClass}>
            <option value="P">Paragraph</option>
            <option value="H1">Heading 1</option>
            <option value="H2">Heading 2</option>
            <option value="H3">Heading 3</option>
            <option value="H4">Heading 4</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Font
            <select aria-label="Font family" value={fontFamily} onMouseDown={remember}
              onChange={event => { setFontFamily(event.target.value); restore(); command('fontName', event.target.value); }}
              className={selectClass}>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Trebuchet MS">Trebuchet</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Size
            <select aria-label="Font size" value={fontSize} onMouseDown={remember}
              onChange={event => applyFontSize(event.target.value)} className={selectClass}>
              {FONT_SIZES.map(([label, value]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground">
            Text
            <input aria-label="Text colour" type="color" defaultValue="#202938" onMouseDown={remember}
              onChange={event => applyColour('foreColor', event.target.value)} className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0" />
          </label>
          <label className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground">
            Highlight
            <input aria-label="Highlight colour" type="color" defaultValue="#fff1a8" onMouseDown={remember}
              onChange={event => applyColour('hiliteColor', event.target.value)} className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0" />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Line spacing
            <select aria-label="Line spacing" value={lineSpacing} onMouseDown={remember}
              onChange={event => changeLineSpacing(event.target.value)} className={selectClass}>
              <option value="1.4">Compact</option>
              <option value="1.6">Comfortable</option>
              <option value="1.75">Relaxed</option>
              <option value="2">Wide</option>
            </select>
          </label>
          <button type="button" onMouseDown={event => { event.preventDefault(); remember(); }}
            onClick={() => setPanel(panel === 'link' ? '' : 'link')} className={buttonClass}>Add link</button>
          <button type="button" onMouseDown={event => { event.preventDefault(); remember(); }}
            onClick={() => setPanel(panel === 'image' ? '' : 'image')} className={buttonClass}>Insert image</button>
          <button type="button" onMouseDown={event => event.preventDefault()}
            onClick={() => command('removeFormat')} className={buttonClass}>Clear formatting</button>
        </div>
      </div>
      {panel === 'image' && (
        <form onSubmit={insertImage} className="grid grid-cols-1 gap-2 border-b border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
          <input required aria-label="Image URL" value={imageUrl} onChange={event => setImageUrl(event.target.value)}
            placeholder="Image URL (https://…)" className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm" />
          <input required aria-label="Image alt text" value={imageAlt} onChange={event => setImageAlt(event.target.value)}
            placeholder="Descriptive alt text" className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm" />
          <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Insert image</button>
        </form>
      )}
      {panel === 'link' && (
        <form onSubmit={insertLink} className="flex flex-wrap gap-2 border-b border-border p-3">
          <input required aria-label="Link URL" value={linkUrl} onChange={event => setLinkUrl(event.target.value)}
            placeholder="https://…" className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" />
          <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Apply to selected text</button>
        </form>
      )}
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Article body editor"
        aria-multiline="true" onInput={publishChange} onBlur={publishChange}
        className="min-h-[420px] max-h-[820px] overflow-y-auto bg-background px-5 py-5 text-base leading-7 outline-none sm:px-7 sm:py-7 [&_h1]:my-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:max-h-[480px] [&_img]:rounded-lg [&_img]:object-contain" />
      <p className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Select text before applying formatting or adding a link. Add descriptive alt text to images. Formatting is saved with the article.
      </p>
    </div>
  );
}
