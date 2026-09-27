import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell, BareShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui';
import LoginPage from './pages/LoginPage';
import {
  ArchivePage,
  BodyweightPage,
  CalibrationPage,
  NotFoundPage,
  OnboardingPage,
  PlanEditorPage,
  PlansPage,
  ProtocolDetailPage,
  SessionDetailPage,
  SessionPage,
  SessionSummaryPage,
  StatusPage,
  LibraryPage,
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
              <Route path="/" element={<StatusPage />} />
              <Route path="/session" element={<SessionPage />} />
              <Route path="/session/summary/:id" element={<SessionSummaryPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/archive/:id" element={<SessionDetailPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/library/:exerciseId" element={<ProtocolDetailPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/plans/:planId" element={<PlanEditorPage />} />
              <Route path="/bodyweight" element={<BodyweightPage />} />
              <Route path="/calibration" element={<CalibrationPage />} />
              <Route path="/dev/kit" element={<DevKitPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
