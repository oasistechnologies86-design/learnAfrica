import { Children, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

function flattenOptions(children) {
  const result = [];
  const visit = (nodes) => Children.forEach(nodes, (node) => {
    if (!node) return;
    if (node.type === Fragment) visit(node.props.children);
    else if (node.type === 'option') {
      const text = (value) => {
        if (value == null || typeof value === 'boolean') return '';
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (Array.isArray(value)) return value.map(text).join('');
        if (value.props?.children != null) return text(value.props.children);
        return '';
      };
      result.push({
        value: String(node.props.value ?? text(node.props.children)),
        label: node.props.children,
        searchText: text(node.props.children).trim(),
        disabled: Boolean(node.props.disabled),
      });
    } else if (Array.isArray(node)) visit(node);
  });
  visit(children);
  return result;
}

/**
 * LearnAfrica's accessible, theme-aware select control.
 * Keeps the familiar select onChange contract: onChange({ target: { value } }).
 */
export function BrandedSelect({
  children, value, defaultValue, onChange, className = '', containerClassName = '', disabled = false,
  id, name, required = false, placeholder, 'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid, title,
}) {
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
  const options = useMemo(() => flattenOptions(children), [children]);
  const current = value === undefined ? uncontrolledValue : value;
  const selected = options.find(option => option.value === String(current ?? ''));
  const searchable = options.length > 8;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(option => option.searchText.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') { setOpen(false); setQuery(''); }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  const choose = option => {
    if (!option || option.disabled) return;
    if (value === undefined) setUncontrolledValue(option.value);
    onChange?.({ target: { value: option.value } });
    setOpen(false);
    setQuery('');
  };

  const moveActive = direction => {
    if (!filtered.length) return;
    setActiveIndex(index => {
      let next = index;
      for (let step = 0; step < filtered.length; step += 1) {
        next = (next + direction + filtered.length) % filtered.length;
        if (!filtered[next].disabled) return next;
      }
      return index;
    });
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${containerClassName}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id ? `${id}-options` : undefined}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid || undefined}
        disabled={disabled}
        title={title}
        onClick={() => { setOpen(currentOpen => !currentOpen); setQuery(''); setActiveIndex(Math.max(0, options.findIndex(option => option.value === String(current ?? '')))); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) setOpen(true);
            else moveActive(event.key === 'ArrowDown' ? 1 : -1);
          } else if (event.key === 'Enter' && open) {
            event.preventDefault();
            choose(filtered[activeIndex]);
          } else if (event.key === ' ' && !open) {
            event.preventDefault(); setOpen(true);
          }
        }}
        className={`relative flex w-full min-w-0 items-center justify-between gap-2 pr-9 text-left ${className} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className={`min-w-0 truncate ${selected ? '' : 'text-muted-foreground'}`}>
          {selected?.label ?? placeholder ?? options.find(option => option.value === '')?.label ?? 'Select an option'}
        </span>
        <ChevronDown className={`pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[90] mt-1 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl">
          {searchable && (
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-2.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input ref={searchRef} value={query} onChange={event => { setQuery(event.target.value); setActiveIndex(0); }}
                  placeholder="Search options…" className="h-9 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>
          )}
          <div id={id ? `${id}-options` : undefined} role="listbox" aria-label={ariaLabel || title || 'Options'}
            className="max-h-60 overflow-y-auto overscroll-contain p-1">
            {filtered.length ? filtered.map((option, index) => {
              const isSelected = option.value === String(current ?? '');
              return (
                <button key={`${option.value}-${index}`} type="button" role="option" aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'} ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                  <span className="min-w-0 break-words">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            }) : <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matching options</p>}
          </div>
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-[11px] text-muted-foreground">{filtered.length} option{filtered.length === 1 ? '' : 's'}</span>
            <button type="button" onClick={() => { setOpen(false); setQuery(''); }}
              className="rounded-md px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">Close</button>
          </div>
        </div>
      )}
      {name && <input type="hidden" name={name} value={current ?? ''} />}
    </div>
  );
}
