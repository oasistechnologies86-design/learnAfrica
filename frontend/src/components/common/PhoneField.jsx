import { useEffect, useMemo, useRef, useState } from 'react'
import { Phone } from 'lucide-react'
import { Input } from '@/components/common/Input'
import { cn } from '@/lib/utils'
import { COUNTRIES, DEFAULT_COUNTRY, countryByCode, sanitizePhoneInput } from '@/lib/payoutDetails'
import { fetchCountryConfig } from '@/lib/countries'

function countryFlag(code) {
  return String.fromCodePoint(...String(code || '').toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)))
}

function parseForOptions(raw, options) {
  const value = sanitizePhoneInput(raw)
  if (!value) return { country: DEFAULT_COUNTRY, national: '' }
  if (value.startsWith('+')) {
    const digits = value.slice(1)
    const match = options
      .filter(option => digits.startsWith(String(option.dial || '').replace('+', '')))
      .sort((a, b) => b.dial.length - a.dial.length)[0]
    if (match) {
      let national = digits.slice(match.dial.length - 1)
      if (match.code === 'GH') national = national.replace(/^0+/, '')
      return { country: match.code, national }
    }
    return { country: DEFAULT_COUNTRY, national: digits }
  }
  return {
    country: DEFAULT_COUNTRY,
    national: value.replace(/^0+/, ''),
  }
}

/**
 * Country-aware phone input. Loads the full ISO country/dial-code list from
 * the backend's maintained phone dataset, with the original compact list as a
 * fallback when the country-config endpoint is unavailable.
 */
export function PhoneField({
  id,
  name = 'phone',
  value = '',
  onChange,
  disabled = false,
  required = false,
  className,
  selectClassName,
  inputClassName,
  placeholder = '244 123 456',
  error,
  helperText,
}) {
  const [countryOptions, setCountryOptions] = useState(COUNTRIES)
  const initial = useMemo(() => parseForOptions(value, countryOptions), [value, countryOptions])
  const [country, setCountry] = useState(initial.country)
  const [national, setNational] = useState(initial.national)
  const userCountry = useRef(null)

  useEffect(() => {
    let alive = true
    fetchCountryConfig()
      .then(config => {
        if (!alive || !Array.isArray(config?.countries)) return
        const full = config.countries
          .filter(item => item.code && item.dial)
          .map(item => ({
            code: item.code,
            name: item.name,
            dial: item.dial,
            flag: countryFlag(item.code),
          }))
        if (full.length) setCountryOptions(full)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const parsed = parseForOptions(value, countryOptions)
    setNational(parsed.national)
    if (!parsed.national) {
      userCountry.current = null
      setCountry(parsed.country)
    } else if (userCountry.current) {
      setCountry(userCountry.current)
    } else {
      setCountry(parsed.country)
    }
  }, [value, countryOptions])

  const emit = (nextCountry, nextNational) => {
    const option = countryOptions.find(item => item.code === nextCountry) || countryByCode(nextCountry)
    let digits = String(nextNational || '').replace(/\D/g, '')
    // Ghana's trunk zero is omitted from the international E.164 value.
    if (nextCountry === 'GH') digits = digits.replace(/^0+/, '')
    onChange?.({ target: { name, value: digits ? option.dial + digits : '' } })
  }

  const onNationalChange = (event) => {
    let digits = sanitizePhoneInput(event.target.value).replace(/^\+/, '').replace(/\D/g, '').slice(0, 15)
    if (country === 'GH') digits = digits.replace(/^0+/, '')
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
      <div className="flex w-full min-w-0 gap-2">
        <select
          aria-label="Country code"
          value={country}
          onChange={onCountryChange}
          disabled={disabled}
          className={cn(
            'h-10 w-[42%] min-w-[7.25rem] max-w-44 flex-none rounded-lg border border-input bg-background px-2 text-sm outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            selectClassName
          )}
        >
          {countryOptions.map(option => (
            <option key={option.code} value={option.code}>{option.flag || countryFlag(option.code)} {option.dial} · {option.name}</option>
          ))}
        </select>
        <div className="relative min-w-0 flex-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={national}
            onChange={onNationalChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={cn('w-full min-w-0 pl-10', inputError, inputClassName)}
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
