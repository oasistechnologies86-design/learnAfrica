import { useEffect, useRef, useState } from 'react'
import { Phone } from 'lucide-react'
import { Input } from '@/components/common/Input'
import { cn } from '@/lib/utils'
import { API_BASE } from '@/lib/api'
import { COUNTRIES, DEFAULT_COUNTRY, sanitizePhoneInput } from '@/lib/payoutDetails'

const flagForCountry = (code) => String(code || '').toUpperCase().replace(/[A-Z]/g, ch =>
  String.fromCodePoint(127397 + ch.charCodeAt(0))
)

function parsePhoneValue(raw, options, preferred = DEFAULT_COUNTRY) {
  const source = String(raw || '').trim()
  const digits = source.replace(/\D/g, '')
  if (!digits) return { country: preferred, national: '' }

  if (source.startsWith('+')) {
    const matches = options
      .filter(item => item.dial && digits.startsWith(String(item.dial).replace(/\D/g, '')))
      .sort((a, b) => String(b.dial).length - String(a.dial).length)
    if (matches.length) {
      const dialDigits = String(matches[0].dial).replace(/\D/g, '')
      const selected = matches.find(item => item.code === preferred) || matches[0]
      return { country: selected.code, national: digits.slice(dialDigits.length) }
    }
  }

  return { country: preferred, national: digits.replace(/^0+/, '') }
}

/**
 * Country-code phone input backed by the platform's full ISO country list.
 * The public config supplies calling codes for all supported countries; the
 * bundled list remains as a fallback if the API is temporarily unavailable.
 * The component always emits an international value such as +233244123456.
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
  const [countryOptions, setCountryOptions] = useState(() => COUNTRIES.map(item => ({
    ...item,
    name: item.name || item.code,
    flag: item.flag || flagForCountry(item.code),
  })))
  const initial = parsePhoneValue(value, countryOptions)
  const [country, setCountry] = useState(initial.country)
  const [national, setNational] = useState(initial.national)
  const userCountry = useRef(null)

  useEffect(() => {
    let active = true
    fetch(`${API_BASE}/api/config/countries`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Country list unavailable')))
      .then(data => {
        if (!active || !Array.isArray(data?.countries)) return
        const options = data.countries
          .filter(item => item.dial)
          .map(item => ({ ...item, flag: flagForCountry(item.code) }))
        if (options.length) setCountryOptions(options)
      })
      .catch(() => {
        // Keep the bundled country choices available if public config is offline.
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const parsed = parsePhoneValue(value, countryOptions, country)
    setNational(parsed.national)
    if (!parsed.national) {
      userCountry.current = null
      setCountry(parsed.country)
    } else if (userCountry.current) {
      setCountry(userCountry.current)
    } else {
      setCountry(parsed.country)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, countryOptions])

  const emit = (nextCountry, nextNational) => {
    const digits = String(nextNational || '').replace(/\D/g, '').replace(/^0+/, '')
    const selected = countryOptions.find(item => item.code === nextCountry)
      || COUNTRIES.find(item => item.code === nextCountry)
    const dial = selected?.dial || '+233'
    onChange?.({ target: { name, value: digits ? `${dial}${digits}` : '' } })
  }

  const onNationalChange = (event) => {
    const digits = sanitizePhoneInput(event.target.value)
      .replace(/^\+/, '')
      .replace(/\D/g, '')
      .slice(0, 15)
    setNational(digits)
    emit(country, digits)
  }

  const onCountryChange = (event) => {
    const next = event.target.value
    userCountry.current = next
    setCountry(next)
    emit(next, national)
  }

  const inputError = error && 'border-destructive focus:ring-destructive'

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
          {countryOptions.map(item => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.dial} · {item.name}
            </option>
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
            aria-invalid={!!error || undefined}
            className={cn(
              'h-10 w-full rounded-lg pl-10 pr-3 text-sm',
              inputError,
              inputClassName
            )}
          />
        </div>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )
}

export default PhoneField
