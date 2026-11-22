import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

const pad = value => String(value).padStart(2, '0');
const toISO = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseISO = value => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};
const displayDate = value => {
  const date = parseISO(value);
  return date ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : '';
};

/** LearnAfrica calendar picker. Values remain YYYY-MM-DD for API compatibility. */
export function BrandedDatePicker({
  value = '', onChange, className = '', disabled = false, required = false,
  id, name, min, max, 'aria-label': ariaLabel, placeholder = 'Select date',
}) {
  const rootRef = useRef(null);
  const selected = parseISO(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => selected || new Date());
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = useMemo(() => Array.from({ length: 42 }, (_, index) => {
    const day = index - mondayOffset + 1;
    return day < 1 || day > daysInMonth ? null : new Date(year, monthIndex, day);
  }), [year, monthIndex, mondayOffset, daysInMonth]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const onKeyDown = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const change = date => {
    const next = toISO(date);
    if ((min && next < min) || (max && next > max)) return;
    onChange?.({ target: { value: next } });
    setOpen(false);
  };
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button id={id} type="button" disabled={disabled} aria-label={ariaLabel}
        aria-haspopup="dialog" aria-expanded={open} aria-required={required || undefined}
        onClick={() => { setMonth(selected || new Date()); setOpen(current => !current); }}
        className={`flex w-full items-center justify-between gap-2 text-left ${className} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <span className={selected ? '' : 'text-muted-foreground'}>{displayDate(value) || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div role="dialog" aria-label="Choose a date" className="absolute right-0 top-full z-[90] mt-1 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 text-card-foreground shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month"
              className="rounded-lg p-2 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <button type="button" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month"
              className="rounded-lg p-2 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day} className="py-1 text-[11px] font-semibold text-muted-foreground">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={index} className="h-9" />;
              const iso = toISO(date);
              const isSelected = iso === value;
              const outOfRange = (min && iso < min) || (max && iso > max);
              const isToday = iso === toISO(new Date());
              return <button key={iso} type="button" disabled={outOfRange} onClick={() => change(date)}
                aria-pressed={isSelected}
                className={`h-9 rounded-lg text-sm transition-colors ${isSelected ? 'bg-primary font-bold text-primary-foreground' : isToday ? 'border border-primary/40 text-primary' : 'hover:bg-muted'} ${outOfRange ? 'cursor-not-allowed opacity-25' : ''}`}>{date.getDate()}</button>;
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
            <button type="button" onClick={() => { onChange?.({ target: { value: '' } }); setOpen(false); }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"><X className="h-3 w-3" /> Clear</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Cancel</button>
          </div>
        </div>
      )}
      {name && <input type="hidden" name={name} value={value || ''} />}
    </div>
  );
}
