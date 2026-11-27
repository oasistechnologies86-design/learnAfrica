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

            <div className={cn('flex items-start gap-2 rounded-xl border border-border/70 bg-muted/20 p-3',
              errors.verification && 'border-destructive bg-destructive/5 ring-1 ring-destructive')}>
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

        <div className={cn('flex items-start gap-2 rounded-xl border border-border/70 bg-muted/20 p-3',
          errors.terms && 'border-destructive bg-destructive/5 ring-1 ring-destructive')}>
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

      {/* Terms, Privacy and Cookie policy dialog */}
      {modal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4"
          onClick={() => setModal(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-policy-title"
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">LearnAfrica · Account agreement</p>
                <h2 id="signup-policy-title" className="mt-0.5 text-base font-bold sm:text-lg">
                  {modal === 'terms' ? (isInstructorFlow ? 'Instructor Terms of Service' : 'Student Terms of Service') : modal === 'privacy' ? 'Privacy Policy' : 'Cookie Policy'}
                </h2>
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Close policy" className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 text-[13px] leading-6 text-muted-foreground sm:px-6 sm:py-5 sm:text-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/15 bg-primary/[0.05] px-3 py-2">
                <span className="text-[11px] font-semibold text-primary">Effective 27 November 2026 · Version 2026-11</span>
                <span className="text-[10px] text-muted-foreground">Please read before accepting</span>
              </div>
              {modal === 'terms' ? (
                isInstructorFlow ? (
                  <div className="space-y-4">
                    <p><strong className="text-foreground">1. Eligibility, application and verification.</strong> You must be legally able to enter into these Terms and provide complete, accurate and current account, identity, professional, contact and payout information. You authorise LearnAfrica to carry out reasonable checks to confirm information you submit, including requesting supporting documents or clarification. An application may be delayed, declined or restricted if information is incomplete, inconsistent, misleading or cannot reasonably be verified. Approval to create an account does not guarantee that a course will be published or remain available.</p>
                    <p><strong className="text-foreground">2. Instructor account and security.</strong> You are responsible for safeguarding your password and sign-in methods, keeping your contact details current and promptly notifying LearnAfrica of suspected account compromise. Do not share access with unauthorised persons or allow another person to publish or act as you. You remain responsible for activity carried out through your account unless applicable law provides otherwise. LearnAfrica may take reasonable steps to secure an account where misuse or compromise is suspected.</p>
                    <p><strong className="text-foreground">3. Course quality and instructor duties.</strong> You must provide accurate course titles, descriptions, prerequisites, learning outcomes, prices and instructor credentials. Course materials, lessons, assessments and announcements should be complete, relevant, accessible where reasonably practicable and consistent with the description shown to learners. You must keep course information reasonably up to date, respond to learner questions in a professional manner, and avoid misleading claims about qualifications, employment outcomes, accreditation or certification.</p>
                    <p><strong className="text-foreground">4. Ownership, permissions and licence.</strong> You retain ownership of original content you create, subject to the rights of third parties. Before uploading or using any text, image, video, audio, software, slide, logo, assessment or other material, you must own it or hold all permissions and licences needed for its use on LearnAfrica. You grant LearnAfrica a non-exclusive, worldwide, royalty-free licence for the period the content is made available, to host, store, reproduce, display, stream, distribute and technically adapt that content as reasonably necessary to operate, secure, support and promote the relevant course and platform. This licence does not transfer ownership to LearnAfrica. You must not upload infringing, unlawful, deceptive, defamatory, discriminatory, unsafe or malicious material.</p>
                    <p><strong className="text-foreground">5. Learner information and professional conduct.</strong> Learner names, contact details, submissions, grades, progress and other personal information may be used only as needed to teach and support learners through LearnAfrica, or as otherwise lawfully authorised. You must keep such information confidential, use appropriate safeguards, and not sell it, export it for unrelated marketing, disclose it to unauthorised persons or contact learners for unrelated commercial purposes. You must not harass, exploit, discriminate against or improperly pressure learners. Report suspected exposure or misuse of learner information to LearnAfrica promptly.</p>
                    <p><strong className="text-foreground">6. Pricing, revenue share and payment-provider fees.</strong> Course prices, instructor revenue shares and applicable deductions are determined by the terms and rates communicated in the platform or relevant instructor settings. The amount payable may be affected by discounts, refunds, chargebacks, reversals, taxes, payment-provider charges and other disclosed adjustments. Payment-provider fees, including Paystack fees where Paystack is used, are separate from LearnAfrica's revenue share and should be shown as a distinct transaction cost where the platform provides that breakdown. Do not represent a gross sale amount as your final payable earnings.</p>
                    <p><strong className="text-foreground">7. Payouts, records and taxes.</strong> Payouts are made to the verified payment destination and according to the payout process and schedule communicated by LearnAfrica. You must keep payout details accurate and promptly report errors. A payout may be delayed or held while a payment is pending, details are being verified, a refund or chargeback is unresolved, fraud is reasonably suspected or a legal restriction applies. Review your earnings and transaction records and raise discrepancies with support. You are responsible for determining and meeting your own tax, registration and reporting obligations.</p>
                    <p><strong className="text-foreground">8. Reviews, moderation and complaints.</strong> LearnAfrica may review reported content, investigate credible complaints and restrict or remove material that appears unlawful, misleading, infringing, harmful, unsafe or inconsistent with these Terms or platform rules. Where reasonably practicable, you may be asked to explain or correct an issue before action is taken. Urgent action may be taken to protect learners, preserve evidence, prevent fraud or comply with law. You should cooperate with reasonable investigations and provide relevant information.</p>
                    <p><strong className="text-foreground">9. Suspension, termination and outstanding balances.</strong> Serious or repeated breaches, fraudulent activity, misuse of learner information, infringement, impersonation or failure to complete required verification may lead to course restrictions, suspension or termination. Where appropriate, LearnAfrica will communicate the reason and any available review route. Termination does not remove obligations that arose before termination. Earnings may be adjusted for valid refunds, chargebacks, reversals, payment costs or lawful holds, and any undisputed balance will be handled under the applicable payout process.</p>
                    <p><strong className="text-foreground">10. Platform availability and changes.</strong> LearnAfrica will take reasonable steps to maintain the service, but uninterrupted or error-free availability cannot be guaranteed. Features, technical requirements and platform rules may change as the service develops. Material changes to these Terms will be communicated where reasonably practicable, with an updated version and effective date. Continued use after a change takes effect is subject to applicable law and any consent or notice requirements that apply.</p>
                    <p><strong className="text-foreground">11. Support, disputes and governing law.</strong> Contact official LearnAfrica support for questions about verification, course moderation, learner complaints, earnings or payouts. We encourage you to raise a concern through support so it can be reviewed. This does not prevent you from contacting a competent regulator or court, or from exercising rights that cannot lawfully be waived. These Terms are intended to operate subject to the laws of Ghana and any mandatory laws that apply to you.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p><strong className="text-foreground">1. Account creation and accurate information.</strong> You must provide information that is accurate and keep it reasonably up to date. Do not impersonate another person, create an account using details you are not authorised to use, or misrepresent your age, identity or qualifications. Keep your password and sign-in methods confidential and tell LearnAfrica promptly if you suspect someone has accessed your account without permission.</p>
                    <p><strong className="text-foreground">2. Enrolment and course access.</strong> Course access may be free or paid and may be subject to stated prerequisites, availability, time limits or course-specific rules. Review the course description, instructor information, price and any important conditions before enrolling. Access is provided for your personal learning use and may depend on continued compliance with these Terms. Do not share your account or attempt to bypass enrolment, access controls or course restrictions.</p>
                    <p><strong className="text-foreground">3. Payments, receipts and transaction issues.</strong> The price and currency shown at checkout are the amount presented for your purchase before payment confirmation. Payments are processed by the provider identified at checkout and may also be subject to that provider's terms. Do not use another person's payment details without their permission. Keep your receipt and contact support if a payment is deducted but access is not granted, a transaction appears duplicated or a receipt contains an error.</p>
                    <p><strong className="text-foreground">4. Refund requests.</strong> Unless mandatory law gives you a better right, LearnAfrica's standard review window is 14 days from purchase where less than 25% of the course has been completed. A request should include the relevant order information and reason. Requests are assessed against the purchase record, course activity, payment status and applicable law. Approved refunds are returned through the original payment method where practical. This review process does not remove consumer rights that cannot legally be excluded and does not guarantee that every request will be approved.</p>
                    <p><strong className="text-foreground">5. Learning, quizzes and academic integrity.</strong> You must complete lessons, quizzes, tests and examinations honestly and in accordance with the instructions provided. Do not impersonate another learner, obtain or distribute restricted answers, manipulate scores, interfere with assessment systems, use unauthorised assistance where prohibited, or submit another person's work as your own. An instructor may set reasonable assessment rules, and you should ask for clarification if an instruction is unclear.</p>
                    <p><strong className="text-foreground">6. Course materials and permitted use.</strong> Course materials may be owned by LearnAfrica, the instructor or another rights holder. Enrolment gives you limited access for your own learning, not ownership of the materials. Unless you have permission or a legal right, do not copy, record, download where disabled, resell, publicly distribute, republish, share login access to, or commercially exploit course content. You may retain or use your own work subject to the rights of others.</p>
                    <p><strong className="text-foreground">7. Certificates, badges and achievement records.</strong> Certificates and badges are issued only when the stated course, assessment or achievement requirements have been met and verified. An award confirms the achievement described on it; it is not a guarantee of employment, professional licence, university credit or external accreditation unless that status is expressly stated. LearnAfrica may investigate an award that appears to have been issued in error, obtained through misconduct or affected by fraud, and may correct or revoke it after appropriate review. Verification links and credential records may be retained to confirm authenticity.</p>
                    <p><strong className="text-foreground">8. Community conduct and prohibited activity.</strong> Treat learners, instructors and staff respectfully. Do not harass, threaten, discriminate against, exploit or impersonate another person. Do not post unlawful, abusive, misleading or infringing material, attempt unauthorised access, disrupt the service, manipulate payments or grades, distribute malware, or misuse another person's personal information. You must follow reasonable instructions intended to keep courses and the platform safe.</p>
                    <p><strong className="text-foreground">9. Account restrictions and appeals.</strong> LearnAfrica may limit features, suspend access or close an account where reasonably necessary to protect users, investigate suspected fraud or serious misconduct, enforce these Terms or comply with law. Where appropriate and reasonably practicable, we will explain the reason and provide a way to respond or request a review. Urgent protective action may occur before notice where delay could create risk.</p>
                    <p><strong className="text-foreground">10. Service availability and changes.</strong> We work to keep LearnAfrica available and course records accurate, but cannot promise uninterrupted service or that every feature will always be available. Maintenance, security incidents, connectivity problems or changes to the service may temporarily affect access. Material changes to these Terms will be communicated where reasonably practicable and will show an updated version and effective date.</p>
                    <p><strong className="text-foreground">11. Support and governing law.</strong> Contact official LearnAfrica support about enrolment, payments, course access, assessments, certificates or complaints. We encourage concerns to be raised so they can be reviewed. Nothing in these Terms removes rights that cannot legally be excluded. These Terms are intended to operate subject to the laws of Ghana and any mandatory consumer or other legal protections that apply to you.</p>
                  </div>
                )
              ) : modal === 'privacy' ? (
                <div className="space-y-4">
                  <p><strong className="text-foreground">1. Who this Policy covers.</strong> This Policy explains how LearnAfrica handles personal information when you visit the platform, register, enrol in courses, teach, communicate with us or use related services. It applies to students, instructor applicants, approved instructors and visitors to the extent that we process their information.</p>
                  <p><strong className="text-foreground">2. Information we collect.</strong> Depending on how you use the service, information may include your name, email address, phone number, password credentials in protected form, account role, profile details, profile image, country and location, course enrolments, lesson activity, progress, quiz and examination results, certificates, badges, messages, support requests, device and browser information, security logs and transaction references. Instructor applicants may additionally provide professional history, identity-document type and number, verification materials, location details and payout information. We aim to collect information relevant to the service and the purpose for which it is used.</p>
                  <p><strong className="text-foreground">3. How we use information.</strong> We use information to create and administer accounts, authenticate users, deliver courses, record progress, run assessments, calculate results, issue and verify achievements, communicate service notices, support instructors, process payments and payouts, respond to complaints, protect the platform, investigate suspected fraud, improve reliability and meet legal obligations. We may also use aggregated or de-identified information to understand platform performance.</p>
                  <p><strong className="text-foreground">4. Payments and financial information.</strong> Payments are handled by the payment provider presented at checkout. LearnAfrica may receive payer details, transaction references, payment status, amount, currency and information needed for receipts, refunds, reconciliation and instructor earnings. Full payment-card credentials are handled by the payment provider and are not intended to be stored on LearnAfrica application servers. Instructors may provide payout destination details, which are restricted to personnel and systems that need them to verify and process payouts.</p>
                  <p><strong className="text-foreground">5. Identity checks and instructor information.</strong> Identity and professional information submitted by instructor applicants is used for eligibility, verification, account integrity, fraud prevention and legal compliance. Access should be limited to authorised personnel with a legitimate operational need. Identity documents are not intended to appear on public profiles or course pages. We may retain verification outcomes and relevant records for security, dispute resolution and legal purposes.</p>
                  <p><strong className="text-foreground">6. Cookies, browser storage and similar technologies.</strong> LearnAfrica may use essential cookies or browser storage to maintain sessions, authenticate users, protect accounts and remember preferences. These technologies are described in the Cookie Policy. Blocking essential storage may prevent sign-in or affect core features.</p>
                  <p><strong className="text-foreground">7. When information is shared.</strong> We do not sell personal information. Information may be shared with authorised LearnAfrica personnel, an instructor where needed to deliver a course or support a learner, contracted hosting, database, email, authentication and security providers, payment providers, professional advisers, and public authorities where required or legally permitted. We seek to limit sharing to information reasonably needed for the relevant purpose. Instructors must use learner information only for legitimate course delivery.</p>
                  <p><strong className="text-foreground">8. International processing.</strong> Some technology, hosting, authentication, email or payment providers may process information in countries outside Ghana. Where this occurs, information may be subject to the laws of those locations and the safeguards or contractual arrangements applicable to the provider. We take reasonable steps to select providers and protect information in connection with these services.</p>
                  <p><strong className="text-foreground">9. Security.</strong> We use reasonable administrative and technical measures designed to protect information, which may include access controls, protected authentication credentials, limited staff access and security monitoring. No internet transmission or storage system can be guaranteed completely secure. You should use a strong password, protect your devices and report suspected account compromise promptly.</p>
                  <p><strong className="text-foreground">10. Retention.</strong> We retain information for as long as reasonably needed to provide the service, maintain learning and payment records, support instructors, verify certificates, prevent fraud, resolve disputes, enforce agreements and meet legal or accounting obligations. Different categories may have different retention periods. When information is no longer required, we take reasonable steps to delete it or remove identifying details, subject to lawful retention requirements, backups and technical limitations.</p>
                  <p><strong className="text-foreground">11. Your privacy choices and rights.</strong> Subject to applicable law, you may ask for access to personal information, correction of inaccurate details, information about how it is used, or deletion where deletion is legally and operationally appropriate. You may withdraw consent where a particular activity relies on consent. Some records may need to be retained for legal, security, accounting or dispute purposes. Contact official LearnAfrica support to make a privacy request and provide enough information for us to identify the relevant account securely.</p>
                  <p><strong className="text-foreground">12. Children and legal capacity.</strong> If you are not legally able to enter into an agreement or provide consent independently, a parent or legal guardian may need to be involved as required by applicable law. We do not intend this notice to replace any additional safeguards required for children or people who need assistance exercising their rights.</p>
                  <p><strong className="text-foreground">13. Updates and complaints.</strong> We may update this Policy when our services, providers or legal obligations change. The current version and effective date will be displayed with the Policy. You may contact official LearnAfrica support with a privacy concern or raise a complaint with the relevant data-protection authority. This Policy is intended to operate in line with applicable Ghanaian data-protection law.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p><strong className="text-foreground">1. What cookies and storage are.</strong> Cookies are small files placed by a website in your browser. Similar technologies may store information in your browser or device. LearnAfrica may use these technologies to operate the service, maintain a secure session and remember selected preferences.</p>
                  <p><strong className="text-foreground">2. Essential session and security technologies.</strong> Essential technologies may help keep you signed in, recognise an authenticated session, protect account actions, reduce fraudulent activity and support the safe operation of forms and platform features. These technologies are important to core functions and may not be available for opt-out through the platform while those functions are in use.</p>
                  <p><strong className="text-foreground">3. Preference technologies.</strong> Browser storage may remember choices such as display preferences or other settings so that you do not need to select them each time. If you clear browser data, these preferences may be reset.</p>
                  <p><strong className="text-foreground">4. Analytics and optional technologies.</strong> The technologies used may change as LearnAfrica develops. If optional analytics, personalisation or advertising technologies are introduced and applicable law requires consent, the relevant notice and controls should be presented before those technologies are activated.</p>
                  <p><strong className="text-foreground">5. Managing cookies and browser storage.</strong> You can usually review, delete or block cookies through your browser settings. The available controls differ by browser and device. Blocking or deleting essential cookies or browser storage may sign you out, prevent authentication or cause some platform functions to stop working. Changing browser settings does not necessarily delete information already held in LearnAfrica account records.</p>
                  <p><strong className="text-foreground">6. Policy updates and contact.</strong> This notice may be updated when the technologies used by LearnAfrica change. The version and effective date above identify the current notice. Contact official LearnAfrica support if you have questions about cookies or browser storage.</p>
                </div>
              )}
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                These policies are platform notices and do not limit rights or obligations that cannot legally be excluded. If a provision conflicts with mandatory applicable law, that law takes priority.
              </p>
            </div>

            <footer className="shrink-0 border-t border-border bg-muted/20 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Close
              </button>
            </footer>
          </section>
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
