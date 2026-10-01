import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell, BareShell } from './components/layout/AppShell';
import { RotateOverlay } from './components/layout/RotateOverlay';
import { ToastProvider } from './components/ui';
import { AuthProvider } from './features/auth/AuthProvider';
import { RequireAuth, RequireGuest } from './features/auth/guards';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { NotFoundPage, WorkoutPage, WorkoutSummaryPage } from './pages/routes';

const SignupPage = lazy(() => import('./pages/SignupPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ProgramPage = lazy(() => import('./pages/ProgramPage'));
const ChartPage = lazy(() => import('./pages/ChartPage'));
// Visual QA page: not linked anywhere, loaded on demand.
const DevKitPage = lazy(() => import('./pages/DevKitPage'));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              {/* Signed out only */}
              <Route element={<RequireGuest />}>
                <Route element={<BareShell />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                </Route>
              </Route>

              {/* Signed in, Subject Intake not finished */}
              <Route element={<RequireAuth onboarding />}>
                <Route element={<BareShell />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Route>
              </Route>

              {/* Signed in and onboarded */}
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/workout" element={<WorkoutPage />} />
                  <Route path="/workout/summary/:id" element={<WorkoutSummaryPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/upload/programs/:programId" element={<ProgramPage />} />
                  <Route path="/upload/charts/:chartId" element={<ChartPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

              {/* Public visual QA */}
              <Route element={<AppShell />}>
                <Route path="/dev/kit" element={<DevKitPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      <RotateOverlay />
    </ToastProvider>
  );
}
