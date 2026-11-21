import { useEffect, useMemo, useRef, useState } from 'react'
import { Phone } from 'lucide-react'
import { Input } from '@/components/common/Input'
import { cn } from '@/lib/utils'
import {
  COUNTRIES, DEFAULT_COUNTRY,
  sanitizePhoneInput,
} from '@/lib/payoutDetails'

/**
 * Country-code phone input.
 *
 * The user picks their country (which fixes the dial code) then types the rest.
 * Non-digit characters are stripped automatically as they type, so a stray
 * letter, space, bracket or dash can never end up saved. The component always
 * emits an international value, e.g. "+233244123456".
 *
 * `onChange` is called with a normal input-like event ({ target: { name, value } })
 * so it drops straight into the existing `handleChange` handlers.
 */
export function PhoneField({
  id,
  name = 'phone',
  value = '',
  onChange,
  disabled = false,
  className,
  selectClassName,
  inputClassName,
  placeholder = '244 123 456',
  error,
  helperText,
  required = false,
}) {
  const flagFor = (code) => String(code || '').toUpperCase().replace(/[A-Z]/g, ch =>
    String.fromCodePoint(127397 + ch.charCodeAt(0))
  );
  const parseValue = (raw, options, preferred = DEFAULT_COUNTRY) => {
    const source = String(raw || '').trim();
    const digits = source.replace(/\\D/g, '');
    if (!digits) return { country: preferred, national: '' };
    if (source.startsWith('+')) {
      const matches = options
        .filter(item => item.dial && digits.startsWith(String(item.dial).replace(/\\D/g, '')))
        .sort((a, b) => String(b.dial).length - String(a.dial).length);
      if (matches.length) {
        const dialDigits = String(matches[0].dial).replace(/\\D/g, '');
        const selected = matches.find(item => item.code === preferred) || matches[0];
        return { country: selected.code, national: digits.slice(dialDigits.length) };
      }
    }
    return { country: preferred, national: digits.replace(/^0+/, '') };
  };

  const [countryOptions, setCountryOptions] = useState(COUNTRIES.map(item => ({
    ...item, name: item.name || item.code, flag: item.flag || flagFor(item.code),
  })));
  const parsed = parseValue(value, countryOptions);
  const [country, setCountry] = useState(parsed.country);
  const [national, setNational] = useState(parsed.national);
  const userCountry = useRef(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/config/countries`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Country list unavailable')))
      .then(data => {
        if (!active || !Array.isArray(data?.countries)) return;
        const options = data.countries
          .filter(item => item.dial)
          .map(item => ({ ...item, flag: flagFor(item.code) }));
        if (!options.length) return;
        setCountryOptions(options);
      })
      .catch(() => {
        // Keep the bundled country choices available if the public config is
        // temporarily offline.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const p = parseValue(value, countryOptions, country);
    setNational(p.national);
    if (!p.national) {
      userCountry.current = null;
      setCountry(p.country);
    } else if (userCountry.current) {
      setCountry(userCountry.current);
    } else {
      setCountry(p.country);
    }
    // External value changes (profile load) and the country list are the only
    // reasons to re-seed the visible national number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, countryOptions]);

  const emit = (nextCountry, nextNational) => {
    const digits = String(nextNational || '').replace(/\\D/g, '').replace(/^0+/, '');
    const selected = countryOptions.find(item => item.code === nextCountry)
      || COUNTRIES.find(item => item.code === nextCountry);
    const dial = selected?.dial || '+233';
    onChange?.({ target: { name, value: digits ? `${dial}${digits}` : '' } });
  };

  const onNationalChange = (e) => {
    const digits = sanitizePhoneInput(e.target.value).replace(/^\\+/, '').replace(/\\D/g, '').slice(0, 15);
    setNational(digits);
    emit(country, digits);
  };

  const onCountryChange = (e) => {
    const next = e.target.value;
    userCountry.current = next;
    setCountry(next);
    emit(next, national);
  };

  const inputError = error && 'border-destructive focus:ring-destructive';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <select
          aria-label="Country code"
          required={required}
          value={country}
          onChange={onCountryChange}
          disabled={disabled}
          className={cn(
            'h-10 shrink-0 rounded-lg border border-input bg-background px-2 text-sm outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            selectClassName
          )}
        >
          {countryOptions.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.dial} · {c.name}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            name={name}
            type="tel"
            required={required}
            inputMode="numeric"
            autoComplete="tel-national"
            value={national}
            onChange={onNationalChange}
            disabled={disabled}
            placeholder={placeholder}
            className={cn('pl-10', inputError, inputClassName)}
          />
        </div>
      </div>
      {error
        ? <p className="text-sm text-destructive">{error}</p>
        : helperText
          ? <p className="text-xs text-muted-foreground">{helperText}</p>
          : null}
    </div>
  )
}
