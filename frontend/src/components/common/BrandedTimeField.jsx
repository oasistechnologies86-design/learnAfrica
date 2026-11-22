import { Clock } from 'lucide-react';

/** Branded text-based time entry that avoids the browser's native time popup. */
export function BrandedTimeField({ value = '', onChange, className = '', required = false, disabled = false, id, name, 'aria-label': ariaLabel }) {
  const handleChange = event => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
    const next = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
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
        className={`w-full ${className} pl-9`} />
    </div>
  );
}
