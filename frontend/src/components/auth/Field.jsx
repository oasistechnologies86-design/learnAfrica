/**
 * Field — a labelled text input in the auth-card style.
 *
 * Icon on the left, optional trailing control (the password eye), inline error
 * text below. Height and font size step up on phones so the browser does not
 * zoom when a box is tapped.
 */
import { cn } from '@/lib/utils';

export function Field({
  id,
  label,
  icon: Icon,
  trailing,
  invalid = false,
  error,
  hint,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        )}
        <input
          id={id}
          aria-invalid={invalid || undefined}
          className={cn(
            'flex h-12 w-full rounded-[10px] border border-input bg-muted/40 px-3 text-[16px] text-foreground transition-colors lg:h-11 lg:text-[13px]',
            'placeholder:text-muted-foreground',
            'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-60',
            Icon && 'pl-10',
            trailing && 'pr-11',
            invalid && 'border-destructive focus-visible:ring-destructive',
            inputClassName
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default Field;
