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
  const [modal, setModal] = useState(null) // 'terms' | 'privacy' | null
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
            agreement_version: '2026-01',
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
        title: 'Continue as a student',
        description: 'Explore courses, build skills and earn certificates.',
      },
      {
        id: 'instructor',
        icon: GraduationCap,
        eyebrow: 'TEACH',
        title: 'Continue as an instructor',
        description: 'Publish courses, teach learners and grow your reach.',
      },
    ]
    return (
      <AuthCard
        view="signup"
        onSwitch={() => navigate('/login')}
      >
        <div className="w-full space-y-5 sm:space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">Join LearnAfrica</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Choose the account that matches what you want to do.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-label={opt.title}
                onClick={() => {
                  setFormData(prev => ({ ...prev, isInstructor: opt.id === 'instructor' }))
                  setRoleChoice(opt.id)
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border border-border bg-background/70 p-3.5 sm:p-4 text-left',
                  'transition-colors duration-200 hover:border-primary/50 hover:bg-primary/[0.035]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
                  'active:bg-primary/[0.06]'
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
                  <opt.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-bold tracking-[0.16em] text-primary">
                    {opt.eyebrow}
                  </span>
                  <span className="block text-[15px] font-semibold leading-snug text-foreground sm:text-base">
                    {opt.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    {opt.description}
                  </span>
                  {opt.id === 'instructor' && (
                    <span className={cn(
                      'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      regInfo?.is_free === false ? 'bg-primary/10 text-primary' : regInfo?.error ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success'
                    )}>
                      <CreditCard className="h-3.5 w-3.5" />
                      {regInfo === null ? 'Checking registration fee…' : regInfo.error ? 'Registration fee unavailable — please try again' : regInfo.is_free
                        ? 'FREE · No registration fee for now'
                        : `PAID · ${regInfo.currency || 'GHS'} ${Number(regInfo.fee || 0).toFixed(2)}`}
                    </span>
                  )}
                </span>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
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
            <button type="button" onClick={() => setModal('privacy')} className="font-medium text-primary hover:underline">Privacy Policy</button>
          </label>
        </div>
        {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}

        <button
          type="submit"
          disabled={isLoading}
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
              <h2 className="text-lg font-bold">{modal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</h2>
              <button onClick={() => setModal(null)} aria-label="Close" className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-5 text-sm leading-relaxed text-muted-foreground">
              {modal === 'terms' ? (
                <>
                  <p>Welcome to LearnAfrica. By creating an account, you agree to use the platform respectfully, complete payments where applicable, and protect your account credentials. You are responsible for the accuracy of the information you provide and any activity under your account.</p>
                  <p>Instructors must own the rights to any content they upload. Students agree not to redistribute paid course materials. LearnAfrica reserves the right to suspend accounts that violate these terms.</p>
                  <p>Refunds for paid courses are issued at our discretion within 14 days of purchase, provided less than 25% of the course has been completed.</p>
                </>
              ) : (
                <>
                  <p>We collect the minimum information needed to operate the platform: your name, email, profile details you provide, including your required phone number, and course progress. We never sell your data to third parties.</p>
                  <p>Payment information is processed by our payment provider — we do not store full card numbers on our servers. Your password is hashed and cannot be recovered, only reset.</p>
                  <p>You can request export or deletion of your data at any time by contacting support. Cookies are used solely for authentication and remembering UI preferences.</p>
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
