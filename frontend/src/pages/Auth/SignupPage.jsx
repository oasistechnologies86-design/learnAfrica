import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, X, Check, BookOpen, ArrowRight, IdCard, ShieldCheck, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Field } from '@/components/auth/Field'
import { SocialButtons } from '@/components/auth/SocialButtons'
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
const isValidGhanaPostGps = (v) =>
  /^[A-Z]{2}-\d{3,5}-\d{4,5}$/.test(String(v || '').replace(/\s+/g, '').toUpperCase())

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
    region: '', district: '', city: '', street_address: '', postal_code: '',
    digital_address: '', phone: '',
  })
  const [idConfirm, setIdConfirm] = useState('')
  const [countryConfig, setCountryConfig] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [regInfo, setRegInfo] = useState(null)
  const [modal, setModal] = useState(null) // 'terms' | 'privacy' | null
  const { signup, loginWithGoogle } = useAuth()
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

  // Fetch the instructor registration config once the instructor form is shown,
  // so the applicant sees the exact fee before entering details.
  useEffect(() => {
    if (!formData.isInstructor) return
    let alive = true
    fetch(`${API_BASE}/api/instructor-registration`)
      .then(r => r.json())
      .then(d => { if (alive) setRegInfo(d) })
      .catch(() => { if (alive) setRegInfo({ is_free: true, fee: 0, currency: 'GHS' }) })
    return () => { alive = false }
  }, [formData.isInstructor])

  // Sign up with Google. This button is only shown on the student flow — instructor
  // accounts must be created with email so identity details are collected. New
  // accounts are created on the backend (never auto-approved as instructors).
  const handleGoogle = async (credential) => {
    setErrors({})
    setIsLoading(true)
    try {
      await loginWithGoogle(credential, 'student')
      navigate('/dashboard')
    } catch (err) {
      setErrors({ general: err.message || 'Google sign up failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

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
    if (formData.phone && !isValidIntlPhone(formData.phone)) {
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
      if (instructor.country === 'GH' && !isValidGhanaPostGps(instructor.digital_address)) {
        newErrors.digital_address = 'Enter a valid GhanaPost GPS address (format GA-123-4567)'
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
            phone:    instructor.phone || formData.phone,
            password: formData.password,
            country:  instructor.country,
            id_type:  instructor.id_type,
            id_number: idNumberNorm,
            // Legacy Ghana field kept in sync so nothing downstream breaks.
            ghana_card_number: instructor.id_type === 'ghana_card' ? idNumberNorm : '',
            ghana_post_gps: instructor.country === 'GH' ? String(instructor.digital_address || '').trim().toUpperCase() : '',
            region: instructor.region, district: instructor.district, city: instructor.city,
            street_address: instructor.street_address, postal_code: instructor.postal_code,
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
        badge: null,
        title: 'Join as a Student',
        description: 'Enroll in courses, learn at your own pace, and earn verifiable certificates.',
      },
      {
        id: 'instructor',
        icon: GraduationCap,
        badge: 'Teach on LearnAfrica',
        title: 'Join as an Instructor',
        description: 'Create and manage your own courses, reach learners across Africa, and earn from every enrollment.',
      },
    ]
    return (
      <AuthCard
        view="signup"
        onSwitch={() => navigate('/login')}
      >
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Join LearnAfrica</h1>
            <p className="text-muted-foreground">Choose how you want to get started</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-stretch">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, isInstructor: opt.id === 'instructor' }))
                  setRoleChoice(opt.id)
                }}
                className={cn(
                  'group relative text-left rounded-2xl border bg-card p-5 flex flex-col h-full',
                  'transition-all duration-200 ease-out',
                  'hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  'active:translate-y-0 active:scale-[0.995]',
                  opt.id === 'instructor' ? 'border-primary/30' : 'border-border'
                )}
              >
                {opt.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {opt.badge}
                  </span>
                )}
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 transition-transform duration-200 group-hover:scale-105">
                  <opt.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mb-1.5 text-lg font-bold tracking-tight">{opt.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{opt.description}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
                  Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isInstructorFlow ? (
          <div className="flex items-start gap-2 rounded-[10px] border border-border bg-muted/40 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Instructor accounts are created with an email address so we can verify your
              identity before approval. Google sign-up is available to students — you can
              still use Google to sign in once your account exists.
            </p>
          </div>
        ) : (
          <>
            <SocialButtons
              googleClientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}
              onGoogle={handleGoogle}
              disabled={isLoading}
            />
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                  or sign up with email
                </span>
              </div>
            </div>
          </>
        )}

        {errors.general && (
          <div role="alert" className="rounded-[10px] bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{errors.general}</div>
        )}

        <Field
          id="name"
          label="Full name"
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
            Phone number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <PhoneField
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            helperText="Pick your country, then type your number. You can change or remove it later."
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
              config={countryConfig}
              requirements={requirements}
              errors={errors}
              idConfirm={idConfirm}
              onIdConfirmChange={setIdConfirm}
            />

            {regInfo && (
              <div className={cn('rounded-[10px] border p-3 text-sm',
                regInfo.is_free ? 'bg-success/10 border-success/30' : 'bg-primary/10 border-primary/30')}>
                {regInfo.is_free ? (
                  <p className="font-medium text-success">Instructor registration is free.</p>
                ) : (
                  <p className="text-foreground">
                    A one-time instructor registration fee of{' '}
                    <strong>{regInfo.currency || 'GHS'} {Number(regInfo.fee || 0).toFixed(2)}</strong>{' '}
                    applies. You&apos;ll pay it after submitting your application, before your account is activated.
                  </p>
                )}
              </div>
            )}

            <div className={cn('flex items-start gap-2 rounded-lg p-2 -m-2',
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
                I confirm that the information I have provided is accurate and truthful. I understand that
                LearnAfrica may verify this information and that providing false or misleading information may
                result in rejection, suspension, account termination, or referral to the appropriate authorities
                for possible legal action where applicable.
              </label>
            </div>
            {errors.verification && <p className="text-sm text-destructive">{errors.verification}</p>}
          </>
        )}

        <div className={cn('flex items-start gap-2 rounded-lg p-2 -m-2',
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
            I agree to the{' '}
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
                  <p>We collect the minimum information needed to operate the platform: your name, email, profile details you choose to share (such as an optional phone number), and course progress. We never sell your data to third parties.</p>
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
