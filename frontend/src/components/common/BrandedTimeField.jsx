import { Clock } from 'lucide-react';

/** Branded text-based time entry that avoids the browser's native time popup. */
export function BrandedTimeField({ value = '', onChange, className = '', required = false, disabled = false, id, name, 'aria-label': ariaLabel }) {
  const handleChange = event => {
    let next = event.target.value.replace(/[^0-9:]/g, '').slice(0, 5);
    if (next.length === 2 && !next.includes(':') && value?.length < 2) next += ':';
    onChange?.({ target: { value: next } });
  };
  return (
    <div className="relative">
      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input id={id} name={name} type="text" inputMode="numeric" autoComplete="off"
        aria-label={ariaLabel} aria-required={required || undefined} required={required}
        disabled={disabled} value={value} onChange={handleChange}
        onBlur={() => {
          if (/^\d{2}:\d{2}$/.test(value)) {
            const [hours, minutes] = value.split(':').map(Number);
            if (hours > 23 || minutes > 59) onChange?.({ target: { value: '' } });
          }
        }}
        placeholder="HH:MM" maxLength={5}
        className={`w-full pl-9 ${className}`} />
    </div>
  );
}
