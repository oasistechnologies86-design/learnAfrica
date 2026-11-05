import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';

import MainLayout    from './layouts/MainLayout';
import DashboardLayout  from './layouts/DashboardLayout';
import InstructorLayout from './layouts/InstructorLayout';

// Every page is loaded on demand. The landing page and layouts ship in the
// initial bundle; everything else is fetched when its route is opened, so a
// first-time visitor no longer downloads the admin panel, the course editor
// and the certificate renderer before seeing the homepage.
const LandingPage              = lazy(() => import('./pages/Landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage                = lazy(() => import('./pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage               = lazy(() => import('./pages/Auth/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage       = lazy(() => import('./pages/Auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage        = lazy(() => import('./pages/Auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const EmailVerificationPage    = lazy(() => import('./pages/Auth/EmailVerificationPage'));
const InstructorOnboarding     = lazy(() => import('./pages/Auth/InstructorOnboarding'));
const InstructorInfoPage       = lazy(() => import('./pages/Auth/InstructorInfoPage'));
const InstructorProfileCompletion = lazy(() => import('./pages/Auth/InstructorProfileCompletion'));
const CoursesPage              = lazy(() => import('./pages/Courses/CoursesPage').then(m => ({ default: m.CoursesPage })));
const CourseDetailPage         = lazy(() => import('./pages/Courses/CourseDetailPage').then(m => ({ default: m.CourseDetailPage })));
const PaymentPage              = lazy(() => import('./pages/Payment/PaymentPage'));
const PaymentReturnPage        = lazy(() => import('./pages/Payment/PaymentReturnPage'));
const LessonPage               = lazy(() => import('./pages/Lessons/LessonPage').then(m => ({ default: m.LessonPage })));
const PreviewCoursePage        = lazy(() => import('./pages/Instructor/PreviewCoursePage').then(m => ({ default: m.PreviewCoursePage })));
const QuizPage                 = lazy(() => import('./pages/Quiz/QuizPage').then(m => ({ default: m.QuizPage })));
const QuizResultsPage          = lazy(() => import('./pages/Quiz/QuizResultsPage').then(m => ({ default: m.QuizResultsPage })));
const StudentDashboard         = lazy(() => import('./pages/Dashboard/StudentDashboard'));
const InstructorDashboard      = lazy(() => import('./pages/Instructor/InstructorDashboard').then(m => ({ default: m.InstructorDashboard })));
const CreateCoursePage         = lazy(() => import('./pages/Instructor/CreateCoursePage').then(m => ({ default: m.CreateCoursePage })));
const AnalyticsPage            = lazy(() => import('./pages/Instructor/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ManageCoursesPage        = lazy(() => import('./pages/Instructor/ManageCoursesPage'));
const RegistrationPaymentPage  = lazy(() => import('./pages/Instructor/RegistrationPaymentPage'));
const EditCoursePage           = lazy(() => import('./pages/Instructor/EditCoursePage').then(m => ({ default: m.EditCoursePage })));
const InstructorCouponsPage    = lazy(() => import('./pages/Instructor/InstructorCouponsPage'));
const ProfilePage              = lazy(() => import('./pages/Profile/ProfilePage'));
const SettingsPage             = lazy(() => import('./pages/Settings/SettingsPage'));
const CertificatePage          = lazy(() => import('./pages/Certificate/CertificatePage'));
const MyCertificatesPage       = lazy(() => import('./pages/Certificate/MyCertificatesPage'));
const LeaderboardPage          = lazy(() => import('./pages/Leaderboard/LeaderboardPage'));
const NotFoundPage             = lazy(() => import('./pages/NotFound/NotFoundPage'));
const AdminPage                = lazy(() => import('./pages/Admin/AdminPage'));
const ReceiptsPage             = lazy(() => import('./pages/Receipts/ReceiptsPage'));
const ReceiptStatementPage     = lazy(() => import('./pages/Receipts/ReceiptStatementPage'));
const InstructorsPage          = lazy(() => import('./pages/Directory/InstructorsPage'));
const InstructorProfilePage    = lazy(() => import('./pages/Directory/InstructorProfilePage'));
const BlogPage                 = lazy(() => import('./pages/Blog/BlogPage'));
const BlogPostPage             = lazy(() => import('./pages/Blog/BlogPostPage'));
const VerifyCredentialPage     = lazy(() => import('./pages/VerifyCredential/VerifyCredentialPage'));
const CommunityPage            = lazy(() => import('./pages/Community/CommunityPage'));

// Shared full-screen loading state, used consistently by every route guard
// below instead of each one inventing its own behavior (previously
// ProtectedRoute showed a spinner while PublicOnlyRoute/StudentOnlyRoute
// silently rendered nothing, an inconsistent, confusing experience).
function RouteLoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground animate-pulse">Please wait...</p>
      </div>
    </div>
  );
}

// ── Route Guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles, returnUrl }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <RouteLoadingScreen />;
  if (!isAuthenticated) return <Navigate to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'} replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Instructors go to instructor dashboard, not student dashboard
    if (user?.role === 'instructor') return <Navigate to="/instructor" replace />;
    if (['admin','superadmin'].includes(user?.role)) return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// The course catalogue is for visitors and students only.
function CatalogRoute({ children }) {
  const { isLoading, user } = useAuth();
  if (isLoading) return <RouteLoadingScreen />;
  if (['admin','superadmin'].includes(user?.role)) return <Navigate to="/admin" replace />;
  if (user?.role === 'instructor') return <Navigate to="/instructor" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  // Fast path: with no stored token the visitor is definitely logged out, so
  // render the login/signup form immediately instead of flashing a spinner
  // while the (token-less) session bootstrap runs.
  const hasToken = typeof window !== 'undefined' && !!sessionStorage.getItem('auth_token');
  if (!hasToken) return children;
  if (isLoading) return <RouteLoadingScreen />;
  if (isAuthenticated) {
    if (['admin','superadmin'].includes(user?.role)) return <Navigate to="/admin" replace />;
    if (user?.role === 'instructor') return <Navigate to="/instructor" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Students cannot access instructor routes and vice versa
function StudentOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <RouteLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (['instructor','admin','superadmin'].includes(user?.role)) return <Navigate to="/instructor" replace />;
  return children;
}

// ── App Gate ──────────────────────────────────────────────────────────────
// Intentionally a pass-through. It used to render its own full-screen spinner
// on top of the per-route loading screen, so every refresh briefly showed two
// different spinners in a row (the login/signup "flicker"). The route guards
// below already render RouteLoadingScreen when they genuinely need to wait, so
// this wrapper no longer duplicates that wait.
function AppGate({ children }) {
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="courses" element={<CatalogRoute><CoursesPage /></CatalogRoute>} />
        <Route path="courses/:courseId" element={<CourseDetailPage />} />
        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="instructors/:instructorId" element={<InstructorProfilePage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="verify-credential" element={<VerifyCredentialPage />} />
        <Route path="verify" element={<Navigate to="/verify-credential" replace />} />
        <Route path="community" element={<ProtectedRoute returnUrl="/community"><CommunityPage /></ProtectedRoute>} />
      </Route>

      {/* ── Auth ── */}
      {/* Every auth step renders its own full-page chrome (AuthCard), so none of
          them sit inside AuthLayout. Wrapping them in both stacked two back
          buttons, two theme toggles and two logos. */}
      <Route path="login"  element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      <Route path="verify-email"    element={<PublicOnlyRoute><EmailVerificationPage /></PublicOnlyRoute>} />
      <Route path="forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="reset-password"  element={<ResetPasswordPage />} />
      <Route path="signup/instructor-onboarding"
        element={<PublicOnlyRoute><InstructorOnboarding /></PublicOnlyRoute>} />
      <Route path="signup/instructor-info"
        element={<PublicOnlyRoute><InstructorInfoPage /></PublicOnlyRoute>} />

      {/* ── Payment (students only) ── */}
      <Route path="payment/return"
        element={<PaymentReturnPage />} />
      <Route path="payment/:courseId"
        element={<ProtectedRoute allowedRoles={['student']}><PaymentPage /></ProtectedRoute>} />

      {/* ── Student Dashboard ── */}
      <Route path="dashboard"
        element={<StudentOnlyRoute><DashboardLayout /></StudentOnlyRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
      </Route>

      {/* ── Shared profile / settings (all authenticated) ── */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="profile"  element={<ProfilePage />} />
        <Route path="my-certificates" element={<StudentOnlyRoute><MyCertificatesPage /></StudentOnlyRoute>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="receipts/:tid" element={<ReceiptStatementPage />} />
      </Route>

      {/* ── Certificate ── */}
      <Route path="/certificate/:courseId"
        element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />

      {/* ── Learning & Instructor Preview: use MainLayout (LearnAfrica nav on top) ── */}
      <Route path="/" element={<MainLayout />}>
        <Route path="instructor/preview/:courseId"
          element={<ProtectedRoute allowedRoles={['instructor','admin','superadmin']}><PreviewCoursePage /></ProtectedRoute>} />
        <Route path="learn/course/:courseId/lesson/:lessonId"
          element={<StudentOnlyRoute><LessonPage /></StudentOnlyRoute>} />
      </Route>

      {/* Quiz pages use DashboardLayout (navbar + container) ── */}
      <Route path="learn" element={<StudentOnlyRoute><DashboardLayout /></StudentOnlyRoute>}>
        <Route path="course/:courseId/quiz/:lessonId"         element={<QuizPage />} />
        <Route path="course/:courseId/quiz/:lessonId/results" element={<QuizResultsPage />} />
      </Route>

      {/* ── Instructor (instructor + admin only) ── */}
      <Route path="instructor"
        element={<ProtectedRoute allowedRoles={['instructor','admin','superadmin']}>
          <InstructorLayout />
        </ProtectedRoute>}>
        <Route index element={<InstructorDashboard />} />
        <Route path="courses"        element={<ManageCoursesPage />} />
        <Route path="courses/create"     element={<CreateCoursePage />} />
        <Route path="courses/edit/:courseId" element={<EditCoursePage />} />
        <Route path="coupons"        element={<InstructorCouponsPage />} />
        <Route path="analytics"      element={<AnalyticsPage />} />
        <Route path="receipts"       element={<ReceiptsPage />} />
        <Route path="settings"       element={<SettingsPage />} />
      </Route>

      {/* Registration checkout lives OUTSIDE the instructor layout: a pending
          instructor (the only person who owes the fee) is blocked by
          InstructorLayout, so nesting it there made checkout unreachable. */}
      <Route path="instructor/registration-payment"
        element={<ProtectedRoute allowedRoles={['instructor','admin','superadmin']}>
          <RegistrationPaymentPage />
        </ProtectedRoute>} />

      {/* Approved instructors whose country-aware profile is incomplete land
          here. Also outside InstructorLayout, which blocks them. */}
      <Route path="instructor/complete-profile"
        element={<ProtectedRoute allowedRoles={['instructor','admin','superadmin']}>
          <InstructorProfileCompletion />
        </ProtectedRoute>} />

      {/* ── Admin ── */}
      <Route path="admin"
        element={<ProtectedRoute allowedRoles={['admin','superadmin']}>
          <DashboardLayout />
        </ProtectedRoute>}>
        <Route index element={<AdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppGate>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </AppGate>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
