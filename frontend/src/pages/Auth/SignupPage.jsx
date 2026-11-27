import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, X, Check, BookOpen, ArrowRight, IdCard, ShieldCheck, Loader2, CreditCard } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Field } from '@/components/auth/Field'
import { PhoneField } from '@/components/common/PhoneField'
import { useAuth } from '@/context/AuthContext'
import { isValidIntlPhone } from '@/lib/payoutDetails'
import { API_BASE } from '@/lib/api'
import { cn } from '@/lib/utils'
import { InstructorProfileFields } from '@/components/instructor/InstructorProfileFields'
import {
  fetchCountryConfig, fetchRequirements, isValidIdNumber, normalizeIdNumber,
} from '@/lib/countries'

// ── Instructor-specific validators (mirror the backend) ─────────────────────
// Identity documents are country-aware (see lib/countries); Ghana Card is the
// only one with a strict national format. Kept here only as a fallback label.
const ID_TYPE_LABELS = {
  ghana_card: 'Ghana Card', national_id: 'National ID', voter_id: "Voter's ID",
  passport: 'Passport', drivers_licence: "Driver's licence", drivers_license: "Driver's Licence",
  nin: 'National Identification Number', other_gov_id: 'Other government-issued ID',
}

// Universal password rules — applied in real-time on the UI and enforced on the backend.
const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',         test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter (A-Z)',    test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter (a-z)',    test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'One number (0-9)',              test: (p) => /[0-9]/.test(p) },
  { id: 'symbol',    label: 'One special character (!@#$%)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const isPasswordStrong = (p) => PASSWORD_RULES.every(r => r.test(p))

export function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isInstructor: false
  })
  // Step 0 = choose account type; 'student' | 'instructor' selects the form.
  const [roleChoice, setRoleChoice] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptVerification, setAcceptVerification] = useState(false)
  // Country-aware instructor identity. Kept in a single object so the shared
  // InstructorProfileFields component can own the whole block.
  const [instructor, setInstructor] = useState({
    country: '', id_type: '', id_number: '',
    region: '', city: '', postal_code: '',
    digital_address: '', phone: '',
  })
  const [idConfirm, setIdConfirm] = useState('')
  const [countryConfig, setCountryConfig] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [regInfo, setRegInfo] = useState(null)
  const [modal, setModal] = useState(null) // 'terms' | 'privacy' | 'cookies' | null
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Deep link: /signup?type=instructor|student preselects the account type.
  useEffect(() => {
    const t = (searchParams.get('type') || '').toLowerCase()
    if (t === 'instructor' || t === 'student') {
      setRoleChoice(t)
      setFormData(prev => ({ ...prev, isInstructor: t === 'instructor' }))
    }
  }, [searchParams])

  // Country reference data — loaded once the instructor form is shown.
  useEffect(() => {
    if (!formData.isInstructor) return
    let alive = true
    fetchCountryConfig().then(c => { if (alive) setCountryConfig(c) }).catch(() => {})
    return () => { alive = false }
  }, [formData.isInstructor])

  // Per-country rules (subdivisions, postal requirement) follow the selection.
  useEffect(() => {
    if (!instructor.country) { setRequirements(null); return }
    let alive = true
    fetchRequirements(instructor.country)
      .then(r => { if (alive) setRequirements(r) })
      .catch(() => { if (alive) setRequirements(null) })
    return () => { alive = false }
  }, [instructor.country])

  const handleInstructorChange = (patch) => {
    setInstructor(prev => ({ ...prev, ...patch }))
    setErrors(er => {
      const next = { ...er }
      Object.keys(patch).forEach(k => { delete next[k] })
      return next
    })
  }

  // Fetch the authoritative instructor registration fee for both the account-type
  // chooser and the instructor signup form.
  useEffect(() => {
    let alive = true
    fetch(`${API_BASE}/api/instructor-registration`)
      .then(r => r.json())
      .then(d => { if (alive) setRegInfo(d) })
      .catch(() => { if (alive) setRegInfo({ error: true }) })
    return () => { alive = false }
  }, [])

  // Live evaluation of each rule
  const ruleStatuses = useMemo(
    () => PASSWORD_RULES.map(r => ({ ...r, passed: r.test(formData.password) })),
    [formData.password]
  )
  const passedCount = ruleStatuses.filter(r => r.passed).length
  const strengthPct = (passedCount / PASSWORD_RULES.length) * 100
  const strengthLabel =
    passedCount <= 1 ? 'Add a secure password' :
    passedCount === 2 ? 'Weak' :
    passedCount === 3 ? 'Good' :
    passedCount === 4 ? 'Strong' : 'Strong'
  const strengthColor =
    passedCount <= 1 ? 'bg-muted-foreground/40' :
    passedCount === 2 ? 'bg-destructive' :
    passedCount === 3 ? 'bg-yellow-500' :
    'bg-success'

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address'
    if (!String(formData.phone || '').trim()) newErrors.phone = 'Phone number is required'
    else if (!isValidIntlPhone(formData.phone)) {
      newErrors.phone = 'Enter a valid phone number, e.g. 0244123456'
    }
    if (!formData.password) newErrors.password = 'Password is required'
    else if (!isPasswordStrong(formData.password)) {
      newErrors.password = 'Password does not meet all requirements'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!acceptTerms) newErrors.terms = 'You must accept the terms and conditions'
    if (formData.isInstructor) {
      if (!instructor.country) newErrors.country = 'Please select your country.'
      if (!instructor.id_type) newErrors.id_type = 'Please choose an identification type.'
      if (!isValidIdNumber(instructor.country, instructor.id_type, instructor.id_number)) {
        newErrors.id_number = `Enter a valid ${ID_TYPE_LABELS[instructor.id_type] || 'identification'} number`
      } else if (normalizeIdNumber(instructor.country, instructor.id_type, idConfirm) !==
                 normalizeIdNumber(instructor.country, instructor.id_type, instructor.id_number)) {
        newErrors.id_number = 'The two identification numbers do not match.'
      }
      if (!String(instructor.city || '').trim()) newErrors.city = 'City or locality is required.'
      if (requirements?.postal_required && !String(instructor.postal_code || '').trim()) newErrors.postal_code = 'Postal code is required for this country.'
      if (instructor.country === 'GH' && !String(instructor.digital_address || '').trim()) {
        newErrors.digital_address = 'Your digital address is required'
      }
      if (!acceptVerification) {
        newErrors.verification = 'You must acknowledge the information-verification statement'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      // Take the user straight to the first field that needs attention.
      requestAnimationFrame(() => {
        const el = formRef.current?.querySelector('[aria-invalid="true"]')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.focus?.({ preventScroll: true })
        }
      })
      return
    }

    setIsLoading(true)
    try {
      if (formData.isInstructor) {
        // For instructor: carry the identity + agreement data to onboarding,
        // where the professional profile and payout method are collected.
        const idNumberNorm = normalizeIdNumber(instructor.country, instructor.id_type, instructor.id_number)
        navigate('/signup/instructor-onboarding', {
          state: {
            email:    formData.email,
            name:     formData.name,
            phone:    formData.phone,
            password: formData.password,
            country:  instructor.country,
            id_type:  instructor.id_type,
            id_number: idNumberNorm,
            // Legacy Ghana field kept in sync so nothing downstream breaks.
            ghana_card_number: instructor.id_type === 'ghana_card' ? idNumberNorm : '',
            ghana_post_gps: instructor.country === 'GH' ? String(instructor.digital_address || '').trim().toUpperCase() : '',
            region: instructor.region, city: instructor.city,
            postal_code: instructor.postal_code,
            digital_address: instructor.digital_address,
            accept_terms: true,
            accept_verification: true,
            agreement_version: '2026-11',
          }
        })
        return
      }

      // For students: sign up immediately
      const result = await signup({
        name:     formData.name,
        email:    formData.email,
        phone:    formData.phone,
        password: formData.password,
        role:     'student',
        accept_terms: true,
        agreement_version: '2026-11',
      })
      // If the backend requires email verification, redirect to /verify-email
      if (result && result.needs_verification) {
        navigate('/verify-email', { state: { email: result.email || formData.email } })
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setErrors({ general: err.message || 'Sign up failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Show the requirements panel when the user focuses the password field or has typed something
  const showRequirements = passwordFocused || formData.password.length > 0

  // ── Step 1: choose how to sign up ──────────────────────────────────────────
  if (!roleChoice) {
    const options = [
      {
        id: 'student',
        icon: BookOpen,
        eyebrow: 'LEARN',
        title: 'Join as a Student',
        description: 'Create your account for free, explore courses and build your skills with LearnAfrica.',
        action: 'Sign Up as Student',
      },
      {
        id: 'instructor',
        icon: GraduationCap,
        eyebrow: 'TEACH',
        title: 'Become an Instructor',
        description: 'Share your knowledge, create and publish courses, reach learners, and earn commissions from course purchases.',
        action: 'Register as Instructor',
      },
    ]

    const chooseRole = (id) => {
      setFormData(prev => ({ ...prev, isInstructor: id === 'instructor' }))
      setRoleChoice(id)
    }

    return (
      <AuthCard
        view="signup"
        onSwitch={() => navigate('/login')}
      >
        <div className="w-full space-y-4 sm:space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold tracking-tight sm:text-[28px]">Get Started with LearnAfrica</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Choose how you would like to join.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {options.map((opt) => {
              const isInstructor = opt.id === 'instructor'
              const feeUnavailable = isInstructor && (regInfo === null || regInfo.error)
              const feeIsFree = isInstructor && regInfo?.is_free === true
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-label={opt.action}
                  onClick={() => chooseRole(opt.id)}
                  className={cn(
                    'group flex min-h-0 min-w-0 w-full flex-col items-start rounded-2xl border border-primary/60 p-3 text-left sm:min-h-[270px] sm:p-6',
                    'bg-card shadow-[0_0_0_1px_hsl(var(--primary)/0.42),0_0_18px_2px_hsl(var(--primary)/0.28)]',
                    'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.65),0_0_26px_5px_hsl(var(--primary)/0.38)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'active:translate-y-0',
                    isInstructor
                      ? 'bg-gradient-to-br from-primary/[0.10] via-card to-card'
                      : 'hover:bg-muted/20'
                  )}
                >
                  <span className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-200 group-hover:scale-105 sm:mb-3 sm:h-12 sm:w-12">
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={1.9} />
                  </span>
                  <span className="mb-0.5 text-[9px] font-bold tracking-[0.16em] text-primary sm:mb-1 sm:text-[10px]">
                    {opt.eyebrow}
                  </span>
                  <span className="text-[15px] font-bold leading-snug text-foreground sm:text-lg">
                    {opt.title}
                  </span>
                  <span className="mt-1 text-[11px] leading-snug text-muted-foreground sm:mt-2 sm:text-sm sm:leading-relaxed">
                    {opt.description}
                  </span>

                  {isInstructor ? (
                    <span className={cn(
                      'mt-2 flex w-full items-start gap-1.5 rounded-xl border px-2.5 py-2 sm:mt-4 sm:gap-2.5 sm:px-3.5 sm:py-3',
                      feeUnavailable
                        ? 'border-border bg-muted/50'
                        : feeIsFree
                          ? 'border-success/25 bg-success/10'
                          : 'border-primary/25 bg-primary/10'
                    )}>
                      <CreditCard className={cn('mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4', feeIsFree ? 'text-success' : 'text-primary')} />
                      <span className="min-w-0">
                        <span className={cn('block text-xs font-bold sm:text-sm', feeIsFree ? 'text-success' : 'text-foreground')}>
                          {regInfo === null
                            ? 'Checking registration fee…'
                            : regInfo.error
                              ? 'Registration fee unavailable'
                              : regInfo.is_free
                                ? 'Instructor registration is FREE'
                                : 'Instructor registration requires payment'}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed">
                          {regInfo === null
                            ? 'Please wait while we confirm the current fee.'
                            : regInfo.error
                              ? 'Please try again shortly.'
                              : regInfo.is_free
                                ? 'No registration payment is required.'
                                : `${regInfo.currency || 'GHS'} ${Number(regInfo.fee || 0).toFixed(2)} one-time registration fee.`}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="mt-2 flex w-full items-start gap-1.5 rounded-xl border border-success/25 bg-success/10 px-2.5 py-2 sm:mt-4 sm:gap-2.5 sm:px-3.5 sm:py-3">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-success sm:text-sm">Student registration is always FREE</span>
                      </span>
                    </span>
                  )}

                  <span className={cn(
                    'mt-2 flex min-h-9 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold shadow-sm sm:mt-auto sm:min-h-11 sm:py-3 sm:text-sm',
                    'transition-all duration-200 group-hover:shadow-md',
                    isInstructor
                      ? 'bg-primary text-primary-foreground group-hover:brightness-110'
                      : 'bg-foreground text-background group-hover:bg-primary group-hover:text-primary-foreground'
                  )}>
                    {opt.action}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </AuthCard>
    )
  }

  const isInstructorFlow = roleChoice === 'instructor'

  const form = (
    <div className="w-full space-y-5">
      <div className="hidden items-center gap-2 lg:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold">
          Learn<span className="text-primary">Africa</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Start building in minutes</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isInstructorFlow ? 'Create an instructor account' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isInstructorFlow
            ? 'Start sharing your knowledge with learners across Africa.'
            : 'It only takes a minute to get set up.'}
        </p>
      </div>

      {isInstructorFlow && (
        <div className={cn(
          'flex items-center gap-3 rounded-xl border p-3',
          regInfo?.is_free === false ? 'border-primary/30 bg-primary/10' : regInfo?.error ? 'border-border bg-muted/40' : 'border-success/30 bg-success/10'
        )}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className={cn('text-sm font-bold', regInfo?.is_free === false ? 'text-primary' : 'text-success')}>
              {regInfo === null ? 'Checking instructor registration fee…' : regInfo.error ? 'Registration fee unavailable' : regInfo.is_free
                ? 'FREE · No registration fee for now'
                : `PAID · ${regInfo.currency || 'GHS'} ${Number(regInfo.fee || 0).toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {regInfo?.error
                ? 'Please refresh this page before continuing so we can confirm the current fee.'
                : regInfo?.is_free === false
                  ? 'One-time fee, payable after submitting your application.'
                  : 'There is currently no charge to register as an instructor.'}
            </p>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isInstructorFlow ? (
          <div className="flex items-start gap-2 rounded-[10px] border border-border bg-muted/40 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Instructor accounts are created with an email address so we can verify your
              identity before approval. Google sign-in is available after your account has been created.
            </p>
          </div>
        ) : (
          <div className="rounded-[10px] border border-primary/15 bg-primary/5 px-3 py-3">
            <p className="text-sm font-medium text-foreground">Create your student account with email</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use your email address and a password. You can use Google to sign in later if this email already has an account.
            </p>
          </div>
        )}

        {errors.general && (
          <div role="alert" className="rounded-[10px] bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{errors.general}</div>
        )}

        <Field
          id="name"
          label="Full name"
          required
          icon={User}
          name="name"
          value={formData.name}
          onChange={handleChange}
          invalid={!!errors.name}
          error={errors.name}
          placeholder="Enter your full name"
          autoComplete="name"
        />

        <Field
          id="email"
          label="Email address"
          required
          icon={Mail}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          invalid={!!errors.email}
          error={errors.email}
          placeholder="Enter your email address"
          autoComplete="email"
        />

        <Field
          id="password"
          label="Password"
          required
          icon={Lock}
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          invalid={!!errors.password}
          error={errors.password}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          placeholder="Create a password"
          autoComplete="new-password"
          hint="Use 8+ characters with a number or symbol."
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {/* Password strength bar */}
        {showRequirements && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full transition-all duration-300', strengthColor)}
                  style={{ width: `${formData.password ? Math.max(strengthPct, 6) : 0}%` }}
                />
              </div>
              <span className="min-w-[7.5rem] text-right text-xs text-muted-foreground">
                {formData.password ? strengthLabel : 'Add a secure password'}
              </span>
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {ruleStatuses.map(rule => (
                <li key={rule.id} className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full shrink-0 transition-colors',
                    rule.passed ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  )}>
                    {rule.passed
                      ? <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      : <X className="h-2.5 w-2.5" strokeWidth={3} />}
                  </span>
                  <span className={cn('transition-colors', rule.passed ? 'text-foreground line-through opacity-70' : 'text-muted-foreground')}>
                    {rule.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Field
          id="confirmPassword"
          label="Confirm password"
          required
          icon={Lock}
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange}
          invalid={!!errors.confirmPassword}
          error={errors.confirmPassword}
          placeholder="Confirm your password"
          autoComplete="new-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showConfirmPassword}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-[13px] font-semibold text-foreground">
            Phone number <span className="text-destructive">*</span>
          </label>
          <PhoneField
            id="phone"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            helperText="Choose your country code and enter your phone number."
          />
        </div>

        {/* Selected account type */}
        <div className="flex items-center gap-3 rounded-[10px] border border-primary/30 bg-primary/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {isInstructorFlow ? <GraduationCap className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{isInstructorFlow ? 'Instructor account' : 'Student account'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {isInstructorFlow ? 'Create and manage courses' : 'Enroll in courses and learn'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setRoleChoice(null); setErrors({}) }}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Change
          </button>
        </div>

        {isInstructorFlow && (
          <>
            <div className="flex items-start gap-2 rounded-[10px] border border-border bg-muted/40 p-3">
              <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Tell us where you are and which government-issued ID you hold. This is stored
                securely, shown only to authorised LearnAfrica staff, and never displayed on your
                public profile or course pages.
              </p>
            </div>

            <InstructorProfileFields
              value={instructor}
              onChange={handleInstructorChange}
              showPhone={false}
              config={countryConfig}
              requirements={requirements}
              errors={errors}
              idConfirm={idConfirm}
              onIdConfirmChange={setIdConfirm}
            />

            <div className={cn('flex items-start gap-2 rounded-lg px-2 pt-2 pb-4 -m-2',
              errors.verification && 'ring-1 ring-destructive bg-destructive/5')}>
              <input
                type="checkbox"
                id="verification"
                checked={acceptVerification}
                onChange={(e) => setAcceptVerification(e.target.checked)}
                aria-invalid={errors.verification ? true : undefined}
                className="mt-1 h-4 w-4 rounded border-border accent-primary"
              />
              <label htmlFor="verification" className="cursor-pointer text-sm text-muted-foreground">
                <span className="mr-1 text-destructive">*</span>I confirm that the information I have provided is accurate and truthful. I understand that
                LearnAfrica may verify this information and that providing false or misleading information may
                result in rejection, suspension, account termination, or referral to the appropriate authorities
                for possible legal action where applicable.
              </label>
            </div>
            {errors.verification && <p className="text-sm text-destructive">{errors.verification}</p>}
          </>
        )}

        <div className={cn('flex items-start gap-2 rounded-lg px-2 pt-2 pb-4 -m-2',
          errors.terms && 'ring-1 ring-destructive bg-destructive/5')}>
          <input
            type="checkbox"
            id="terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            aria-invalid={errors.terms ? true : undefined}
            className="mt-1 h-4 w-4 rounded border-border accent-primary"
          />
          <label htmlFor="terms" className="cursor-pointer text-sm text-muted-foreground">
            <span className="mr-1 text-destructive">*</span>I agree to the{' '}
            <button type="button" onClick={() => setModal('terms')} className="font-medium text-primary hover:underline">Terms</button>
            {' '}and{' '}
            <button type="button" onClick={() => setModal('privacy')} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">Privacy Policy</button>
            {' '}and{' '}
            <button type="button" onClick={() => setModal('cookies')} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">Cookie Policy</button>
          </label>
        </div>
        {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}

        <button
          type="submit"
          disabled={isLoading || (isInstructorFlow && (regInfo === null || !!regInfo.error))}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-primary-foreground',
            'shadow-[0_10px_24px_-10px_var(--primary)] transition-all duration-200',
            'hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-60 sm:h-11'
          )}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating account…' : (formData.isInstructor ? 'Continue to instructor setup' : 'Create account')}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>

      {/* Terms / Privacy modal */}
      {modal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-bold">{modal === 'terms' ? (isInstructorFlow ? 'Instructor Terms of Service' : 'Student Terms of Service') : modal === 'privacy' ? 'Privacy Policy' : 'Cookie Policy'}</h2>
              <button onClick={() => setModal(null)} aria-label="Close" className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-5 text-sm leading-relaxed text-muted-foreground">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Effective 27 November 2026 · Version 2026-11</p>
              {modal === 'terms' ? (
                isInstructorFlow ? (
                  <>
                    <p><strong className="text-foreground">1. Instructor eligibility and verification.</strong> You must provide truthful account, identity, professional and payout information. LearnAfrica may verify submitted information, request clarification, and decline or suspend an application where information is false, misleading or cannot reasonably be verified. The separate verification acknowledgement also applies.</p>
                    <p><strong className="text-foreground">2. Instructor responsibilities.</strong> Keep your profile and payout details accurate, protect your account, provide professional support to learners, keep course descriptions and learning outcomes accurate, and comply with applicable law and platform rules.</p>
                    <p><strong className="text-foreground">3. Course content and intellectual property.</strong> You must own or hold all permissions needed for every item you publish, including text, images, video, audio, slides and assessments. You retain ownership of your original materials and grant LearnAfrica a non-exclusive licence to host, display, distribute and technically adapt them as needed to operate and promote your courses. Do not upload unlawful, infringing, deceptive or harmful content.</p>
                    <p><strong className="text-foreground">4. Learner privacy and conduct.</strong> Use learner names, contact details, submissions, grades and progress only to deliver the relevant course. Keep this information confidential. Do not sell, export, disclose or reuse learner information for unrelated purposes without a lawful basis.</p>
                    <p><strong className="text-foreground">5. Earnings, fees and payouts.</strong> Instructor earnings are calculated under the revenue-sharing rules communicated by LearnAfrica. Refunds, chargebacks, reversals and payment-provider fees may affect payable amounts. Payment-provider charges, including Paystack charges where applicable, are identified separately from LearnAfrica's share. Payouts are sent to the verified destination and may be paused for incorrect details, suspected fraud, reversals or legal restrictions. You are responsible for your tax obligations.</p>
                    <p><strong className="text-foreground">6. Moderation and termination.</strong> LearnAfrica may review, restrict or remove content that is unlawful, misleading, infringing, unsafe or inconsistent with these Terms. Serious or repeated breaches, fraudulent activity or misuse of learner information may result in suspension or termination. Pending earnings may be adjusted for refunds, chargebacks and lawful holds.</p>
                    <p><strong className="text-foreground">7. Changes, support and law.</strong> Material changes will be communicated where reasonably practicable. Contact official LearnAfrica support about verification, moderation, statements or payouts. These Terms are intended to operate subject to the laws of Ghana and any mandatory legal rights that apply. Please raise disputes with support first; this does not prevent access to a competent regulator or court.</p>
                  </>
                ) : (
                  <>
                    <p><strong className="text-foreground">1. Account and access.</strong> You must provide accurate information, keep your login details confidential and promptly report suspected unauthorised access. You are responsible for activity under your account. Do not impersonate another person, share accounts, bypass security or misuse the platform.</p>
                    <p><strong className="text-foreground">2. Enrolment and payments.</strong> Courses may be free or paid. The price and currency are shown before purchase. Payments are processed by the provider shown at checkout and may be subject to that provider's terms. Do not use another person's payment details without permission.</p>
                    <p><strong className="text-foreground">3. Refunds.</strong> Unless mandatory law gives you a better right, refund requests may be considered within 14 days of purchase where less than 25% of the course has been completed. Requests are assessed using the purchase record, course activity and reason given. Approved refunds are returned through the original payment method where practical. This does not remove rights that cannot legally be excluded.</p>
                    <p><strong className="text-foreground">4. Learning and academic integrity.</strong> Complete quizzes and examinations honestly. Do not obtain or share answers improperly, impersonate another learner, interfere with assessments or present another person's work as your own. Follow reasonable course-specific instructions.</p>
                    <p><strong className="text-foreground">5. Course materials.</strong> Course materials remain the property of their rights holders. You receive limited personal access for learning. Do not copy, resell, publicly distribute, record, republish or commercially exploit paid materials without permission or a legal right.</p>
                    <p><strong className="text-foreground">6. Certificates and badges.</strong> Awards are issued when stated completion or achievement requirements are met. They are not a promise of employment, professional licence or external accreditation unless expressly stated. LearnAfrica may correct or revoke an award issued in error, obtained through misconduct or affected by fraud, after appropriate review.</p>
                    <p><strong className="text-foreground">7. Conduct and account action.</strong> Do not harass others, post unlawful or harmful content, infringe rights, manipulate grades or payments, or attempt unauthorised access. LearnAfrica may restrict or suspend access when reasonably needed to protect users, investigate suspected fraud or comply with law. Where appropriate, we will provide notice and a route to respond.</p>
                    <p><strong className="text-foreground">8. Availability, support and law.</strong> We work to keep LearnAfrica available but cannot promise uninterrupted service. Features may change and material Terms updates will be communicated where reasonably practicable. Contact official support with complaints or questions. These Terms are intended to operate subject to Ghanaian law and mandatory rights that apply to you.</p>
                  </>
                )
              ) : modal === 'privacy' ? (
                <>
                  <p><strong className="text-foreground">1. Information collected.</strong> We may handle your name, email, phone number, account role, profile details, image, course enrolments, progress, quiz and examination results, certificates, badges, messages and support requests. Instructor applicants may also provide professional details, location, government-issued identity information, verification outcomes and payout details.</p>
                  <p><strong className="text-foreground">2. Purposes.</strong> We use information to create and secure accounts, provide courses and assessments, calculate progress, issue and verify achievements, support instructors, process payments and payouts, prevent fraud, improve reliability, respond to requests and meet legal obligations.</p>
                  <p><strong className="text-foreground">3. Payments and service providers.</strong> Checkout payments are processed by the payment provider shown to you. LearnAfrica receives transaction details needed to confirm payment, handle refunds and reconcile earnings. Full card details are handled by the payment provider and are not intended to be stored on LearnAfrica application servers. We may use hosting, database, email, authentication, security and other providers. Google may process identity information when Google sign-in is used. Providers may process data outside Ghana under their own terms and applicable safeguards.</p>
                  <p><strong className="text-foreground">4. Sharing.</strong> We do not sell personal information. Information may be shared with authorised LearnAfrica personnel, relevant instructors where needed to deliver a course, contracted service providers, payment providers, professional advisers and authorities where required or legally permitted. Instructor identity documents are restricted to authorised personnel and are not displayed on public profiles or course pages.</p>
                  <p><strong className="text-foreground">5. Security and retention.</strong> We use administrative and technical safeguards, including access controls and password hashing. No online service can guarantee complete security. Information is retained as reasonably needed to provide the service, maintain learning and payment records, verify certificates, resolve disputes, prevent fraud and meet legal obligations. We then take reasonable steps to delete it or remove identifying details, subject to lawful retention and backups.</p>
                  <p><strong className="text-foreground">6. Your choices.</strong> Subject to applicable law, you may request access, correction, information about use, or deletion where appropriate. You may withdraw consent where processing relies on consent. Some records may need to be retained for legal, security, accounting or dispute purposes. Contact official LearnAfrica support for privacy requests or raise concerns with the relevant data-protection authority.</p>
                  <p><strong className="text-foreground">7. Children and updates.</strong> Where a person is not legally able to consent independently, parent or guardian involvement may be required. We may update this Policy as services or legal obligations change and will publish the updated version and effective date. This Policy is intended to operate in line with applicable Ghanaian data-protection law.</p>
                </>
              ) : (
                <>
                  <p><strong className="text-foreground">1. Essential technologies.</strong> LearnAfrica may use cookies and similar browser storage technologies to keep you signed in, manage sessions, protect accounts, prevent misuse and remember interface preferences.</p>
                  <p><strong className="text-foreground">2. How they work.</strong> Authentication and session technologies help recognise an active sign-in and protect requests. Preference technologies may remember settings such as display choices. These technologies are used to support the operation and security of the service.</p>
                  <p><strong className="text-foreground">3. Managing cookies.</strong> You can delete or block cookies through your browser settings. Blocking essential cookies or browser storage may prevent sign-in or cause some features to stop working. Clearing browser data may sign you out and reset saved preferences.</p>
                  <p><strong className="text-foreground">4. Optional technologies.</strong> If LearnAfrica introduces optional analytics or advertising cookies that require consent, the relevant notice and consent controls should be provided before those technologies are used.</p>
                  <p><strong className="text-foreground">5. Updates.</strong> This Cookie Policy may change when the technologies used by LearnAfrica change. The version and effective date above identify the current notice.</p>
                </>
              )}
            </div>
            <div className="border-t border-border bg-muted/20 p-4">
              <button
                onClick={() => setModal(null)}
                className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <AuthCard
      view="signup"
      onSwitch={() => navigate('/login')}
    >
      {form}
    </AuthCard>
  )
}
