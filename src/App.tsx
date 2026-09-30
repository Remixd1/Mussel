import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell, BareShell } from './components/layout/AppShell';
import { RotateOverlay } from './components/layout/RotateOverlay';
import { ToastProvider } from './components/ui';
import LoginPage from './pages/LoginPage';
import {
  ChartDetailPage,
  HomePage,
  NotFoundPage,
  OnboardingPage,
  ProfilePage,
  UploadPage,
  WorkoutPage,
  WorkoutSummaryPage,
} from './pages/routes';

// Visual QA page: not linked anywhere, loaded on demand.
const DevKitPage = lazy(() => import('./pages/DevKitPage'));

// Route guards (unauthenticated -> /login, not onboarded -> /onboarding) land in phase 1.
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<BareShell />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/workout/summary/:id" element={<WorkoutSummaryPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/upload/:chartId" element={<ChartDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dev/kit" element={<DevKitPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <RotateOverlay />
    </ToastProvider>
  );
}
